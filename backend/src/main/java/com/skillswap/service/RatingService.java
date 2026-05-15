package com.skillswap.service;

import com.skillswap.dto.RatingCreateRequest;
import com.skillswap.model.Rating;
import com.skillswap.model.Session;
import com.skillswap.model.enums.NotificationType;
import com.skillswap.model.enums.SessionStatus;
import com.skillswap.repository.RatingRepository;
import com.skillswap.repository.SessionRepository;
import com.skillswap.repository.SkillProfileRepository;
import com.skillswap.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
public class RatingService {
    private final RatingRepository ratingRepo;
    private final SessionRepository sessionRepo;
    private final SkillProfileRepository profileRepo;
    private final UserRepository userRepo;
    private final NotificationService notifService;
    private final ExchangeService exchangeService;

    public RatingService(RatingRepository r, SessionRepository s, SkillProfileRepository p, UserRepository u,
                         NotificationService n, ExchangeService exchangeService) {
        this.ratingRepo = r; this.sessionRepo = s; this.profileRepo = p; this.userRepo = u;
        this.notifService = n; this.exchangeService = exchangeService;
    }

    @Transactional
    public Rating createRating(UUID sessionId, UUID raterId, RatingCreateRequest req) {
        Session session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() != SessionStatus.COMPLETED && session.getStatus() != SessionStatus.RATED) {
            throw new IllegalArgumentException("Session must be completed before rating");
        }

        boolean isLearner  = session.getLearner().getUserId().equals(raterId);
        boolean isProvider = session.getProvider().getUserId().equals(raterId);
        if (!isLearner && !isProvider) {
            throw new IllegalArgumentException("You are not a participant in this session");
        }

        if (ratingRepo.existsBySessionSessionIdAndRaterUserId(sessionId, raterId)) {
            throw new IllegalStateException("Already rated this session");
        }

        UUID rateeId = isLearner ? session.getProvider().getUserId() : session.getLearner().getUserId();

        Rating rating = new Rating();
        rating.setSession(session);
        rating.setRater(userRepo.findById(raterId).orElseThrow());
        rating.setRatee(userRepo.findById(rateeId).orElseThrow());
        rating.setScore(req.getScore());
        rating.setComment(req.getComment());
        rating = ratingRepo.save(rating);

        // First rating on a session flips it to RATED. The exchange completes once BOTH
        // of its sessions are RATED — see ExchangeService.completeIfBothSessionsRated.
        session.setStatus(SessionStatus.RATED);
        sessionRepo.save(session);
        if (session.getExchange() != null) {
            exchangeService.completeIfBothSessionsRated(session.getExchange().getExchangeId());
        }

        Double avg = ratingRepo.getAverageRatingForUser(rateeId);
        profileRepo.findByUserUserId(rateeId).ifPresent(p -> {
            p.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
            profileRepo.save(p);
        });

        String raterName = rating.getRater().getDisplayName();
        String stars = "★".repeat(req.getScore()) + "☆".repeat(5 - req.getScore());
        notifService.create(rateeId, NotificationType.NEW_RATING,
                raterName + " rated your session " + stars
                        + (req.getComment() != null && !req.getComment().isBlank()
                           ? ": \"" + req.getComment() + "\"" : ""));

        return rating;
    }
}
