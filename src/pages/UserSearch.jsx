import React, { useState } from 'react';
import BannerNavbar from '../components/common/BannerNavbar';
import FollowButton from '../components/FollowButton';
import FriendRequestButton from '../components/FriendRequestButton';
import '../styles/user/UserSearch.css';
import { Link } from 'react-router-dom';

export default function UserSearch() {
  const [mode, setMode] = useState('username');
  const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const doSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.set(mode, keyword.trim());
    try {
      const res = await fetch(`/api/users/search?${params.toString()}`);
      const j = await res.json();
      if (j && j.code === 200 && j.data) {
        setResults(j.data.list || []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-search-page">
      <BannerNavbar />
      <div className="user-search-container">
        <h2>查找好友</h2>
        <div className="user-search-controls">
          <select value={mode} onChange={e => setMode(e.target.value)}>
            <option value="username">按用户名</option>
            <option value="nickname">按昵称</option>
          </select>
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder={mode === 'username' ? '输入用户名' : '输入昵称'} />
          <button onClick={doSearch} disabled={loading}>{loading ? '搜索中...' : '搜索'}</button>
        </div>
        <ul className="user-search-results">
          {error ? (
            <li className="empty" style={{color:'red'}}>{error}</li>
          ) : results.length === 0 ? (
            <li className="empty">没有找到用户</li>
          ) : (
            results.map(u => (
              <li key={u.id} className="user-item">
                <img src={u.avatarUrl || '/public/default-avatar.png'} alt="avatar" className="user-avatar" />
                <div className="user-info">
                  <div className="user-nick">{u.nickname || u.username}</div>
                  <div className="user-username">@{u.username}</div>
                </div>
                <div className="user-actions">
                  {String(u.id) !== String(localStorage.getItem('userId')) && (
                    <>
                      <FriendRequestButton targetId={u.id} />
                      <FollowButton targetId={u.id} />
                    </>
                  )}
                  <Link to={`/selfspace?userId=${u.id}`} className="btn outline">查看</Link>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
