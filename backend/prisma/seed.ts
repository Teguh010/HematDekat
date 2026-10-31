import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ProductCategory, ProductUnit, Role, StoreType } from '@prisma/client';
import { hash } from 'argon2';

import { slugify } from '../src/common/slugify.js';

export type ProductSeed = {
  name: string;
  category: ProductCategory;
  defaultUnit: ProductUnit;
};

export type StoreSeed = {
  name: string;
  district: string;
  type: StoreType;
  lat: number;
  lng: number;
  placeId: string;
};

export type CitySeed = {
  name: string;
  province: string;
  centerLat: number;
  centerLng: number;
  stores: StoreSeed[];
};

export const productCatalog: ProductSeed[] = [
  { name: 'Beras premium', category: ProductCategory.RICE, defaultUnit: ProductUnit.KG },
  { name: 'Minyak goreng curah', category: ProductCategory.COOKING_OIL, defaultUnit: ProductUnit.LITER },
  { name: 'Gula pasir', category: ProductCategory.SUGAR, defaultUnit: ProductUnit.KG },
  { name: 'Telur ayam', category: ProductCategory.EGGS, defaultUnit: ProductUnit.PCS },
  { name: 'Tepung terigu', category: ProductCategory.FLOUR, defaultUnit: ProductUnit.KG },
  { name: 'Garam', category: ProductCategory.SALT, defaultUnit: ProductUnit.KG },
  { name: 'Mie instan', category: ProductCategory.INSTANT_NOODLES, defaultUnit: ProductUnit.PACK },
  { name: 'Cabai merah', category: ProductCategory.CHILI, defaultUnit: ProductUnit.KG },
  { name: 'Bawang merah', category: ProductCategory.SHALLOTS, defaultUnit: ProductUnit.KG },
  { name: 'Bawang putih', category: ProductCategory.GARLIC, defaultUnit: ProductUnit.KG },
  { name: 'Ayam broiler', category: ProductCategory.CHICKEN, defaultUnit: ProductUnit.KG },
  { name: 'Daging sapi', category: ProductCategory.BEEF, defaultUnit: ProductUnit.KG },
  { name: 'Ikan bandeng', category: ProductCategory.FISH, defaultUnit: ProductUnit.KG },
];

