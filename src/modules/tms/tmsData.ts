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
    id: 'loc-1', name: '11-Sonli Oshxona', type: 'canteen', lat: 40.209697, lng: 69.286762,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-2', name: '4-Sonli Bufet', type: 'buffet', lat: 40.210621, lng: 69.288551,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-3', name: 'кондитерская цех', type: 'factory', lat: 40.244075, lng: 69.286456,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-4', name: 'Katta Sklad', type: 'warehouse', lat: 40.244305, lng: 69.286201,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-5', name: '2-Sonli Oshxona', type: 'canteen', lat: 40.243384, lng: 69.289422,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-6', name: '2-Sonli Bufet', type: 'buffet', lat: 40.243526, lng: 69.289627,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-7', name: 'Magazin SPS', type: 'retail', lat: 40.243710, lng: 69.288826,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-8', name: '1-Sonli Oshxona', type: 'canteen', lat: 40.239689, lng: 69.287201,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-9', name: '9-Sonli Oshxona', type: 'canteen', lat: 40.239265, lng: 69.295700,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-10', name: 'Italya oshxona', type: 'canteen', lat: 40.236530, lng: 69.292549,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-11', name: '6-Sonli Oshxona', type: 'canteen', lat: 40.236523, lng: 69.293114,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-12', name: '8-Sonli Oshxona', type: 'canteen', lat: 40.233433, lng: 69.290604,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-13', name: 'LKP Oshxona', type: 'canteen', lat: 40.240082, lng: 69.289070,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-14', name: '16-Sonli Oshxona', type: 'canteen', lat: 40.234879, lng: 69.287697,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-15', name: 'Kafeteriy Bazalt  Bufet', type: 'buffet', lat: 40.234810, lng: 69.285782,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-16', name: '4-Sonli Oshxona', type: 'canteen', lat: 40.223648, lng: 69.286911,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-17', name: '5-Sonli Bufet', type: 'buffet', lat: 40.225811, lng: 69.282837,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-18', name: '10-Sonli Oshxona', type: 'canteen', lat: 40.225719, lng: 69.283798,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-19', name: 'Mini Pekarni', type: 'factory', lat: 40.209057, lng: 69.287117,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-20', name: '12-Sonli Oshxona', type: 'canteen', lat: 40.243877, lng: 69.286064,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-21', name: '13-Sonli Oshxona', type: 'canteen', lat: 40.213120, lng: 69.287216,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-22', name: '14-Sonli Bufet', type: 'buffet', lat: 40.211975, lng: 69.286453,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  },
  {
    id: 'loc-23', name: '14-Sonli Oshxona', type: 'canteen', lat: 40.212334, lng: 69.286270,
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
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
      [40.234879, 69.287697],
      [40.243710, 69.288826]
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
      [40.209697, 69.286762],
      [40.244305, 69.286201]
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
      [40.243384, 69.289422],
      [40.236523, 69.293114]
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
      [40.210621, 69.288551],
      [40.244075, 69.286456]
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
      [40.240082, 69.289070],
      [40.239689, 69.287201]
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
