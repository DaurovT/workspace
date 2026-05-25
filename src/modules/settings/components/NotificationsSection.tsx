import React, { useState } from 'react';
import { useStore } from '../../../store';
import { Mail, Smartphone, Check } from 'lucide-react';
import { SectionHeader, SettingsCard, SettingRow, Divider, ToggleSwitch } from './shared';

const NotificationsSection: React.FC = () => {
  const settings = useStore(state => state.settings);
      const updateSettings = useStore(state => state.updateSettings);
      const currentUserId = useStore(state => state.currentUserId);
      const users = useStore(state => state.users);
  const currentUser = users.find(u => u.id === currentUserId);
  const isAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  const [localSettings, setLocalSettings] = useState({
    emailAssign: settings.emailAssign,
    emailMention: settings.emailMention,
    emailDue: settings.emailDue,
    pushAll: settings.pushAll,
    digestFreq: settings.digestFreq,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!isAdmin) return;
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateLocal = (key: keyof typeof localSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ maxWidth: 660 }}>
      <SectionHeader title="Уведомления" subtitle="Настройте, как и когда пользователи получают уведомления" />

      <SettingsCard title="Email-уведомления" icon={Mail}>
        <SettingRow label="Назначение задачи" description="Отправлять email, когда задача назначена на пользователя">
          <ToggleSwitch value={localSettings.emailAssign} onChange={val => updateLocal('emailAssign', val)} disabled={!isAdmin} />
        </SettingRow>
        <Divider />
        <SettingRow label="Упоминания" description="Оповещать при @упоминании в комментариях">
          <ToggleSwitch value={localSettings.emailMention} onChange={val => updateLocal('emailMention', val)} disabled={!isAdmin} />
        </SettingRow>
        <Divider />
        <SettingRow label="Дедлайны" description="Предупреждать за 24 часа до дедлайна">
          <ToggleSwitch value={localSettings.emailDue} onChange={val => updateLocal('emailDue', val)} disabled={!isAdmin} />
        </SettingRow>
        <Divider />
        <SettingRow label="Дайджест" description="Периодический отчёт по задачам">
          <select className="form-control" style={{ maxWidth: 200 }} value={localSettings.digestFreq} onChange={e => updateLocal('digestFreq', e.target.value)} disabled={!isAdmin}>
            <option value="none">Выключен</option>
            <option value="daily">Ежедневно</option>
            <option value="weekly">Еженедельно</option>
          </select>
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Push-уведомления" icon={Smartphone}>
        <SettingRow label="Все события" description="Показывать push-уведомления в браузере">
          <ToggleSwitch value={localSettings.pushAll} onChange={val => updateLocal('pushAll', val)} disabled={!isAdmin} />
        </SettingRow>
        <Divider />
        <SettingRow label="Звук уведомлений" description="Воспроизводить звук при новых уведомлениях">
          <ToggleSwitch value={false} onChange={() => {}} disabled={!isAdmin} />
        </SettingRow>
      </SettingsCard>

      <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: 8 }} disabled={!isAdmin}>
        {saved ? <><Check size={14} /> Сохранено</> : 'Сохранить изменения'}
      </button>
    </div>
  );
};

export default NotificationsSection;
