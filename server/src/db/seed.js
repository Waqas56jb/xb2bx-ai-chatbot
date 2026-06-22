/**
 * Seed the supplier directory and product catalogue with sample data so search
 * works today. Run:  npm run seed
 * Replace this with your real import once you have live data.
 */
import db from './index.js';

const SUPPLIERS = [
  ['SUP-1042', 'GreenPack Industries', 'Vietnam', 'packaging,eco', 'eco-friendly packaging biodegradable mailer boxes recyclable', 'Sustainable packaging manufacturer specialising in biodegradable mailers and recyclable boxes.', 500000, 5000, 1, 0.92, 4.7],
  ['SUP-0876', 'EcoForm Manufacturing', 'India', 'packaging,eco', 'compostable packaging paper pulp trays moulded fibre', 'Moulded-fibre and compostable packaging for food and retail.', 250000, 2000, 1, 0.85, 4.4],
  ['SUP-1190', 'NordPackaging', 'Poland', 'packaging', 'cardboard boxes corrugated packaging printed', 'Corrugated and printed cardboard packaging for European supply chains.', 180000, 1000, 1, 0.78, 4.2],
  ['SUP-1330', 'Saigon Furnishings', 'Vietnam', 'furniture,wood', 'furniture wooden chairs tables solid wood rattan', 'Solid-wood and rattan furniture manufacturer for hospitality and retail.', 40000, 200, 1, 0.81, 4.6],
  ['SUP-1455', 'Hanoi WoodCraft', 'Vietnam', 'furniture,wood', 'furniture cabinets desks plywood veneer', 'Cabinetry and office furniture, plywood and veneer specialists.', 30000, 100, 0, 0.66, 4.1],
  ['SUP-1501', 'TextilePro Lahore', 'Pakistan', 'textiles', 'textiles cotton fabric woven garments t-shirts', 'Woven cotton textiles and garment production at scale.', 800000, 10000, 1, 0.88, 4.5],
  ['SUP-1622', 'Istanbul Knits', 'Turkey', 'textiles', 'textiles knitwear jersey organic cotton apparel', 'Knitwear and jersey apparel, organic cotton options.', 350000, 3000, 1, 0.83, 4.3],
  ['SUP-1709', 'Shenzhen ElectroParts', 'China', 'electronics', 'electronics pcb components connectors assembly', 'PCB assembly and electronic components for OEMs.', 1000000, 5000, 1, 0.9, 4.4],
  ['SUP-1810', 'Guangzhou LED Co', 'China', 'electronics,lighting', 'led lighting fixtures bulbs smart lighting', 'LED lighting fixtures and smart-lighting modules.', 600000, 2000, 1, 0.76, 4.0],
  ['SUP-1925', 'AndesOrganics', 'Peru', 'food,eco', 'organic food quinoa cacao superfoods bulk', 'Bulk organic superfoods — quinoa, cacao, and more.', 120000, 500, 1, 0.79, 4.6],
  ['SUP-2044', 'Cairo Packaging Group', 'Egypt', 'packaging', 'plastic packaging containers bottles caps', 'Rigid plastic containers, bottles, and closures.', 400000, 5000, 0, 0.6, 3.9],
  ['SUP-2160', 'BalticWood Interiors', 'Lithuania', 'furniture,wood', 'furniture oak tables chairs flat-pack', 'Oak and flat-pack furniture for European retailers.', 25000, 150, 1, 0.84, 4.5]
];

const PRODUCTS = [
  ['PRD-301', 'Recyclable Mailer Box', 'packaging', 'Curbside-recyclable corrugated mailer box, custom print available.', 'mailer box recyclable corrugated shipping', 1000, 'from $0.18/unit', 'SUP-1042'],
  ['PRD-302', 'Biodegradable Poly Mailer', 'packaging', 'Compostable mailer bag made from plant-based film.', 'biodegradable mailer compostable bag eco', 2000, 'from $0.09/unit', 'SUP-1042'],
  ['PRD-303', 'Moulded Fibre Tray', 'packaging', 'Compostable moulded-fibre tray for food and retail packaging.', 'moulded fibre tray compostable food packaging', 5000, 'from $0.06/unit', 'SUP-0876'],
  ['PRD-310', 'Organic Cotton T-Shirt (Blank)', 'textiles', 'Blank organic cotton tee for private-label apparel.', 'organic cotton t-shirt blank apparel garment', 500, 'from $2.40/unit', 'SUP-1622'],
  ['PRD-311', 'Woven Cotton Fabric Roll', 'textiles', 'Woven cotton fabric by the roll for garment manufacturing.', 'woven cotton fabric roll textile', 1000, 'from $1.10/metre', 'SUP-1501'],
  ['PRD-320', 'Solid Wood Dining Chair', 'furniture', 'Solid-wood dining chair for hospitality and retail.', 'solid wood dining chair furniture hospitality', 100, 'from $18/unit', 'SUP-1330'],
  ['PRD-321', 'Flat-Pack Oak Table', 'furniture', 'Flat-pack oak dining table for European retailers.', 'flat-pack oak table furniture dining', 50, 'from $46/unit', 'SUP-2160'],
  ['PRD-330', 'Smart LED Panel Light', 'electronics', 'Dimmable smart LED panel with app control.', 'led panel smart lighting dimmable fixture', 200, 'from $7.50/unit', 'SUP-1810'],
  ['PRD-331', 'Custom PCB Assembly', 'electronics', 'Turnkey PCB assembly for OEM electronics.', 'pcb assembly electronics oem components', 100, 'quote on spec', 'SUP-1709'],
  ['PRD-340', 'Organic Quinoa (Bulk)', 'food', 'Bulk organic white quinoa, export-grade.', 'organic quinoa bulk superfood food', 500, 'from $2.80/kg', 'SUP-1925']
];

const insSupplier = db.prepare(`
  INSERT OR REPLACE INTO suppliers
    (id, name, country, categories, keywords, description, monthly_capacity, min_order_qty, verified, responsiveness, rating)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insProduct = db.prepare(`
  INSERT OR REPLACE INTO products
    (id, title, category, description, keywords, moq, price, supplier_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

db.exec('BEGIN');
try {
  SUPPLIERS.forEach((r) => insSupplier.run(...r));
  PRODUCTS.forEach((r) => insProduct.run(...r));
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}

const s = db.prepare('SELECT COUNT(*) AS n FROM suppliers').get().n;
const p = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
console.log(`Seeded — ${s} suppliers, ${p} products.`);
