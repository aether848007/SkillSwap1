package com.skillswap.service;

import com.skillswap.model.OtpChallenge;
import com.skillswap.model.User;
import com.skillswap.model.enums.OtpIntent;
import com.skillswap.repository.OtpChallengeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class OtpService {
    public static final int CODE_LENGTH = 6;
    public static final int EXPIRY_MINUTES = 5;
    public static final int RESEND_COOLDOWN_SECONDS = 60;
    public static final int MAX_ATTEMPTS = 5;

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpChallengeRepository otpRepo;
    private final EmailService emailService;
    private final PasswordEncoder encoder;
    /** Self-reference so we can call @Transactional helpers and have them go through the proxy. */
    @Autowired @Lazy
    private OtpService self;

    public OtpService(OtpChallengeRepository otpRepo, EmailService emailService, PasswordEncoder encoder) {
        this.otpRepo = otpRepo;
        this.emailService = emailService;
        this.encoder = encoder;
    }

    @Transactional
    public OtpChallenge createAndSend(String email, OtpIntent intent, User user) {
        String code = generateCode();
        OtpChallenge ch = new OtpChallenge();
        ch.setEmail(email);
        if (user != null) ch.setUserId(user.getUserId());
        ch.setCodeHash(encoder.encode(code));
        ch.setIntent(intent);
        ch.setAttemptsRemaining(MAX_ATTEMPTS);
        ch.setExpiresAt(LocalDateTime.now().plusMinutes(EXPIRY_MINUTES));
        ch.setLastSentAt(LocalDateTime.now());
        ch.setConsumed(false);
        OtpChallenge saved = otpRepo.save(ch);
        emailService.sendOtpEmail(email, code, EXPIRY_MINUTES);
        return saved;
    }

    @Transactional
    public OtpChallenge resend(UUID challengeId) {
        OtpChallenge ch = otpRepo.findById(challengeId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired challenge"));
        if (ch.isConsumed()) throw new IllegalStateException("Challenge already used or invalidated");

        long secondsSince = Duration.between(ch.getLastSentAt(), LocalDateTime.now()).toSeconds();
        if (secondsSince < RESEND_COOLDOWN_SECONDS) {
            long wait = RESEND_COOLDOWN_SECONDS - secondsSince;
            throw new TooSoonException("Please wait " + wait + "s before requesting another code", wait);
        }

        String code = generateCode();
        ch.setCodeHash(encoder.encode(code));
        ch.setAttemptsRemaining(MAX_ATTEMPTS);
        ch.setExpiresAt(LocalDateTime.now().plusMinutes(EXPIRY_MINUTES));
        ch.setLastSentAt(LocalDateTime.now());
        OtpChallenge saved = otpRepo.save(ch);
        emailService.sendOtpEmail(ch.getEmail(), code, EXPIRY_MINUTES);
        return saved;
    }

    /**
     * Two-phase verify:
     *  1. recordAttempt(): runs in its OWN transaction (REQUIRES_NEW) — always commits, regardless
     *     of what we throw afterward. That's how the attempt counter actually decrements.
     *  2. After it commits, we throw (or return) to signal the caller.
     */
    public OtpChallenge verify(UUID challengeId, String code) {
        VerifyResult result = self.recordAttempt(challengeId, code);
        switch (result.outcome) {
            case NOT_FOUND:        throw new IllegalArgumentException("Invalid or expired challenge");
            case CONSUMED:         throw new IllegalStateException("Challenge already used or invalidated");
            case EXPIRED:          throw new IllegalStateException("Code has expired. Request a new one.");
            case EXHAUSTED:        throw new IllegalStateException("Too many attempts. Request a new code.");
            case INVALID:          throw new InvalidCodeException("Incorrect code", result.attemptsRemaining);
            case OK:               return result.challenge;
        }
        throw new IllegalStateException("Unreachable");
    }

    /**
     * The actual DB mutation. REQUIRES_NEW so that even if the outer call throws, this commit lives.
     * Never throws — encodes the outcome in the returned VerifyResult.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public VerifyResult recordAttempt(UUID challengeId, String code) {
        var maybe = otpRepo.findById(challengeId);
        if (maybe.isEmpty()) return new VerifyResult(Outcome.NOT_FOUND, null, 0);
        OtpChallenge ch = maybe.get();

        if (ch.isConsumed()) return new VerifyResult(Outcome.CONSUMED, null, 0);
        if (LocalDateTime.now().isAfter(ch.getExpiresAt())) {
            ch.setConsumed(true);
            otpRepo.save(ch);
            return new VerifyResult(Outcome.EXPIRED, null, 0);
        }
        if (ch.getAttemptsRemaining() <= 0) {
            ch.setConsumed(true);
            otpRepo.save(ch);
            return new VerifyResult(Outcome.EXHAUSTED, null, 0);
        }

        boolean ok = code != null && code.length() == CODE_LENGTH && encoder.matches(code, ch.getCodeHash());
        if (!ok) {
            ch.setAttemptsRemaining(ch.getAttemptsRemaining() - 1);
            int left = ch.getAttemptsRemaining();
            if (left <= 0) ch.setConsumed(true);
            OtpChallenge saved = otpRepo.save(ch);
            return new VerifyResult(Outcome.INVALID, saved, left);
        }

        ch.setConsumed(true);
        OtpChallenge saved = otpRepo.save(ch);
        return new VerifyResult(Outcome.OK, saved, ch.getAttemptsRemaining());
    }

    private static String generateCode() {
        int n = RANDOM.nextInt(1_000_000);
        return String.format("%06d", n);
    }

    // --- typed result + exceptions ---

    enum Outcome { OK, INVALID, EXPIRED, EXHAUSTED, CONSUMED, NOT_FOUND }

    public static class VerifyResult {
        final Outcome outcome;
        final OtpChallenge challenge;
        final int attemptsRemaining;
        VerifyResult(Outcome o, OtpChallenge c, int a) {
            this.outcome = o; this.challenge = c; this.attemptsRemaining = a;
        }
    }

    public static class InvalidCodeException extends RuntimeException {
        private final int attemptsRemaining;
        public InvalidCodeException(String msg, int attemptsRemaining) {
            super(msg);
            this.attemptsRemaining = attemptsRemaining;
        }
        public int getAttemptsRemaining() { return attemptsRemaining; }
    }

    public static class TooSoonException extends RuntimeException {
        private final long retryAfterSeconds;
        public TooSoonException(String msg, long retryAfterSeconds) {
            super(msg);
            this.retryAfterSeconds = retryAfterSeconds;
        }
        public long getRetryAfterSeconds() { return retryAfterSeconds; }
    }
}
