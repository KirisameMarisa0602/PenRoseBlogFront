// 将后端返回的图片/媒体路径规范为浏览器可请求的 URL
export default function resolveUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  // 优先使用 VITE_BACKEND_ORIGIN（生产部署时在 .env.production 设置），开发环境回退到 window.location.origin
  const backend = import.meta.env.VITE_BACKEND_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
  if (url.startsWith('/')) return backend + url;
  return backend + '/' + url;
}
