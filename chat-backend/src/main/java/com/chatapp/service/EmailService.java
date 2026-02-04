package com.chatapp.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendResetEmail(String toEmail, String token) {
        String url = frontendBaseUrl +
                "/?mode=reset&token=" +
                URLEncoder.encode(token, StandardCharsets.UTF_8);

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(toEmail);
        msg.setSubject("Chat App - Reset your password");
        msg.setText(
            "You requested a password reset.\n\n" +
            "Click this link to reset your password:\n" +
            url + "\n\n" +
            "This link expires in 15 minutes.\n" +
            "If you did not request this, ignore this email."
        );

        mailSender.send(msg);
    }
}
