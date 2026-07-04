import type { BillableFeature, DemoUser } from "./types";

const wait = (duration = 420) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

export const seedFeatures: BillableFeature[] = [
  {
    id: "feat_caption",
    name: "Caption Generation",
    price: 50,
    usageCount: 482,
    active: true,
  },
  {
    id: "feat_invoice",
    name: "Invoice OCR",
    price: 120,
    usageCount: 214,
    active: true,
  },
  {
    id: "feat_payout",
    name: "Payout Risk Check",
    price: 80,
    usageCount: 139,
    active: false,
  },
];

export async function createFeature(input: { name: string; price: number }) {
  await wait();

  return {
    id: `feat_${Date.now()}`,
    name: input.name.trim(),
    price: input.price,
    usageCount: 0,
    active: true,
  } satisfies BillableFeature;
}

export async function registerDemoUser(input: { name: string; email: string }) {
  await wait(620);

  const cleanName = input.name.trim();

  return {
    id: `user_${Date.now()}`,
    name: cleanName,
    email: input.email.trim().toLowerCase(),
    accountNumber: "5343270516",
    accountName: cleanName || "PayMeter User",
    bankName: "Nomba",
  } satisfies DemoUser;
}
