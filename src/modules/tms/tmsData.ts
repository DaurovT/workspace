export interface TMSLocation {
  id: string;
  name: string;
  type: 'warehouse' | 'distribution' | 'retail' | 'office' | 'factory' | 'canteen' | 'buffet' | 'cafe';
  lat: number;
  lng: number;
  address: string;
  description: string;
  photo: string;
  status: 'active' | 'busy' | 'maintenance';
  manager: string;
  phone: string;
  workingHours: string;
  vehiclesAtSite: number;
  capacityPercent: number;
  lastDelivery: string;
  stats: {
    todayDeliveries: number;
    weekDeliveries: number;
    avgLoadTime: string;
  };
}

export interface TMSRoute {
  id: string;
  fromId: string;
  toId: string;
  distance: string;
  duration: string;
  status: 'active' | 'delayed' | 'completed';
  vehicleId: string;
  vehicleName: string;
  cargo: string;
  waypoints: [number, number][];
}

export const initialLocations: TMSLocation[] = [
  {
    id: 'loc-1', name: 'Буфет номер 4', type: 'buffet', lat: 40.210609, lng: 69.288485,
    address: 'Узбекистан', description: 'Описание отсутствует', photo: '', status: 'active',
    manager: 'Малика опа', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-2', name: 'Столовая 13', type: 'canteen', lat: 40.213080, lng: 69.287136,
    address: 'Узбекистан', description: 'Описание отсутствует', photo: '', status: 'active',
    manager: 'Рустам ака', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-3', name: 'Столовая 14', type: 'canteen', lat: 40.212775, lng: 69.286248,
    address: 'Узбекистан', description: 'Описание отсутствует', photo: '', status: 'active',
    manager: 'Убайдула', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-4', name: 'Столовая 10', type: 'canteen', lat: 40.225623, lng: 69.281056,
    address: 'Узбекистан', description: 'Описание отсутствует', photo: '', status: 'active',
    manager: 'Джавохир', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-5', name: 'Буфет номер 5', type: 'buffet', lat: 40.225719, lng: 69.283048,
    address: 'Узбекистан', description: 'Описание отсутствует', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-6', name: 'Столовая номер 4', type: 'canteen', lat: 40.223630, lng: 69.286885,
    address: 'Узбекистан', description: 'Описание отсутствует', photo: '', status: 'active',
    manager: 'Муроджон ака', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-7', name: 'Базальт Буфет', type: 'buffet', lat: 40.234762, lng: 69.285810,
    address: 'Узбекистан', description: 'Описание отсутствует', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-8', name: '16 столовая', type: 'canteen', lat: 40.235061, lng: 69.287929,
    address: 'Узбекистан', description: 'Описание отсутствует', photo: '', status: 'active',
    manager: 'Азиз', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-9', name: '8 столовая', type: 'canteen', lat: 40.233303, lng: 69.290500,
    address: 'Узбекистан', description: 'Описание отсутствует', photo: '', status: 'active',
    manager: 'Журат', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-10', name: '6 столовая', type: 'canteen', lat: 40.236671, lng: 69.292926,
    address: 'Узбекистан', description: 'Описание отсутствует', photo: '', status: 'active',
    manager: 'Икром', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-11', name: '9 столовая', type: 'canteen', lat: 40.239429, lng: 69.295653,
    address: 'Узбекистан', description: 'Описание отсутствует', photo: '', status: 'active',
    manager: 'Уктам', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-12', name: '1 столовая', type: 'canteen', lat: 40.239720, lng: 69.287165,
    address: 'Узбекистан', description: 'Описание отсутствует', photo: '', status: 'active',
    manager: 'Зокир', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-13', name: '2 столовая', type: 'canteen', lat: 40.243749, lng: 69.289546,
    address: 'Узбекистан', description: 'Описание отсутствует', photo: '', status: 'active',
    manager: 'Мурад', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-14', name: 'Кофетерий-Испц', type: 'cafe', lat: 40.244657, lng: 69.288278,
    address: 'Узбекистан', description: 'Описание отсутствует', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  }
];

export const initialRoutes: TMSRoute[] = [
  {
    id: 'route-1',
    fromId: 'loc-14',
    toId: 'loc-7',
    distance: '1.2 км',
    duration: '5 мин',
    status: 'active',
    vehicleId: 'v-001',
    vehicleName: 'Isuzu NQR',
    cargo: 'Продукты, напитки — 1.5 т',
    waypoints: [
      [40.244657, 69.288278],
      [40.234762, 69.285810]
    ]
  },
  {
    id: 'route-2',
    fromId: 'loc-1',
    toId: 'loc-4',
    distance: '1.8 км',
    duration: '7 мин',
    status: 'active',
    vehicleId: 'v-002',
    vehicleName: 'Labo',
    cargo: 'Хлебобулочные изделия — 0.4 т',
    waypoints: [
      [40.210609, 69.288485],
      [40.215000, 69.285000],
      [40.220000, 69.282000],
      [40.225623, 69.281056]
    ]
  },
  {
    id: 'route-3',
    fromId: 'loc-5',
    toId: 'loc-11',
    distance: '2.5 км',
    duration: '10 мин',
    status: 'delayed',
    vehicleId: 'v-003',
    vehicleName: 'Damas',
    cargo: 'Полуфабрикаты — 0.3 т',
    waypoints: [
      [40.225719, 69.283048],
      [40.230000, 69.288000],
      [40.235000, 69.293000],
      [40.239429, 69.295653]
    ]
  },
  {
    id: 'route-4',
    fromId: 'loc-2',
    toId: 'loc-3',
    distance: '0.3 км',
    duration: '2 мин',
    status: 'completed',
    vehicleId: 'v-004',
    vehicleName: 'GAZelle',
    cargo: 'Овощи — 0.8 т',
    waypoints: [
      [40.213080, 69.287136],
      [40.212775, 69.286248]
    ]
  },
  {
    id: 'route-5',
    fromId: 'loc-13',
    toId: 'loc-8',
    distance: '1.1 км',
    duration: '6 мин',
    status: 'active',
    vehicleId: 'v-005',
    vehicleName: 'Labo',
    cargo: 'Молочная продукция — 0.5 т',
    waypoints: [
      [40.243749, 69.289546],
      [40.239000, 69.288500],
      [40.235061, 69.287929]
    ]
  }
];

export const typeLabels: Record<TMSLocation['type'], string> = {
  warehouse: 'Склад',
  distribution: 'Дистрибуция',
  retail: 'Магазин',
  office: 'Офис',
  factory: 'Производство',
  canteen: 'Столовая',
  buffet: 'Буфет',
  cafe: 'Кофетерий'
};

export const typeColors: Record<TMSLocation['type'], string> = {
  warehouse: '#6366f1',
  distribution: '#f59e0b',
  retail: '#10b981',
  office: '#3b82f6',
  factory: '#ef4444',
  canteen: '#ec4899',
  buffet: '#8b5cf6',
  cafe: '#14b8a6'
};

export const statusLabels: Record<TMSLocation['status'], string> = {
  active: 'Активен',
  busy: 'Загружен',
  maintenance: 'Обслуживание'
};

export const statusColors: Record<TMSLocation['status'], string> = {
  active: '#22c55e',
  busy: '#f59e0b',
  maintenance: '#ef4444'
};

export const routeStatusColors: Record<TMSRoute['status'], string> = {
  active: '#6366f1',
  delayed: '#ef4444',
  completed: '#22c55e'
};
