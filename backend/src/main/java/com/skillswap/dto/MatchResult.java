package com.skillswap.dto;

import java.util.List;
import java.util.UUID;

public class MatchResult {
    private UUID userId;
    private String displayName;
    private String avatarUrl;
    private String city;
    private Double averageRating;
    private Integer totalSessions;
    private double matchScore;
    private List<String> theyTeachMe;
    private List<String> iTeachThem;
    private List<String> theirOfferedSkills;
    private List<String> theirWantedSkills;

    public MatchResult() {}

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }
    public Integer getTotalSessions() { return totalSessions; }
    public void setTotalSessions(Integer totalSessions) { this.totalSessions = totalSessions; }
    public double getMatchScore() { return matchScore; }
    public void setMatchScore(double matchScore) { this.matchScore = matchScore; }
    public List<String> getTheyTeachMe() { return theyTeachMe; }
    public void setTheyTeachMe(List<String> theyTeachMe) { this.theyTeachMe = theyTeachMe; }
    public List<String> getITeachThem() { return iTeachThem; }
    public void setITeachThem(List<String> iTeachThem) { this.iTeachThem = iTeachThem; }
    public List<String> getTheirOfferedSkills() { return theirOfferedSkills; }
    public void setTheirOfferedSkills(List<String> s) { this.theirOfferedSkills = s; }
    public List<String> getTheirWantedSkills() { return theirWantedSkills; }
    public void setTheirWantedSkills(List<String> s) { this.theirWantedSkills = s; }
}
