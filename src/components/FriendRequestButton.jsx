import React, { useState } from 'react';

export default function FriendRequestButton({ targetId, onSent }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const userId = typeof localStorage !== 'undefined' ? localStorage.getItem('userId') : null;

  const send = async () => {
    if (!userId && !token) {
      alert('请先登录');
      return;
    }
    if (sent) return;
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        // try to extract userId from JWT and also set X-User-Id to satisfy backend resolveCurrentUser
        try {
          const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
          const uid = payload && (payload.userId || payload.userID || payload.user_id || payload.uid || payload.userId);
          if (uid) {
            headers['X-User-Id'] = String(uid);
            console.debug('FriendRequest extracted userId from token', uid);
          }
        } catch {
          // ignore parse errors
        }
      } else if (userId) headers['X-User-Id'] = userId;
      const opts = { method: 'POST', headers };
      // debug: log headers to help diagnose 401 issues
      console.debug('FriendRequest send headers', headers, 'targetId', targetId);
      const res = await fetch(`/api/friends/request/${targetId}`, opts);
      const j = await res.json();
      if (j && j.code === 200) {
        setSent(true);
        if (onSent) onSent(j.data);
      } else {
        // Surface backend message (e.g., 未认证)
        const msg = j && (j.message || j.msg || j.msg) ? (j.message || j.msg) : '发送失败';
        alert(msg);
        console.warn('FriendRequest failed', j);
      }
    } catch (e) {
      console.error(e);
      alert('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className={`friend-request-btn ${sent ? 'sent' : ''}`} onClick={send} disabled={loading || sent}>
      {sent ? '已申请' : (loading ? '发送中...' : '加好友')}
    </button>
  );
}
