import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import '../styles/welcome/Welcome.css';

export default function Welcome() {
  const navigate = useNavigate();
  const [showRegister, setShowRegister] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem('rememberLogin');
  });
  const [loginData, setLoginData] = useState(() => {
    const saved = localStorage.getItem('rememberLogin');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { username: '', password: '' };
      }
    }
    return { username: '', password: '' };
  });
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    gender: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 2000);
    return () => clearTimeout(timer);
  }, [message]);
  const genderItems = [
    { key: '男', img: '/imgs/loginandwelcomepanel/1.png' },
    { key: '女', img: '/imgs/loginandwelcomepanel/2.png' },
    { key: '保密', img: '/imgs/loginandwelcomepanel/3.png' },
  ];
  const selectedGenderIndex = Math.max(0, genderItems.findIndex(g => g.key === registerData.gender));

  // 登录逻辑
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    try {
      const res = await axios.post('/api/user/login', {
        username: loginData.username,
        password: loginData.password
      });
      setMessage(res.data.msg);
      setMessageType(res.data.code === 200 ? 'success' : 'error');
      if (res.data.code === 200 && res.data.data) {
        let token = res.data.data;
        // 兼容后端返回对象或字符串
        if (typeof token === 'object' && token !== null && token.token) {
          token = token.token;
        }
        // 登录成功后强制清理 localStorage，避免多账号残留
        localStorage.clear();
        localStorage.setItem('token', token);

        // 解析 userId（假设JWT里有userId、id或sub字段）
        let userId = null;
        try {
          const payload = jwtDecode(token);
          userId = payload.userId || payload.id || payload.sub || null;
        } catch {
          // 解析失败
        }

        // 存储 userId，确保后续页面可用
        if (userId) {
          localStorage.setItem('userId', userId);
          try {
            const profileRes = await axios.get(`/api/user/profile/${userId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (profileRes.data && profileRes.data.data) {
              const profile = profileRes.data.data;
              localStorage.setItem('nickname', profile.nickname || '');
              localStorage.setItem('avatarUrl', profile.avatarUrl || '');
              localStorage.setItem('backgroundUrl', profile.backgroundUrl || '');
              localStorage.setItem('gender', profile.gender || '');
            }
          } catch {
            // 获取用户信息失败，忽略
          }
        }

        // 通知应用内其他组件刷新登录态
        window.dispatchEvent(new Event('auth-changed'));
        if (rememberMe) {
          localStorage.setItem('rememberLogin', JSON.stringify({ username: loginData.username, password: loginData.password }));
        } else {
          localStorage.removeItem('rememberLogin');
        }
        navigate('/home');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setMessage(err.response.data.message);
        setMessageType('error');
      } else {
        setMessage('服务器错误');
        setMessageType('error');
      }
    }
  };

  // 注册逻辑
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    if (!registerData.username.match(/^[A-Za-z0-9_]{5,15}$/)) {
      setMessage('用户名必须为5-15位，仅支持数字、字母、下划线');
      setMessageType('error');
      return;
    }
    if (!registerData.password.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,12}$/)) {
      setMessage('密码必须为8-12位，且包含数字和字母，不允许其他字符');
      setMessageType('error');
      return;
    }
    if (registerData.gender && !['男', '女', '保密'].includes(registerData.gender)) {
      setMessage('性别只能为男、女或保密');
      setMessageType('error');
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setMessage('两次密码不一致');
      setMessageType('error');
      return;
    }
    try {
      const res = await axios.post('/api/user/register', {
        username: registerData.username,
        password: registerData.password,
        gender: registerData.gender
      });
      setMessage(res.data.msg);
      setMessageType(res.data.code === 200 ? 'success' : 'error');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setMessage(err.response.data.message);
        setMessageType('error');
      } else {
        setMessage('服务器错误');
        setMessageType('error');
      }
    }
  };

  return (
    <div className="container">
      <div className="welcome">
        <div className={`pinkbox${showRegister ? ' show-register' : ''}`}>  
          <div className={`signup${showRegister ? '' : ' nodisplay'}`}>
            <h1>Register</h1>
            <form autoComplete="off" onSubmit={handleRegister}>
              <div className="form-grid">
                <div className="form-fields">
                  <input type="text" placeholder="Username" value={registerData.username} onChange={e => setRegisterData({ ...registerData, username: e.target.value })} />
                  <input type="password" placeholder="Password" value={registerData.password} onChange={e => setRegisterData({ ...registerData, password: e.target.value })} />
                  <input type="password" placeholder="Confirm Password" value={registerData.confirmPassword} onChange={e => setRegisterData({ ...registerData, confirmPassword: e.target.value })} />
                </div>
                <div className="form-gender">
                  <div className="gender-selector" role="group" aria-label="Gender">
                    <div className="gender-top">
                      <ul className="gender-main" style={{ left: `${selectedGenderIndex * -100}%` }}>
                        {genderItems.map(item => (
                          <li key={item.key}>
                            <div className="gender-figure">
                              <img src={item.img} alt={item.key} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <ul className="gender-bottom">
                      {genderItems.map((item, idx) => (
                        <li key={item.key} className={`gender-item${selectedGenderIndex === idx ? ' active' : ''}`}>
                          <button
                            type="button"
                            className="gender-btn"
                            onClick={() => setRegisterData({ ...registerData, gender: item.key })}
                            aria-pressed={selectedGenderIndex === idx}
                            aria-label={item.key}
                          >
                            <img src={item.img} alt={item.key} />
                            <span className="gender-text">{item.key}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <button className="button submit" type="submit">Create Account</button>
            </form>
          </div>
          <div className={`signin${showRegister ? ' nodisplay' : ''}`}>
            <h1>Sign In</h1>
            <form className="more-padding" autoComplete="off" onSubmit={handleLogin}>
              <input type="text" placeholder="Username" value={loginData.username} onChange={e => setLoginData({ ...loginData, username: e.target.value })} />
              <input type="password" placeholder="Password" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
              <div className="checkbox">
                <input type="checkbox" id="remember" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                <label htmlFor="remember">Remember Me</label>
              </div>
              <button className="button sumbit" type="submit">Login</button>
            </form>
          </div>
          {message && (
            <p
              role="alert"
              aria-live="polite"
              className={`form-message ${messageType === 'error' ? 'error-message' : messageType === 'success' ? 'success-message' : ''}`}
            >
              {message}
            </p>
          )}
        </div>
        <div className="leftbox">
          <h2 className="title"><span>BLOOM</span>&<br />BOUQUET</h2>
          <p className="desc">Pick your perfect <span>bouquet</span></p>
          <img className="flower smaller" src="/imgs/loginandwelcomepanel/flower01.png" alt="flower" />
          <p className="account">Have an account?</p>
          <button className="button" onClick={() => setShowRegister(false)}>Login</button>
        </div>
        <div className="rightbox">
          <h2 className="title"><span>BLOOM</span>&<br />BOUQUET</h2>
          <p className="desc">Pick your perfect <span>bouquet</span></p>
          <img className="flower" src="/imgs/loginandwelcomepanel/flower02.png" alt="flower" />
          <p className="account">Don't have an account?</p>
          <button className="button" onClick={() => setShowRegister(true)}>Sign Up</button>
        </div>
      </div>
    </div>
  );
}
