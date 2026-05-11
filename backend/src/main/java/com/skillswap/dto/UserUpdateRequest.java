package com.skillswap.dto;

import jakarta.validation.constraints.Size;

public class UserUpdateRequest {
    @Size(max = 100)
    private String displayName;

    @Size(max = 1000)
    private String bio;

    private String city;

    private String avatarUrl;

    private Double latitude;

    private Double longitude;

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String d) { this.displayName = d; }
    public String getBio() { return bio; }
    public void setBio(String b) { this.bio = b; }
    public String getCity() { return city; }
    public void setCity(String c) { this.city = c; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String a) { this.avatarUrl = a; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double lat) { this.latitude = lat; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double lng) { this.longitude = lng; }
}
