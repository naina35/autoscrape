export enum PackId {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
}

export type CreditsPack = {
  id: PackId;
  name: string;
  label: string;
  credits: number;
  price: number;
  priceId: string;
};

export const CreditsPack: CreditsPack[] = [
  {
    id: PackId.SMALL,
    name: "Small Pack",
    label: "1,000 Credits",
    credits: 1000,
    price: 100000,
    priceId: process.env.RZ_SMALL_PACK_PRICE_ID!,
  },
  {
    id: PackId.MEDIUM,
    name: "Medium Pack",
    label: "5,000 Credits",
    credits: 5000,
    price: 400000,
    priceId: process.env.RZ_MEDIUM_PACK_PRICE_ID!,
  },
  {
    id: PackId.LARGE,
    name: "Large Pack",
    label: "10,000 Credits",
    credits: 10000,
    price: 600000,
    priceId: process.env.RZ_LARGE_PACK_PRICE_ID!,
  },
];

export function getCreditsPack(id: PackId) {
  return CreditsPack.find((p) => p.id === id);
}
