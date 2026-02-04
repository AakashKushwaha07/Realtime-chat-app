package com.chatapp.model;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "rooms")
public class Room {

    @Id
    private String id;

    private String name;            // e.g. "Java Team"
    private List<String> members;   // usernames
    private LocalDateTime createdAt;

    public Room() {}

    public Room(String name, List<String> members) {
        this.name = name;
        this.members = members;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public List<String> getMembers() { return members; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(String id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setMembers(List<String> members) { this.members = members; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
