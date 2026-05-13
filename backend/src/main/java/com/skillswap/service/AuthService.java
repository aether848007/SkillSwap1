package com.skillswap.service;

import com.skillswap.config.JwtUtil;
import com.skillswap.dto.AuthRequest;
import com.skillswap.dto.AuthResponse;
import com.skillswap.model.User;
import com.skillswap.model.SkillProfile;
import com.skillswap.model.enums.UserRole;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.SkillProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository userRepo;
    private final SkillProfileRepository profileRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    @Value("${google.client-id:}")
    private String googleClientId;

    @Value("${google.client-secret:}")
    private String googleClientSecret;

    public AuthService(UserRepository u, SkillProfileRepository p, PasswordEncoder e, JwtUtil j) {
        this.userRepo = u; this.profileRepo = p; this.encoder = e; this.jwtUtil = j;
    }

    public AuthResponse register(AuthRequest req) {
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        User user = new User();
        user.setEmail(req.getEmail());
        user.setPassword(encoder.encode(req.getPassword()));
        user.setDisplayName(req.getDisplayName() != null ? req.getDisplayName() : req.getEmail().split("@")[0]);
        user.setRole(UserRole.LEARNER);
        user.setCity(req.getCity() != null ? req.getCity() : "Not specified");
        user.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.getDisplayName());
        user = userRepo.save(user);

        SkillProfile profile = new SkillProfile();
        profile.setUser(user);
        profileRepo.save(profile);

        String token = jwtUtil.generateToken(user.getUserId(), user.getEmail(), user.getRole().name());
        String refresh = jwtUtil.generateRefreshToken(user.getUserId());
        return new AuthResponse(token, refresh, user.getUserId(), user.getEmail(), user.getDisplayName(), user.getRole().name());
    }

    public AuthResponse login(AuthRequest req) {
        User user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        if (!encoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        String token = jwtUtil.generateToken(user.getUserId(), user.getEmail(), user.getRole().name());
        String refresh = jwtUtil.generateRefreshToken(user.getUserId());
        return new AuthResponse(token, refresh, user.getUserId(), user.getEmail(), user.getDisplayName(), user.getRole().name());
    }

    @SuppressWarnings("unchecked")
    public AuthResponse googleLogin(String code, String redirectUri) {
        if (googleClientId.isBlank() || googleClientSecret.isBlank()) {
            throw new RuntimeException("Google OAuth is not configured on the server");
        }

        RestTemplate rest = new RestTemplate();

        // 1. Exchange authorization code for tokens
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

        // 2. Fetch user info from Google
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

        // 3. Find existing user or create one
        User user = userRepo.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setEmail(email);
            u.setDisplayName(name != null ? name : email.split("@")[0]);
            u.setAvatarUrl(picture);
            u.setOauthProvider("GOOGLE");
            u.setRole(UserRole.LEARNER);
            u.setCity("Not specified");
            // unusable random password — Google users sign in via OAuth only
            u.setPassword(encoder.encode(UUID.randomUUID().toString()));
            User saved = userRepo.save(u);
            SkillProfile profile = new SkillProfile();
            profile.setUser(saved);
            profileRepo.save(profile);
            return saved;
        });

        // Update avatar if it changed
        if (picture != null && !picture.equals(user.getAvatarUrl())) {
            user.setAvatarUrl(picture);
            userRepo.save(user);
        }

        String token   = jwtUtil.generateToken(user.getUserId(), user.getEmail(), user.getRole().name());
        String refresh = jwtUtil.generateRefreshToken(user.getUserId());
        return new AuthResponse(token, refresh, user.getUserId(), user.getEmail(), user.getDisplayName(), user.getRole().name());
    }
}
