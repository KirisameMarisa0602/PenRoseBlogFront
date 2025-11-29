import { useEffect, useState } from 'react';
import resolveUrl from '../utils/resolveUrl';

/**
 * useAuthState
 * - 从 localStorage 读取登录状态与头像地址
 * - 监听 storage 与自定义 auth-changed 事件以便跨组件/页面及时刷新
 */
export function useAuthState() {
  const read = () => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    const rawAvatar = typeof localStorage !== 'undefined' ? (localStorage.getItem('avatarUrl') || '') : '';
    const nickname = typeof localStorage !== 'undefined' ? (localStorage.getItem('nickname') || '') : '';
    const gender = typeof localStorage !== 'undefined' ? (localStorage.getItem('gender') || 'other') : 'other';
    const rawBackground = typeof localStorage !== 'undefined' ? (localStorage.getItem('backgroundUrl') || '') : '';
    const avatar = rawAvatar ? resolveUrl(rawAvatar) : '';
    const backgroundUrl = rawBackground ? resolveUrl(rawBackground) : '';
    return {
      isLoggedIn: !!token,
      user: {
        avatar,
        nickname,
        gender,
        backgroundUrl,
      },
    };
  };

  const [{ isLoggedIn, user }, setState] = useState(read);

  useEffect(() => {
    const onStorage = (e) => {
      if (!e || (e.key !== null && !['token', 'avatarUrl', 'nickname', 'gender', 'backgroundUrl'].includes(e.key))) return;
      setState(read());
    };
    const onAuthChanged = () => setState(read());
    window.addEventListener('storage', onStorage);
    window.addEventListener('auth-changed', onAuthChanged);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth-changed', onAuthChanged);
    };
  }, []);

  // 退出登录
  const logout = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('avatarUrl');
      localStorage.removeItem('nickname');
      localStorage.removeItem('gender');
      localStorage.removeItem('backgroundUrl');
    }
    window.dispatchEvent(new Event('auth-changed'));
  };

  return { isLoggedIn, user, logout };
}
