import type { ProductData, Product, CustomerScenario, FAQ, ComparisonTable } from '../types';

let data: ProductData | null = null;

export async function loadProductData(): Promise<ProductData> {
  if (data) return data;
  const res = await fetch('/products.json');
  data = await res.json();
  return data!;
}

export function getProducts(): Product[] {
  return data?.products ?? [];
}

export function getProductByCode(code: string): Product | undefined {
  return data?.products.find(p => p.code === code);
}

export function getScenarios(): CustomerScenario[] {
  return data?.customer_scenarios ?? [];
}

export function getFAQs(): FAQ[] {
  return data?.faq ?? [];
}

export function getComparisons(): Record<string, ComparisonTable> {
  return data?.product_comparison ?? {};
}

export function getProductData(): ProductData | null {
  return data;
}
