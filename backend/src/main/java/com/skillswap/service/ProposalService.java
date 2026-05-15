package com.skillswap.service;

import com.skillswap.dto.ProposeRequest;
import com.skillswap.model.Exchange;
import com.skillswap.model.Proposal;
import com.skillswap.model.Skill;
import com.skillswap.model.User;
import com.skillswap.model.enums.ExchangeStatus;
import com.skillswap.model.enums.NotificationType;
import com.skillswap.model.enums.ProposalStatus;
import com.skillswap.repository.ExchangeRepository;
import com.skillswap.repository.ProposalRepository;
import com.skillswap.repository.SkillRepository;
import com.skillswap.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ProposalService {
    private final ProposalRepository proposalRepo;
    private final ExchangeRepository exchangeRepo;
    private final UserRepository userRepo;
    private final SkillRepository skillRepo;
    private final ExchangeService exchangeService;
    private final NotificationService notifService;

    public ProposalService(ProposalRepository p, ExchangeRepository e, UserRepository u,
                           SkillRepository s, ExchangeService ex, NotificationService n) {
        this.proposalRepo = p; this.exchangeRepo = e; this.userRepo = u;
        this.skillRepo = s; this.exchangeService = ex; this.notifService = n;
    }

    @Transactional
    public Proposal propose(UUID fromId, ProposeRequest req) {
        if (fromId.equals(req.getToUserId())) {
            throw new IllegalArgumentException("You cannot propose an exchange with yourself");
        }
        User from = userRepo.findById(fromId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User to = userRepo.findById(req.getToUserId())
                .orElseThrow(() -> new IllegalArgumentException("Recipient not found"));

        Skill offered = skillRepo.findById(req.getOfferedSkillId())
                .orElseThrow(() -> new IllegalArgumentException("Offered skill not found"));
        Skill requested = skillRepo.findById(req.getRequestedSkillId())
                .orElseThrow(() -> new IllegalArgumentException("Requested skill not found"));

        if (!ownsTeachable(offered, fromId)) {
            throw new IllegalArgumentException("You can only offer an active skill you teach");
        }
        if (!ownsTeachable(requested, req.getToUserId())) {
            throw new IllegalArgumentException("The requested skill is not one the recipient teaches");
        }

        boolean dup = proposalRepo
                .existsByFromUserUserIdAndToUserUserIdAndOfferedSkillSkillIdAndRequestedSkillSkillIdAndStatus(
                        fromId, req.getToUserId(), offered.getSkillId(), requested.getSkillId(),
                        ProposalStatus.PENDING);
        if (dup) throw new IllegalStateException("You already have a pending proposal for these skills");

        if (activeExchangeExists(fromId, req.getToUserId())) {
            throw new IllegalStateException("You already have an active exchange with this person");
        }

        Proposal p = new Proposal();
        p.setFromUser(from);
        p.setToUser(to);
        p.setOfferedSkill(offered);
        p.setRequestedSkill(requested);
        if (req.getMessage() != null && !req.getMessage().isBlank()) {
            p.setMessage(req.getMessage().trim());
        }
        p.setStatus(ProposalStatus.PENDING);
        Proposal saved = proposalRepo.save(p);

        String msg = from.getDisplayName() + " wants to swap: they teach \"" + offered.getTitle()
                + "\" for your \"" + requested.getTitle() + "\".";
        notifService.create(to.getUserId(), NotificationType.MATCH_REQUEST, msg);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Proposal> listForUser(UUID userId) {
        return proposalRepo.findAllForUser(userId);
    }

    /** Accept a proposal — only the recipient may do so. Spawns the Exchange. */
    @Transactional
    public Exchange accept(UUID proposalId, UUID callerId) {
        Proposal p = loadPending(proposalId);
        if (!p.getToUser().getUserId().equals(callerId)) {
            throw new SecurityException("Only the recipient can accept this proposal");
        }
        p.setStatus(ProposalStatus.ACCEPTED);
        p.setDecidedAt(LocalDateTime.now());
        proposalRepo.save(p);

        Exchange exchange = exchangeService.createFromProposal(p);

        notifService.create(p.getFromUser().getUserId(), NotificationType.MATCH_ACCEPTED,
                p.getToUser().getDisplayName() + " accepted your exchange. Schedule your sessions now.");
        return exchange;
    }

    @Transactional
    public void decline(UUID proposalId, UUID callerId) {
        Proposal p = loadPending(proposalId);
        if (!p.getToUser().getUserId().equals(callerId)) {
            throw new SecurityException("Only the recipient can decline this proposal");
        }
        p.setStatus(ProposalStatus.DECLINED);
        p.setDecidedAt(LocalDateTime.now());
        proposalRepo.save(p);
        notifService.create(p.getFromUser().getUserId(), NotificationType.MATCH_DECLINED,
                p.getToUser().getDisplayName() + " declined your exchange proposal.");
    }

    @Transactional
    public void cancel(UUID proposalId, UUID callerId) {
        Proposal p = loadPending(proposalId);
        if (!p.getFromUser().getUserId().equals(callerId)) {
            throw new SecurityException("Only the sender can cancel this proposal");
        }
        p.setStatus(ProposalStatus.CANCELLED);
        p.setDecidedAt(LocalDateTime.now());
        proposalRepo.save(p);
    }

    // --- helpers ---

    private Proposal loadPending(UUID proposalId) {
        Proposal p = proposalRepo.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found"));
        if (p.getStatus() != ProposalStatus.PENDING) {
            throw new IllegalStateException("This proposal has already been " + p.getStatus().name().toLowerCase());
        }
        return p;
    }

    private boolean ownsTeachable(Skill skill, UUID ownerId) {
        return Boolean.TRUE.equals(skill.getIsOffered())
                && Boolean.TRUE.equals(skill.getIsActive())
                && skill.getSkillProfile().getUser().getUserId().equals(ownerId);
    }

    private boolean activeExchangeExists(UUID a, UUID b) {
        return exchangeRepo.existsByStatusAndPartyAUserIdAndPartyBUserId(ExchangeStatus.ACTIVE, a, b)
            || exchangeRepo.existsByStatusAndPartyBUserIdAndPartyAUserId(ExchangeStatus.ACTIVE, a, b);
    }
}
