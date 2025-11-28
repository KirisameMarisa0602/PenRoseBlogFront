import React, { useRef, useEffect, useState } from 'react';
import Maid from '../components/home/maid/Maid';
import '../styles/home/Home.css';
import BannerNavbar from '../components/common/BannerNavbar';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const heroRef = useRef(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/blogpost?page=0&size=20')
      .then(res => res.json())
      .then(data => {
        // 调试输出
        if (import.meta.env && import.meta.env.DEV) {
          console.log('blogpost接口返回:', data);
        }
        let arr = [];
        if ((data.code === 200 || data.status === 200) && data.data) {
          // 优先处理常见的分页结构
          if (Array.isArray(data.data)) {
            arr = data.data;
          } else if (Array.isArray(data.data.list)) {
            arr = data.data.list;
          } else if (Array.isArray(data.data.content)) {
            arr = data.data.content;
          } else {
            // 回退：从对象的值中找第一个数组（保持向后兼容）
            const maybeArray = Object.values(data.data).find(v => Array.isArray(v));
            if (Array.isArray(maybeArray)) {
              arr = maybeArray;
            } else {
              // 最后回退为 Object.values（原逻辑）
              arr = Object.values(data.data);
            }
          }
        }

        // 新增：按 createdAt 倒序排列（最新的在前）
        if (Array.isArray(arr) && arr.length > 0) {
          arr.sort((a, b) => {
            const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tb - ta;
          });
        }

        setArticles(arr);
      })
      .catch(err => {
        if (import.meta.env && import.meta.env.DEV) {
          console.error('blogpost接口异常:', err);
        }
        setArticles([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <BannerNavbar bannerId={undefined} />
      <section ref={heroRef} className="home-main-full" aria-label="主页内容" style={{ minHeight: '100vh', paddingTop: '15vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 0' }}>
          <h2 style={{ fontSize: 28, marginBottom: 24, color: '#222' }}>最新文章</h2>
          {loading ? <div style={{padding:40}}>加载中...</div> : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              {articles.length === 0 && <div style={{ color: '#888' }}>暂无文章</div>}
              {articles.map(article => (
                <div
                  key={article.id}
                  style={{
                    width: 270,
                    background: '#fff',
                    borderRadius: 10,
                    boxShadow: '0 2px 12px #0001',
                    padding: 18,
                    cursor: 'pointer',
                    transition: 'box-shadow .2s',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  onClick={() => navigate(`/article/${article.id}`)}
                >
                  {article.coverImageUrl && <img src={article.coverImageUrl} alt="cover" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, marginBottom: 10 }} />}
                  <div style={{ fontSize: 19, fontWeight: 600, color: '#222', marginBottom: 8 }}>{article.title}</div>
                  <div style={{ color: '#888', fontSize: 14, marginBottom: 6 }}>作者ID: {article.userId}</div>
                  <div style={{ color: '#aaa', fontSize: 13 }}>{article.createdAt?.replace('T', ' ').slice(0, 19)}</div>
                  <div style={{ color: '#0a7', fontSize: 13, marginTop: 8 }}>点赞 {article.likeCount || 0} · 评论 {article.commentCount || 0}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Maid />
    </>
  );
};

export default Home;