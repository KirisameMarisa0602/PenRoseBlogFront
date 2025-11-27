
import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/common/AvatarDropdown.css";


const sexIconMap = {
  男: "/icons/sex/男.svg",
  女: "/icons/sex/女.svg",
  保密: "/icons/sex/保密.svg",
};

function getSexIcon(gender) {
  if (gender === '男' || gender === '女' || gender === '保密') {
    return sexIconMap[gender];
  }
  return sexIconMap['保密'];
}

function getUserIdFallback() {
  // 尝试从 localStorage 获取 token 并解包 userId
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      let payload = null;
      try {
        payload = token.split('.')[1];
        if (payload) {
          let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) base64 += '=';
          const decoded = JSON.parse(atob(base64));
          const id = decoded.userId || decoded.id || decoded.sub;
          if (id) return id.toString();
        }
      } catch{
        // ignore
      }
    }
  }
  return '00000000';
}

export default function AvatarDropdown({ user, onLogout }) {
  const navigate = useNavigate();

  const handleSelfSpace = () => {
    navigate("/selfspace");
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/welcome");
  };

  // 昵称兜底
  const displayName = user.nickname && user.nickname.trim()
    ? user.nickname
    : `Cat_${getUserIdFallback()}`;
  // 性别图标
  const sexIcon = getSexIcon(user.gender);

  return (
    <div className="avatar-dropdown">
      <div className="dropdown-header no-avatar">
        <span className="dropdown-name">{displayName}</span>
        <img className="sex-icon" src={sexIcon} alt={user.gender} />
      </div>
      <button className="dropdown-btn" onClick={handleSelfSpace}>
        个人空间
      </button>
      <button className="dropdown-btn logout" onClick={handleLogout}>
        退出登录
      </button>
    </div>
  );
}
