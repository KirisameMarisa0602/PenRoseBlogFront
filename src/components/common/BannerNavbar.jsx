import React, { useEffect, useRef, useState, useMemo } from 'react';
import '../../styles/common/BannerNavbar.css';
import ExampleSpring from './examples/ExampleSpring.jsx';
import ExampleAutumn from './examples/ExampleAutumn.jsx';
import ExampleWinter from './examples/ExampleWinter.jsx';

// BannerNavbar：顶部导航 + 主题化可交互背景（效果由各主题 data.json 全权决定）
export default function BannerNavbar({ bannerId, children }) {
  const BASE_WIDTH = 1650; // 参考项目的基准宽度
  const [navHidden, setNavHidden] = useState(false);
  // 从 /banner/manifest.json 读取的主题清单
  const [manifest, setManifest] = useState([]);
  const [index, setIndex] = useState(0);
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const lastScrollRef = useRef(0);
  const prevHiddenRef = useRef(false);
  const initializedRef = useRef(false);
  const containerRef = useRef(null);
  const baseHeightRef = useRef(180); // 主题级基准画布高度，用于统一缩放
  const layerRefs = useRef([]); // 每层 DOM 引用
  const compTransformsRef = useRef([]); // 按 compensate 处理后的基础 transform 矩阵数组（6元组）
  const mediaSizeRef = useRef([]); // 每层媒体的宽高（已补偿）
  const compensateRef = useRef(1);
  const moveXRef = useRef(0);
  const animStateRef = useRef({ homing: false, startTime: 0, duration: 300 });

  // 加载主题清单（public/banner/manifest.json）
  useEffect(() => {
    let dead = false;
    setError(null);
  fetch('/banner/manifest.json?_=' + Date.now())
      .then(r => (r.ok ? r.json() : []))
      .then(list => { if (!dead) setManifest(Array.isArray(list) ? list : []); })
      .catch(e => { console.error(e); if (!dead) setManifest([]); });
    return () => { dead = true; };
  }, []);

  // 初始化激活主题索引：优先使用传入 bannerId（支持数字索引或名称匹配）
  useEffect(() => {
    if (!manifest.length) return;
    if (bannerId !== undefined && bannerId !== null) {
      let start = -1;
      if (typeof bannerId === 'number') start = Number.isFinite(bannerId) ? bannerId : -1;
      else if (typeof bannerId === 'string') {
        start = manifest.findIndex(x => String(x?.id || x?.name || '').toLowerCase() === bannerId.toLowerCase());
      }
      if (start >= 0 && start < manifest.length && start !== index) setIndex(start);
      else if (start === -1 && index !== 0) setIndex(0);
    } else if (index >= manifest.length) {
      setIndex(0);
    }
  }, [manifest, bannerId, index]);

  // 滚动显隐：下滚隐藏，上滚显示
  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY || document.documentElement.scrollTop || 0;
      const last = lastScrollRef.current;
      const goingDown = current > last;
      const delta = Math.abs(current - last);
      if (current <= 0) setNavHidden(false);
      else if (goingDown && delta > 4 && current > 80) setNavHidden(true);
      else if (!goingDown && delta > 4) setNavHidden(false);
      lastScrollRef.current = current;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 监听隐藏->显示：轮换主题
  useEffect(() => {
    const prev = prevHiddenRef.current;
    if (initializedRef.current && prev === true && navHidden === false && manifest.length > 0) {
      setIndex(i => (i + 1) % manifest.length);
    }
    prevHiddenRef.current = navHidden;
    if (!initializedRef.current) initializedRef.current = true;
  }, [navHidden, manifest.length]);
  const activeId = useMemo(() => (manifest.length ? manifest[index]?.id : null), [manifest, index]);
  const isExample = useMemo(() => ['example-spring','example-autumn','example-winter'].includes(String(activeId)), [activeId]);

  // 加载 data.json -> 构造 layers（完全数据驱动）
  useEffect(() => {
    let dead = false;
    setLoading(true); setError(null); setLayers([]);
    if (!activeId) { setLoading(false); return; }
    if (['example-spring','example-autumn','example-winter'].includes(String(activeId))) {
      // 示例主题走专用组件渲染，不加载 data.json
      setLoading(false);
      return;
    }
  fetch(`/banner/assets/${activeId}/data.json?_=${Date.now()}`)
      .then(r => { if (!r.ok) throw new Error(r.status + ' ' + r.statusText); return r.json(); })
      .then(json => {
        if (dead) return;
        const init = Array.isArray(json) ? json.map(item => {
          const [m11 = 1, m12 = 0, m21 = 0, m22 = 1, tx = 0, ty = 0] = Array.isArray(item.transform) ? item.transform : [1,0,0,1,0,0];
          return {
            ...item,
            m11, m12, m21, m22,
            baseTx: tx, baseTy: ty,
            tx: tx, ty: ty, rot: 0,
            accel: item.a ?? 0,
            deg: item.deg ?? 0,
            g: item.g ?? 0,
            f: item.f ?? 0
          };
        }) : [];
        const firstH = init[0]?.height ? Number(init[0].height) : null;
        const maxH = init.reduce((m, l) => (Number(l.height) > m ? Number(l.height) : m), 0);
        baseHeightRef.current = Number.isFinite(firstH) && firstH > 0 ? firstH : (maxH > 0 ? maxH : 180);
        setLayers(init);
      })
      .catch(e => { console.error(e); if (!dead) setError(e.message || '加载失败'); })
      .finally(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
  }, [activeId]);

  // 尺寸与基础矩阵布局：根据窗口宽度计算 compensate，并写入媒体宽高以及基础 transform
  useEffect(() => {
  const el = containerRef.current;
    if (!el || !layers.length) return;
  // 示例主题不参与标准层布局
  if (isExample) return;
    function layout() {
      const w = window.innerWidth || document.documentElement.clientWidth || el.clientWidth || BASE_WIDTH;
      const compensate = w > BASE_WIDTH ? w / BASE_WIDTH : 1;
      compensateRef.current = compensate;
      // 生成每层的基础矩阵与媒体尺寸
      const compT = [];
      const mSizes = [];
      for (let i = 0; i < layers.length; i++) {
        const item = layers[i];
        const t = Array.isArray(item.transform) ? item.transform.slice() : [1,0,0,1,0,0];
        // 平移量按补偿
        t[4] = (t[4] || 0) * compensate;
        t[5] = (t[5] || 0) * compensate;
        compT[i] = t;
        mSizes[i] = [Math.round((Number(item.width) || 0) * compensate), Math.round((Number(item.height) || 0) * compensate)];
      }
      compTransformsRef.current = compT;
      mediaSizeRef.current = mSizes;
      // 立即应用尺寸到 DOM
      for (let i = 0; i < layerRefs.current.length; i++) {
        const layerEl = layerRefs.current[i];
        if (!layerEl) continue;
        const media = layerEl.firstElementChild;
        if (!media) continue;
        const [mw, mh] = mSizes[i] || [0, 0];
        media.style.width = mw ? mw + 'px' : '';
        media.style.height = mh ? mh + 'px' : '';
        media.style.filter = `blur(${layers[i]?.blur || 0}px)`;
        // 应用基础矩阵
        const baseM = new DOMMatrix(compT[i] || [1,0,0,1,0,0]);
        layerEl.style.transform = baseM.toString();
        // 初始透明度
        const op = Array.isArray(layers[i]?.opacity) ? parseFloat(layers[i].opacity[0]) : 1;
        layerEl.style.opacity = String(op);
      }
    }
    layout();
    window.addEventListener('resize', layout);
    return () => window.removeEventListener('resize', layout);
  }, [layers, isExample]);

  // 指针交互 + 回正动画：以 DOMMatrix 直接应用到层，贴近参考项目
  useEffect(() => {
  const el = containerRef.current;
  if (!el || !layers.length) return;
  if (isExample) return; // 示例主题自身管理交互
    let raf = null;
    let initX = null;
    const duration = animStateRef.current.duration;
    const lerp = (a, b, t) => a + (b - a) * t;
    const onEnter = (e) => {
      initX = e.pageX;
    };
    const onMove = (e) => {
      if (initX == null) initX = e.pageX;
      // 与参考项目一致：不引入额外强度系数
      moveXRef.current = (e.pageX - initX);
      animStateRef.current.homing = false;
      if (!raf) raf = requestAnimationFrame(animate);
    };
    const onLeave = () => {
      animStateRef.current.homing = true;
      animStateRef.current.startTime = 0;
      if (!raf) raf = requestAnimationFrame(homing);
    };
    function applyFor(progress /* 0..1 or undefined */) {
      const compT = compTransformsRef.current || [];
      for (let i = 0; i < layerRefs.current.length; i++) {
        const layerEl = layerRefs.current[i];
        if (!layerEl) continue;
        const item = layers[i];
        if (!item) continue;
        const base = new DOMMatrix(compT[i] || [1,0,0,1,0,0]);
        let moveX = moveXRef.current;
        let s = item.f ? item.f * moveX + 1 : 1;
        let g = (item.g || 0) ? item.g * moveX : 0;
        let move = (item.a || 0) * moveX; // translateX
        let m = base.multiply(new DOMMatrix([base.a * s, base.b, base.c, base.d * s, move, g]));
        if (item.deg) {
          const deg = item.deg * moveX; // 实际上是角度系数 * 偏移量，沿用参考项目
          m = m.multiply(new DOMMatrix([
            Math.cos(deg),
            Math.sin(deg),
            -Math.sin(deg),
            Math.cos(deg),
            0,
            0,
          ]));
        }
        if (typeof progress === 'number') {
          // 回正时处理：将 e 分量/缩放/纵移/旋转插值回到基础
          const backMove = lerp((moveX * (item.a || 0)) + (compT[i]?.[4] || 0), (compT[i]?.[4] || 0), progress);
          const backG = lerp((item.g || 0) * moveX, 0, progress);
          const backS = lerp(item.f ? item.f * moveX + 1 : 1, 1, progress);
          let mm = new DOMMatrix([base.a * backS, base.b, base.c, base.d * backS, backMove - (compT[i]?.[4] || 0), backG]);
          if (item.deg) {
            const d = lerp(item.deg * moveX, 0, progress);
            mm = mm.multiply(new DOMMatrix([
              Math.cos(d),
              Math.sin(d),
              -Math.sin(d),
              Math.cos(d),
              0,
              0,
            ]));
          }
          m = base.multiply(mm);
        }
        // 透明度
        if (item.opacity) {
          const o0 = parseFloat(item.opacity[0] || 1);
          const o1 = parseFloat(item.opacity[1] || o0);
          const rectW = (window.innerWidth || document.documentElement.clientWidth || BASE_WIDTH);
          const ratio = Math.min(Math.abs(moveXRef.current) / rectW * 2, 1);
          const val = typeof progress === 'number'
            ? (moveXRef.current > 0 ? lerp(o1, o0, progress) : lerp(o0, o1, progress))
            : (moveXRef.current > 0 ? lerp(o0, o1, ratio) : lerp(o0, o1, ratio));
          layerEl.style.opacity = String(val);
        }
        layerEl.style.transform = m.toString();
      }
    }
    function animate() {
      raf = null;
      applyFor();
    }
    function homing(timestamp) {
      if (!animStateRef.current.startTime) animStateRef.current.startTime = timestamp;
      const elapsed = timestamp - animStateRef.current.startTime;
      const progress = Math.min(elapsed / duration, 1);
      applyFor(progress);
      if (progress < 1) raf = requestAnimationFrame(homing); else raf = null;
    }
    // 事件绑定在 window，避免背景忽略指针
    window.addEventListener('mouseenter', onEnter);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('blur', onLeave);
    // 初始应用一次基础矩阵
    if (!raf) raf = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mouseenter', onEnter);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('blur', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [layers, isExample]);

  // 资源路径重写
  const resolveSrc = (src) => {
    if (!src) return '';
  // 将相对路径 ./assets/{id}/xxx 映射为 /banner/assets/{id}/xxx
  if (/^\.\/assets\//.test(src)) return src.replace(/^\.\/assets\//, '/banner/assets/');
    if (/^https?:\/\//i.test(src) || src.startsWith('/')) return src;
    return src;
  };

  return (
    <nav className={`banner-navbar${navHidden ? ' is-hidden' : ''}`} aria-label="主导航">
      <div ref={containerRef} className="bili-banner" aria-hidden="true">
        {loading && <div className="bili-banner-loading">Loading...</div>}
        {error && !loading && <div className="bili-banner-error">{error}</div>}
        {!loading && !error && !isExample && layers.map((layer, i) => (
          <div className="bili-layer" key={i} ref={el => (layerRefs.current[i] = el)}>
            {layer.tagName === 'video' ? (
              <video className="bili-media" autoPlay loop muted playsInline>
                <source src={resolveSrc(layer.src)} />
              </video>
            ) : layer.tagName === 'iframe' ? (
              <iframe
                className="bili-media"
                src={resolveSrc(layer.src)}
                title={`banner-iframe-${i}`}
                frameBorder="0"
                loading="lazy"
              />
            ) : (
              <img className="bili-media" src={resolveSrc(layer.src)} alt="banner layer" draggable={false} />
            )}
          </div>
        ))}
        {!loading && !error && isExample && (
          <div className="example-host">
            {activeId === 'example-spring' && <ExampleSpring />}
            {activeId === 'example-autumn' && <ExampleAutumn />}
            {activeId === 'example-winter' && <ExampleWinter />}
          </div>
        )}
      </div>
      <div className="nav-inner">
        <div className="nav-brand" aria-label="站点标识">
          <a href="/" className="penrose-logo" aria-label="Blog">
            <div className="penrose-scale">
              <div className="penrose-shell">
                <div className="penrose-wrapper">
                  <div className="penrose-a" />
                  <div className="penrose-b" />
                  <div className="penrose-c" />
                </div>
                <div className="penrose-wrapper2">
                  <div className="penrose-a" />
                  <div className="penrose-b" />
                  <div className="penrose-c" />
                  <div className="penrose-d" />
                  <div className="penrose-e" />
                  <div className="penrose-f" />
                </div>
                <div className="penrose-wrapper3">
                  <div className="penrose-a" />
                  <div className="penrose-b" />
                  <div className="penrose-c" />
                  <div className="penrose-d" />
                  <div className="penrose-e" />
                  <div className="penrose-f" />
                </div>
              </div>
            </div>
          </a>
        </div>
        <div className="nav-actions">
          {children}
        </div>
      </div>
    </nav>
  );
}
