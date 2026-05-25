import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './tms.css';
import {
  typeLabels, typeColors, statusLabels, statusColors,
  routeStatusColors, type TMSLocation
} from './tmsData';
import { useTmsStore } from './tmsStore';
import { useStore } from '../../store';
import {
  ArrowLeft, X, MapPin, Phone, Clock, User, Truck, Package,
  ChevronDown, Navigation, Warehouse, Building2, Store, Factory, Coffee, Edit2, Save, Image as ImageIcon, Utensils, CupSoda
} from 'lucide-react';

// ─── Fix default Leaflet icon path ───────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Custom Marker Icon Creator ──────────────────────────────────────────────
const createMarkerIcon = (type: TMSLocation['type'], status: TMSLocation['status']) => {
  const color = typeColors[type];
  const statusColor = statusColors[status];
  const iconSvg: Record<TMSLocation['type'], string> = {
    warehouse: `<rect x="6" y="10" width="12" height="8" rx="1" fill="white"/><path d="M4 10L12 4L20 10" stroke="white" stroke-width="2" fill="none"/>`,
    distribution: `<rect x="5" y="8" width="14" height="10" rx="1" fill="white"/><rect x="8" y="12" width="3" height="6" fill="${color}"/><rect x="13" y="10" width="3" height="3" rx="0.5" fill="${color}"/>`,
    retail: `<rect x="6" y="8" width="12" height="10" rx="1" fill="white"/><rect x="8" y="12" width="8" height="6" rx="0.5" fill="${color}"/><path d="M6 8L12 4L18 8" stroke="white" stroke-width="1.5" fill="none"/>`,
    office: `<rect x="7" y="6" width="10" height="12" rx="1" fill="white"/><rect x="9" y="8" width="2" height="2" fill="${color}"/><rect x="13" y="8" width="2" height="2" fill="${color}"/><rect x="9" y="12" width="2" height="2" fill="${color}"/><rect x="13" y="12" width="2" height="2" fill="${color}"/>`,
    factory: `<rect x="4" y="10" width="7" height="8" rx="0.5" fill="white"/><rect x="13" y="6" width="7" height="12" rx="0.5" fill="white"/><rect x="15" y="2" width="2" height="4" fill="white"/>`,
    canteen: `<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 2l-1.2 6.8A3 3 0 0 1 16.8 11H16M16.5 21 16 11" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    cafe: `<path d="M17 8h1a4 4 0 1 1 0 8h-1" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 2v2" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M10 2v2" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M14 2v2" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
    buffet: `<path d="m8 8 4-4 4 4M12 4v16" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 12h16M4 16h16" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
  };

  const html = `
    <div style="
      width: 44px; height: 44px; border-radius: 50%;
      background: ${color}; border: 3px solid rgba(255,255,255,0.9);
      box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 0 3px ${color}33;
      display: flex; align-items: center; justify-content: center;
      position: relative; cursor: pointer;
      transition: transform 0.2s;
    ">
      <svg width="24" height="24" viewBox="0 0 24 24">${iconSvg[type]}</svg>
      <div style="
        position: absolute; bottom: -2px; right: -2px;
        width: 12px; height: 12px; border-radius: 50%;
        background: ${statusColor};
        border: 2px solid rgba(10,10,20,0.9);
      "></div>
    </div>
    <div style="
      position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%);
      width: 0; height: 0;
      border-left: 7px solid transparent; border-right: 7px solid transparent;
      border-top: 8px solid rgba(255,255,255,0.9);
    "></div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52]
  });
};

// ─── Auto-fit Map on Load ────────────────────────────────────────────────────
const FitBounds: React.FC<{ locations: TMSLocation[] }> = ({ locations }) => {
  const map = useMap();
  useEffect(() => {
    if (locations.length === 0) return;
    const bounds = L.latLngBounds(locations.map(l => [l.lat, l.lng]));
    map.fitBounds(bounds.pad(0.15));
  }, [map, locations]);
  return null;
};

// ─── Type Icons ──────────────────────────────────────────────────────────────
const TypeIcon: React.FC<{ type: TMSLocation['type']; size?: number }> = ({ type, size = 14 }) => {
  switch (type) {
    case 'warehouse': return <Warehouse size={size} />;
    case 'distribution': return <Package size={size} />;
    case 'retail': return <Store size={size} />;
    case 'office': return <Building2 size={size} />;
    case 'factory': return <Factory size={size} />;
    case 'canteen': return <Utensils size={size} />;
    case 'cafe': return <Coffee size={size} />;
    case 'buffet': return <CupSoda size={size} />;
  }
};

