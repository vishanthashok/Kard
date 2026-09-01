import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// West campus merchants and the rewards students can redeem with points.
const merchants = [
  {
    name: "West Campus Coffee",
    category: "Cafe",
    rewardRate: 2,
    rewards: [
      { title: "Free Drip Coffee", cost: 100 },
      { title: "Free Latte", cost: 250 },
    ],
  },
  {
    name: "Longhorn Grill",
    category: "Dining",
    rewardRate: 1.5,
    rewards: [
      { title: "Free Side", cost: 150 },
      { title: "Free Burger", cost: 400 },
    ],
  },
  {
    name: "Campus Bookstore",
    category: "Retail",
    rewardRate: 1,
    rewards: [
      { title: "$5 Off Supplies", cost: 300 },
      { title: "Free Notebook", cost: 120 },
    ],
  },
  {
    name: "Guad Street Laundry",
    category: "Services",
    rewardRate: 3,
    rewards: [{ title: "Free Wash Cycle", cost: 200 }],
  },
];

async function main() {
  for (const { rewards, ...merchant } of merchants) {
    const record = await prisma.merchant.upsert({
      where: { name: merchant.name },
      update: merchant,
      create: merchant,
    });
    for (const reward of rewards) {
      const existing = await prisma.reward.findFirst({
        where: { merchantId: record.id, title: reward.title },
      });
      if (existing) {
        await prisma.reward.update({ where: { id: existing.id }, data: reward });
      } else {
        await prisma.reward.create({ data: { ...reward, merchantId: record.id } });
      }
    }
  }
  const count = await prisma.merchant.count();
  console.log(`Seeded database: ${count} merchants ready.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
