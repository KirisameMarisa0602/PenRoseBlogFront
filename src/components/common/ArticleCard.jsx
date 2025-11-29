import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/common/ArticleCard.css';
import resolveUrl from '../../utils/resolveUrl';

export default function ArticleCard({ post }) {
  const navigate = useNavigate();
  const handleClick = () => navigate(`/post/${post.id}`);
  const coverSrc = resolveUrl(post.coverImageUrl) || null;
  return (
    <div className="article-card" onClick={handleClick} role="button" tabIndex={0}>
      {coverSrc && (
        <div className="article-card-cover">
          <img src={coverSrc} alt="cover" />
        </div>
      )}
      <div className="article-card-body">
        <div className="article-card-author-meta" style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
          {post.authorAvatarUrl && (
            <img src={resolveUrl(post.authorAvatarUrl)} alt="avatar" style={{width:24,height:24,borderRadius:'50%',objectFit:'cover'}} />
          )}
          <span style={{fontSize:14,color:'#888'}}>{post.authorNickname || '匿名'}</span>
        </div>
        <h3 className="article-card-title">{post.title}</h3>
        <div className="article-card-stats" style={{display:'flex',alignItems:'center',gap:16,marginTop:8}}>
          <span style={{fontSize:13,color:'#1976d2'}}>👍 {post.likeCount || 0}</span>
          <span style={{fontSize:13,color:'#3b82f6'}}>💬 {post.commentCount || 0}</span>
        </div>
      </div>
    </div>
  );
}
