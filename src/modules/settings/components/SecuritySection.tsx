import React, { useState } from 'react';
import { useStore } from '../../../store';
import { Clock, Lock, Shield, Check } from 'lucide-react';
import { SectionHeader, SettingsCard, SettingRow, Divider, ToggleSwitch } from './shared';

const SecuritySection: React.FC = () => {
  const settings = useStore(state => state.settings);
      const updateSettings = useStore(state => state.updateSettings);
      const currentUserId = useStore(state => state.currentUserId);
      const users = useStore(state => state.users);
  const currentUser = users.find(u => u.id === currentUserId);
  const isAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  const [localSettings, setLocalSettings] = useState({
    sessionTimeout: settings.sessionTimeout,
    forceLogoutOnClose: settings.forceLogoutOnClose,
    passwordMinLength: settings.passwordMinLength,
    requireNumbers: settings.requireNumbers,
    requireSpecialChars: settings.requireSpecialChars,
    twoFactor: settings.twoFactor,
    ipWhitelist: settings.ipWhitelist,
    ipWhitelistText: settings.ipWhitelistText,
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!isAdmin) return;
    if (localSettings.ipWhitelist && localSettings.ipWhitelistText.trim() !== '') {
      const ips = localSettings.ipWhitelistText.split('\n').map(ip => ip.trim()).filter(ip => ip);
      const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?:\/[0-9]{1,2})?$/;
      const invalidIps = ips.filter(ip => !ipRegex.test(ip));
      if (invalidIps.length > 0) { setError('Некорректный формат IP: ' + invalidIps.join(', ')); return; }
    }
    setError('');
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateLocal = (key: keyof typeof localSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ maxWidth: 660 }}>
      <SectionHeader title="Безопасность" subtitle="Настройки авторизации, сессий и защиты системы" />

      <SettingsCard title="Сессии" icon={Clock}>
        <SettingRow label="Время жизни сессии" description="Время бездействия до автоматического выхода (минуты)">
          <select className="form-control" style={{ maxWidth: 200 }} value={localSettings.sessionTimeout} onChange={e => updateLocal('sessionTimeout', e.target.value)} disabled={!isAdmin}>
            <option value="60">1 час</option>
            <option value="480">8 часов</option>
            <option value="1440">24 часа</option>
            <option value="10080">7 дней</option>
          </select>
        </SettingRow>
        <Divider />
        <SettingRow label="Всегда запрашивать пароль" description="Принудительно разлогинивать при закрытии вкладки">
          <ToggleSwitch value={localSettings.forceLogoutOnClose} onChange={val => updateLocal('forceLogoutOnClose', val)} disabled={!isAdmin} />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Пароли" icon={Lock}>
        <SettingRow label="Минимальная длина пароля" description="Количество символов">
          <select className="form-control" style={{ maxWidth: 120 }} value={localSettings.passwordMinLength} onChange={e => updateLocal('passwordMinLength', e.target.value)} disabled={!isAdmin}>
            <option value="6">6</option>
            <option value="8">8</option>
            <option value="12">12</option>
            <option value="16">16</option>
          </select>
        </SettingRow>
        <Divider />
        <SettingRow label="Требовать цифры" description="Пароль должен содержать минимум одну цифру">
          <ToggleSwitch value={localSettings.requireNumbers} onChange={val => updateLocal('requireNumbers', val)} disabled={!isAdmin} />
        </SettingRow>
        <Divider />
        <SettingRow label="Спецсимволы" description="Пароль должен содержать минимум один спецсимвол">
          <ToggleSwitch value={localSettings.requireSpecialChars} onChange={val => updateLocal('requireSpecialChars', val)} disabled={!isAdmin} />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Дополнительная защита" icon={Shield}>
        <SettingRow label="Двухфакторная аутентификация" description="Обязательная 2FA для всех администраторов">
          <ToggleSwitch value={localSettings.twoFactor} onChange={val => updateLocal('twoFactor', val)} disabled={!isAdmin} />
        </SettingRow>
        <Divider />
        <SettingRow label="Белый список IP" description="Разрешить вход только с определённых IP-адресов">
          <ToggleSwitch value={localSettings.ipWhitelist} onChange={val => updateLocal('ipWhitelist', val)} disabled={!isAdmin} />
        </SettingRow>
        {localSettings.ipWhitelist && (
          <div style={{ marginTop: 12 }}>
            <textarea
              className="form-control"
              style={{ minHeight: 80, fontSize: 12, fontFamily: 'monospace', resize: 'vertical', borderColor: error ? '#ef4444' : undefined }}
              placeholder={'192.168.1.0/24\n10.0.0.1'}
              value={localSettings.ipWhitelistText}
              onChange={e => updateLocal('ipWhitelistText', e.target.value)}
              disabled={!isAdmin}
            />
            <p style={{ fontSize: 11, color: error ? '#ef4444' : 'var(--text-muted)', marginTop: 4 }}>
              {error || 'Каждый IP/CIDR с новой строки'}
            </p>
          </div>
        )}
      </SettingsCard>

      <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: 8 }} disabled={!isAdmin}>
        {saved ? <><Check size={14} /> Сохранено</> : 'Сохранить изменения'}
      </button>
    </div>
  );
};

export default SecuritySection;
