
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerNavbar from '../components/common/BannerNavbar';
import '../styles/blogeditor/BlogEditor.css';
import MDEditor from '@uiw/react-md-editor';

const BlogEditor = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);



  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    setCover(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setCoverPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setCoverPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert('请先登录！');
      return;
    }
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('userId', userId);
    if (cover) formData.append('cover', cover);
    try {
      const res = await fetch('/api/blogpost/withcover', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        alert('发布成功！');
        navigate('/');
      } else {
        alert('发布失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  return (
    <div className="blog-editor-container">
      <BannerNavbar />
      <h2>发布新文章</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          type="text"
          placeholder="请输入标题"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="blog-editor-title-input"
        />
        <div className="blog-editor-cover-row">
          <label className="blog-editor-cover-label">封面</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            style={{ display: 'inline-block' }}
          />
          {coverPreview && (
            <div className="blog-editor-cover-preview">
              <img src={coverPreview} alt="封面预览" className="blog-editor-cover-img" />
            </div>
          )}
        </div>
        <div style={{marginBottom: '16px'}}>
          <MDEditor
            value={content}
            onChange={setContent}
            height={350}
            preview="edit"
          />
        </div>
        <button
          type="submit"
          className="blog-editor-submit-btn"
        >
          发布
        </button>
      </form>
    </div>
  );
};

export default BlogEditor;
