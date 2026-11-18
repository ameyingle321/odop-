// src/data/index.js
// Aggregated catalog data combining base demo listings and Docs/products.extra.js

import { demoProducts as baseProducts, demoSellers as baseSellers, demoDistricts as baseDistricts } from './products.js';
import { moreProducts, moreSellers, moreDistricts } from './products.extra.js';

export const allDemoProducts = [...baseProducts, ...moreProducts];
export const allDemoSellers = [...baseSellers, ...moreSellers];
export const allDemoDistricts = [...baseDistricts, ...moreDistricts];

export { baseProducts, moreProducts, baseSellers, moreSellers, baseDistricts, moreDistricts };
