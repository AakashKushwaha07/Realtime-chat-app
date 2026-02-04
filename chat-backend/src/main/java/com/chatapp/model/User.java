package com.chatapp.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
public class User {

    @Id
    private String id;
    private String username;
    private String password;
    private String email;
    private String resetToken;
    private Long resetTokenExpiry;



    public User() {}

    public User(String username, String password) {
        this.username = username;
        this.password = password;
    }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }

    public Long getResetTokenExpiry() { return resetTokenExpiry; }
    public void setResetTokenExpiry(Long resetTokenExpiry) { this.resetTokenExpiry = resetTokenExpiry; }

    public String getId() { return id; }
    public String getUsername() { return username; }
    public String getPassword() { return password; }

    public void setId(String id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setPassword(String password) { this.password = password; }
}

