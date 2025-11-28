import React, { useState, useEffect } from "react";

export default function ProfileEditPanel() {
  const [profile, setProfile] = useState({ nickname: "", bio: "", gender: "", avatar: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/user/profile?userId=1`)
      .then(res => res.json())
      .then(data => {
        if ((data.code === 200 || data.status === 200) && data.data) {
          setProfile({
            nickname: data.data.nickname || "",
            bio: data.data.bio || "",
            gender: data.data.gender || "",
            avatar: data.data.avatar || ""
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = e => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    const res = await fetch(`/api/user/profile/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 1, ...profile })
    });
    const data = await res.json();
    setLoading(false);
    if ((data.code === 200 || data.status === 200)) {
      setMsg("保存成功");
    } else {
      setMsg(data.msg || "保存失败");
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "0 auto", background: "#fff", borderRadius: 10, boxShadow: "0 2px 12px #0001", padding: 24 }}>
      <h3 style={{ fontSize: 20, marginBottom: 16 }}>编辑个人资料</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>昵称：</label>
          <input name="nickname" value={profile.nickname} onChange={handleChange} style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>简介：</label>
          <textarea name="bio" value={profile.bio} onChange={handleChange} style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>性别：</label>
          <select name="gender" value={profile.gender} onChange={handleChange} style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}>
            <option value="">保密</option>
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>头像链接：</label>
          <input name="avatar" value={profile.avatar} onChange={handleChange} style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }} />
        </div>
        <button type="submit" disabled={loading} style={{ padding: "8px 16px", borderRadius: 4, background: loading ? "#ccc" : "#4e8cff", color: "#fff", border: "none" }}>保存</button>
      </form>
      {msg && <div style={{ color: "#888", marginTop: 10 }}>{msg}</div>}
    </div>
  );
}

