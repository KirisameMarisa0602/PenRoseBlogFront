import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import resolveUrl from '../../../utils/resolveUrl';
import '../../../styles/selfspace/SelfspaceProfileAccordion/selfspaceProfileAccordion.css';

// 个人空间左侧手风琴面板
export default function SelfspaceProfileAccordion({ panelWidth = '100%', panelHeight = '100%' }) {
  const [hoverIdx, setHoverIdx] = useState(0);
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.offsetHeight);
    }

    // 监听容器尺寸变化（例如导航栏收起导致 left-panel 高度变化）
    let ro = null;
    try {
      if (window.ResizeObserver && containerRef.current) {
        ro = new ResizeObserver(entries => {
          for (let entry of entries) {
            const h = entry.contentRect ? entry.contentRect.height : (containerRef.current ? containerRef.current.offsetHeight : 0);
            setContainerHeight(h);
          }
        });
        ro.observe(containerRef.current);
      }
    } catch {
      ro = null;
    }

    const onWinResize = () => {
      if (containerRef.current) setContainerHeight(containerRef.current.offsetHeight);
    };
    window.addEventListener('resize', onWinResize);

    return () => {
      window.removeEventListener('resize', onWinResize);
      try {
        if (ro && ro.disconnect) ro.disconnect();
      } catch {
        // ignore
      }
    };
  }, [panelHeight]);

  const getPanelHeight = (idx) => {
    if (!containerHeight) return 100;
    return hoverIdx === idx ? containerHeight * 0.7 : containerHeight * 0.1;
  };

  // 只有不在编辑区时才允许自动收回
  const handleMouseLeave = () => {
    if (hoverIdx !== 3) {
      setHoverIdx(0);
    }
  };

  const panels = [0, 1, 2, 3];

  // 用户信息编辑相关状态
  const initialProfile = React.useMemo(() => ({
    id: '',
    nickname: '',
    avatarUrl: '',
    backgroundUrl: '',
    gender: '',
  }), []);
  const [profile, setProfile] = useState(initialProfile);
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  // userId 必须为有效数字，且 token 必须存在
  const rawUserId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const userId = rawUserId && /^\d+$/.test(rawUserId) ? Number(rawUserId) : null;

  // 只在第四个面板激活时加载用户信息
  useEffect(() => {
    if (hoverIdx === 3) {
      if (!userId || !token) {
        setEditMsg('用户信息无效，请重新登录');
        setProfile(initialProfile);
        return;
      }
      setEditMsg('');
      setEditLoading(true);
      axios.get(`/api/user/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.data && res.data.code === 200 && res.data.data) {
            setProfile(res.data.data);
          } else {
            setProfile(initialProfile);
            setEditMsg(res.data?.msg || res.data?.message || '获取用户信息失败');
          }
        })
        .catch(() => {
          setProfile(initialProfile);
          setEditMsg('获取用户信息异常');
        })
        .finally(() => setEditLoading(false));
    }
  }, [hoverIdx, userId, token, initialProfile]);

  // 在组件挂载时先从 localStorage 初始化 profile，保证进入个人空间时左侧面板能立即显示
  useEffect(() => {
    try {
      const storedAvatar = localStorage.getItem('avatarUrl') || '';
      const storedBackground = localStorage.getItem('backgroundUrl') || '';
      const storedNickname = localStorage.getItem('nickname') || '';
      const storedGender = localStorage.getItem('gender') || '';
      const storedId = localStorage.getItem('userId') || '';
      setProfile(prev => ({
        ...prev,
        id: storedId,
        nickname: storedNickname,
        avatarUrl: storedAvatar,
        backgroundUrl: storedBackground,
        gender: storedGender,
      }));
    } catch {
      // ignore
    }
  }, []);

  // 编辑表单变更
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  // 保存用户信息
  const handleProfileSave = () => {
    if (!userId) {
      setEditMsg('用户ID无效，请重新登录');
      return;
    }
    setEditLoading(true);
    setEditMsg('');
    const token = localStorage.getItem('token');
    axios.put(`/api/user/profile/${userId}`, profile, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => {
        if (res.data && res.data.code === 200) {
          setEditMsg('保存成功');
          // 保存成功后，刷新localStorage昵称和性别，并通知其他组件刷新
          localStorage.setItem('nickname', profile.nickname || '');
          localStorage.setItem('gender', profile.gender || '');
          window.dispatchEvent(new Event('auth-changed'));
        } else {
          setEditMsg(res.data?.msg || res.data?.message || '保存失败');
        }
      })
      .catch(() => setEditMsg('保存异常'))
      .finally(() => setEditLoading(false));
  };

  // 头像上传
  const handleAvatarUpload = async (e) => {
    if (!userId) {
      setEditMsg('用户ID无效，请重新登录');
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) {
      setEditMsg('仅支持图片/gif作为头像');
      return;
    }
    setEditMsg('头像上传中...');
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`/api/user/profile/${userId}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.data && res.data.code === 200 && res.data.data) {
        setEditMsg('头像上传成功');
        // 上传成功后刷新用户信息
        axios.get(`/api/user/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res2 => {
          if (res2.data && res2.data.code === 200 && res2.data.data) {
            setProfile(res2.data.data);
            localStorage.setItem('avatarUrl', res2.data.data.avatarUrl || '');
            window.dispatchEvent(new Event('auth-changed'));
          }
        });
      } else {
        setEditMsg(res.data?.msg || res.data?.message || '头像上传失败');
      }
    } catch {
      setEditMsg('头像上传异常');
    }
  };

  // 背景上传
  const handleBackgroundUpload = async (e) => {
    if (!userId) {
      setEditMsg('用户ID无效，请重新登录');
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type) && !/^video\/(mp4|webm)$/.test(file.type)) {
      setEditMsg('背景仅支持图片/gif/mp4/webm');
      return;
    }
    setEditMsg('背景上传中...');
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`/api/user/profile/${userId}/background`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.data && res.data.code === 200 && res.data.data) {
        setEditMsg('背景上传成功');
        // 上传成功后刷新用户信息
        axios.get(`/api/user/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res2 => {
          if (res2.data && res2.data.code === 200 && res2.data.data) {
            setProfile(res2.data.data);
            localStorage.setItem('backgroundUrl', res2.data.data.backgroundUrl || '');
            window.dispatchEvent(new Event('auth-changed'));
          }
        });
      } else {
        setEditMsg(res.data?.msg || res.data?.message || '背景上传失败');
      }
    } catch {
      setEditMsg('背景上传异常');
    }
  };

  return (
    <div
      className="profilepanel-container selfspace-profilepanel-container"
      style={{ width: panelWidth, height: panelHeight }}
      ref={containerRef}
      onMouseLeave={handleMouseLeave}
    >
      {panels.map((idx) => {
        const isFirst = idx === 0;
        const isActive = hoverIdx === idx;
        const direction = idx > hoverIdx ? 'down' : 'up';

        if (isFirst) {
          return (
            <div
              key={idx}
              className={`profilepanel-section${isActive ? ' profilepanel-section-active' : ''}`}
              style={{
                height: getPanelHeight(idx),
                minHeight: getPanelHeight(idx),
                position: 'relative',
                overflow: 'hidden',
                background: 'transparent',
              }}
              onMouseEnter={() => setHoverIdx(idx)}
            >
              <div className={`profilepanel-content${isActive ? ' profilepanel-content-active' : ' profilepanel-content-collapsed'}`}>
                {/* 用户背景作为第一模块背景 */}
                {profile.backgroundUrl && (
                  /\.(mp4|webm)$/i.test(profile.backgroundUrl)
                    ? (
                      <video
                        src={resolveUrl(profile.backgroundUrl)}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="profilepanel-bg-video"
                        style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
                      />
                    ) : (
                      <img
                        src={resolveUrl(profile.backgroundUrl)}
                        alt="背景"
                        className="profilepanel-bg-img"
                        style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
                      />
                    )
                )}
                <div className="profilepanel-empty-panel" style={{ position: 'relative', zIndex: 1 }} />
              </div>
            </div>
          );
        }

        // 第四个模块：用户信息编辑
        if (idx === 3) {
          return (
            <div
              key={idx}
              className={`profilepanel-section profilepanel-scroll-section${isActive ? ' profilepanel-section-active' : ''}`}
              style={{ height: getPanelHeight(idx), minHeight: getPanelHeight(idx) }}
              onMouseEnter={() => setHoverIdx(idx)}
            >
              <div
                className={
                  `profilepanel-content profilepanel-scroll-content${
                    isActive ? ' profilepanel-scroll-active' : ' profilepanel-scroll-collapsed'
                  } profilepanel-scroll-${direction}`
                }
              >
                {isActive ? (
                  <div className="profilepanel-useredit-panel">
                    <h4>编辑个人信息</h4>
                    {editLoading ? <div>加载中...</div> : (
                      <form
                        className="profilepanel-useredit-form"
                        onSubmit={e => { e.preventDefault(); handleProfileSave(); }}
                      >
                        <div className="form-group">
                          <label>昵称：</label>
                          <input name="nickname" value={profile.nickname || ''} onChange={handleProfileChange} />
                        </div>
                        <div className="form-group">
                          <label>头像：</label>
                          <input type="file" accept="image/*,image/gif" onChange={handleAvatarUpload} style={{marginTop:4}} />
                          {profile.avatarUrl && (
                            <div className="profilepanel-avatar-preview">
                              <img
                                src={resolveUrl(profile.avatarUrl)}
                                alt="头像预览"
                                className="profilepanel-avatar-img"
                              />
                            </div>
                          )}
                        </div>
                        <div className="form-group">
                          <label>背景：</label>
                          <input type="file" accept="image/*,image/gif,video/mp4,video/webm" onChange={handleBackgroundUpload} style={{marginTop:4}} />
                          {profile.backgroundUrl && (
                            <div className="profilepanel-bg-preview">
                              {/\.(mp4|webm)$/i.test(profile.backgroundUrl)
                                  ? (
                                  <video
                                    src={resolveUrl(profile.backgroundUrl)}
                                    controls
                                    className="profilepanel-bg-video"
                                  />
                                ) : (
                                  <img
                                    src={resolveUrl(profile.backgroundUrl)}
                                    alt="背景预览"
                                    className="profilepanel-bg-img"
                                  />
                                )}
                            </div>
                          )}
                        </div>
                        <div className="form-group">
                          <label>性别：</label>
                          <select name="gender" value={profile.gender || ''} onChange={handleProfileChange}>
                            <option value="保密">保密</option>
                            <option value="男">男</option>
                            <option value="女">女</option>
                          </select>
                        </div>
                        <button type="submit" disabled={editLoading}>保存</button>
                        {editMsg && <div className="form-msg">{editMsg}</div>}
                      </form>
                    )}
                  </div>
                ) : <div className="profilepanel-empty-panel" />}
              </div>
            </div>
          );
        }

        // 其他模块保持原样
        return (
          <div
            key={idx}
            className={`profilepanel-section profilepanel-scroll-section${isActive ? ' profilepanel-section-active' : ''}`}
            style={{ height: getPanelHeight(idx), minHeight: getPanelHeight(idx) }}
            onMouseEnter={() => setHoverIdx(idx)}
          >
            <div
              className={
                `profilepanel-content profilepanel-scroll-content${
                  isActive ? ' profilepanel-scroll-active' : ' profilepanel-scroll-collapsed'
                } profilepanel-scroll-${direction}`
              }
            >
              <div className="profilepanel-empty-panel" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
