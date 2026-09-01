import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

function generateCardNumber() {
  // 16-digit card number rendered in groups of four (e.g. 4021 8834 ...).
  let digits = "";
  for (let i = 0; i < 16; i++) digits += Math.floor(Math.random() * 10);
  return digits.match(/.{1,4}/g).join(" ");
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// --- Health ---------------------------------------------------------------
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "kard", time: new Date().toISOString() });
});

// --- Merchants ------------------------------------------------------------
app.get(
  "/api/merchants",
  asyncHandler(async (_req, res) => {
    const merchants = await prisma.merchant.findMany({
      orderBy: { name: "asc" },
      include: { rewards: { orderBy: { cost: "asc" } } },
    });
    res.json(merchants);
  })
);

// --- Students / cards -----------------------------------------------------
app.post(
  "/api/students",
  asyncHandler(async (req, res) => {
    const { name, email } = req.body ?? {};
    if (!name || !email) {
      return res.status(400).json({ error: "name and email are required" });
    }
    const existing = await prisma.student.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "A card already exists for that email" });
    }
    const student = await prisma.student.create({
      data: { name, email, cardNumber: generateCardNumber() },
    });
    res.status(201).json(student);
  })
);

app.get(
  "/api/students/:id",
  asyncHandler(async (req, res) => {
    const student = await prisma.student.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          include: { merchant: true },
        },
      },
    });
    if (!student) return res.status(404).json({ error: "Card not found" });
    res.json(student);
  })
);

// --- Earn points (spend money) -------------------------------------------
app.post(
  "/api/students/:id/earn",
  asyncHandler(async (req, res) => {
    const studentId = Number(req.params.id);
    const { merchantId, amount } = req.body ?? {};
    const spend = Number(amount);
    if (!merchantId || !Number.isFinite(spend) || spend <= 0) {
      return res.status(400).json({ error: "merchantId and a positive amount are required" });
    }
    const [student, merchant] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId } }),
      prisma.merchant.findUnique({ where: { id: Number(merchantId) } }),
    ]);
    if (!student) return res.status(404).json({ error: "Card not found" });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const earned = Math.round(spend * merchant.rewardRate);
    const [, updated] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          type: "earn",
          amount: spend,
          points: earned,
          description: `Spent $${spend.toFixed(2)} at ${merchant.name}`,
          studentId,
          merchantId: merchant.id,
        },
      }),
      prisma.student.update({
        where: { id: studentId },
        data: { points: { increment: earned } },
      }),
    ]);
    res.status(201).json({ earned, balance: updated.points });
  })
);

// --- Redeem a reward (spend points) --------------------------------------
app.post(
  "/api/students/:id/redeem",
  asyncHandler(async (req, res) => {
    const studentId = Number(req.params.id);
    const { rewardId } = req.body ?? {};
    if (!rewardId) return res.status(400).json({ error: "rewardId is required" });

    const [student, reward] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId } }),
      prisma.reward.findUnique({
        where: { id: Number(rewardId) },
        include: { merchant: true },
      }),
    ]);
    if (!student) return res.status(404).json({ error: "Card not found" });
    if (!reward) return res.status(404).json({ error: "Reward not found" });
    if (student.points < reward.cost) {
      return res.status(400).json({
        error: `Not enough points: need ${reward.cost}, have ${student.points}`,
      });
    }

    const [, updated] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          type: "redeem",
          amount: 0,
          points: -reward.cost,
          description: `Redeemed "${reward.title}" at ${reward.merchant.name}`,
          studentId,
          merchantId: reward.merchantId,
        },
      }),
      prisma.student.update({
        where: { id: studentId },
        data: { points: { decrement: reward.cost } },
      }),
    ]);
    res.status(201).json({ redeemed: reward.title, balance: updated.points });
  })
);

// --- Static frontend ------------------------------------------------------
app.use(express.static(path.join(__dirname, "..", "public")));

// --- Error handling -------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = Number(process.env.PORT) || 3000;

// Only listen when run directly (not when imported by tests).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Kard server listening on http://0.0.0.0:${PORT}`);
  });
}

export { app };
