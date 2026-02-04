package com.chatapp.model;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "messages")
public class Message {

    @Id
    private String id;
    private String sender;
    private String receiver;
    private String content;
    private LocalDateTime timestamp;
    private String roomId;   // ✅ for group chats
    private String type;      // TEXT, FILE, IMAGE, VIDEO
    private String fileUrl;   // e.g. http://localhost:8080/api/files/<name>
    private String fileName;
    private String fileType;  // mime type
    private Long fileSize;
    private List<String> deletedFor;




    public Message() {}

    public Message(String sender, String receiver, String content) {
        this.sender = sender;
        this.receiver = receiver;
        this.content = content;
        this.timestamp = LocalDateTime.now();
    }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getSender() { return sender; }
    public String getReceiver() { return receiver; }
    public String getContent() { return content; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public String getRoomId() { return roomId; }

    public String getType() {
    return type;
}
public List<String> getDeletedFor() {
    return deletedFor;
}

public void setDeletedFor(List<String> deletedFor) {
    this.deletedFor = deletedFor;
}

public void setSender(String sender) {
    this.sender = sender;
}


public void setType(String type) {
    this.type = type;
}

public String getFileUrl() {
    return fileUrl;
}

public void setFileUrl(String fileUrl) {
    this.fileUrl = fileUrl;
}

public String getFileName() {
    return fileName;
}

public void setFileName(String fileName) {
    this.fileName = fileName;
}

public String getFileType() {
    return fileType;
}

public void setFileType(String fileType) {
    this.fileType = fileType;
}

public Long getFileSize() {
    return fileSize;
}

public void setFileSize(Long fileSize) {
    this.fileSize = fileSize;
}


}
