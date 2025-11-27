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

  // 编辑模式下加载原博客内容
  useEffect(() => {
    if (blogId) {
      setLoading(true);
      fetch(`/api/blogpost/${blogId}`)
        .then(res => res.json())
        .then(data => {
          if (data.code === 200 && data.data) {
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
      cover, // 兼容后端cover字段
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
      if (data.code === 200) {
        setMsg("保存成功");
        // 可选：跳转到详情页或清空表单
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
      maxWidth: 600,
      margin: "32px auto",
      background: "#fff",
      borderRadius: 8,
      boxShadow: "0 2px 12px #0001",
      padding: 32
    }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>
        {blogId ? "编辑博客文章" : "新建博客文章"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", marginBottom: 6 }}>标题 *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #bbb" }}
            placeholder="请输入标题"
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", marginBottom: 6 }}>正文内容 *</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            style={{ width: "100%", height: 140, padding: 8, borderRadius: 4, border: "1px solid #bbb" }}
            placeholder="请输入正文内容"
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", marginBottom: 6 }}>封面URL</label>
          <input
            type="text"
            value={cover}
            onChange={e => setCover(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #bbb" }}
            placeholder="可选 http/https 图片链接"
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", marginBottom: 6 }}>目录 (directory)</label>
          <input
            type="text"
            value={directory}
            onChange={e => setDirectory(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #bbb" }}
            placeholder="可选：分类/栏目"
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: 18, textAlign: "center" }}>
          <button
            type="submit"
            style={{
              padding: "8px 32px",
              borderRadius: 4,
              background: "#0a7",
              color: "#fff",
              border: "none",
              fontSize: 16,
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
            fontSize: 15
          }}>
            {msg}
          </div>
        )}
      </form>
    </div>
  );
}
