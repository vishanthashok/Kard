import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/server.js";
import { prisma } from "../src/db.js";

let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  base = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

test("health check responds ok", async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, "ok");
});

test("merchants are seeded", async () => {
  const res = await fetch(`${base}/api/merchants`);
  assert.equal(res.status, 200);
  const merchants = await res.json();
  assert.ok(merchants.length >= 1, "expected at least one seeded merchant");
  assert.ok(merchants[0].rewards.length >= 1, "merchant should have rewards");
});

test("full earn and redeem flow", async () => {
  const merchants = await (await fetch(`${base}/api/merchants`)).json();
  const merchant = merchants[0];
  const reward = merchant.rewards.sort((a, b) => a.cost - b.cost)[0];

  const created = await fetch(`${base}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Student",
      email: `test-${Date.now()}-${Math.random()}@utexas.edu`,
    }),
  });
  assert.equal(created.status, 201);
  const student = await created.json();
  assert.equal(student.points, 0);

  // Spend enough to afford the cheapest reward.
  const spend = Math.ceil(reward.cost / merchant.rewardRate);
  const earn = await fetch(`${base}/api/students/${student.id}/earn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchantId: merchant.id, amount: spend }),
  });
  assert.equal(earn.status, 201);
  const earnBody = await earn.json();
  assert.ok(earnBody.balance >= reward.cost, "should have enough points to redeem");

  const redeem = await fetch(`${base}/api/students/${student.id}/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rewardId: reward.id }),
  });
  assert.equal(redeem.status, 201);
  const redeemBody = await redeem.json();
  assert.equal(redeemBody.balance, earnBody.balance - reward.cost);

  // Redeeming again without enough points must fail cleanly.
  const student2 = await (await fetch(`${base}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Broke Student",
      email: `broke-${Date.now()}-${Math.random()}@utexas.edu`,
    }),
  })).json();
  const failRedeem = await fetch(`${base}/api/students/${student2.id}/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rewardId: reward.id }),
  });
  assert.equal(failRedeem.status, 400);
});
