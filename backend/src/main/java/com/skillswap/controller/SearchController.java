package com.skillswap.controller;

import com.skillswap.dto.SkillDto;
import com.skillswap.service.SearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/search")
public class SearchController {
    private final SearchService searchService;

    public SearchController(SearchService s) { this.searchService = s; }

    @GetMapping
    public ResponseEntity<List<SkillDto>> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(searchService.searchSkills(query, category));
    }
}
