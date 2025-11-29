import React, { useEffect, useState } from 'react';
import '../styles/message/MessageList.css';

export default function FriendsList() {
  const [list, setList] = useState([]);
  const [error, setError] = useState(null);
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const userId = typeof localStorage !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (userId) headers['X-User-Id'] = userId;
        const res = await fetch('/api/friends/list', { headers });
        const j = await res.json();
        if (j && j.code === 200) {
          setList(j.data?.list || j.data || []);
        } else {
          setError(j && (j.message || j.msg) ? (j.message || j.msg) : '获取失败');
        }
      } catch (e) {
        setError('网络错误');
        console.error(e);
      }
    };
    fetchFriends();
  }, [token, userId]);

  return (
    <div className="message-list-container">
      <h2 className="message-list-title">我的好友</h2>
      {error ? (
        <div className="message-list-empty" style={{color:'red'}}>{error}</div>
      ) : list.length === 0 ? (
        <div className="message-list-empty">暂无好友</div>
      ) : (
        <ul className="message-list-ul">
          {list.map(u => (
            <li key={u.id} className="message-list-item">
              <img src={u.avatarUrl || '/imgs/loginandwelcomepanel/1.png'} alt="avatar" className="message-list-avatar" />
              <div style={{ flex: 1 }}>
                <div className="message-list-nickname">{u.nickname || u.username}</div>
                <div style={{ color: '#666' }}>{u.bio || ''}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
