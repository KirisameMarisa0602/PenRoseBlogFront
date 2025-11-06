import React, { useEffect, useRef, useState } from 'react';
import Maid from '../components/home/maid/Maid';
import '../styles/home/Home.css';
import PenroseLogo from '../components/common/PenroseLogo';

const Home = () => {
  const heroRef = useRef(null);
  const lastScrollRef = useRef(0);
  const [navHidden, setNavHidden] = useState(false);
  const [navTransparent, setNavTransparent] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY || document.documentElement.scrollTop || 0;
      const last = lastScrollRef.current;
      const goingDown = current > last;
      const delta = Math.abs(current - last);

      // 1) 透明逻辑：当导航覆盖在欢迎区内时，保持完全透明
      const heroH = heroRef.current?.offsetHeight || window.innerHeight;
      const navH = Math.round((window.innerHeight || 0) * 0.10); // 导航高度 10vh
      setNavTransparent(current < Math.max(0, heroH - navH));

      // 2) 显隐逻辑：向下滚动隐藏，向上滚动显示（加阈值避免抖动）
      if (current <= 0) {
        setNavHidden(false);
      } else if (goingDown && delta > 4 && current > 80) {
        setNavHidden(true);
      } else if (!goingDown && delta > 4) {
        setNavHidden(false);
      }

      lastScrollRef.current = current;
    };

    const onResize = () => {
      // 触发一次透明状态计算
      const current = window.scrollY || document.documentElement.scrollTop || 0;
      const heroH = heroRef.current?.offsetHeight || window.innerHeight;
      const navH = Math.round((window.innerHeight || 0) * 0.10);
      setNavTransparent(current < Math.max(0, heroH - navH));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    // 初始计算
    onResize();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
      {/* 顶部导航栏：透明/半透明 + 上下滑显隐 */}
      <nav
        className={`home-navbar${navHidden ? ' is-hidden' : ''}${navTransparent ? ' is-transparent' : ' is-translucent'}`}
        aria-label="主导航"
      >
        <div className="nav-inner">
          <div className="nav-brand" aria-label="站点标识">
            <PenroseLogo size={120} href="/" />
          </div>
          <div className="nav-actions" aria-hidden="true" />
        </div>
      </nav>

      {/* 欢迎区域：占满整个视窗，高度 100vh */}
      <section ref={heroRef} className="home-hero-full" aria-label="欢迎区域">
        <div className="hero-center">
          <h1 className="welcome-title">欢迎区域</h1>
        </div>
      </section>
      {/* 与欢迎区域相同大小的内容区域 */}
      <section className="home-content-full" aria-label="内容区域">
        <div className="hero-center">
          <h2 className="welcome-title">内容区域</h2>
        </div>
      </section>
      <Maid />
    </>
  );
};

export default Home;
