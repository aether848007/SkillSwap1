package com.skillswap.dto;

import java.util.UUID;

public class MessageRequest {
    private UUID receiverId;
    private String content;

    public UUID getReceiverId() { return receiverId; }
    public void setReceiverId(UUID r) { this.receiverId = r; }
    public String getContent() { return content; }
    public void setContent(String c) { this.content = c; }
}
