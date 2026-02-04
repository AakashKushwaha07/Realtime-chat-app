🚀 Realtime Chat Application

A full-stack real-time chat application built with Spring Boot, WebSocket, MongoDB, and React, supporting 1-to-1 chat, group rooms, authentication, password recovery via email, and live online presence.

🔗 Live Backend: https://realtime-chat-app-rea3.onrender.com

🔗 Frontend: https://realtime-chat-app-eta-red.vercel.app

📌 Features Overview
🔐 Authentication

User registration & login

Password hashing using BCrypt

Forgot password & reset password via email (Gmail SMTP)

Secure reset link (token-based)

💬 Chat System

Broadcast chat (ALL users)

1-to-1 private messaging

Group chat rooms

Chat history per user / room

Delete chat (local user view)

Delete user account

⚡ Real-Time Capabilities

WebSocket-based messaging

Live online/offline presence

Auto reconnect on refresh

Supports ws:// (local) and wss:// (production)

👥 User & Room Management

View all registered users

Create group rooms with selected members

See room members & message history

☁️ Deployment Ready

Backend deployed on Render (Docker)

Frontend deployed on Vercel

MongoDB hosted on MongoDB Atlas

Secrets handled via environment variables

🛠️ Tech Stack
Backend

Java 17

Spring Boot

Spring WebSocket

MongoDB Atlas

BCrypt

JavaMailSender (Gmail SMTP)

Docker

Frontend

React (CRA)

Tailwind CSS

WebSocket API

Fetch API

📂 Project Structure
Realtime-chat-app/
│
├── chat-backend/
│   ├── src/main/java/com/chatapp
│   │   ├── controller/
│   │   ├── websocket/
│   │   ├── service/
│   │   ├── model/
│   │   └── repository/
│   ├── uploads/
│   ├── pom.xml
│   └── mvnw
│
├── chat-frontend/
│   ├── src/components/
│   ├── src/App.jsx
│   ├── public/
│   └── package.json
│
├── Dockerfile
├── .dockerignore
└── README.md

⚙️ Environment Variables
Backend (Render)
MONGODB_URI=your_mongodb_atlas_uri
MONGODB_DB=chatapp
MAIL_USERNAME=your_gmail
MAIL_PASSWORD=your_gmail_app_password
FRONTEND_BASE_URL=https://your-vercel-app.vercel.app

Frontend (Vercel)
REACT_APP_API_BASE=https://realtime-chat-app-rea3.onrender.com

▶️ Running Locally
Backend
cd chat-backend
./mvnw spring-boot:run


Backend runs on:

http://localhost:8080

Frontend
cd chat-frontend
npm install
npm start


Frontend runs on:

http://localhost:3000

🔌 WebSocket Endpoints
ws://localhost:8080/chat?username=<username>
wss://realtime-chat-app-rea3.onrender.com/chat?username=<username>

🧪 API Endpoints (Sample)
Method	Endpoint	Description
POST	/api/register	Register user
POST	/api/login	Login
POST	/api/forgot-password	Send reset email
POST	/api/reset-password	Reset password
GET	/api/users	List users
POST	/api/rooms	Create group
GET	/api/history	Chat history
🧠 Key Learnings From This Project

Designing real-time systems with WebSocket

Managing stateful connections

Secure authentication & password recovery

Environment-based configuration

Dockerizing Spring Boot apps

Handling deployment issues in production

Building scalable chat architecture

🚧 Known Limitations

File uploads stored locally (Render filesystem is ephemeral)

No push notifications yet

No JWT / role-based auth (can be added)

🔮 Future Enhancements

Cloud storage (S3 / Cloudinary)

JWT authentication

Message read receipts

Notifications & unread counts

Admin moderation panel

👨‍💻 Author

Aakash Kumar
Java Backend Developer | Full-Stack Enthusiast
GitHub: https://github.com/AakashKushwaha07
