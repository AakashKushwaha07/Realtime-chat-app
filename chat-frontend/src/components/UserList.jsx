export default function UserList({ users, select, onlineSet, activeUser }) {
  return (
    <div className="space-y-1">
      {users.map((u) => {
        const online = onlineSet?.has(u);
        const active = activeUser === u;

        return (
          <button
            key={u}
            onClick={() => select(u)}
            className={[
              "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition",
              active ? "bg-gray-100" : "hover:bg-gray-50",
            ].join(" ")}
          >
            <div className="relative shrink-0">
              <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-700">
                {u?.[0]?.toUpperCase() || "U"}
              </div>
              <span
                className={[
                  "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white",
                  online ? "bg-green-500" : "bg-gray-300",
                ].join(" ")}
                title={online ? "Online" : "Offline"}
              />
            </div>

            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{u}</div>
              <div className="text-xs text-gray-500">{online ? "Online" : "Offline"}</div>
            </div>
          </button>
        );
      })}
      {users.length === 0 && (
        <div className="text-sm text-gray-400 px-2 py-2">No users</div>
      )}
    </div>
  );
}
