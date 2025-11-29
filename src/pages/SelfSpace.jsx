import React from 'react';
import '../styles/selfspace/SelfSpace.css';
import SelfspaceProfileAccordion from '../components/selfspace/SelfspaceProfileAccordion/SelfspaceProfileAccordion.jsx';
import BannerNavbar from '../components/common/BannerNavbar.jsx';

// SelfSpace 页面：左侧 25vw 手风琴资料面板 + 右侧内容区域
export default function SelfSpace() {
  return (
    <>
      <BannerNavbar />
      <div className="selfspace-page" data-page="selfspace">
        <aside className="selfspace-left-panel" aria-label="个人空间侧边栏">
          <div className="selfspace-left-panel-inner">
            <SelfspaceProfileAccordion panelWidth="100%" panelHeight="100%" />
          </div>
        </aside>

        <main className="selfspace-right-panel" aria-label="个人空间内容区">
          {/* ProfileEditPanel 已集成到 SelfspaceProfileAccordion，无需单独渲染 */}
          <div style={{ height: '2000px', background: 'rgba(0,0,0,0.03)' }} />
        </main>
      </div>
    </>
  );
}
