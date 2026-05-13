package com.skillswap.service;

import com.skillswap.dto.SessionRequest;
import com.skillswap.model.Session;
import com.skillswap.model.enums.NotificationType;
import com.skillswap.model.enums.SessionStatus;
import com.skillswap.repository.SessionRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.SkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class SessionService {
    private static final DateTimeFormatter DT_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm[:ss]");

    private final SessionRepository sessionRepo;
    private final UserRepository userRepo;
    private final SkillRepository skillRepo;
    private final NotificationService notifService;

    public SessionService(SessionRepository se, UserRepository u, SkillRepository sk, NotificationService n) {
        this.sessionRepo = se; this.userRepo = u; this.skillRepo = sk; this.notifService = n;
    }

    @Transactional
    public Session createSession(UUID learnerId, SessionRequest req) {
        Session session = new Session();
        session.setLearner(userRepo.findById(learnerId).orElseThrow());
        session.setProvider(userRepo.findById(req.getProviderId()).orElseThrow());
        session.setSkill(skillRepo.findById(req.getSkillId()).orElseThrow());
        session.setScheduledAt(LocalDateTime.parse(req.getScheduledAt(), DT_FORMATTER));
        session.setDurationMinutes(req.getDurationMinutes() != null ? req.getDurationMinutes() : 60);
        session.setNotes(req.getNotes());
        session.setStatus(SessionStatus.REQUESTED);
        Session saved = sessionRepo.save(session);

        notifService.create(
                req.getProviderId(),
                NotificationType.SESSION_REQUEST,
                saved.getLearner().getDisplayName() + " wants to learn \"" + saved.getSkill().getTitle() + "\" from you");

        return saved;
    }

    @Transactional(readOnly = true)
    public List<Session> getUserSessions(UUID userId) {
        return sessionRepo.findByLearnerOrProviderWithFetch(userId);
    }

    @Transactional
    public Session updateStatus(UUID sessionId, String status) {
        Session session = sessionRepo.findByIdWithFetch(sessionId).orElseThrow();
        SessionStatus newStatus = SessionStatus.valueOf(status);
        session.setStatus(newStatus);
        sessionRepo.save(session);

        String skillTitle = session.getSkill().getTitle();
        String providerName = session.getProvider().getDisplayName();
        String learnerName = session.getLearner().getDisplayName();
        UUID learnerId = session.getLearner().getUserId();
        UUID providerId = session.getProvider().getUserId();

        switch (newStatus) {
            case CONFIRMED -> notifService.create(learnerId, NotificationType.SESSION_ACCEPTED,
                    providerName + " accepted your session request for \"" + skillTitle + "\"");
            case DECLINED -> notifService.create(learnerId, NotificationType.SESSION_DECLINED,
                    providerName + " declined your session request for \"" + skillTitle + "\"");
            case COMPLETED -> {
                notifService.create(learnerId, NotificationType.SESSION_COMPLETED,
                        "Your session \"" + skillTitle + "\" with " + providerName + " is complete. Leave a rating!");
                notifService.create(providerId, NotificationType.SESSION_COMPLETED,
                        "Your session \"" + skillTitle + "\" with " + learnerName + " is complete. Leave a rating!");
            }
            default -> {}
        }

        return session;
    }
}
