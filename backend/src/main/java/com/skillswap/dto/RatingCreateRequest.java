package com.skillswap.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class RatingCreateRequest {
    @NotNull
    @Min(1) @Max(5)
    private Integer score;

    private String comment;

    public Integer getScore() { return score; }
    public void setScore(Integer s) { this.score = s; }
    public String getComment() { return comment; }
    public void setComment(String c) { this.comment = c; }
}
