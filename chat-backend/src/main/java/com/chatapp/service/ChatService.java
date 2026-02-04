package com.chatapp.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.chatapp.model.Message;
import com.chatapp.model.Room;
import com.chatapp.repository.MessageRepository;
import com.chatapp.repository.RoomRepository;

@Service
public class ChatService {

    private final MessageRepository messageRepo;
    private final RoomRepository roomRepo;

    public ChatService(MessageRepository messageRepo, RoomRepository roomRepo) {
        this.messageRepo = messageRepo;
        this.roomRepo = roomRepo;
    }

    public Message save(Message message) {
        return messageRepo.save(message);
    }

    public Optional<Room> findRoom(String roomId) {
        return roomRepo.findById(roomId);
    }
}
