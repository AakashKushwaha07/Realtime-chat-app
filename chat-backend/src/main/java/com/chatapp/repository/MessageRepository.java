package com.chatapp.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.chatapp.model.Message;

public interface MessageRepository extends MongoRepository<Message, String> {

    // group room history
    List<Message> findByRoomIdOrderByTimestampAsc(String roomId);
    List<Message> findByRoomId(String roomId);
    public List<Message> findBySender(String username);
    



    // 1-to-1 history (both directions)
    @Query(value = "{ '$or': [ "
            + "{ 'sender': ?0, 'receiver': ?1 }, "
            + "{ 'sender': ?1, 'receiver': ?0 } "
            + "] }",
            sort = "{ 'timestamp': 1 }")
    List<Message> findConversation(String user1, String user2);

    // broadcast history
    @Query(value = "{ 'receiver': 'ALL' }", sort = "{ 'timestamp': 1 }")
    List<Message> findBroadcast();
    @Query("""
{
 $and: [
   { $or: [
     { sender: ?0, receiver: ?1 },
     { sender: ?1, receiver: ?0 }
   ]},
   { $or: [
     { deletedFor: { $exists: false } },
     { deletedFor: { $ne: ?0 } }
   ]}
 ]
}
""")
List<Message> findConversationExcludingDeleted(String me, String withUser);

@Query("""
{
 $and: [
   { roomId: ?0 },
   { $or: [
     { deletedFor: { $exists: false } },
     { deletedFor: { $ne: ?1 } }
   ]}
 ]
}
""")
List<Message> findRoomHistoryExcludingDeleted(String roomId, String me);

}
