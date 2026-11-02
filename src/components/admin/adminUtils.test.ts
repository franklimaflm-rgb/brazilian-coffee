// @ts-nocheck -- run with `bun test`
import { expect, test } from "bun:test";
import { computeStats, type AdminOrder } from "./adminUtils";

const o = (status: string, total: number): AdminOrder => ({
  id: Math.random().toString(), order_number: "X", status, total_amount: total, created_at: new Date().toISOString(),
});

test("cancelled orders are excluded from revenue", () => {
  const s = computeStats([o("pending", 10), o("cancelled", 50), o("delivered", 20)]);
  expect(s.today).toBe(30);
  expect(s.average).toBe(15);
});
