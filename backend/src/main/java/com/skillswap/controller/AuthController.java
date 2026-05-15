package com.skillswap.controller;

import com.skillswap.dto.AuthRequest;
import com.skillswap.dto.AuthResponse;
import com.skillswap.dto.GoogleAuthRequest;
import com.skillswap.dto.OtpChallengeResponse;
import com.skillswap.dto.OtpResendRequest;
import com.skillswap.dto.OtpVerifyRequest;
import com.skillswap.model.OtpChallenge;
import com.skillswap.service.AuthService;
import com.skillswap.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService a) { this.authService = a; }

    /** Start signup. Always responds with the same challenge shape so account existence isn't exposed. */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody AuthRequest req) {
        try {
            OtpChallenge ch = authService.beginSignup(req);
            return ResponseEntity.ok(toChallengeResponse(ch));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Start login. Returns a challenge; the JWT is only minted after /verify-otp. */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest req) {
        try {
            OtpChallenge ch = authService.beginLogin(req);
            return ResponseEntity.ok(toChallengeResponse(ch));
        } catch (AuthService.BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Final step — verify the OTP and receive the JWT. */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody OtpVerifyRequest req) {
        try {
            AuthResponse resp = authService.completeChallenge(req.getChallengeId(), req.getCode());
            return ResponseEntity.ok(resp);
        } catch (OtpService.InvalidCodeException e) {
            return ResponseEntity.status(400).body(Map.of(
                    "error", e.getMessage(),
                    "attemptsRemaining", e.getAttemptsRemaining()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(410).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    /** Resend the code for an existing challenge. Server-enforced 60s cooldown. */
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@Valid @RequestBody OtpResendRequest req) {
        try {
            OtpChallenge ch = authService.resendCode(req.getChallengeId());
            return ResponseEntity.ok(toChallengeResponse(ch));
        } catch (OtpService.TooSoonException e) {
            return ResponseEntity.status(429).body(Map.of(
                    "error", e.getMessage(),
                    "retryAfterSeconds", e.getRetryAfterSeconds()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(410).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /** Google OAuth code-exchange — unchanged path, still returns JWT directly. */
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleAuthRequest req) {
        try {
            return ResponseEntity.ok(authService.googleLogin(req.getCode(), req.getRedirectUri()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    private static OtpChallengeResponse toChallengeResponse(OtpChallenge ch) {
        long expiresInSeconds = Math.max(0, Duration.between(LocalDateTime.now(), ch.getExpiresAt()).toSeconds());
        return new OtpChallengeResponse(
                ch.getChallengeId(),
                ch.getEmail(),
                ch.getIntent(),
                (int) expiresInSeconds,
                OtpService.RESEND_COOLDOWN_SECONDS);
    }
}
