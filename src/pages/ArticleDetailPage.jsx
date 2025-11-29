import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ArticleDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetch(`/api/blogpost/${id}?currentUserId=1`)
      .then(res => res.json())
      .then(data => {
        if ((data.code === 200 || data.status === 200) && data.data) {
          setArticle(data.data);
          setLiked(!!data.data.likedByCurrentUser);
          setLikeCount(data.data.likeCount || 0);
        }
      });
    fetch(`/api/blogpost/${id}/comments`)
      .then(res => res.json())
      .then(data => {
        if ((data.code === 200 || data.status === 200) && data.data) {
          // 兼容后端返回 { list: [...] } 或直接返回数组
          if (Array.isArray(data.data)) {
            setComments(data.data);
          } else if (Array.isArray(data.data.list)) {
            setComments(data.data.list);
          } else {
            setComments([]);
          }
        } else {
          setComments([]);
        }
      });
  }, [id]);

  const handleLike = async () => {
    const res = await fetch(`/api/blogpost/${id}/like?userId=1`, { method: "POST" });
    const data = await res.json();
    if (data.code === 200 || data.status === 200) {
      setLiked(v => !v);
      setLikeCount(c => liked ? c - 1 : c + 1);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setMsg("发表评论中...");
    const res = await fetch(`/api/blogpost/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blogPostId: id, userId: 1, content: comment })
    });
    const data = await res.json();
    if (data.code === 200 || data.status === 200) {
      setMsg("评论成功");
      setComment("");
      fetch(`/api/blogpost/${id}/comments`).then(res => res.json()).then(data => {
        if ((data.code === 200 || data.status === 200) && data.data) {
          if (Array.isArray(data.data)) {
            setComments(data.data);
          } else if (Array.isArray(data.data.list)) {
            setComments(data.data.list);
          } else {
            setComments([]);
          }
        } else {
          setComments([]);
        }
      });
    } else {
      setMsg(data.msg || "评论失败");
    }
  };

  if (!article) return <div style={{padding:40}}>加载中...</div>;

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", background: "#fff", borderRadius: 10, boxShadow: "0 2px 16px #0001", padding: 32 }}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>{article.title}</h1>
      <div style={{ color: '#888', marginBottom: 18 }}>作者ID: {article.userId} | {article.createdAt?.replace('T', ' ').slice(0, 19)}</div>
      {article.coverImageUrl && <img src={article.coverImageUrl} alt="cover" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 18 }} />}
      <div style={{ fontSize: 18, color: '#222', marginBottom: 24, whiteSpace: 'pre-wrap' }}>{article.content}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button
          onClick={handleLike}
          style={{
            background: liked ? '#0a7' : '#eee',
            color: liked ? '#fff' : '#333',
            border: 'none',
            borderRadius: 4,
            padding: '6px 18px',
            fontSize: 16,
            cursor: 'pointer'
          }}
        >
          {liked ? '已点赞' : '点赞'} ({likeCount})
        </button>
      </div>
      <h3 style={{ marginBottom: 12 }}>评论</h3>
      <form onSubmit={handleComment} style={{ marginBottom: 18 }}>
        <textarea value={comment} onChange={e => setComment(e.target.value)} style={{ width: '100%', minHeight: 60, borderRadius: 6, border: '1px solid #bbb', padding: 8, fontSize: 15 }} placeholder="写下你的评论..." />
        <button type="submit" style={{ marginTop: 8, padding: '6px 24px', borderRadius: 4, background: '#0a7', color: '#fff', border: 'none', fontSize: 15, cursor: 'pointer' }}>发表评论</button>
        {msg && <span style={{ marginLeft: 16, color: msg.includes('成功') ? '#0a7' : '#c00' }}>{msg}</span>}
      </form>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {comments.length === 0 && <li style={{ color: '#888' }}>暂无评论</li>}
        {comments.map(c => (
          <li key={c.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
            <div style={{ color: '#333', fontWeight: 500 }}>{c.userId}：</div>
            <div style={{ color: '#222', margin: '4px 0 2px 0' }}>{c.content}</div>
            <div style={{ color: '#aaa', fontSize: 13 }}>{c.createdAt?.replace('T', ' ').slice(0, 19)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}