// ─── Location Detail Panel ───────────────────────────────────────────────────
const LocationDetail: React.FC<{ 
  location: TMSLocation; 
  onClose: () => void;
  isAdmin: boolean;
}> = ({ location, onClose, isAdmin }) => {
  const { routes, updateLocation } = useTmsStore();
  const [isEditing, setIsEditing] = useState(false);
  
  const [form, setForm] = useState({
    photo: location.photo || '',
    manager: location.manager || '',
    workingHours: location.workingHours || '',
    description: location.description || ''
  });

  // Reset form when location changes
  useEffect(() => {
    setForm({
      photo: location.photo || '',
      manager: location.manager || '',
      workingHours: location.workingHours || '',
      description: location.description || ''
    });
    setIsEditing(false);
  }, [location]);

  const handleSave = () => {
    updateLocation(location.id, form);
    setIsEditing(false);
  };

  const connectedRoutes = routes.filter(r => r.fromId === location.id || r.toId === location.id);
  const capacityColor = location.capacityPercent > 80 ? '#ef4444' : location.capacityPercent > 60 ? '#f59e0b' : '#22c55e';

  return (
    <div className="tms-detail-overlay">
      <div className="tms-detail-backdrop" onClick={onClose} />
      <div className="tms-detail-panel">
        <button className="tms-detail-close" onClick={onClose}>
          <X size={16} />
        </button>

        {isEditing ? (
          <div style={{ height: 260, background: 'rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <ImageIcon size={32} color="rgba(255,255,255,0.2)" style={{ marginBottom: 10 }} />
            <div style={{ width: '100%' }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>URL Фотографии (напр. https://...)</label>
              <input 
                type="text" 
                value={form.photo} 
                onChange={e => setForm({ ...form, photo: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }}
                placeholder="Вставьте ссылку на изображение"
              />
            </div>
            {form.photo && (
               <div style={{ marginTop: 10, fontSize: 11, color: '#34d399' }}>Изображение прикреплено</div>
            )}
          </div>
        ) : (
          location.photo ? (
            <img src={location.photo} alt={location.name} className="tms-detail-photo" />
          ) : (
            <div style={{ height: 160, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
              <ImageIcon size={48} />
            </div>
          )
        )}

        <div className="tms-detail-body">
          {/* Header Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div
              className="tms-detail-type-badge"
              style={{
                background: `${typeColors[location.type]}20`,
                color: typeColors[location.type],
                border: `1px solid ${typeColors[location.type]}30`,
                margin: 0
              }}
            >
              <TypeIcon type={location.type} size={12} />
              {typeLabels[location.type]}
            </div>
            
            {isAdmin && (
              isEditing ? (
                <button 
                  onClick={handleSave}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Save size={14} /> Сохранить
                </button>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Edit2 size={14} /> Редактировать
                </button>
              )
            )}
          </div>

          {/* Name */}
          <h2 className="tms-detail-name">{location.name}</h2>

          {/* Address */}
          <div className="tms-detail-address">
            <MapPin size={13} />
            {location.address}
          </div>

          {/* Status */}
          <div
            className="tms-detail-status"
            style={{
              background: `${statusColors[location.status]}15`,
              color: statusColors[location.status],
              border: `1px solid ${statusColors[location.status]}30`
            }}
          >
            <div className="tms-detail-status-dot" style={{ background: statusColors[location.status] }} />
            {statusLabels[location.status]}
          </div>

          {/* Description */}
          {isEditing ? (
             <div style={{ marginBottom: 24 }}>
               <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Описание</label>
               <textarea 
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', minHeight: 80, padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, resize: 'vertical' }}
                  placeholder="Введите описание объекта..."
               />
             </div>
          ) : (
             <div className="tms-detail-desc">{location.description}</div>
          )}

          {/* Stats Grid */}
          <div className="tms-detail-grid">
            <div className="tms-detail-card">
              <div className="tms-detail-card-label">Доставки сегодня</div>
              <div className="tms-detail-card-value">{location.stats.todayDeliveries}</div>
              <div className="tms-detail-card-sub">за неделю: {location.stats.weekDeliveries}</div>
            </div>
            <div className="tms-detail-card">
              <div className="tms-detail-card-label">Ср. время загрузки</div>
              <div className="tms-detail-card-value">{location.stats.avgLoadTime}</div>
              <div className="tms-detail-card-sub">последняя: {location.lastDelivery}</div>
            </div>
            <div className="tms-detail-card">
              <div className="tms-detail-card-label">ТС на точке</div>
              <div className="tms-detail-card-value">{location.vehiclesAtSite}</div>
              <div className="tms-detail-card-sub">автомобилей</div>
            </div>
            <div className="tms-detail-card">
              <div className="tms-detail-card-label">Загрузка</div>
              <div className="tms-detail-card-value" style={{ color: capacityColor }}>
                {location.capacityPercent}%
              </div>
              <div className="tms-capacity-bar">
                <div
                  className="tms-capacity-bar-fill"
                  style={{ width: `${location.capacityPercent}%`, background: capacityColor }}
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="tms-detail-section-title">Информация</div>
          <div className="tms-detail-info-row">
            <div className="tms-detail-info-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
              <User size={16} />
            </div>
            <div className="tms-detail-info-text">
              <div className="tms-detail-info-label">Имя старшего на объекте</div>
              {isEditing ? (
                <input 
                  type="text" 
                  value={form.manager}
                  onChange={e => setForm({ ...form, manager: e.target.value })}
                  style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 6px', color: '#fff', fontSize: 13, borderRadius: 4 }}
                  placeholder="Имя старшего"
                />
              ) : (
                <div className="tms-detail-info-value">{location.manager || 'Не назначен'}</div>
              )}
            </div>
          </div>
          <div className="tms-detail-info-row">
            <div className="tms-detail-info-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
              <Phone size={16} />
            </div>
            <div className="tms-detail-info-text">
              <div className="tms-detail-info-label">Телефон</div>
              <div className="tms-detail-info-value">{location.phone || '—'}</div>
            </div>
          </div>
          <div className="tms-detail-info-row" style={{ marginBottom: 24 }}>
            <div className="tms-detail-info-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
              <Clock size={16} />
            </div>
            <div className="tms-detail-info-text">
              <div className="tms-detail-info-label">График работы</div>
              {isEditing ? (
                <input 
                  type="text" 
                  value={form.workingHours}
                  onChange={e => setForm({ ...form, workingHours: e.target.value })}
                  style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 6px', color: '#fff', fontSize: 13, borderRadius: 4 }}
                  placeholder="Например: 08:00 - 20:00"
                />
              ) : (
                <div className="tms-detail-info-value">{location.workingHours || 'Не заполнен'}</div>
              )}
            </div>
          </div>

          {/* Connected Routes */}
          {connectedRoutes.length > 0 && (
            <>
              <div className="tms-detail-section-title">Связанные маршруты ({connectedRoutes.length})</div>
              {connectedRoutes.map(route => {
                const { locations } = useTmsStore.getState();
                const fromLoc = locations.find(l => l.id === route.fromId)!;
                const toLoc = locations.find(l => l.id === route.toId)!;
                return (
                  <div key={route.id} className="tms-detail-info-row" style={{ cursor: 'default' }}>
                    <div className="tms-detail-info-icon" style={{
                      background: `${routeStatusColors[route.status]}20`,
                      color: routeStatusColors[route.status]
                    }}>
                      <Navigation size={16} />
                    </div>
                    <div className="tms-detail-info-text">
                      <div className="tms-detail-info-label">{route.vehicleName}</div>
                      <div className="tms-detail-info-value" style={{ fontSize: 12 }}>
                        {fromLoc?.name.split(' ')[0]} → {toLoc?.name.split(' ')[0]} · {route.distance} · {route.duration}
                      </div>
                    </div>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: routeStatusColors[route.status],
                      flexShrink: 0
                    }} />
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main TMS App ────────────────────────────────────────────────────────────
const TMSApp: React.FC = () => {
  const { locations, routes } = useTmsStore();
  const setActiveApp = useStore(state => state.setActiveApp);
  
  // Check admin rights
  const currentUserId = useStore(state => state.currentUserId);
  const users = useStore(state => state.users);
  const currentUser = users.find(u => u.id === currentUserId);
  const isAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  const [selectedLocation, setSelectedLocation] = useState<TMSLocation | null>(null);
  const [highlightedRoute, setHighlightedRoute] = useState<string | null>(null);
  const [routesPanelCollapsed, setRoutesPanelCollapsed] = useState(false);

  // Sync selected location if edited
  useEffect(() => {
    if (selectedLocation) {
      const updated = locations.find(l => l.id === selectedLocation.id);
      if (updated && updated !== selectedLocation) {
        setSelectedLocation(updated);
      }
    }
  }, [locations, selectedLocation]);

  // Count active routes
  const activeRoutes = routes.filter(r => r.status === 'active').length;
  const totalVehicles = locations.reduce((sum, l) => sum + l.vehiclesAtSite, 0);

  // Marker icons
  const markerIcons = useMemo(() => {
    const icons: Record<string, L.DivIcon> = {};
    locations.forEach(loc => {
      icons[loc.id] = createMarkerIcon(loc.type, loc.status);
    });
    return icons;
  }, [locations]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedLocation(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="tms-app">
      <div className="tms-map-container">
        {/* ── Map Header ── */}
        <div className="tms-map-header">
          <div className="tms-map-header-left">
            <button className="tms-map-header-back" onClick={() => setActiveApp('desktop')}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="tms-map-header-title">TMS · Транспортная система</div>
              <div className="tms-map-header-subtitle">Карта объектов и маршрутов</div>
            </div>
          </div>
          <div className="tms-map-header-stats">
            <div className="tms-header-stat">
              <div className="tms-header-stat-value">{locations.length}</div>
              <div className="tms-header-stat-label">Объектов</div>
            </div>
            <div className="tms-header-stat">
              <div className="tms-header-stat-value" style={{ color: '#818cf8' }}>{activeRoutes}</div>
              <div className="tms-header-stat-label">Маршрутов</div>
            </div>
            <div className="tms-header-stat">
              <div className="tms-header-stat-value" style={{ color: '#34d399' }}>{totalVehicles}</div>
              <div className="tms-header-stat-label">Машин</div>
            </div>
          </div>
        </div>

        {/* ── Map Legend ── */}
        <div className="tms-legend">
          <div className="tms-legend-title">Типы объектов</div>
          {(Object.keys(typeLabels) as TMSLocation['type'][]).map(type => (
            <div key={type} className="tms-legend-item">
              <div className="tms-legend-dot" style={{ background: typeColors[type], borderColor: typeColors[type] }} />
              {typeLabels[type]}
            </div>
          ))}
        </div>

        {/* ── Leaflet Map ── */}
        <MapContainer
          center={[40.23, 69.28]}
          zoom={12}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds locations={locations} />

          {/* Routes */}
          {routes.map(route => (
            <Polyline
              key={route.id}
              positions={route.waypoints}
              pathOptions={{
                color: routeStatusColors[route.status],
                weight: highlightedRoute === route.id ? 5 : 3,
                opacity: highlightedRoute && highlightedRoute !== route.id ? 0.2 : 0.7,
                dashArray: route.status === 'delayed' ? '10 6' : route.status === 'completed' ? '4 4' : undefined,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          ))}

          {/* Location Markers */}
          {locations.map(loc => (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={markerIcons[loc.id]}
              eventHandlers={{
                click: () => setSelectedLocation(loc)
              }}
            />
          ))}
        </MapContainer>

        {/* ── Routes Bottom Panel ── */}
        {routes.length > 0 && (
          <div className={`tms-routes-panel ${routesPanelCollapsed ? 'collapsed' : ''}`}>
            <div className="tms-routes-header" onClick={() => setRoutesPanelCollapsed(!routesPanelCollapsed)}>
              <div className="tms-routes-title">
                <Truck size={14} />
                Активные маршруты
                <span className="tms-routes-badge">{routes.length}</span>
              </div>
              <ChevronDown size={16} className="tms-routes-chevron" />
            </div>
            {!routesPanelCollapsed && (
              <div className="tms-routes-list">
                {routes.map(route => {
                  const fromLoc = locations.find(l => l.id === route.fromId)!;
                  const toLoc = locations.find(l => l.id === route.toId)!;
                  return (
                    <div
                      key={route.id}
                      className={`tms-route-card ${highlightedRoute === route.id ? 'active' : ''}`}
                      onMouseEnter={() => setHighlightedRoute(route.id)}
                      onMouseLeave={() => setHighlightedRoute(null)}
                    >
                      <div className="tms-route-card-header">
                        <div className="tms-route-card-vehicle">{route.vehicleName}</div>
                        <div className="tms-route-card-status" style={{ background: routeStatusColors[route.status] }} />
                      </div>
                      <div className="tms-route-card-path">
                        <MapPin size={10} />
                        {fromLoc?.name.split('«')[0].trim().split(' ').slice(0, 2).join(' ')}
                        <span style={{ color: 'rgba(255,255,255,0.25)' }}>→</span>
                        {toLoc?.name.split('«')[0].trim().split(' ').slice(0, 2).join(' ')}
                      </div>
                      <div className="tms-route-card-meta">
                        <span>{route.distance}</span>
                        <span>·</span>
                        <span>{route.duration}</span>
                      </div>
                      <div style={{
                        fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {route.cargo}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Location Detail ── */}
      {selectedLocation && (
        <LocationDetail 
          location={selectedLocation} 
          onClose={() => setSelectedLocation(null)}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default TMSApp;
