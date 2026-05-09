package com.skillswap.service;

import com.skillswap.config.JwtUtil;
import com.skillswap.dto.AuthRequest;
import com.skillswap.dto.AuthResponse;
import com.skillswap.model.User;
import com.skillswap.model.SkillProfile;
import com.skillswap.model.enums.UserRole;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.SkillProfileRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository userRepo;
    private final SkillProfileRepository profileRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

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
}
