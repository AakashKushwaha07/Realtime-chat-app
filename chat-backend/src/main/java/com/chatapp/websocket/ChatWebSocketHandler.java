package com.chatapp.websocket;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.chatapp.model.Message;
import com.chatapp.model.Room;
import com.chatapp.service.ChatService;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
@EnableWebSocket
public class ChatWebSocketHandler extends TextWebSocketHandler implements WebSocketConfigurer {

    private final ObjectMapper mapper = new ObjectMapper();
    private final ChatService chatService;

    // username -> sessions (supports multiple tabs)
    private final Map<String, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(ChatService chatService) {
        this.chatService = chatService;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(this, "/chat")
                .setAllowedOrigins("http://localhost:3000");
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String username = extractQueryParam(session.getUri(), "username");
        if (username != null && !username.isBlank()) {
            session.getAttributes().put("username", username);
            userSessions.computeIfAbsent(username, k -> new CopyOnWriteArraySet<>()).add(session);
        }
        broadcastPresence();

    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Object u = session.getAttributes().get("username");
        if (u != null) {
            String username = u.toString();
            Set<WebSocketSession> set = userSessions.get(username);
            if (set != null) {
                set.remove(session);
                if (set.isEmpty()) userSessions.remove(username);
            }
        }
        broadcastPresence();

    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Message msg = mapper.readValue(message.getPayload(), Message.class);

        // Save message in DB
        chatService.save(msg);

        // ✅ If roomId exists -> group routing
        if (msg.getRoomId() != null && !msg.getRoomId().isBlank()) {
            Optional<Room> roomOpt = chatService.findRoom(msg.getRoomId());
            if (roomOpt.isEmpty()) return;

            Room room = roomOpt.get();
            String payload = mapper.writeValueAsString(msg);

            for (String member : room.getMembers()) {
                sendToUser(member, payload);
            }
            return;
        }

        // ✅ else fallback to old logic (private receiver or ALL)
        String receiver = (msg.getReceiver() == null || msg.getReceiver().isBlank()) ? "ALL" : msg.getReceiver();
        String payload = mapper.writeValueAsString(msg);

        if ("ALL".equalsIgnoreCase(receiver)) {
            // broadcast to all online users
            for (String user : userSessions.keySet()) {
                sendToUser(user, payload);
            }
            return;
        }

        // private
        sendToUser(receiver, payload);         // to receiver
        sendToUser(msg.getSender(), payload);  // echo back to sender
    }

    private void sendToUser(String username, String payload) throws Exception {
        Set<WebSocketSession> sessions = userSessions.get(username);
        if (sessions == null) return;
        for (WebSocketSession s : sessions) {
            if (s.isOpen()) s.sendMessage(new TextMessage(payload));
        }
    }
    private void broadcastPresence() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "PRESENCE");
        payload.put("online", new ArrayList<>(userSessions.keySet())); // usernames online now
        String json = mapper.writeValueAsString(payload);

        for (Set<WebSocketSession> set : userSessions.values()) {
            for (WebSocketSession s : set) {
                if (s.isOpen()) s.sendMessage(new TextMessage(json));
            }
        }
    }

    private String extractQueryParam(URI uri, String key) {
        if (uri == null || uri.getQuery() == null) return null;
        String[] pairs = uri.getQuery().split("&");
        for (String p : pairs) {
            String[] kv = p.split("=", 2);
            if (kv.length == 2 && kv[0].equals(key)) return kv[1];
        }
        return null;
    }
}
