import React, { useEffect, useState } from 'react';

export default function FollowButton({ targetId, initialFollowing = null, onChange }) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const userId = typeof localStorage !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    // if initialFollowing not provided, leave it null; caller can decide to fetch
    if (initialFollowing == null) {
      // try to infer via calling friends endpoint or following list (omitted for brevity)
    } else {
      setIsFollowing(initialFollowing);
    }
  }, [initialFollowing]);

  const callApi = async (method) => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        const uid = payload && (payload.userId || payload.userID || payload.user_id || payload.uid || payload.userId);
        if (uid) headers['X-User-Id'] = String(uid);
      } catch {
        // ignore
      }
    } else if (userId) headers['X-User-Id'] = userId;
    console.debug('Follow call headers', headers, 'targetId', targetId, 'method', method);
    const res = await fetch(`/api/follow/${targetId}`, { method, headers });
    return res.json();
  };

  const toggle = async () => {
    if (!userId && !token) {
      alert('请先登录');
      return;
    }
    setLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const j = await callApi(method);
      if (j && j.code === 200) {
        setIsFollowing(prev => !prev);
        if (onChange) onChange(!isFollowing);
      } else {
        const msg = j && (j.message || j.msg) ? (j.message || j.msg) : '操作失败';
        alert(msg);
        console.warn('Follow toggle failed', j);
      }
    } catch (e) {
      console.error(e);
      alert('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={toggle} disabled={loading} className="follow-btn">
      {isFollowing ? '已关注' : '关注'}
    </button>
  );
}
