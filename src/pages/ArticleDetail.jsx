import React, { useEffect, useState } from 'react';
import MarkdownIt from 'markdown-it';
import { useParams } from 'react-router-dom';
import BannerNavbar from '../components/common/BannerNavbar';
import '../styles/article/ArticleDetail.css';
import resolveUrl from '../utils/resolveUrl';

export default function ArticleDetail(){
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const userId = localStorage.getItem('userId');

  useEffect(()=>{
    fetch(`/api/blogpost/${id}${userId?`?currentUserId=${userId}`:''}`)
      .then(r=>r.json()).then(j=>{
        console.log('[文章详情] 后端返回数据:', j);
        if(j && j.code===200) setPost(j.data);
      })
      .catch(console.error);
    // load comments
    fetch(`/api/blogpost/${id}/comments?page=0&size=10${userId?`&currentUserId=${userId}`:''}`)
      .then(r=>r.json()).then(j=>{ if(j && j.code===200) setComments(j.data.list || []); })
      .catch(console.error);
  },[id, userId]);

  function loadComments(page,size){
    fetch(`/api/blogpost/${id}/comments?page=${page}&size=${size}${userId?`&currentUserId=${userId}`:''}`)
      .then(r=>r.json()).then(j=>{ if(j && j.code===200) setComments(j.data.list || []); })
      .catch(console.error);
  }

  const handleSubmitComment = async (e) =>{
    e.preventDefault();
    if(!userId){ alert('请先登录'); return; }
    const body = { blogPostId: Number(id), userId: Number(userId), content: commentText };
    try{
      const res = await fetch('/api/blogpost/comment', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const j = await res.json();
      if(j && j.code===200){ setCommentText(''); loadComments(0,10); }
      else alert('评论失败');
    }catch(e){ console.error(e); alert('网络错误'); }
  };

  const toggleLike = async () =>{
    if(!userId){ alert('请先登录'); return; }
    try{
      const res = await fetch(`/api/blogpost/${id}/like?userId=${userId}`, { method: 'POST' });
      const j = await res.json();
      if(j && j.code===200){
        // refresh post
        const r2 = await fetch(`/api/blogpost/${id}?currentUserId=${userId}`);
        const j2 = await r2.json(); if(j2 && j2.code===200) setPost(j2.data);
      }
    }catch(e){ console.error(e); }
  };

  

  const md = new MarkdownIt();
  if(!post) return (<div><BannerNavbar /> <div style={{padding:24}}>加载中...</div></div>);

  return (
    <div className="article-detail-page">
      <BannerNavbar />
      <div className="article-detail-container">
        <article className="article-main">
          {post.coverImageUrl && <img className="article-cover" src={resolveUrl(post.coverImageUrl)} alt="cover" />}
          <h1>{post.title}</h1>
          <div className="article-meta" style={{display:'flex',alignItems:'center',gap:8}}>
            {post.authorAvatarUrl ? (
              <img src={resolveUrl(post.authorAvatarUrl)} alt="avatar" style={{width:32,height:32,borderRadius:'50%',objectFit:'cover'}} />
            ) : null}
            <span>{post.authorNickname ? post.authorNickname : '匿名'}</span>
            <span style={{color:'#bbb',marginLeft:8}}>{new Date(post.createdAt).toLocaleString()}</span>
          </div>
          <div className="article-content" dangerouslySetInnerHTML={{__html: md.render(post.content || '')}} />

          {/* 点赞与评论放在文章正文底部 */}
          <div className="article-actions">
            <button onClick={toggleLike}>{post.likedByCurrentUser ? '取消点赞' : '点赞'} ({post.likeCount||0})</button>
          </div>

          <section className="article-comments">
            <h3>评论</h3>
            <form onSubmit={handleSubmitComment}>
              {userId ? (
                <>
                  <label htmlFor="commentText" className="comment-hint">在此发表评论（支持基本文本）</label>
                  <textarea
                    id="commentText"
                    aria-label="发表评论"
                    placeholder="写下你的想法，文明评论~"
                    value={commentText}
                    onChange={e=>setCommentText(e.target.value)}
                    required
                  />
                  <div style={{marginTop:8}}><button type="submit">评论</button></div>
                </>
              ) : (
                <div className="comment-login-prompt" style={{padding:8}}>
                  请先 <a href="/welcome">登录</a> 后发表评论。
                </div>
              )}
            </form>
            <div className="comments-list">
              {comments.map(c => (
                <div key={c.id} className="comment-item">
                  <div className="comment-avatar"><img src={resolveUrl(c.avatarUrl)} alt="avatar" /></div>
                  <div className="comment-body">
                    <div className="comment-header">{c.nickname} · {new Date(c.createdAt).toLocaleString()}</div>
                    <div className="comment-content">{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
