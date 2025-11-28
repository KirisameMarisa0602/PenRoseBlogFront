import React, { useState, useEffect } from "react";
import "../styles/common/AvatarDropdown.css";

// 你可以通过 props、路由参数等方式传递 blogId 和 userId
// 这里仅为演示，实际请替换为你的获取方式
const blogId = null; // 编辑时填入博客ID，新增时为null
const userId = 1;    // 当前登录用户ID

export default function BlogEditPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState("");
  const [directory, setDirectory] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  // 编辑模式下加载原博客内容
  useEffect(() => {
    if (blogId) {
      setLoading(true);
      fetch(`/api/blogpost/${blogId}`)
        .then(res => res.json())
        .then(data => {
          if ((data.code === 200 || data.status === 200) && data.data) {
            setTitle(data.data.title || "");
            setContent(data.data.content || "");
            setCover(data.data.coverImageUrl || "");
            setDirectory(data.data.directory || "");
          } else {
            setMsg(data.msg || "加载失败");
          }
        })
        .catch(() => setMsg("加载失败"))
        .finally(() => setLoading(false));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setMsg("标题和正文不能为空");
      return;
    }
    setMsg("保存中...");
    setLoading(true);

    // 构造请求体，cover/coverImageUrl 字段都发，后端可兼容
    const body = {
      title,
      content,
      coverImageUrl: cover,
      directory,
      userId, // 新建时需要，编辑时可选
    };

    try {
      let resp, data;
      if (blogId) {
        // 编辑
        resp = await fetch(`/api/blogpost/${blogId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        // 新建
        resp = await fetch("/api/blogpost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      data = await resp.json();
      if (data.code === 200 || data.status === 200) {
        setMsg("保存成功，博客已写入数据库");
        setTitle("");
        setContent("");
        setCover("");
        setDirectory("");
      } else {
        setMsg(data.msg || "保存失败");
      }
    } catch {
      setMsg("网络或服务器错误");
    }
    setLoading(false);
  };

  return (
    <div style={{
      maxWidth: 700,
      margin: "40px auto",
      background: "#f8f9fa",
      borderRadius: 12,
      boxShadow: "0 4px 24px #0002",
      padding: 36,
      fontFamily: 'Segoe UI',
      position: 'relative'
    }}>
      <h2 style={{ textAlign: "center", marginBottom: 28, color: '#222', letterSpacing: 2 }}>
        {blogId ? "编辑博客文章" : "新建博客文章"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>标题 *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #bbb", fontSize: 16, background: '#fff', color: '#222', zIndex: 1, opacity: 1 }}
            placeholder="请输入标题"
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>正文内容 *</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            style={{ width: "100%", height: 180, padding: 10, borderRadius: 6, border: "1px solid #bbb", fontSize: 15, background: '#fff', color: '#222', resize: 'vertical', zIndex: 1, opacity: 1 }}
            placeholder="请输入正文内容"
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>封面图片URL</label>
          <input
            type="text"
            value={cover}
            onChange={e => setCover(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #bbb", fontSize: 15, background: '#fff' }}
            placeholder="可选 http/https 图片链接"
            disabled={loading}
          />
          {cover && cover.startsWith('http') && (
            <img src={cover} alt="cover" style={{ marginTop: 10, maxWidth: '100%', borderRadius: 8, boxShadow: '0 2px 8px #0001' }} />
          )}
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>目录 (directory)</label>
          <input
            type="text"
            value={directory}
            onChange={e => setDirectory(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #bbb", fontSize: 15, background: '#fff' }}
            placeholder="可选：分类/栏目"
            disabled={loading}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => setPreview(v => !v)}
            style={{
              padding: "8px 24px",
              borderRadius: 4,
              background: preview ? "#0a7" : "#eee",
              color: preview ? "#fff" : "#333",
              border: "none",
              fontSize: 15,
              cursor: "pointer",
              marginRight: 10
            }}
            disabled={loading}
          >
            {preview ? "关闭预览" : "预览正文"}
          </button>
          <button
            type="submit"
            style={{
              padding: "8px 32px",
              borderRadius: 4,
              background: "#0a7",
              color: "#fff",
              border: "none",
              fontSize: 17,
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer"
            }}
            disabled={loading}
          >
            {loading ? "保存中..." : "保存"}
          </button>
        </div>
        {msg && (
          <div style={{
            textAlign: "center",
            color: msg.includes("成功") ? "#0a7" : "#c00",
            fontSize: 16,
            marginTop: 10
          }}>
            {msg}
          </div>
        )}
      </form>
      {preview && (
        <div style={{
          marginTop: 32,
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 2px 8px #0001',
          padding: 24,
          minHeight: 120
        }}>
          <h3 style={{ color: '#0a7', marginBottom: 12 }}>正文预览</h3>
          <div style={{ whiteSpace: 'pre-wrap', color: '#222', fontSize: 16 }}>{content || '（暂无内容）'}</div>
        </div>
      )}
    </div>
  );
}
