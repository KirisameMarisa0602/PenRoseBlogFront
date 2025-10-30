import React, { useState } from 'react';
import axios from 'axios';
import '../components/welcome/styles/Welcome.css';

export default function Welcome() {
  const [showRegister, setShowRegister] = useState(false);
  // 页面加载时自动填充用户名和密码
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
    nickname: '',
    gender: '',
  });
  // 记住我勾选状态
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem('rememberLogin');
  });

  // 消息内容和类型（success/error）
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'

  // 登录表单提交
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
      // 登录成功后保存token
      if (res.data.code === 200 && res.data.data) {
        localStorage.setItem('token', res.data.data);
        // 记住我：保存用户名和密码
        if (rememberMe) {
          localStorage.setItem('rememberLogin', JSON.stringify({ username: loginData.username, password: loginData.password }));
        } else {
          localStorage.removeItem('rememberLogin');
        }
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setMessage(err.response.data.message);
        setMessageType('error');
      } else {
        setMessage('网络错误，请稍后重试');
        setMessageType('error');
      }
    }
  };

  // 注册表单提交
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    // 用户名校验：5-15位，仅数字字母下划线
    if (!registerData.username.match(/^[A-Za-z0-9_]{5,15}$/)) {
      setMessage('用户名必须为5-15位，仅支持数字、字母、下划线');
      setMessageType('error');
      return;
    }
    // 密码校验：8-12位，必须包含数字和字母
    if (!registerData.password.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,12}$/)) {
      setMessage('密码必须为8-12位，且包含数字和字母，不允许其他字符');
      setMessageType('error');
      return;
    }
    // 昵称长度校验（最长25）
    if (registerData.nickname.length > 25) {
      setMessage('昵称不能超过25个字符');
      setMessageType('error');
      return;
    }
    // 性别校验（可选）
    if (registerData.gender && !['男', '女', '保密'].includes(registerData.gender)) {
      setMessage('性别只能为男、女或保密');
      setMessageType('error');
      return;
    }
    // 两次密码一致性校验
    if (registerData.password !== registerData.confirmPassword) {
      setMessage('两次密码不一致');
      setMessageType('error');
      return;
    }
    try {
      const res = await axios.post('/api/user/register', {
        username: registerData.username,
        password: registerData.password,
        nickname: registerData.nickname,
        gender: registerData.gender
      });
  setMessage(res.data.msg);
  setMessageType(res.data.code === 200 ? 'success' : 'error');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setMessage(err.response.data.message);
        setMessageType('error');
      } else {
        setMessage('网络错误，请稍后重试');
        setMessageType('error');
      }
    }
  };

  return (
    <div className="container">
      <div className="welcome">
  <div className={`pinkbox${showRegister ? ' show-register' : ''}` }>
          {/* 注册 */}
          <div className={`signup${showRegister ? '' : ' nodisplay'}`}>
            <h1>Register</h1>
            <form autoComplete="off" onSubmit={handleRegister}>
              <input type="text" placeholder="Username" value={registerData.username} onChange={e => setRegisterData({ ...registerData, username: e.target.value })} />
              <input type="password" placeholder="Password" value={registerData.password} onChange={e => setRegisterData({ ...registerData, password: e.target.value })} />
              <input type="password" placeholder="Confirm Password" value={registerData.confirmPassword} onChange={e => setRegisterData({ ...registerData, confirmPassword: e.target.value })} />
              <input type="text" placeholder="Nickname (最长25字)" value={registerData.nickname} onChange={e => setRegisterData({ ...registerData, nickname: e.target.value })} />
              <select value={registerData.gender} onChange={e => setRegisterData({ ...registerData, gender: e.target.value })} className="gender-select">
                <option value="">选择性别</option>
                <option value="男">男</option>
                <option value="女">女</option>
                <option value="保密">保密</option>
              </select>

              <button className="button submit" type="submit">Create Account</button>
            </form>
          </div>
          {/* 登录 */}
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
          {/* 错误/成功提示信息，样式区分 */}
          {message && (
            <p className={`form-message ${messageType === 'error' ? 'error-message' : messageType === 'success' ? 'success-message' : ''}`}>{message}</p>
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
