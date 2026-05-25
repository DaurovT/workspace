import React, { useState } from 'react';
import { useStore } from '../../../store';
import { Building2, Globe, Check } from 'lucide-react';
import { SectionHeader, SettingsCard, SettingRow, Divider } from './shared';

const GeneralSection: React.FC = () => {
  const settings = useStore(state => state.settings);
      const updateSettings = useStore(state => state.updateSettings);
      const currentUserId = useStore(state => state.currentUserId);
      const users = useStore(state => state.users);
  const currentUser = users.find(u => u.id === currentUserId);
  const isAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  const [localSettings, setLocalSettings] = useState({
    companyName: settings.companyName,
    domain: settings.domain,
    timezone: settings.timezone,
    language: settings.language,
    workWeekStart: settings.workWeekStart,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!isAdmin) return;
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateLocal = (key: keyof typeof localSettings, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ maxWidth: 660 }}>
      <SectionHeader title="Общие настройки" subtitle="Основная информация о вашей организации" />

      <SettingsCard title="Организация" icon={Building2}>
        <SettingRow label="Название компании" description="Отображается в заголовке системы">
          <input className="form-control" style={{ maxWidth: 320 }} value={localSettings.companyName} onChange={e => updateLocal('companyName', e.target.value)} disabled={!isAdmin} />
        </SettingRow>
        <Divider />
        <SettingRow label="Домен" description="Корпоративный домен для приглашений">
          <input className="form-control" style={{ maxWidth: 320 }} value={localSettings.domain} onChange={e => updateLocal('domain', e.target.value)} disabled={!isAdmin} />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Региональные настройки" icon={Globe}>
        <SettingRow label="Часовой пояс" description="Используется для дат и дедлайнов">
          <select className="form-control" style={{ maxWidth: 240 }} value="Asia/Tashkent" disabled>
            <option value="Asia/Tashkent">Ташкент (UTC+5)</option>
          </select>
        </SettingRow>
        <Divider />
        <SettingRow label="Язык интерфейса" description="Язык для всех пользователей">
          <select className="form-control" style={{ maxWidth: 240 }} value="ru" disabled>
            <option value="ru">Русский</option>
          </select>
        </SettingRow>
        <Divider />
        <SettingRow label="Рабочая неделя" description="Начало рабочей недели">
          <select className="form-control" style={{ maxWidth: 240 }} value={localSettings.workWeekStart} onChange={e => updateLocal('workWeekStart', e.target.value)} disabled={!isAdmin}>
            <option value="Понедельник">Понедельник</option>
            <option value="Воскресенье">Воскресенье</option>
          </select>
        </SettingRow>
      </SettingsCard>

      <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: 8 }} disabled={!isAdmin}>
        {saved ? <><Check size={14} /> Сохранено</> : 'Сохранить изменения'}
      </button>
    </div>
  );
};

export default GeneralSection;
