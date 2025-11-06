import React, { useEffect, useRef, useState } from 'react';
import '../../styles/common/PenroseLogo.css';

// PenroseLogo: 复刻示例“彭罗斯三角”作为项目 Logo（保留 hover 交互）
// 通过整体缩放适配导航栏高度，避免侵入全局样式。
export default function PenroseLogo({ size = 56, href = '/', duration = 2000 }) {
  const style = { width: `${size}px`, height: `${size}px` };
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const timerRef = useRef(null);

  // 悬停触发：展开并在 2 秒后自动收回；期间加锁忽略再次悬停
  const onPointerEnter = () => {
    if (locked) return;
    setOpen(true);
    setLocked(true);
  };

  // 定时收回逻辑：当 open 且 locked 为 true 时，启动计时器；
  // 在严格模式下，effect 的清理-重建不会导致“永不收回”，因为重建会重新安排计时器。
  useEffect(() => {
    if (!(open && locked)) return undefined;
    try { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } } catch { /* ignore */ }
    timerRef.current = setTimeout(() => {
      setOpen(false);
      setLocked(false);
      try { timerRef.current = null; } catch { /* ignore */ }
    }, Math.max(0, Number(duration) || 0));
    return () => {
      try { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } } catch { /* ignore */ }
    };
  }, [open, locked, duration]);

  // 组件卸载时兜底清理
  useEffect(() => () => {
    try { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } } catch { /* ignore */ }
  }, []);

  return (
    <a href={href} className="penrose-logo" style={style} aria-label="Blog" onPointerEnter={onPointerEnter}>
      <div className="penrose-scale">
        <div className={`penrose-shell${open ? ' penrose-open' : ''}`}>
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
  );
}
