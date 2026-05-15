package com.skillswap.service;

import com.skillswap.model.Exchange;
import com.skillswap.model.Proposal;
import com.skillswap.model.Session;
import com.skillswap.model.User;
import com.skillswap.model.enums.ExchangeStatus;
import com.skillswap.model.enums.NotificationType;
import com.skillswap.model.enums.SessionStatus;
import com.skillswap.repository.ExchangeRepository;
import com.skillswap.repository.SessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ExchangeService {
    private final ExchangeRepository exchangeRepo;
    private final SessionRepository sessionRepo;
    private final NotificationService notifService;

    public ExchangeService(ExchangeRepository e, SessionRepository s, NotificationService n) {
        this.exchangeRepo = e; this.sessionRepo = s; this.notifService = n;
    }

    /**
     * Spawns an Exchange from an accepted Proposal: creates the exchange record plus its
     * two DRAFT session slots, one per teaching direction.
     */
    @Transactional
    public Exchange createFromProposal(Proposal p) {
        Exchange ex = new Exchange();
        ex.setProposal(p);
        ex.setPartyA(p.getFromUser());          // proposer teaches what they offered
        ex.setSkillA(p.getOfferedSkill());
        ex.setPartyB(p.getToUser());            // acceptor teaches what was requested
        ex.setSkillB(p.getRequestedSkill());
        ex.setStatus(ExchangeStatus.ACTIVE);
        Exchange saved = exchangeRepo.save(ex);

        // Direction 1: partyA teaches skillA -> partyB learns
        sessionRepo.save(draftSession(saved, saved.getPartyA(), saved.getPartyB(), saved.getSkillA()));
        // Direction 2: partyB teaches skillB -> partyA learns
        sessionRepo.save(draftSession(saved, saved.getPartyB(), saved.getPartyA(), saved.getSkillB()));

        return saved;
    }

    private Session draftSession(Exchange ex, User provider, User learner, com.skillswap.model.Skill skill) {
        Session s = new Session();
        s.setExchange(ex);
        s.setProvider(provider);
        s.setLearner(learner);
        s.setSkill(skill);
        s.setStatus(SessionStatus.DRAFT);
        s.setDurationMinutes(60);
        return s;
    }

    @Transactional(readOnly = true)
    public List<Exchange> listForUser(UUID userId) {
        return exchangeRepo.findAllForUser(userId);
    }

    @Transactional(readOnly = true)
    public Exchange getDetail(UUID exchangeId, UUID callerId) {
        Exchange ex = exchangeRepo.findByIdWithFetch(exchangeId)
                .orElseThrow(() -> new IllegalArgumentException("Exchange not found"));
        assertParticipant(ex, callerId);
        return ex;
    }

    @Transactional(readOnly = true)
    public List<Session> sessionsOf(UUID exchangeId) {
        return sessionRepo.findByExchangeId(exchangeId);
    }

    @Transactional
    public Exchange abandon(UUID exchangeId, UUID callerId) {
        Exchange ex = exchangeRepo.findByIdWithFetch(exchangeId)
                .orElseThrow(() -> new IllegalArgumentException("Exchange not found"));
        assertParticipant(ex, callerId);
        if (ex.getStatus() != ExchangeStatus.ACTIVE) {
            throw new IllegalStateException("Only an active exchange can be abandoned");
        }
        ex.setStatus(ExchangeStatus.ABANDONED);
        exchangeRepo.save(ex);

        UUID other = ex.getPartyA().getUserId().equals(callerId)
                ? ex.getPartyB().getUserId() : ex.getPartyA().getUserId();
        notifService.create(other, NotificationType.EXCHANGE_ABANDONED,
                "An exchange was closed by the other party.");
        return ex;
    }

    /**
     * Called after a session becomes RATED. If both of an exchange's sessions are RATED,
     * the exchange itself flips to COMPLETED and both parties are notified.
     */
    @Transactional
    public void completeIfBothSessionsRated(UUID exchangeId) {
        Exchange ex = exchangeRepo.findById(exchangeId).orElse(null);
        if (ex == null || ex.getStatus() != ExchangeStatus.ACTIVE) return;

        List<Session> sessions = sessionRepo.findByExchangeId(exchangeId);
        boolean allRated = !sessions.isEmpty()
                && sessions.stream().allMatch(s -> s.getStatus() == SessionStatus.RATED);
        if (!allRated) return;

        ex.setStatus(ExchangeStatus.COMPLETED);
        exchangeRepo.save(ex);
        notifService.create(ex.getPartyA().getUserId(), NotificationType.EXCHANGE_COMPLETED,
                "Your skill exchange is complete. Nicely done!");
        notifService.create(ex.getPartyB().getUserId(), NotificationType.EXCHANGE_COMPLETED,
                "Your skill exchange is complete. Nicely done!");
    }

    private void assertParticipant(Exchange ex, UUID userId) {
        if (!ex.getPartyA().getUserId().equals(userId) && !ex.getPartyB().getUserId().equals(userId)) {
            throw new SecurityException("Not a participant in this exchange");
        }
    }
}
