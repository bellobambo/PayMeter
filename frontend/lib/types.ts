export type Founder = {
  id: string;
  name: string;
  email: string;
};

export type BillableFeature = {
  id: string;
  name: string;
  price: number;
  usageCount: number;
  active: boolean;
};

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
};

export type UsageEvent = {
  id: string;
  featureName: string;
  amount: number;
  status: "allowed" | "denied";
  createdAt: string;
};
