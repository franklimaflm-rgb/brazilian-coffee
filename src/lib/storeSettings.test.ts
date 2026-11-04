// @ts-nocheck -- run with `bun test`
import { expect, test } from "bun:test";
import { computeDeliveryFee, isOpenAt, meetsMinimum, DEFAULT_SETTINGS } from "./storeSettings";

const hours = DEFAULT_SETTINGS.opening_hours; // Mon–Sat 08:00–18:00, Sun 09:00–16:00

test("delivery fee is base fee plus price per km", () => {
  expect(computeDeliveryFee({ delivery_base_fee: 3, delivery_fee_per_km: 2 }, 2.5)).toBe(8);
});

test("delivery fee never charges beyond the 5km radius", () => {
  expect(computeDeliveryFee({ delivery_base_fee: 3, delivery_fee_per_km: 2 }, 9)).toBe(13);
});

test("orders below the minimum are rejected", () => {
  expect(meetsMinimum({ min_order_amount: 15 }, 14.99)).toBe(false);
  expect(meetsMinimum({ min_order_amount: 15 }, 15)).toBe(true);
});

test("shop is open inside hours and closed after closing time (London time)", () => {
  // Wednesday 4 Nov 2026 — London is on GMT (UTC+0)
  expect(isOpenAt(hours, new Date("2026-11-04T10:00:00Z"))).toBe(true);
  expect(isOpenAt(hours, new Date("2026-11-04T18:00:00Z"))).toBe(false);
});

test("a day marked closed rejects orders all day", () => {
  const closedSunday = hours.map((d, i) => (i === 6 ? { ...d, open: false } : d));
  expect(isOpenAt(closedSunday, new Date("2026-11-08T12:00:00Z"))).toBe(false);
});
