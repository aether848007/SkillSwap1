package com.skillswap.service;

import com.skillswap.model.Session;
import com.skillswap.model.SkillProfile;
import com.skillswap.model.enums.NotificationType;
import com.skillswap.model.enums.SessionStatus;
import com.skillswap.repository.SessionRepository;
import com.skillswap.repository.SkillProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Sessions are never created standalone — they are born as DRAFT slots of an {@link Exchange}
 * (see ExchangeService). This service only schedules and transitions them.
 */
@Service
public class SessionService {
    private static final DateTimeFormatter DT_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm[:ss]");

    private final SessionRepository sessionRepo;
    private final SkillProfileRepository profileRepo;
    private final NotificationService notifService;

    public SessionService(SessionRepository se, SkillProfileRepository pr, NotificationService n) {
        this.sessionRepo = se; this.profileRepo = pr; this.notifService = n;
    }

    @Transactional(readOnly = true)
    public List<Session> getUserSessions(UUID userId) {
        return sessionRepo.findByLearnerOrProviderWithFetch(userId);
    }

    /**
     * Learner proposes (or re-proposes) a time. DRAFT/DECLINED/CONFIRMED -> REQUESTED.
     */
    @Transactional
    public Session schedule(UUID callerId, UUID sessionId, String scheduledAtIso) {
        Session s = sessionRepo.findByIdWithFetch(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        if (!callerId.equals(s.getLearner().getUserId())) {
            throw new SecurityException("Only the learner can schedule this session");
        }
        SessionStatus st = s.getStatus();
        if (st != SessionStatus.DRAFT && st != SessionStatus.DECLINED && st != SessionStatus.CONFIRMED) {
            throw new IllegalStateException("This session can no longer be (re)scheduled");
        }
        LocalDateTime when;
        try {
            when = LocalDateTime.parse(scheduledAtIso, DT_FORMATTER);
        } catch (Exception e) {
            throw new IllegalArgumentException("scheduledAt must be ISO-8601, e.g. 2026-06-01T14:30");
        }
        s.setScheduledAt(when);
        s.setStatus(SessionStatus.REQUESTED);
        sessionRepo.save(s);

        notifService.create(s.getProvider().getUserId(), NotificationType.SESSION_REQUEST,
                s.getLearner().getDisplayName() + " proposed a time to learn \""
                        + s.getSkill().getTitle() + "\" from you.");
        return s;
    }

    /**
     * Transition a session. Ownership-checked. CONFIRMED/DECLINED are provider-only;
     * COMPLETED/CANCELLED/IN_PROGRESS may be done by either participant.
     */
    @Transactional
    public Session updateStatus(UUID callerId, UUID sessionId, String status) {
        Session session = sessionRepo.findByIdWithFetch(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        UUID providerId = session.getProvider().getUserId();
        UUID learnerId = session.getLearner().getUserId();
        if (!callerId.equals(providerId) && !callerId.equals(learnerId)) {
            throw new SecurityException("Not a participant in this session");
        }

        SessionStatus newStatus;
        try {
            newStatus = SessionStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown session status: " + status);
        }
        if ((newStatus == SessionStatus.CONFIRMED || newStatus == SessionStatus.DECLINED)
                && !callerId.equals(providerId)) {
            throw new SecurityException("Only the provider can accept or decline");
        }

        boolean wasCompleted = session.getStatus() == SessionStatus.COMPLETED
                || session.getStatus() == SessionStatus.RATED;
        session.setStatus(newStatus);
        sessionRepo.save(session);

        // Credit the provider with a completed session exactly once.
        if (newStatus == SessionStatus.COMPLETED && !wasCompleted) {
            profileRepo.findByUserUserId(providerId).ifPresent(p -> {
                SkillProfile prof = p;
                prof.setTotalSessions((prof.getTotalSessions() == null ? 0 : prof.getTotalSessions()) + 1);
                profileRepo.save(prof);
            });
        }

        String skillTitle = session.getSkill().getTitle();
        String providerName = session.getProvider().getDisplayName();
        String learnerName = session.getLearner().getDisplayName();

        switch (newStatus) {
            case CONFIRMED -> notifService.create(learnerId, NotificationType.SESSION_ACCEPTED,
                    providerName + " confirmed your session for \"" + skillTitle + "\".");
            case DECLINED -> notifService.create(learnerId, NotificationType.SESSION_DECLINED,
                    providerName + " can't make that time for \"" + skillTitle + "\" — propose another.");
            case COMPLETED -> {
                notifService.create(learnerId, NotificationType.SESSION_COMPLETED,
                        "Session \"" + skillTitle + "\" with " + providerName + " is done. Leave a rating!");
                notifService.create(providerId, NotificationType.SESSION_COMPLETED,
                        "Session \"" + skillTitle + "\" with " + learnerName + " is done. Leave a rating!");
            }
            default -> { }
        }
        return session;
    }
}