export const citySeeds: CitySeed[] = [
  {
    name: 'Jakarta',
    province: 'DKI Jakarta',
    centerLat: -6.2088,
    centerLng: 106.8456,
    stores: [
      { name: 'Pasar Kramat Jati', district: 'Kramat Jati', type: StoreType.MARKET, lat: -6.287, lng: 106.856, placeId: 'jakarta-pasar-kramat-jati' },
      { name: 'Mitra Grocery', district: 'Cakung', type: StoreType.MINIMARKET, lat: -6.196, lng: 106.96, placeId: 'jakarta-mitra-grocery' },
      { name: 'Pasar Cakung', district: 'Cakung', type: StoreType.MARKET, lat: -6.1697, lng: 106.9444, placeId: 'jakarta-pasar-cakung' },
    ],
  },
  {
    name: 'Bandung',
    province: 'Jawa Barat',
    centerLat: -6.9175,
    centerLng: 107.6191,
    stores: [
      { name: 'Toko Rahma', district: 'Bandung Kulon', type: StoreType.GROCERY_STALL, lat: -6.906, lng: 107.565, placeId: 'bandung-toko-rahma' },
      { name: 'Pasar Sukajadi', district: 'Sukajadi', type: StoreType.MARKET, lat: -6.885, lng: 107.6, placeId: 'bandung-pasar-sukajadi' },
      { name: 'Alfamart Dago', district: 'Dago', type: StoreType.MINIMARKET, lat: -6.8748, lng: 107.6073, placeId: 'bandung-alfamart-dago' },
    ],
  },
  {
    name: 'Yogyakarta',
    province: 'DI Yogyakarta',
    centerLat: -7.7956,
    centerLng: 110.3695,
    stores: [
      { name: 'Pasar Kotagede', district: 'Kotagede', type: StoreType.MARKET, lat: -7.822, lng: 110.388, placeId: 'yogyakarta-pasar-kotagede' },
      { name: 'Toko Sehat', district: 'Mergangsan', type: StoreType.GROCERY_STALL, lat: -7.819, lng: 110.358, placeId: 'yogyakarta-toko-sehat' },
    ],
  },
  {
    name: 'Surabaya',
    province: 'Jawa Timur',
    centerLat: -7.2575,
    centerLng: 112.7521,
    stores: [
      { name: 'Super Indo Puri', district: 'Wiyung', type: StoreType.SUPERMARKET, lat: -7.324, lng: 112.709, placeId: 'surabaya-super-indo-puri' },
      { name: 'Pasar Wonokromo', district: 'Wonokromo', type: StoreType.MARKET, lat: -7.3023, lng: 112.7402, placeId: 'surabaya-pasar-wonokromo' },
    ],
  },
  {
    name: 'Medan',
    province: 'Sumatera Utara',
    centerLat: 3.5952,
    centerLng: 98.6722,
    stores: [
      { name: 'Pasar Petisah', district: 'Medan Petisah', type: StoreType.MARKET, lat: 3.588, lng: 98.664, placeId: 'medan-pasar-petisah' },
      { name: 'Toko Sumber Rezeki', district: 'Medan Baru', type: StoreType.MINIMARKET, lat: 3.571, lng: 98.671, placeId: 'medan-toko-sumber-rezeki' },
    ],
  },
];

async function ensureSeedAdmin(prisma: PrismaClient, email: string, password: string): Promise<void> {
  const passwordHash = await hash(password);

  await prisma.user.upsert({
    where: { email },
    update: {
      role: Role.ADMIN,
      passwordHash,
      name: 'Admin Sembako',
    },
    create: {
      email,
      name: 'Admin Sembako',
      passwordHash,
      role: Role.ADMIN,
    },
  });
}

async function seedProducts(prisma: PrismaClient): Promise<void> {
  for (const product of productCatalog) {
    await prisma.product.upsert({
      where: { slug: slugify(product.name) },
      update: {
        category: product.category,
        defaultUnit: product.defaultUnit,
      },
      create: {
        slug: slugify(product.name),
        name: product.name,
        category: product.category,
        defaultUnit: product.defaultUnit,
      },
    });
  }
}

async function seedCities(prisma: PrismaClient): Promise<void> {
  for (const city of citySeeds) {
    await prisma.city.upsert({
      where: { slug: slugify(city.name) },
      update: {
        name: city.name,
        province: city.province,
        centerLat: city.centerLat,
        centerLng: city.centerLng,
      },
      create: {
        slug: slugify(city.name),
        name: city.name,
        province: city.province,
        centerLat: city.centerLat,
        centerLng: city.centerLng,
      },
    });
  }
}

