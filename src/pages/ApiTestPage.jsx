import React, { useState } from "react";
import "../styles/common/ui.css";

export default function ApiTestPage() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [result, setResult] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult("请求中...");
    let customHeaders = {};
    try {
      if (headers.trim()) {
        customHeaders = JSON.parse(headers);
      }
    } catch (err) {
      setResult("请求头格式错误: " + err.message);
      return;
    }
    try {
      const res = await fetch(url, {
        method,
        headers: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
        body: ["POST", "PUT", "PATCH", "DELETE"].includes(method) ? body : undefined
      });
      const text = await res.text();
      setResult(text);
    } catch (err) {
      setResult("请求失败: " + err.message);
    }
  };

  return (
    <div className="ui-card">
      <h2 className="ui-title">API 测试工具</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
        <input className="ui-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="请求 URL" />
        <select className="ui-select" value={method} onChange={e => setMethod(e.target.value)} style={{ width: 130 }}>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
          <option value="OPTIONS">OPTIONS</option>
          <option value="HEAD">HEAD</option>
        </select>
        <textarea className="ui-textarea" value={headers} onChange={e => setHeaders(e.target.value)} placeholder="请求头 (JSON格式)" style={{ minHeight: 48, fontFamily: 'JetBrains Mono, Fira Mono, Consolas, monospace' }} />
        {["POST", "PUT", "PATCH", "DELETE"].includes(method) && (
          <textarea className="ui-textarea" value={body} onChange={e => setBody(e.target.value)} placeholder="请求体 (JSON)" style={{ minHeight: 60 }} />
        )}
        <button type="submit" className="ui-btn" style={{ width: 130 }}>发送</button>
      </form>
      <div className="ui-result">{result}</div>
    </div>
  );
}
