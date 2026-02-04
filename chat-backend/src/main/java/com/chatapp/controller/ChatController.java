package com.chatapp.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.chatapp.model.Message;
import com.chatapp.model.Room;
import com.chatapp.model.User;
import com.chatapp.repository.MessageRepository;
import com.chatapp.repository.RoomRepository;
import com.chatapp.repository.UserRepository;
import com.chatapp.service.EmailService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000","https://realtime-chat-app-rea3.onrender.com/"})
public class ChatController {

    private final UserRepository userRepo;
    private final MessageRepository messageRepo;
    private final RoomRepository roomRepo;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final EmailService emailService;


    public ChatController(UserRepository userRepo,
                      MessageRepository messageRepo,
                      RoomRepository roomRepo,
                      EmailService emailService) {
    this.userRepo = userRepo;
    this.messageRepo = messageRepo;
    this.roomRepo = roomRepo;
    this.emailService = emailService;}

    private final Path uploadDir = Paths.get("uploads");

    @GetMapping("/users")
    public List<String> users() {
        return userRepo.findAll().stream().map(User::getUsername).toList();
    }

    @PostMapping("/rooms")
    public Room createRoom(@RequestBody Room room) {
        return roomRepo.save(new Room(room.getName(), room.getMembers()));
    }

    @GetMapping("/rooms")
    public List<Room> myRooms(@RequestParam String me) {
        return roomRepo.findByMembersContaining(me);
    }

    @GetMapping("/history")
public List<Message> history(
        @RequestParam(required = false) String roomId,
        @RequestParam(required = false) String me,
        @RequestParam(required = false, name = "with") String withUser
) {
    if (roomId != null && !roomId.isBlank()) {
        return messageRepo.findRoomHistoryExcludingDeleted(roomId, me);
    }
    if (withUser != null && "ALL".equalsIgnoreCase(withUser)) {
        return messageRepo.findBroadcast();
    }
    return messageRepo.findConversationExcludingDeleted(me, withUser);
}

    @PostMapping("/login")
public User login(@RequestBody User user) {
    if (user.getEmail() == null || user.getEmail().isBlank() ||
        user.getPassword() == null || user.getPassword().isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password required");
    }

    String email = user.getEmail().trim().toLowerCase();

    return userRepo.findByEmail(email)
            .filter(u -> encoder.matches(user.getPassword(), u.getPassword()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
}

@PostMapping("/register")
public User register(@RequestBody User user) {
    if (user.getUsername() == null || user.getUsername().isBlank())
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username required");

    if (user.getEmail() == null || user.getEmail().isBlank())
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email required");

    if (user.getPassword() == null || user.getPassword().isBlank())
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password required");

    String email = user.getEmail().trim().toLowerCase();
    user.setEmail(email);

    if (userRepo.existsByEmail(email))
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");

    user.setPassword(encoder.encode(user.getPassword()));
    return userRepo.save(user);
}

@PostMapping("/forgot-password")
public String forgotPassword(@RequestBody User req) {
    if (req.getEmail() == null || req.getEmail().isBlank())
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email required");

    String email = req.getEmail().trim().toLowerCase();

    User user = userRepo.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Email not found"));

    String token = UUID.randomUUID().toString();
    user.setResetToken(token);
    user.setResetTokenExpiry(System.currentTimeMillis() + (15 * 60 * 1000));
    userRepo.save(user);

    // ✅ SEND REAL EMAIL
    emailService.sendResetEmail(email, token);

    // ✅ Never return token in response
    return "If the email exists, a reset token has been sent.";
}


@PostMapping("/reset-password")
public String resetPassword(@RequestBody User req) {
    System.out.println("RESET PASSWORD HIT");

    if (req.getResetToken() == null || req.getResetToken().isBlank())
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token required");

    if (req.getPassword() == null || req.getPassword().isBlank())
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password required");

    User user = userRepo.findByResetToken(req.getResetToken())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid token"));

    if (user.getResetTokenExpiry() == null ||
        user.getResetTokenExpiry() < System.currentTimeMillis())
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token expired");

    user.setPassword(encoder.encode(req.getPassword()));
    user.setResetToken(null);
    user.setResetTokenExpiry(null);

    userRepo.save(user);
    return "Password reset successful";
}
@PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public Map<String, Object> upload(@RequestParam("file") MultipartFile file) throws IOException {
    if (file.isEmpty()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
    }

    Files.createDirectories(uploadDir);

    String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
    // avoid weird paths
    original = original.replace("\\", "_").replace("/", "_");

    String storedName = UUID.randomUUID() + "__" + original;
    Path target = uploadDir.resolve(storedName);

    Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

    String fileUrl = "http://localhost:8080/api/files/" + storedName;

    Map<String, Object> res = new HashMap<>();
    res.put("fileUrl", fileUrl);
    res.put("fileName", original);
    res.put("fileType", file.getContentType());
    res.put("fileSize", file.getSize());
    return res;
}
@GetMapping("/files/{name}")
public ResponseEntity<Resource> getFile(@PathVariable String name) throws IOException {
    // basic safety
    if (name.contains("..")) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    Path filePath = uploadDir.resolve(name).normalize();
    if (!Files.exists(filePath)) {
        return ResponseEntity.notFound().build();
    }

    Resource resource = new UrlResource(filePath.toUri());
    String contentType = Files.probeContentType(filePath);
    if (contentType == null) contentType = "application/octet-stream";

    return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + name + "\"")
            .body(resource);
}

@PostMapping("/chat/delete")
public void deleteChatForMe(
        @RequestParam String me,
        @RequestParam(required = false) String withUser,
        @RequestParam(required = false) String roomId
) {
    List<Message> msgs;

    if (roomId != null && !roomId.isBlank()) {
        msgs = messageRepo.findByRoomId(roomId);
    } else {
        msgs = messageRepo.findConversation(me, withUser);
    }

    for (Message m : msgs) {
        if (m.getDeletedFor() == null) {
            m.setDeletedFor(new ArrayList<>());
        }
        if (!m.getDeletedFor().contains(me)) {
            m.getDeletedFor().add(me);
        }
    }

    messageRepo.saveAll(msgs);
}
@DeleteMapping("/user")
public void deleteUser(@RequestParam String username) {

    // 1. Remove user from users collection
    userRepo.deleteByUsername(username);

    // 2. Anonymize messages sent by this user
    List<Message> msgs = messageRepo.findBySender(username);
    for (Message m : msgs) {
        m.setSender("Deleted User");
    }
    messageRepo.saveAll(msgs);

    // 3. Remove user from group rooms
    List<Room> rooms = roomRepo.findByMembersContaining(username);
    for (Room r : rooms) {
        r.getMembers().remove(username);
    }
    roomRepo.saveAll(rooms);
}


}
