import React, { useEffect, useState } from "react";

export default function FriendListPage() {
  const [friends, setFriends] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/friend/list?userId=1`)
      .then(res => res.json())
      .then(data => {
        if ((data.code === 200 || data.status === 200) && data.data) {
          setFriends(data.data);
        } else {
          setMsg(data.msg || "暂无好友");
        }
      });
  }, []);

  const handleDelete = async (friendId) => {
    setMsg("");
    const res = await fetch(`/api/friend/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 1, friendId })
    });
    const data = await res.json();
    if ((data.code === 200 || data.status === 200)) {
      setFriends(friends.filter(f => f.id !== friendId));
      setMsg("已删除");
    } else {
      setMsg(data.msg || "删除失败");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", background: "#fff", borderRadius: 10, boxShadow: "0 2px 12px #0001", padding: 24 }}>
      <h2 style={{ fontSize: 22, marginBottom: 18 }}>我的好友</h2>
      {msg && <div style={{ color: "#888", marginBottom: 10 }}>{msg}</div>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {friends.length === 0 && <li style={{ color: "#888" }}>暂无好友</li>}
        {friends.map(friend => (
          <li key={friend.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
            <span>{friend.nickname || friend.username}</span>
            <button
              onClick={() => handleDelete(friend.id)}
              style={{ padding: "4px 12px", borderRadius: 4, background: "#ff4e4e", color: "#fff", border: "none" }}
            >
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

