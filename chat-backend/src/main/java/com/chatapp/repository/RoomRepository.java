package com.chatapp.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.chatapp.model.Room;

public interface RoomRepository extends MongoRepository<Room, String> {
    List<Room> findByMembersContaining(String username);
}
