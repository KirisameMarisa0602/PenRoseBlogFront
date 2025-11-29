import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const userId = typeof localStorage !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    let es;
    const fetchInitial = async () => {
      try {
        // As example, fetch pending friend requests as notifications
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        else if (userId) headers['X-User-Id'] = userId;
        const res = await fetch('/api/friends/pending', { headers });
        const j = await res.json();
        const items = (j && j.code === 200 && j.data) ? j.data : [];
        setCount(items.length);
      } catch {
        // ignore
      }
    };
    fetchInitial();

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
          setCount((data || []).length);
        } catch {
          // ignore
        }
      };
      es.addEventListener('error', () => {
        if (es) { es.close(); es = null; }
      });
    }
    return () => { if (es) es.close(); };
  }, [token, userId]);

  return (
    <div style={{ position: 'relative' }}>
      <Link to="/friends/pending" aria-label="查看通知" style={{ display: 'inline-block' }}>
        <button className="notification-bell" type="button">🔔</button>
      </Link>
      {count > 0 && (
        <span style={{ position: 'absolute', top: -6, right: -6, background: '#ff4d4f', color: '#fff', borderRadius: 12, padding: '2px 6px', fontSize: 12 }}>{count}</span>
      )}
      {/* optional dropdown rendering list when clicked (omitted) */}
    </div>
  );
}