async function seedPriceReports(prisma: PrismaClient): Promise<void> {
  await prisma.priceReport.deleteMany({});

  const stores = await prisma.store.findMany();
  const products = await prisma.product.findMany();
  const productMap = new Map(products.map((product) => [product.name, product]));
  const now = Date.now();

  const basePrices = {
    'Beras premium': 14500,
    'Minyak goreng curah': 17000,
    'Gula pasir': 15000,
    'Telur ayam': 2900,
    'Tepung terigu': 12000,
    'Garam': 5000,
    'Mie instan': 3500,
    'Cabai merah': 42000,
    'Bawang merah': 25000,
    'Bawang putih': 22000,
    'Ayam broiler': 35000,
    'Daging sapi': 120000,
    'Ikan bandeng': 45000,
  };

  const priceEntries: Array<{
    storeId: string;
    productId: string;
    price: number;
    quantity: number;
    unit: ProductUnit;
    normalizedUnitPrice: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    confirmationCount: number;
    verifiedAt: Date;
  }> = [];

  let index = 0;

  for (const store of stores) {
    for (const [productName, defaultPrice] of Object.entries(basePrices)) {
      const product = productMap.get(productName);
      if (!product) {
        continue;
      }

      const unit = product.defaultUnit;
      const price = Math.round(defaultPrice + (store.name.length % 5) * 250);

      priceEntries.push({
        storeId: store.id,
        productId: product.id,
        price,
        quantity: 1,
        unit,
        normalizedUnitPrice: price,
        status: 'APPROVED',
        confirmationCount: 2,
        verifiedAt: new Date(now - (index % 21) * 86_400_000),
      });

      index += 1;
    }
  }

  if (priceEntries.length === 0) {
    return;
  }

  await prisma.priceReport.createMany({
    data: priceEntries,
  });
}

async function seedPromos(prisma: PrismaClient, adminEmail: string): Promise<void> {
  await prisma.promo.deleteMany({});

  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  const stores = await prisma.store.findMany({ orderBy: { name: 'asc' }, take: 2 });
  const products = await prisma.product.findMany({ orderBy: { name: 'asc' }, take: 2 });

  if (!admin || stores.length < 2 || products.length < 2) {
    return;
  }

  const validFrom = new Date(Date.now() - 86_400_000);
  const validTo = new Date(Date.now() + 14 * 86_400_000);

  await prisma.promo.createMany({
    data: [
      {
        storeId: stores[0].id,
        productId: products[0].id,
        submitterId: admin.id,
        promoPrice: 13000,
        discountPct: null,
        conditions: 'Diskon hari ini untuk pembelian cash.',
        validFrom,
        validTo,
        status: 'APPROVED',
      },
      {
        storeId: stores[1].id,
        productId: products[1].id,
        submitterId: admin.id,
        promoPrice: null,
        discountPct: 10,
        conditions: 'Promo berlaku hingga stok habis.',
        validFrom,
        validTo,
        status: 'APPROVED',
      },
    ],
  });
}

async function seedStores(prisma: PrismaClient): Promise<void> {
  for (const city of citySeeds) {
    const cityRecord = await prisma.city.findUnique({
      where: { slug: slugify(city.name) },
    });

    if (!cityRecord) {
      continue;
    }

    for (const store of city.stores) {
      await prisma.store.upsert({
        where: { placeId: store.placeId },
        update: {
          name: store.name,
          type: store.type,
          cityId: cityRecord.id,
          district: store.district,
          lat: store.lat,
          lng: store.lng,
          fetchedAt: new Date(),
        },
        create: {
          slug: slugify(store.name),
          name: store.name,
          placeId: store.placeId,
          type: store.type,
          cityId: cityRecord.id,
          district: store.district,
          lat: store.lat,
          lng: store.lng,
          fetchedAt: new Date(),
        },
      });
    }
  }
}

export function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export async function seedDatabase(prisma = createPrismaClient()): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? (process.env.NODE_ENV !== 'production' ? 'admin123' : undefined);

  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD must be set when NODE_ENV=production.');
  }

  await ensureSeedAdmin(prisma, adminEmail, adminPassword);
  await seedProducts(prisma);
  await seedCities(prisma);
  await seedStores(prisma);
  await seedPriceReports(prisma);
  await seedPromos(prisma, adminEmail);

  console.log(`Seeded ${productCatalog.length} products, ${citySeeds.length} cities, ${citySeeds.reduce((count, city) => count + city.stores.length, 0)} stores, and sample price reports.`);
}

export async function main(): Promise<void> {
  const prisma = createPrismaClient();

  try {
    await seedDatabase(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectExecution = process.argv[1]?.includes('prisma/seed.ts');

if (isDirectExecution) {
  void main();
}
