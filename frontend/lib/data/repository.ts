export type StoreType = "supermarket" | "minimarket" | "market" | "grocery-stall";

export interface ProductPrice {
  id: string;
  name: string;
  category: "rice" | "oil" | "sugar" | "eggs" | "flour" | "seasoning" | "proteins";
  unit: "kg" | "liter" | "pcs" | "pack";
  price: number;
  normalizedUnitPrice: number;
  isPromo: boolean;
}

export interface Store {
  id: string;
  name: string;
  city: string;
  district: string;
  type: StoreType;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  updatedAt: string;
  coordinates: {
    x: number;
    y: number;
    lat: number;
    lng: number;
  };
  products: ProductPrice[];
}

export interface StoreWithProduct extends Store {
  product?: ProductPrice;
}

const stores: Store[] = [
  {
    id: "pasar-kranji",
    name: "Pasar Kramat Jati",
    city: "Jakarta",
    district: "Kramat Jati",
    type: "market",
    rating: 4.7,
    reviewCount: 401,
    distanceKm: 2.4,
    updatedAt: "2 jam yang lalu",
    coordinates: { x: 30, y: 42, lat: -6.287, lng: 106.856 },
    products: [
      { id: "rice-1", name: "Beras premium", category: "rice", unit: "kg", price: 15000, normalizedUnitPrice: 15000, isPromo: false },
      { id: "oil-1", name: "Minyak goreng curah", category: "oil", unit: "liter", price: 17000, normalizedUnitPrice: 17000, isPromo: true },
      { id: "sugar-1", name: "Gula pasir", category: "sugar", unit: "kg", price: 15000, normalizedUnitPrice: 15000, isPromo: false },
      { id: "egg-1", name: "Telur ayam", category: "eggs", unit: "pcs", price: 2900, normalizedUnitPrice: 2900, isPromo: false },
    ],
  },
  {
    id: "mitra-grocery",
    name: "Mitra Grocery",
    city: "Jakarta",
    district: "Cakung",
    type: "minimarket",
    rating: 4.5,
    reviewCount: 168,
    distanceKm: 4.1,
    updatedAt: "1 hari yang lalu",
    coordinates: { x: 58, y: 62, lat: -6.196, lng: 106.96 },
    products: [
      { id: "rice-2", name: "Beras premium", category: "rice", unit: "kg", price: 15500, normalizedUnitPrice: 15500, isPromo: false },
      { id: "oil-2", name: "Minyak goreng curah", category: "oil", unit: "liter", price: 16500, normalizedUnitPrice: 16500, isPromo: true },
      { id: "flour-1", name: "Tepung terigu", category: "flour", unit: "kg", price: 12000, normalizedUnitPrice: 12000, isPromo: false },
      { id: "egg-2", name: "Telur ayam", category: "eggs", unit: "pcs", price: 3000, normalizedUnitPrice: 3000, isPromo: false },
    ],
  },
  {
    id: "toko-rahma",
    name: "Toko Rahma",
    city: "Bandung",
    district: "Bandung Kulon",
    type: "grocery-stall",
    rating: 4.6,
    reviewCount: 213,
    distanceKm: 3.2,
    updatedAt: "4 jam yang lalu",
    coordinates: { x: 48, y: 30, lat: -6.906, lng: 107.565 },
    products: [
      { id: "rice-3", name: "Beras premium", category: "rice", unit: "kg", price: 14900, normalizedUnitPrice: 14900, isPromo: false },
      { id: "oil-3", name: "Minyak goreng curah", category: "oil", unit: "liter", price: 16800, normalizedUnitPrice: 16800, isPromo: false },
      { id: "sugar-2", name: "Gula pasir", category: "sugar", unit: "kg", price: 14500, normalizedUnitPrice: 14500, isPromo: true },
      { id: "egg-3", name: "Telur ayam", category: "eggs", unit: "pcs", price: 2800, normalizedUnitPrice: 2800, isPromo: true },
    ],
  },
  {
    id: "pasar-sukajadi",
    name: "Pasar Sukajadi",
    city: "Bandung",
    district: "Sukajadi",
    type: "market",
    rating: 4.8,
    reviewCount: 527,
    distanceKm: 1.5,
    updatedAt: "30 menit yang lalu",
    coordinates: { x: 68, y: 46, lat: -6.885, lng: 107.6 },
    products: [
      { id: "rice-4", name: "Beras premium", category: "rice", unit: "kg", price: 14700, normalizedUnitPrice: 14700, isPromo: true },
      { id: "oil-4", name: "Minyak goreng curah", category: "oil", unit: "liter", price: 16000, normalizedUnitPrice: 16000, isPromo: true },
      { id: "flour-2", name: "Tepung terigu", category: "flour", unit: "kg", price: 11800, normalizedUnitPrice: 11800, isPromo: false },
      { id: "egg-4", name: "Telur ayam", category: "eggs", unit: "pcs", price: 2750, normalizedUnitPrice: 2750, isPromo: true },
    ],
  },
  {
    id: "superindo-puri",
    name: "Super Indo Puri",
    city: "Surabaya",
    district: "Wiyung",
    type: "supermarket",
    rating: 4.4,
    reviewCount: 278,
    distanceKm: 6.3,
    updatedAt: "6 jam yang lalu",
    coordinates: { x: 73, y: 72, lat: -7.324, lng: 112.709 },
    products: [
      { id: "rice-5", name: "Beras premium", category: "rice", unit: "kg", price: 16200, normalizedUnitPrice: 16200, isPromo: false },
      { id: "oil-5", name: "Minyak goreng curah", category: "oil", unit: "liter", price: 17500, normalizedUnitPrice: 17500, isPromo: false },
      { id: "sugar-3", name: "Gula pasir", category: "sugar", unit: "kg", price: 16000, normalizedUnitPrice: 16000, isPromo: false },
      { id: "egg-5", name: "Telur ayam", category: "eggs", unit: "pcs", price: 3100, normalizedUnitPrice: 3100, isPromo: false },
    ],
  },
];

export function getStores(): Store[] {
  return stores;
}

export function getTopCheapestStores(productName: string): StoreWithProduct[] {
  return [...stores]
    .map((store) => {
      const product = store.products.find((item) => item.name === productName);
      return {
        ...store,
        product,
      };
    })
    .filter((store): store is StoreWithProduct & { product: ProductPrice } => Boolean(store.product))
    .sort((a, b) => a.product.normalizedUnitPrice - b.product.normalizedUnitPrice)
    .slice(0, 4);
}
