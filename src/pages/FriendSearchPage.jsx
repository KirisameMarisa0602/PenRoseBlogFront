import React, { useState } from "react";

export default function FriendSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [msg, setMsg] = useState("");
  const [addingId, setAddingId] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setMsg("");
    setResults([]);
    if (!query.trim()) return;
    setMsg("搜索中...");
    const res = await fetch(`/api/friend/search?keyword=${encodeURIComponent(query)}`);
    const data = await res.json();
    if ((data.code === 200 || data.status === 200) && data.data) {
      setResults(data.data);
      setMsg("");
    } else {
      setMsg(data.msg || "未找到相关用户");
    }
  };

  const handleAdd = async (userId) => {
    setAddingId(userId);
    setMsg("");
    const res = await fetch(`/api/friend/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, fromUserId: 1 }) // 假设当前用户ID为1
    });
    const data = await res.json();
    setAddingId(null);
    if ((data.code === 200 || data.status === 200)) {
      setMsg("已发送好友请求");
    } else {
      setMsg(data.msg || "添加失败");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", background: "#fff", borderRadius: 10, boxShadow: "0 2px 12px #0001", padding: 24 }}>
      <h2 style={{ fontSize: 22, marginBottom: 18 }}>搜索好友</h2>
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="输入用户名/昵称"
          style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        />
        <button type="submit" style={{ padding: "8px 16px", borderRadius: 4, background: "#4e8cff", color: "#fff", border: "none" }}>搜索</button>
      </form>
      {msg && <div style={{ color: "#888", marginBottom: 10 }}>{msg}</div>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {results.map(user => (
          <li key={user.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
            <span>{user.nickname || user.username}</span>
            <button
              disabled={addingId === user.id}
              onClick={() => handleAdd(user.id)}
              style={{ padding: "4px 12px", borderRadius: 4, background: addingId === user.id ? "#ccc" : "#4e8cff", color: "#fff", border: "none" }}
            >
              {addingId === user.id ? "添加中..." : "加为好友"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

