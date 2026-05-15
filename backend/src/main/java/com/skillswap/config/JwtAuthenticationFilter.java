package com.skillswap.config;

import com.skillswap.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final ObjectProvider<UserRepository> userRepoProvider;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, ObjectProvider<UserRepository> userRepoProvider) {
        this.jwtUtil = jwtUtil;
        this.userRepoProvider = userRepoProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtUtil.isTokenValid(token)) {
                Claims claims = jwtUtil.extractClaims(token);
                UUID userId = UUID.fromString(claims.getSubject());
                String role = claims.get("role", String.class);

                UserRepository userRepo = userRepoProvider.getIfAvailable();
                if (userRepo != null) {
                    var userOpt = userRepo.findById(userId);
                    if (userOpt.isPresent() && userOpt.get().isDisabled()) {
                        response.setContentType("application/json");
                        response.setStatus(403);
                        response.getWriter().write("{\"error\":\"Account disabled\"}");
                        return;
                    }
                }

                var auth = new UsernamePasswordAuthenticationToken(
                    userId, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        chain.doFilter(request, response);
    }
}
