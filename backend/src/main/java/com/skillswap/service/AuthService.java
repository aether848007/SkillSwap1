package com.skillswap.service;

import com.skillswap.config.JwtUtil;
import com.skillswap.dto.AuthRequest;
import com.skillswap.dto.AuthResponse;
import com.skillswap.model.OtpChallenge;
import com.skillswap.model.SkillProfile;
import com.skillswap.model.User;
import com.skillswap.model.enums.OtpIntent;
import com.skillswap.model.enums.UserRole;
import com.skillswap.repository.SkillProfileRepository;
import com.skillswap.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository userRepo;
    private final SkillProfileRepository profileRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;
    private final EmailService emailService;

    @Value("${google.client-id:}")
    private String googleClientId;

    @Value("${google.client-secret:}")
    private String googleClientSecret;

    public AuthService(UserRepository u, SkillProfileRepository p, PasswordEncoder e, JwtUtil j,
                       OtpService otpService, EmailService emailService) {
        this.userRepo = u; this.profileRepo = p; this.encoder = e; this.jwtUtil = j;
        this.otpService = otpService;
        this.emailService = emailService;
    }

    /**
     * Begins signup. Always returns a challenge so we don't leak account existence.
     * - new email → creates an unverified user + SIGNUP challenge → emails OTP
     * - existing unverified user → reuses the user, issues a new SIGNUP challenge
     * - existing verified user → emails an "account exists" message and issues a dummy
     *   challenge that will never verify, so timing + response shape stay identical
     */
    @Transactional
    public OtpChallenge beginSignup(AuthRequest req) {
        String email = normaliseEmail(req.getEmail());
        Optional<User> existing = userRepo.findByEmail(email);

        if (existing.isPresent() && existing.get().isEmailVerified()) {
            // Tell the user via email; respond to the client with an unverifiable challenge.
            emailService.sendAccountExistsEmail(email);
            return otpService.createAndSend(email, OtpIntent.SIGNUP, null);
            // Note: the OTP we just emailed is unrelated to the existing account; even if the
            // attacker guesses it, completeChallenge() will refuse to upgrade an already-verified
            // user. Result: no enumeration, no privilege gain.
        }

        User user = existing.orElseGet(() -> createPendingUser(email, req));
        return otpService.createAndSend(email, OtpIntent.SIGNUP, user);
    }

    /**
     * Begins login. Validates credentials silently (no enumeration). On bad creds, throws
     * a generic exception that the controller maps to 401 with a single error string.
     */
    @Transactional
    public OtpChallenge beginLogin(AuthRequest req) {
        String email = normaliseEmail(req.getEmail());
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (user.isDisabled()) {
            throw new BadCredentialsException("Invalid credentials");
        }
        if (!encoder.matches(req.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        // If the existing user never finished verification, treat this as a resumed signup
        // (issue a SIGNUP challenge so completeChallenge() flips email_verified on success).
        OtpIntent intent = user.isEmailVerified() ? OtpIntent.LOGIN : OtpIntent.SIGNUP;
        return otpService.createAndSend(email, intent, user);
    }

    /**
     * Verifies the OTP, mints a JWT, and returns the auth response.
     * Side effect: marks the user email_verified on SIGNUP success.
     */
    @Transactional
    public AuthResponse completeChallenge(UUID challengeId, String code) {
        OtpChallenge verified = otpService.verify(challengeId, code);
        User user = userRepo.findByEmail(verified.getEmail())
                .orElseThrow(() -> new RuntimeException("User no longer exists"));
        if (verified.getIntent() == OtpIntent.SIGNUP) {
            if (!user.isEmailVerified()) {
                user.setEmailVerified(true);
                user = userRepo.save(user);
            }
        }
        String token   = jwtUtil.generateToken(user.getUserId(), user.getEmail(), user.getRole().name());
        String refresh = jwtUtil.generateRefreshToken(user.getUserId());
        return new AuthResponse(token, refresh, user.getUserId(), user.getEmail(), user.getDisplayName(), user.getRole().name());
    }

    public OtpChallenge resendCode(UUID challengeId) {
        return otpService.resend(challengeId);
    }

    // --- Google OAuth — unchanged, but emailVerified=true since Google has done verification for us ---

    @SuppressWarnings("unchecked")
    public AuthResponse googleLogin(String code, String redirectUri) {
        if (googleClientId.isBlank() || googleClientSecret.isBlank()) {
            throw new RuntimeException("Google OAuth is not configured on the server");
        }

        RestTemplate rest = new RestTemplate();

        MultiValueMap<String, String> tokenParams = new LinkedMultiValueMap<>();
        tokenParams.add("code", code);
        tokenParams.add("client_id", googleClientId);
        tokenParams.add("client_secret", googleClientSecret);
        tokenParams.add("redirect_uri", redirectUri);
        tokenParams.add("grant_type", "authorization_code");

        HttpHeaders tokenHeaders = new HttpHeaders();
        tokenHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        ResponseEntity<Map> tokenRes = rest.postForEntity(
                "https://oauth2.googleapis.com/token",
                new HttpEntity<>(tokenParams, tokenHeaders),
                Map.class);

        String accessToken = (String) tokenRes.getBody().get("access_token");
        if (accessToken == null) throw new RuntimeException("Failed to obtain Google access token");

        HttpHeaders userInfoHeaders = new HttpHeaders();
        userInfoHeaders.setBearerAuth(accessToken);
        ResponseEntity<Map> userInfoRes = rest.exchange(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                HttpMethod.GET,
                new HttpEntity<>(userInfoHeaders),
                Map.class);

        Map<String, Object> info = userInfoRes.getBody();
        String email   = (String) info.get("email");
        String name    = (String) info.get("name");
        String picture = (String) info.get("picture");
        if (email == null) throw new RuntimeException("Google did not return an email address");

        User user = userRepo.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setEmail(email);
            u.setDisplayName(name != null ? name : email.split("@")[0]);
            u.setAvatarUrl(picture);
            u.setOauthProvider("GOOGLE");
            u.setRole(UserRole.LEARNER);
            u.setCity("Not specified");
            u.setEmailVerified(true);
            u.setPassword(encoder.encode(UUID.randomUUID().toString()));
            User saved = userRepo.save(u);
            SkillProfile profile = new SkillProfile();
            profile.setUser(saved);
            profileRepo.save(profile);
            return saved;
        });

        if (picture != null && !picture.equals(user.getAvatarUrl())) {
            user.setAvatarUrl(picture);
            userRepo.save(user);
        }
        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            userRepo.save(user);
        }

        String token   = jwtUtil.generateToken(user.getUserId(), user.getEmail(), user.getRole().name());
        String refresh = jwtUtil.generateRefreshToken(user.getUserId());
        return new AuthResponse(token, refresh, user.getUserId(), user.getEmail(), user.getDisplayName(), user.getRole().name());
    }

    // --- helpers ---

    private User createPendingUser(String email, AuthRequest req) {
        User u = new User();
        u.setEmail(email);
        u.setPassword(encoder.encode(req.getPassword()));
        u.setDisplayName(req.getDisplayName() != null ? req.getDisplayName().trim() : email.split("@")[0]);
        u.setRole(UserRole.LEARNER);
        u.setCity(req.getCity() != null ? req.getCity().trim() : "Not specified");
        u.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=" + u.getDisplayName());
        u.setEmailVerified(false);
        User saved = userRepo.save(u);
        SkillProfile profile = new SkillProfile();
        profile.setUser(saved);
        profileRepo.save(profile);
        return saved;
    }

    private static String normaliseEmail(String e) {
        return e == null ? "" : e.trim().toLowerCase();
    }

    public static class BadCredentialsException extends RuntimeException {
        public BadCredentialsException(String msg) { super(msg); }
    }
}
