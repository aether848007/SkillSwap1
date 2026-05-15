package com.skillswap.controller;

import com.skillswap.dto.SkillDto;
import com.skillswap.service.SearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
public class SearchController {
    private final SearchService searchService;

    public SearchController(SearchService s) { this.searchService = s; }

    @GetMapping
    public ResponseEntity<?> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<SkillDto> all = searchService.searchSkills(query, category);
        int total = all.size();
        int from = page * size;
        List<SkillDto> content = from >= total ? List.of() : all.subList(from, Math.min(from + size, total));
        return ResponseEntity.ok(Map.of("content", content, "total", total, "page", page, "size", size));
    }

    @GetMapping("/by-city")
    public ResponseEntity<List<SkillDto>> byCity(@RequestParam String city) {
        return ResponseEntity.ok(searchService.searchByCity(city));
    }
}
