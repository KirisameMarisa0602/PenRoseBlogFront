import React, { useEffect, useState } from 'react';
import '../styles/message/MessageList.css';

export default function PendingFriendRequests() {
  const [list, setList] = useState([]);
  const [error, setError] = useState(null);
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const userId = typeof localStorage !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        else if (userId) headers['X-User-Id'] = userId;
        const res = await fetch('/api/friends/pending', { headers });
        const j = await res.json();
        if (j && j.code === 200) {
          setList(j.data?.list || j.data || []);
        } else {
          setError(j && (j.message || j.msg) ? (j.message || j.msg) : '获取失败');
        }
      } catch {
        setError('网络错误');
        // ignore
      }
    };
    fetchPending();
    // Try SSE subscribe with token in query param (EventSource can't set headers)
    let es;
    if (token || userId) {
      const tokenParam = token ? `?token=${encodeURIComponent(token)}` : `?token=`;
      try {
        es = new EventSource(`/api/friends/subscribe${tokenParam}`);
      } catch {
        es = null;
      }
    }
      if (es) {
        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            // initial payload is pending list
            setList(data || []);
          } catch {
            // ignore
          }
        };
      es.addEventListener('error', () => {
        if (es) { es.close(); es = null; }
        // fallback to polling
        const timer = setInterval(fetchPending, 5000);
        // store timer on es object for cleanup
        es = { cleanup: () => clearInterval(timer) };
      });
    } else {
      // fallback polling
      const timer = setInterval(fetchPending, 5000);
      es = { cleanup: () => clearInterval(timer) };
    }
    return () => { if (es && es.cleanup) es.cleanup(); if (es && es.close) es.close(); };
  }, [token, userId]);

  const respond = async (id, accept) => {
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      else if (userId) headers['X-User-Id'] = userId;
      const res = await fetch(`/api/friends/respond/${id}?accept=${accept}`, { method: 'POST', headers });
      const j = await res.json();
      if (j && j.code === 200) {
        setList(prev => prev.filter(p => p.id !== id));
      } else {
        alert(j && j.message ? j.message : '处理失败');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="message-list-container">
      <h2 className="message-list-title">好友请求</h2>
      {error ? (
        <div className="message-list-empty" style={{color:'red'}}>{error}</div>
      ) : list.length === 0 ? (
        <div className="message-list-empty">暂无请求</div>
      ) : (
        <ul className="message-list-ul">
          {list.map(req => (
            <li key={req.id} className="message-list-item">
              <img src={req.senderAvatarUrl || '/imgs/loginandwelcomepanel/1.png'} alt="avatar" className="message-list-avatar" />
              <div style={{ flex: 1 }}>
                <div className="message-list-nickname">{req.senderNickname || req.senderUsername}</div>
                <div style={{ color: '#666' }}>{req.message}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => respond(req.id, true)}>接受</button>
                <button onClick={() => respond(req.id, false)}>拒绝</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
