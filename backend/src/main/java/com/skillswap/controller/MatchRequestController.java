package com.skillswap.controller;

import com.skillswap.model.MatchRequest;
import com.skillswap.model.User;
import com.skillswap.model.enums.MatchRequestStatus;
import com.skillswap.model.enums.NotificationType;
import com.skillswap.repository.MatchRequestRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/match-requests")
public class MatchRequestController {
    private final MatchRequestRepository matchReqRepo;
    private final UserRepository userRepo;
    private final NotificationService notifService;

    public MatchRequestController(MatchRequestRepository mr, UserRepository u, NotificationService n) {
        this.matchReqRepo = mr; this.userRepo = u; this.notifService = n;
    }

    @PostMapping
    public ResponseEntity<?> propose(Authentication auth, @RequestBody Map<String, Object> body) {
        UUID fromId = (UUID) auth.getPrincipal();
        UUID toId   = UUID.fromString((String) body.get("toUserId"));

        if (fromId.equals(toId)) return ResponseEntity.badRequest().body(Map.of("error", "Cannot propose to yourself"));

        boolean alreadyPending = matchReqRepo.existsByFromUserUserIdAndToUserUserIdAndStatus(
                fromId, toId, MatchRequestStatus.PENDING);
        if (alreadyPending) return ResponseEntity.badRequest().body(Map.of("error", "Proposal already sent"));

        User from = userRepo.findById(fromId).orElseThrow();
        User to   = userRepo.findById(toId).orElseThrow();

        MatchRequest mr = new MatchRequest();
        mr.setFromUser(from);
        mr.setToUser(to);
        mr.setTheyTeachMe(listToString(body.get("theyTeachMe")));
        mr.setITeachThem(listToString(body.get("iTeachThem")));
        String msg = (String) body.get("message");
        if (msg != null && !msg.isBlank()) mr.setMessage(msg.trim());
        matchReqRepo.save(mr);

        String notifMsg = from.getDisplayName() + " wants to swap skills with you!";
        if (msg != null && !msg.isBlank()) notifMsg += " \"" + (msg.length() > 60 ? msg.substring(0, 60) + "…" : msg) + "\"";
        notifService.create(toId, NotificationType.MATCH_REQUEST, notifMsg);

        return ResponseEntity.ok(Map.of("status", "sent"));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMyRequests(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        List<MatchRequest> requests = matchReqRepo.findAllForUser(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (MatchRequest mr : requests) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("matchRequestId", mr.getMatchRequestId());
            map.put("status", mr.getStatus());
            map.put("theyTeachMe", mr.getTheyTeachMe());
            map.put("iTeachThem", mr.getITeachThem());
            map.put("message", mr.getMessage());
            map.put("createdAt", mr.getCreatedAt());
            map.put("direction", mr.getFromUser().getUserId().equals(userId) ? "sent" : "received");
            User other = mr.getFromUser().getUserId().equals(userId) ? mr.getToUser() : mr.getFromUser();
            map.put("otherUser", Map.of(
                "userId", other.getUserId(),
                "displayName", other.getDisplayName(),
                "avatarUrl", other.getAvatarUrl() != null ? other.getAvatarUrl() : "",
                "city", other.getCity() != null ? other.getCity() : ""
            ));
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<?> accept(Authentication auth, @PathVariable UUID id) {
        UUID userId = (UUID) auth.getPrincipal();
        MatchRequest mr = matchReqRepo.findById(id).orElseThrow();
        if (!mr.getToUser().getUserId().equals(userId)) return ResponseEntity.status(403).build();
        mr.setStatus(MatchRequestStatus.ACCEPTED);
        matchReqRepo.save(mr);
        notifService.create(mr.getFromUser().getUserId(), NotificationType.MATCH_ACCEPTED,
                mr.getToUser().getDisplayName() + " accepted your skill exchange proposal!");
        return ResponseEntity.ok(Map.of("status", "accepted"));
    }

    @PatchMapping("/{id}/decline")
    public ResponseEntity<?> decline(Authentication auth, @PathVariable UUID id) {
        UUID userId = (UUID) auth.getPrincipal();
        MatchRequest mr = matchReqRepo.findById(id).orElseThrow();
        if (!mr.getToUser().getUserId().equals(userId)) return ResponseEntity.status(403).build();
        mr.setStatus(MatchRequestStatus.DECLINED);
        matchReqRepo.save(mr);
        notifService.create(mr.getFromUser().getUserId(), NotificationType.MATCH_DECLINED,
                mr.getToUser().getDisplayName() + " declined your proposal.");
        return ResponseEntity.ok(Map.of("status", "declined"));
    }

    @SuppressWarnings("unchecked")
    private String listToString(Object val) {
        if (val == null) return "";
        if (val instanceof List) return String.join(", ", (List<String>) val);
        return val.toString();
    }
}
