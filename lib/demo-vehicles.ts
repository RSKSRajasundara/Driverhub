export type DemoVehicle = {
  name: string;
  make: string;
  model: string;
  year: number;
  category: string;
  pricePerDay: number;
  fuelType: string;
  transmission: string;
  seats: number;
  description: string;
  image: string;
  available: boolean;
};

export type DemoVehicleWithId = DemoVehicle & {
  _id: string;
};

function slugifyForId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const demoVehicles: DemoVehicle[] = [
  {
    name: 'Toyota Camry 2024',
    make: 'Toyota',
    model: 'Camry',
    year: 2024,
    category: 'sedan',
    pricePerDay: 75,
    fuelType: 'petrol',
    transmission: 'automatic',
    seats: 5,
    description: 'Reliable midsize sedan for city and highway driving.',
    image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1200&q=80',
    available: true,
  },
  {
    name: 'Honda CR-V 2023',
    make: 'Honda',
    model: 'CR-V',
    year: 2023,
    category: 'suv',
    pricePerDay: 95,
    fuelType: 'hybrid',
    transmission: 'automatic',
    seats: 5,
    description: 'Comfortable SUV with excellent fuel economy.',
    image: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=1200&q=80',
    available: true,
  },
  {
    name: 'Tesla Model 3 2024',
    make: 'Tesla',
    model: 'Model 3',
    year: 2024,
    category: 'luxury',
    pricePerDay: 140,
    fuelType: 'electric',
    transmission: 'automatic',
    seats: 5,
    description: 'Premium electric sedan with advanced driver features.',
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80',
    available: true,
  },
  {
    name: 'Suzuki Alto 2022',
    make: 'Suzuki',
    model: 'Alto',
    year: 2022,
    category: 'economy',
    pricePerDay: 35,
    fuelType: 'petrol',
    transmission: 'manual',
    seats: 4,
    description: 'Budget-friendly compact car for short city trips.',
    image: 'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?auto=format&fit=crop&w=1200&q=80',
    available: true,
  },
  {
    name: 'Hyundai i20 2023',
    make: 'Hyundai',
    model: 'i20',
    year: 2023,
    category: 'compact',
    pricePerDay: 50,
    fuelType: 'petrol',
    transmission: 'automatic',
    seats: 5,
    description: 'Modern hatchback with smooth ride and smart features.',
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80',
    available: true,
  },
  {
    name: 'BMW 5 Series 2022',
    make: 'BMW',
    model: '530i',
    year: 2022,
    category: 'luxury',
    pricePerDay: 180,
    fuelType: 'petrol',
    transmission: 'automatic',
    seats: 5,
    description: 'Executive luxury sedan with premium comfort.',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
    available: true,
  },
  {
    name: 'Yamaha FZ-S V3 2024',
    make: 'Yamaha',
    model: 'FZ-S V3',
    year: 2024,
    category: 'bike',
    pricePerDay: 28,
    fuelType: 'petrol',
    transmission: 'manual',
    seats: 2,
    description: 'Sporty bike for quick city rides and easy parking.',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80',
    available: true,
  },
  {
    name: 'Bajaj Pulsar NS200 2023',
    make: 'Bajaj',
    model: 'Pulsar NS200',
    year: 2023,
    category: 'bike',
    pricePerDay: 24,
    fuelType: 'petrol',
    transmission: 'manual',
    seats: 2,
    description: 'Powerful street bike with great handling.',
    image: 'https://images.unsplash.com/photo-1525701417927-6217a5b1fbc3?auto=format&fit=crop&w=1200&q=80',
    available: true,
  },
  {
    name: 'Mahindra Thar 2024',
    make: 'Mahindra',
    model: 'Thar',
    year: 2024,
    category: 'jeep',
    pricePerDay: 120,
    fuelType: 'diesel',
    transmission: 'manual',
    seats: 4,
    description: 'Rugged 4x4 jeep ideal for off-road adventures.',
    image: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&w=1200&q=80',
    available: true,
  },
  {
    name: 'Toyota Hiace 2022',
    make: 'Toyota',
    model: 'Hiace',
    year: 2022,
    category: 'van',
    pricePerDay: 145,
    fuelType: 'diesel',
    transmission: 'automatic',
    seats: 12,
    description: 'Spacious van for family tours and group transfers.',
    image: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=1200&q=80',
    available: true,
  },
  {
    name: 'Nissan Caravan 2021',
    make: 'Nissan',
    model: 'Caravan',
    year: 2021,
    category: 'van',
    pricePerDay: 132,
    fuelType: 'diesel',
    transmission: 'automatic',
    seats: 10,
    description: 'Comfortable passenger van for long-distance travel.',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
    available: true,
  },
  {
    name: 'Ashok Leyland Lynx 2020',
    make: 'Ashok Leyland',
    model: 'Lynx',
    year: 2020,
    category: 'bus',
    pricePerDay: 260,
    fuelType: 'diesel',
    transmission: 'manual',
    seats: 30,
    description: 'Mini bus suitable for events, staff transport, and tours.',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    available: true,
  },
];

export function withDemoVehicleIds(vehicles: DemoVehicle[]): DemoVehicleWithId[] {
  return vehicles.map((vehicle) => ({
    ...vehicle,
    _id: `demo-${slugifyForId(vehicle.name)}`,
  }));
}

export function getDemoVehicleById(id: string): DemoVehicleWithId | null {
  return withDemoVehicleIds(demoVehicles).find((vehicle) => vehicle._id === id) ?? null;
}