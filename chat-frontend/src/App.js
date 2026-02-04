import { useState } from "react";
import Login from "./components/Login";
import ChatWindow from "./components/ChatWindow";

export default function App() {
  const [user, setUser] = useState(null);

  return user ? <ChatWindow user={user} /> : <Login setUser={setUser} />;
}
