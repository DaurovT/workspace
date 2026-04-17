import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Briefcase, CreditCard, ShoppingBag, GraduationCap, Wifi, Battery, Search, User, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const OSDesktop: React.FC = () => {
  const { setActiveApp, setActivePage } = useStore();
  const [time, setTime] = useState(new Date());
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const apps = [
    {
      id: 'workspace',
      name: 'WorkSpace Pro',
      icon: <Briefcase size={32} color="#fff" />,
      color: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      onClick: () => { setActiveApp('workspace'); setActivePage('dashboard'); }
    },
    {
      id: 'kidsplate',
      name: 'Kids Plate',
      icon: <ShoppingBag size={32} color="#fff" />,
      color: 'linear-gradient(135deg, #f59e0b, #d97706)',
      onClick: () => alert('В разработке')
    },
    {
      id: 'lms',
      name: 'LMS Academy',
      icon: <GraduationCap size={32} color="#fff" />,
      color: 'linear-gradient(135deg, #ef4444, #b91c1c)',
      onClick: () => alert('В разработке')
    },
    {
      id: 'profile',
      name: 'Мой профиль',
      icon: <User size={32} color="#fff" />,
      color: 'linear-gradient(135deg, #a855f7, #7e22ce)',
      onClick: () => setShowProfile(true)
    }
  ];


  return (
    <div className="os-desktop">
      {/* ── Status Bar ── */}
      <div className="os-status-bar">
        <div className="os-status-left">
          <span></span>
          <span style={{ fontWeight: 600 }}>OS Launcher</span>
        </div>
        <div className="os-status-right">
          <Wifi size={14} />
          <Battery size={14} />
          <span>{format(time, 'd MMM HH:mm', { locale: ru })}</span>
        </div>
      </div>

      {/* ── Desktop Canvas ── */}
      <div className="os-desktop-canvas">
        <div className="os-app-grid">
          {apps.map(app => (
            <div key={app.id} className="os-app-icon-wrapper" onClick={app.onClick}>
              <div className="os-app-icon" style={{ background: app.color }}>
                {app.icon}
              </div>
              <span className="os-app-label">{app.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* ── Dock (Optional) ── */}
      <div className="os-dock-wrapper">
        <div className="os-dock">
          {apps.map(app => (
            <div key={`dock-${app.id}`} className="os-dock-icon" style={{ background: app.color }} onClick={app.onClick} title={app.name}>
              {React.cloneElement(app.icon as React.ReactElement, { size: 24 })}
            </div>
          ))}
          <div className="os-dock-divider" />
          <div className="os-dock-icon" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <Search size={22} color="#fff" />
          </div>
        </div>
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
};

const ProfileModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentUserId, users, updateUser } = useStore();
  const currentUser = users.find(u => u.id === currentUserId);
  
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [jobTitle, setJobTitle] = useState(currentUser?.jobTitle || '');
  const [color, setColor] = useState(currentUser?.color || '#6366f1');
  
  if (!currentUser) return null;

  const AVATAR_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#38bdf8', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];
  const avatarInitials = name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || currentUser.avatar;

  const handleSave = () => {
    updateUser(currentUserId, { name: name.trim(), email: email.trim(), jobTitle: jobTitle.trim(), color, avatar: avatarInitials });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ zIndex: 1000 }}>
      <div className="modal" style={{ maxWidth: 400, background: 'rgba(30,30,40,0.85)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 className="modal-title" style={{ color: '#fff' }}>Мой профиль</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ color: '#fff' }}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 24, background: color, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              {avatarInitials}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {AVATAR_COLORS.map(c => (
                <div key={c} onClick={() => setColor(c)} style={{ width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '2px solid #fff' : '2px solid transparent', transition: 'all 0.2s' }} />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }} htmlFor="profile-name">Имя и фамилия</label>
            <input id="profile-name" name="profile-name" className="form-control" style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }} htmlFor="profile-email">Email</label>
            <input id="profile-email" name="profile-email" className="form-control" style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }} htmlFor="profile-jobtitle">Должность</label>
            <input id="profile-jobtitle" name="profile-jobtitle" className="form-control" style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none' }} onClick={onClose}>Отмена</button>
            <button className="btn btn-primary" onClick={handleSave}><Check size={14} /> Сохранить</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OSDesktop;
