package com.skillswap.service;

import com.skillswap.dto.SessionRequest;
import com.skillswap.model.Session;
import com.skillswap.model.enums.SessionStatus;
import com.skillswap.repository.SessionRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.SkillRepository;
import org.springframework.stereotype.Service;
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

    public SessionService(SessionRepository se, UserRepository u, SkillRepository sk) {
        this.sessionRepo = se; this.userRepo = u; this.skillRepo = sk;
    }

    public Session createSession(UUID learnerId, SessionRequest req) {
        Session session = new Session();
        session.setLearner(userRepo.findById(learnerId).orElseThrow());
        session.setProvider(userRepo.findById(req.getProviderId()).orElseThrow());
        session.setSkill(skillRepo.findById(req.getSkillId()).orElseThrow());
        session.setScheduledAt(LocalDateTime.parse(req.getScheduledAt(), DT_FORMATTER));
        session.setDurationMinutes(req.getDurationMinutes() != null ? req.getDurationMinutes() : 60);
        session.setNotes(req.getNotes());
        session.setStatus(SessionStatus.REQUESTED);
        return sessionRepo.save(session);
    }

    public List<Session> getUserSessions(UUID userId) {
        return sessionRepo.findByLearnerUserIdOrProviderUserIdOrderByScheduledAtDesc(userId, userId);
    }

    public Session updateStatus(UUID sessionId, String status) {
        Session session = sessionRepo.findById(sessionId).orElseThrow();
        session.setStatus(SessionStatus.valueOf(status));
        return sessionRepo.save(session);
    }
}
