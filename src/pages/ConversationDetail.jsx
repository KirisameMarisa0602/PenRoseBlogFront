import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import BannerNavbar from '../components/common/BannerNavbar';
import '../styles/message/ConversationDetail.css';

export default function ConversationDetail() {
  const { otherId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [otherInfo, setOtherInfo] = useState({ nickname: '', avatarUrl: '' });
  const userId = localStorage.getItem('userId');
  const messagesEndRef = useRef(null);
  
  const mergeMessages = (oldList, newList) => {
    if ((!oldList || oldList.length === 0) && (!newList || newList.length === 0)) return [];
    const mergedArr = [];
    const seen = new Map();
    const keyOf = (m) => {
      if (!m) return null;
      if (m.id != null) return `id:${m.id}`;
      // fallback composite key: createdAt + sender + receiver + text
      const time = m.createdAt ? String(m.createdAt) : '';
      const s = m.senderId != null ? String(m.senderId) : '';
      const r = m.receiverId != null ? String(m.receiverId) : '';
      const t = m.text != null ? String(m.text) : '';
      return `c:${time}|s:${s}|r:${r}|t:${t}`;
    };

    const pushIfNew = (m) => {
      const k = keyOf(m);
      if (!k) return;
      if (!seen.has(k)) {
        seen.set(k, true);
        mergedArr.push(m);
      }
    };

    // prefer preserving order: first oldList then newList, but allow newList to override content by key
    (oldList || []).forEach(pushIfNew);
    (newList || []).forEach(pushIfNew);

    // sort by createdAt asc (fallback to keep existing order when missing)
    mergedArr.sort((a, b) => {
      const ta = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });

    return mergedArr;
  };
  useEffect(() => {
    if (!userId || !otherId) return;
    fetch(`/api/messages/conversation/${otherId}`, {
      headers: { 'X-User-Id': userId }
    })
      .then(r => r.json())
      .then(j => {
        if (j && j.code === 200 && j.data) setMessages(prev => mergeMessages(prev, j.data.list || []));
      });
  }, [userId, otherId]);

  // derive other user's info from loaded messages
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const meId = Number(userId);
    for (let m of messages) {
      if (m.senderId !== meId) {
        setOtherInfo({ nickname: m.senderNickname || '', avatarUrl: m.senderAvatarUrl || '' });
        return;
      }
      if (m.receiverId !== meId) {
        setOtherInfo({ nickname: m.receiverNickname || '', avatarUrl: m.receiverAvatarUrl || '' });
        return;
      }
    }
  }, [messages, userId]);

  // SSE 实时订阅（若服务器端拒绝或不支持，则回退为轮询）
  useEffect(() => {
    if (!otherId) return;
    let es;
    let pollTimer;
    try {
      es = new EventSource(`/api/messages/stream/${otherId}`);
    } catch {
      es = null;
    }
    let fallbackToPoll = false;
    if (es) {
      es.addEventListener('init', e => {
        try {
          const data = JSON.parse(e.data);
          setMessages(prev => mergeMessages(prev, data || []));
        } catch {
          // ignore parse errors
        }
      });
      es.addEventListener('update', e => {
        try {
          const data = JSON.parse(e.data);
          setMessages(prev => mergeMessages(prev, data || []));
        } catch {
          // ignore parse errors
        }
      });
      es.addEventListener('error', () => {
        // 服务端可能返回一个立即结束的 emitter（含 ApiResponse 错误）
        fallbackToPoll = true;
        if (es) { es.close(); es = null; }
      });
    } else {
      fallbackToPoll = true;
    }

    if (fallbackToPoll) {
      // 轮询每 4 秒
      const fn = () => {
        if (!userId) return;
        fetch(`/api/messages/conversation/${otherId}`, { headers: { 'X-User-Id': userId } })
          .then(r => r.json())
          .then(j => { if (j && j.code === 200 && j.data) setMessages(prev => mergeMessages(prev, j.data.list || [])); });
      };
      fn();
      pollTimer = setInterval(fn, 4000);
    }

    return () => {
      if (es) es.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [otherId, userId]);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const body = { text };
    const res = await fetch(`/api/messages/text/${otherId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
      body: JSON.stringify(body)
    });
    setText('');
    try {
      const j = await res.json();
      if (j && j.code === 200 && j.data) {
        // merge the sent message into the list (dedupe if SSE/poll also returns it)
        setMessages(prev => mergeMessages(prev, [j.data]));
      } else {
        // fallback: refresh full conversation
        fetch(`/api/messages/conversation/${otherId}`, { headers: { 'X-User-Id': userId } })
          .then(r => r.json())
          .then(j2 => { if (j2 && j2.code === 200 && j2.data) setMessages(prev => mergeMessages(prev, j2.data.list || [])); });
      }
    } catch {
      // ignore errors parsing response
    }
  };

  return (
    <div className="conversation-detail-page">
      <BannerNavbar />
      {/* 顶部导航占位已由全局 `index.css` 的 `padding-top` 提供，无需额外占位元素 */}
      <div className="conversation-detail-container">
        <h2 className="conversation-detail-title">{otherInfo.nickname ? `与 ${otherInfo.nickname} 的会话` : '与Ta的会话'}</h2>
        <div className="conversation-detail-list">
          {messages.map(msg => (
            <div key={msg.id} className={`conversation-detail-msg${msg.senderId === Number(userId) ? ' self' : ''}`}>
              <div className="conversation-detail-msg-meta">
                <img
                  src={msg.senderAvatarUrl || otherInfo.avatarUrl || '/imgs/loginandwelcomepanel/1.png'}
                  alt="avatar"
                  className="conversation-detail-msg-avatar"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/imgs/loginandwelcomepanel/1.png'; }}
                />
                <span className="conversation-detail-msg-nickname">{msg.senderNickname || (msg.senderId === Number(userId) ? '你' : otherInfo.nickname)}</span>
              </div>
              <div className="conversation-detail-msgtext">{msg.text}</div>
              <div className="conversation-detail-msgtime">{new Date(msg.createdAt).toLocaleString()}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form className="conversation-detail-form" onSubmit={handleSend}>
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="输入消息..."
            className="conversation-detail-input"
            autoFocus
          />
          <button type="submit" className="conversation-detail-sendbtn">发送</button>
        </form>
      </div>
    </div>
  );
}
