import React, { useEffect, useState } from 'react';
import BannerNavbar from '../components/common/BannerNavbar';
import '../styles/message/MessageList.css';

export default function MessageList() {
  const [conversations, setConversations] = useState([]);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/messages/conversation/list`, {
      headers: {
        'X-User-Id': userId
      }
    })
      .then(r => r.json())
      .then(j => {
        if (j && j.code === 200) setConversations(j.data.list || []);
      });
  }, [userId]);

  return (
    <div className="message-list-page">
      <BannerNavbar />
      {/* 顶部导航占位已由全局 `index.css` 的 `padding-top` 提供，无需额外占位元素 */}
      <div className="message-list-container">
        <h2 className="message-list-title">我的私信</h2>
        <ul className="message-list-ul">
          {conversations.length === 0 ? (
            <li className="message-list-empty">暂无会话</li>
          ) : (
            conversations.map(conv => (
              <li key={conv.otherId} className="message-list-item">
                <a href={`/conversation/${conv.otherId}`} className="message-list-link">
                  <img
                    src={conv.avatarUrl || '/imgs/loginandwelcomepanel/1.png'}
                    alt="avatar"
                    className="message-list-avatar"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/imgs/loginandwelcomepanel/1.png'; }}
                  />
                  <span className="message-list-nickname">{conv.nickname}</span>
                  <span className="message-list-lastmsg">{conv.lastMessage}</span>
                </a>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
