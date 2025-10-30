import React, { useState } from 'react';
import axios from 'axios';
import '../components/welcome/styles/Welcome.css';

export default function Welcome() {
  const [showRegister, setShowRegister] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    gender: '',
  });

  const [message, setMessage] = useState('');

  // 登录表单提交
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await axios.post('/api/user/login', {
        username: loginData.username,
        password: loginData.password
      });
      setMessage(res.data.message || (res.data.code === 200 ? '登录成功' : '登录失败'));
    } catch {
      setMessage('登录失败');
    }
  };

  // 注册表单提交
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    if (registerData.password !== registerData.confirmPassword) {
      setMessage('两次密码不一致');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('username', registerData.username);
      formData.append('password', registerData.password);
      formData.append('nickname', registerData.nickname);
      formData.append('gender', registerData.gender);
      const res = await axios.post('/api/user/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(res.data.message || (res.data.code === 200 ? '注册成功' : '注册失败'));
    } catch {
      setMessage('注册失败');
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
              <input type="text" placeholder="Nickname (最长15字)" value={registerData.nickname} onChange={e => setRegisterData({ ...registerData, nickname: e.target.value })} />
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
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember Me</label>
              </div>
              <button className="button sumbit" type="submit">Login</button>
            </form>
          </div>
          {message && <p className="form-message">{message}</p>}
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
