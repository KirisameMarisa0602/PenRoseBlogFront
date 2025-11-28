import React, { useEffect, useState, useRef } from "react";

export default function ChatPage({ friendId = 2 }) {
  // friendId 可通过路由参数传递，这里默认2为演示
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch(`/api/message/list?userId=1&friendId=${friendId}`)
      .then(res => res.json())
      .then(data => {
        if ((data.code === 200 || data.status === 200) && data.data) {
          setMessages(data.data);
        }
      });
  }, [friendId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMsg("");
    const res = await fetch(`/api/message/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromUserId: 1, toUserId: friendId, content: input })
    });
    const data = await res.json();
    if ((data.code === 200 || data.status === 200)) {
      setMessages([...messages, { fromUserId: 1, toUserId: friendId, content: input, time: new Date().toLocaleString() }]);
      setInput("");
    } else {
      setMsg(data.msg || "发送失败");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", background: "#fff", borderRadius: 10, boxShadow: "0 2px 12px #0001", padding: 24, display: 'flex', flexDirection: 'column', height: 500 }}>
      <h2 style={{ fontSize: 22, marginBottom: 18 }}>与好友聊天</h2>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, border: '1px solid #eee', borderRadius: 6, padding: 10, background: '#fafbfc' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.fromUserId === 1 ? 'right' : 'left', margin: '6px 0' }}>
            <span style={{ display: 'inline-block', background: m.fromUserId === 1 ? '#4e8cff' : '#eee', color: m.fromUserId === 1 ? '#fff' : '#222', borderRadius: 8, padding: '6px 12px', maxWidth: 220, wordBreak: 'break-all' }}>{m.content}</span>
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{m.time || ''}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="输入消息"
          style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        />
        <button type="submit" style={{ padding: "8px 16px", borderRadius: 4, background: "#4e8cff", color: "#fff", border: "none" }}>发送</button>
      </form>
      {msg && <div style={{ color: "#888", marginTop: 8 }}>{msg}</div>}
    </div>
  );
}

