import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

const root = process.cwd();
const dataDir = path.join(root, 'public', 'data');
const required = ['orders.csv', 'order_items.csv', 'products.csv', 'stores.csv', 'countries.csv', 'world.geo.json'];

function readCsv(fileName) {
  const raw = fs.readFileSync(path.join(dataDir, fileName), 'utf8');
  const parsed = Papa.parse(raw, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => String(header || '').replace(/^\uFEFF/, '').trim()
  });
  if (parsed.errors.length) {
    throw new Error(`${fileName} parse errors: ${parsed.errors.map((error) => error.message).join('; ')}`);
  }
  return parsed.data;
}

function asNumber(value) {
  const parsed = Number.parseFloat(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

for (const fileName of required) {
  const full = path.join(dataDir, fileName);
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${fileName}`);
}

const orders = readCsv('orders.csv');
const items = readCsv('order_items.csv');
const products = readCsv('products.csv');
const stores = readCsv('stores.csv');
const countries = readCsv('countries.csv');
const world = JSON.parse(fs.readFileSync(path.join(dataDir, 'world.geo.json'), 'utf8'));

const fields = {
  'orders.csv': ['order_id', 'order_time_utc8', 'platform', 'store_id', 'store_name', 'business_type', 'country_code', 'country_name_cn', 'customer_name', 'order_amount_usd', 'currency', 'order_status'],
  'order_items.csv': ['order_item_id', 'order_id', 'sku', 'product_name_en', 'product_image', 'quantity', 'item_sales_amount_usd'],
  'products.csv': ['sku', 'product_name_en', 'product_image'],
  'stores.csv': ['store_id', 'store_name', 'business_type'],
  'countries.csv': ['country_code', 'country_name_cn', 'map_name', 'timezone']
};

for (const [fileName, requiredFields] of Object.entries(fields)) {
  const rows = { 'orders.csv': orders, 'order_items.csv': items, 'products.csv': products, 'stores.csv': stores, 'countries.csv': countries }[fileName];
  if (!rows.length) throw new Error(`${fileName} has no rows`);
  const missing = requiredFields.filter((field) => !(field in rows[0]));
  if (missing.length) throw new Error(`${fileName} missing fields: ${missing.join(', ')}`);
}

const orderIds = new Set(orders.map((order) => order.order_id));
const productSkus = new Set(products.map((product) => product.sku));
const storeIds = new Set(stores.map((store) => store.store_id));
const countryCodes = new Set(countries.map((country) => country.country_code));
const mapNames = new Set(world.features.map((feature) => feature.properties?.name));

for (const order of orders) {
  if (!/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(order.order_time_utc8)) {
    throw new Error(`Invalid order_time_utc8 for ${order.order_id}: ${order.order_time_utc8}`);
  }
  if (!storeIds.has(order.store_id)) throw new Error(`Unknown store_id on ${order.order_id}: ${order.store_id}`);
  if (!countryCodes.has(order.country_code)) throw new Error(`Unknown country_code on ${order.order_id}: ${order.country_code}`);
  if (order.currency !== 'USD') throw new Error(`Non-USD order ${order.order_id}`);
}

for (const item of items) {
  if (!orderIds.has(item.order_id)) throw new Error(`Unknown order_id on item ${item.order_item_id}: ${item.order_id}`);
  if (!productSkus.has(item.sku)) throw new Error(`Unknown sku on item ${item.order_item_id}: ${item.sku}`);
  if (asNumber(item.quantity) <= 0) throw new Error(`Invalid quantity on item ${item.order_item_id}`);
}

for (const country of countries) {
  if (!mapNames.has(country.map_name)) throw new Error(`countries.csv map_name not found in world.geo.json: ${country.map_name}`);
}

const paidOrders = orders.filter((order) => String(order.order_status).toLowerCase() === 'paid');
const totalSales = paidOrders.reduce((sum, order) => sum + asNumber(order.order_amount_usd), 0);
if (totalSales < 70000 || totalSales > 80000) {
  throw new Error(`Expected total sales between 70000 and 80000 USD, got ${totalSales.toFixed(2)}`);
}

console.log(`CSV validation passed: ${orders.length} orders, ${items.length} items, ${products.length} products, total paid sales $${totalSales.toFixed(2)}.`);
