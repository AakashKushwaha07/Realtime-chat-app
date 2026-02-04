import { useEffect, useMemo, useRef, useState } from "react";
import UserList from "./UserList";
const API = process.env.REACT_APP_API_BASE || "http://localhost:8080";
const WS_BASE = API.replace("https://", "wss://").replace("http://", "ws://");


export default function ChatWindow({ user }) {
  const ws = useRef(null);
  const fileRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [active, setActive] = useState({ type: "ALL" });
  const [text, setText] = useState("");
  const [convos, setConvos] = useState({});
  

  const activeKey = useMemo(() => {
    if (active.type === "ALL") return "ALL";
    if (active.type === "DM") return ["DM", ...[user.username, active.with].sort()].join("__");
    return `ROOM__${active.roomId}`;
  }, [active, user.username]);

  const messages = convos[activeKey] || [];

  // ---------- helpers ----------
  const refreshRooms = () => {
    fetch(`${API}/api/rooms?me=${encodeURIComponent(user.username)}`)
      .then((r) => r.json())
      .then((list) => setRooms(Array.isArray(list) ? list : []))
      .catch(() => setRooms([]));
  };

  const createGroup = async () => {
    const name = (prompt("Group name (example: Java Team)") || "").trim();
    if (!name) return;

    const memberStr = (
      prompt(`Members usernames (comma separated)\nAvailable: ${users.join(", ")}`) || ""
    ).trim();
    if (!memberStr) return;

    const members = memberStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!members.includes(user.username)) members.push(user.username);

    const res = await fetch(`${API}/api/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, members }),
    });

    if (!res.ok) {
      const t = await res.text();
      alert("Room create failed: " + t);
      return;
    }

    const room = await res.json();
    refreshRooms();
    setActive({ type: "ROOM", roomId: room.id, name: room.name });
  };

  // ---------- load initial data ----------
  useEffect(() => {
    fetch(`${API}/api/users`)
      .then((r) => r.json())
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setUsers(arr.filter((u) => u !== user.username));
      })
      .catch(() => setUsers([]));

    refreshRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.username]);

  // ---------- connect websocket ----------
  useEffect(() => {
    ws.current = new WebSocket(`${WS_BASE}/chat?username=${encodeURIComponent(user.username)}`);


    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "PRESENCE") {
        const online = (data.online || []).filter((u) => u !== user.username);
        setOnlineUsers(online);
        return;
      }

      const msg = data;

      let key = "ALL";
      if (msg.roomId) key = `ROOM__${msg.roomId}`;
      else if (msg.receiver && msg.receiver !== "ALL") {
        key = ["DM", ...[msg.sender, msg.receiver].sort()].join("__");
      }

      setConvos((prev) => {
        const arr = prev[key] ? [...prev[key]] : [];
        arr.push(msg);
        return { ...prev, [key]: arr };
      });
    };

    ws.current.onerror = () => console.log("❌ WebSocket error");

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [user.username]);

  // ---------- load history when active chat changes ----------
  useEffect(() => {
    if (convos[activeKey]) return;

    let url = "";
    if (active.type === "ROOM") {
      url = `${API}/api/history?roomId=${encodeURIComponent(active.roomId)}`;
    } else if (active.type === "ALL") {
      url = `${API}/api/history?me=${encodeURIComponent(user.username)}&with=ALL`;
    } else {
      url =
        `${API}/api/history?me=${encodeURIComponent(user.username)}` +
        `&with=${encodeURIComponent(active.with)}`;
    }

    fetch(url)
      .then((r) => r.json())
      .then((history) => {
        setConvos((prev) => ({
          ...prev,
          [activeKey]: Array.isArray(history) ? history : [],
        }));
      })
      .catch(() => setConvos((prev) => ({ ...prev, [activeKey]: [] })));
  }, [activeKey, active, convos, user.username]);

  const uploadAndSend = async (file) => {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`${API}/api/upload`, { method: "POST", body: fd });

    if (!res.ok) {
      const t = await res.text();
      alert("Upload failed: " + t);
      return;
    }

    const meta = await res.json();

    const mime = (meta.fileType || "").toLowerCase();
    let type = "FILE";
    if (mime.startsWith("image/")) type = "IMAGE";
    else if (mime.startsWith("video/")) type = "VIDEO";

    const payload = {
      type,
      sender: user.username,
      content: "",
      fileUrl: meta.fileUrl,
      fileName: meta.fileName,
      fileType: meta.fileType,
      fileSize: meta.fileSize,
    };

    if (active.type === "ROOM") payload.roomId = active.roomId;
    else if (active.type === "DM") payload.receiver = active.with;
    else payload.receiver = "ALL";

    ws.current.send(JSON.stringify(payload));
  };

  const onlineSet = useMemo(() => new Set(onlineUsers), [onlineUsers]);
  const isDMOnline = active.type === "DM" && onlineSet.has(active.with);

  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeKey]);

  // ---------- send message ----------
  const send = () => {
    if (!ws.current || ws.current.readyState !== 1) {
      alert("WebSocket not connected");
      return;
    }

    const content = text.trim();
    if (!content) return;

    if (active.type === "ROOM") {
      ws.current.send(JSON.stringify({ roomId: active.roomId, sender: user.username, content }));
    } else if (active.type === "DM") {
      ws.current.send(JSON.stringify({ sender: user.username, receiver: active.with, content }));
    } else {
      ws.current.send(JSON.stringify({ sender: user.username, receiver: "ALL", content }));
    }

    setText("");
  };

const deleteChat = async () => {
  if (!window.confirm("Delete this chat for you?")) return;

  let url = `${API}/api/chat/delete?me=${encodeURIComponent(user.username)}`;


  if (active.type === "ROOM") {
    url += `&roomId=${active.roomId}`;
  } else if (active.type === "DM") {
    url += `&withUser=${active.with}`;
  } else {
    alert("Broadcast cannot be deleted");
    return;
  }

  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const t = await res.text();
    alert("Delete failed: " + t);
    return;
  }

  // Clear the currently open chat from UI cache
  setConvos((prev) => {
    const next = { ...prev };
    delete next[activeKey];
    return next;
  });
};
const deleteAccount = async () => {
  const ok = window.confirm(
    "This will permanently delete your account.\nChats will remain for others.\nContinue?"
  );
  if (!ok) return;

  const res = await fetch(
    `${API}/api/user?username=${encodeURIComponent(user.username)}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    const t = await res.text();
    alert("Delete failed: " + t);
    return;
  }

  alert("Account deleted");
  window.location.reload(); // forces logout
};



  // ---------- helpers for UI ----------
  const headerTitle =
    active.type === "ALL" ? "Broadcast" : active.type === "DM" ? active.with : active.name;

  const headerSub =
    active.type === "ALL"
      ? "Everyone in broadcast"
      : active.type === "ROOM"
      ? "Group room"
      : isDMOnline
      ? "Online now"
      : "Offline";

  const initial = (s) => (s?.trim()?.[0] || "?").toUpperCase();

  return (
    <div className="h-screen w-full bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      {/* subtle background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto h-full max-w-6xl p-3 sm:p-4">
        <div className="h-full grid grid-rows-[auto_1fr] md:grid-rows-1 md:grid-cols-[340px_1fr] gap-3">
          {/* SIDEBAR */}

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col">
            {/* Sidebar header */}
                      <button onClick={deleteAccount}
          className="mt-6 w-full rounded-xl px-4 py-2 text-sm text-red-600 border border-red-200 hover:bg-red-50 transition">
            Delete my account
          </button>
            <div className="p-4 border-b border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold tracking-tight">Chats</h2>
                  <p className="text-xs text-white/60 mt-1 truncate">
                    Logged in as <span className="font-semibold text-white/90">{user.username}</span>
                  </p>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">
                  Live
                </span>
              </div>

              {/* broadcast quick button */}
              <button
                onClick={() => setActive({ type: "ALL" })}
                className={[
                  "mt-3 w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition border",
                  active.type === "ALL"
                    ? "bg-white/10 border-white/15"
                    : "bg-transparent border-white/10 hover:bg-white/5",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-semibold">
                    A
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Broadcast</div>
                    <div className="text-xs text-white/60">Message everyone</div>
                  </div>
                </div>
                <span className="text-xs text-white/60">ALL</span>
              </button>
            </div>

            {/* Sidebar content */}
            <div className="p-3 overflow-y-auto">
              {/* DM */}
              <SectionTitle title="Direct Messages" right={String(users.length)} />
              <div className="mt-2">
                <UserList
                  users={users}
                  onlineSet={onlineSet}
                  activeUser={active.type === "DM" ? active.with : null}
                  select={(u) => setActive({ type: "DM", with: u })}
                />
              </div>

              {/* Online Now */}
              <div className="mt-5">
                <SectionTitle title="Online Now" right={`${onlineUsers.length}`} rightClass="text-emerald-300" />
                <div className="mt-2">
                  <UserList
                    users={onlineUsers}
                    onlineSet={onlineSet}
                    activeUser={active.type === "DM" ? active.with : null}
                    select={(u) => setActive({ type: "DM", with: u })}
                  />
                </div>
              </div>

              {/* Rooms */}
              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white/90">Group Rooms</h3>
                  <button
                    onClick={createGroup}
                    className="text-xs px-3 py-1 rounded-full bg-white text-slate-900 hover:bg-white/90 transition font-semibold"
                  >
                    + Create
                  </button>
                </div>

                <div className="mt-2 space-y-1">
                  {rooms.map((r) => {
                    const activeRoom = active.type === "ROOM" && active.roomId === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setActive({ type: "ROOM", roomId: r.id, name: r.name })}
                        className={[
                          "w-full rounded-xl px-3 py-2 text-left border transition",
                          activeRoom
                            ? "bg-white/10 border-white/20"
                            : "border-white/10 hover:bg-white/5",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium truncate text-white/95">{r.name}</div>
                          <div className="text-xs text-white/60">{r.members?.length || 0}</div>
                        </div>
                        <div className="text-xs text-white/60 mt-0.5 truncate">
                          {r.members?.join(", ") || ""}
                        </div>
                      </button>
                    );
                  })}

                  {rooms.length === 0 && (
                    <div className="text-sm text-white/45 px-2 py-2">No group rooms</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CHAT */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col">
            {/* Header */}
            <button onClick={deleteChat}
            className="text-sm text-red-500 hover:underline">Delete chat</button>

            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center font-bold">
                  {initial(headerTitle)}
                </div>

                <div className="min-w-0">
                  <div className="text-base font-semibold truncate">{headerTitle}</div>
                  <div className="text-xs text-white/60 mt-0.5 flex items-center gap-2">
                    {active.type === "DM" && (
                      <>
                        <span className={isDMOnline ? "text-emerald-300" : "text-white/60"}>
                          {headerSub}
                        </span>
                        <span
                          className={[
                            "h-2 w-2 rounded-full",
                            isDMOnline ? "bg-emerald-400" : "bg-white/25",
                          ].join(" ")}
                          title={isDMOnline ? "Online" : "Offline"}
                        />
                      </>
                    )}
                    {active.type !== "DM" && <span>{headerSub}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* attachment shortcut */}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="rounded-xl px-3 py-2 border border-white/10 hover:bg-white/5 transition text-sm"
                  title="Attach"
                >
                  📎
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white/0 via-white/0 to-white/0">
              <div className="space-y-2">
                {messages.map((m, i) => {
                  const mine = m.sender === user.username;

                  return (
                    <div key={i} className={mine ? "flex justify-end" : "flex justify-start"}>
                      <div className="max-w-[82%] sm:max-w-[75%]">
                        {!mine && (
                          <div className="text-[11px] text-white/60 mb-1 pl-1">{m.sender}</div>
                        )}

                        <div
                          className={[
                            "rounded-2xl px-3 py-2 shadow-sm border",
                            mine
                              ? "bg-emerald-500 text-white border-emerald-500/60 rounded-br-md"
                              : "bg-white/5 text-white border-white/10 rounded-bl-md",
                          ].join(" ")}
                        >
                          {/* Attachments */}
                          {(m.type === "IMAGE" || (m.fileType || "").startsWith("image/")) && m.fileUrl ? (
                            <div className="space-y-1">
                              <img
                                src={m.fileUrl}
                                alt={m.fileName || "image"}
                                className="rounded-xl max-w-[260px] border border-white/15"
                              />
                              <div className={mine ? "text-xs text-white/80" : "text-xs text-white/60"}>
                                {m.fileName}
                              </div>
                            </div>
                          ) : (m.type === "VIDEO" || (m.fileType || "").startsWith("video/")) && m.fileUrl ? (
                            <div className="space-y-1">
                              <video
                                src={m.fileUrl}
                                controls
                                className="rounded-xl max-w-[320px] border border-white/15"
                              />
                              <div className={mine ? "text-xs text-white/80" : "text-xs text-white/60"}>
                                {m.fileName}
                              </div>
                            </div>
                          ) : m.fileUrl ? (
                            <a
                              href={m.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={mine ? "underline text-white" : "text-sky-300 underline"}
                            >
                              📎 {m.fileName || "Download file"}
                            </a>
                          ) : (
                            <span className="whitespace-pre-wrap break-words">{m.content}</span>
                          )}
                        </div>

                        {m.timestamp && (
                          <div
                            className={[
                              "text-[10px] text-white/45 mt-1",
                              mine ? "text-right pr-1" : "pl-1",
                            ].join(" ")}
                          >
                            {String(m.timestamp).replace("T", " ").slice(0, 16)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Composer */}
            <div className="p-3 border-t border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none
                             focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400/40 placeholder:text-white/35"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message…"
                  onKeyDown={(e) => e.key === "Enter" && send()}
                />

                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadAndSend(f);
                    e.target.value = "";
                  }}
                />

                <button
                  onClick={() => fileRef.current?.click()}
                  className="rounded-xl px-4 py-3 border border-white/10 hover:bg-white/10 transition"
                  title="Attach"
                >
                  📎
                </button>

                <button
                  onClick={send}
                  className="rounded-xl px-5 py-3 bg-emerald-500 text-white hover:bg-emerald-600 transition font-semibold"
                >
                  Send
                </button>
              </div>

              <div className="text-[11px] text-white/45 mt-2 flex flex-wrap gap-2">
                <span>Tip:</span>
                <span>Use emojis 😄🔥✅</span>
                <span>•</span>
                <span>Attach image/pdf/video</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Small helper component for sidebar headings */
function SectionTitle({ title, right, rightClass = "text-white/60" }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-white/90">{title}</h3>
      <span className={["text-xs", rightClass].join(" ")}>{right}</span>
    </div>
  );
}
