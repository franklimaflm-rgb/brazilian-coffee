// Shop settings the owner edits in the admin panel (opening hours, delivery fee, minimum order).
// The order function in the backend enforces the same rules; this file mirrors them for the UI.

export type DayHours = { open: boolean; from: string; to: string };

export type StoreSettings = {
  delivery_base_fee: number;
  delivery_fee_per_km: number;
  min_order_amount: number;
  opening_hours: DayHours[]; // 7 entries, Monday first
};

export const MAX_DELIVERY_KM = 5;
export const STORE_TIMEZONE = "Europe/London";

export const DAY_NAMES: Record<"pt-BR" | "en", string[]> = {
  "pt-BR": ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};

export const DEFAULT_SETTINGS: StoreSettings = {
  delivery_base_fee: 3,
  delivery_fee_per_km: 2,
  min_order_amount: 0,
  opening_hours: [
    ...Array.from({ length: 6 }, () => ({ open: true, from: "08:00", to: "18:00" })),
    { open: true, from: "09:00", to: "16:00" },
  ],
};

export const normalizeSettings = (row: Partial<Record<keyof StoreSettings, unknown>> | null | undefined): StoreSettings => {
  if (!row) return DEFAULT_SETTINGS;
  const hours = Array.isArray(row.opening_hours) && row.opening_hours.length === 7
    ? (row.opening_hours as DayHours[]).map((d) => ({ open: !!d?.open, from: String(d?.from ?? "08:00"), to: String(d?.to ?? "18:00") }))
    : DEFAULT_SETTINGS.opening_hours;
  return {
    delivery_base_fee: Number(row.delivery_base_fee ?? DEFAULT_SETTINGS.delivery_base_fee),
    delivery_fee_per_km: Number(row.delivery_fee_per_km ?? DEFAULT_SETTINGS.delivery_fee_per_km),
    min_order_amount: Number(row.min_order_amount ?? DEFAULT_SETTINGS.min_order_amount),
    opening_hours: hours,
  };
};

export const computeDeliveryFee = (s: Pick<StoreSettings, "delivery_base_fee" | "delivery_fee_per_km">, distanceKm: number) =>
  Math.round((s.delivery_base_fee + Math.min(distanceKm, MAX_DELIVERY_KM) * s.delivery_fee_per_km) * 100) / 100;

export const meetsMinimum = (s: Pick<StoreSettings, "min_order_amount">, itemsSubtotal: number) =>
  itemsSubtotal >= s.min_order_amount;

/** Day index (0 = Monday) and "HH:MM" for a moment, in the shop's timezone. */
export const localDayAndTime = (at: Date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: STORE_TIMEZONE, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday"));
  return { day, time: `${get("hour")}:${get("minute")}` };
};

export const isOpenAt = (hours: DayHours[], at: Date = new Date()) => {
  const { day, time } = localDayAndTime(at);
  const d = hours[day];
  if (!d) return true;
  return d.open && time >= d.from && time < d.to;
};

export const validateHours = (hours: DayHours[]): string | null => {
  for (let i = 0; i < hours.length; i++) {
    const d = hours[i];
    if (d.open && !(d.from < d.to)) return `${DAY_NAMES["pt-BR"][i]}: o horário de fechamento deve ser depois da abertura.`;
  }
  return null;
};

/** Groups consecutive days with identical hours: "Segunda–Sábado: 08:00–18:00 · Domingo: 09:00–16:00". */
export const formatHours = (hours: DayHours[], lang: "pt-BR" | "en") => {
  const names = DAY_NAMES[lang];
  const closed = lang === "pt-BR" ? "Fechado" : "Closed";
  const label = (d: DayHours) => (d.open ? `${d.from}–${d.to}` : closed);
  const groups: { start: number; end: number; text: string }[] = [];
  hours.forEach((d, i) => {
    const text = label(d);
    const last = groups[groups.length - 1];
    if (last && last.text === text) last.end = i;
    else groups.push({ start: i, end: i, text });
  });
  return groups
    .map((g) => `${g.start === g.end ? names[g.start] : `${names[g.start]}–${names[g.end]}`}: ${g.text}`)
    .join(" · ");
};

/** schema.org openingHours, e.g. ["Mo-Sa 08:00-18:00", "Su 09:00-16:00"]. */
export const schemaOpeningHours = (hours: DayHours[]) => {
  const codes = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  return hours.flatMap((d, i) => (d.open ? [`${codes[i]} ${d.from}-${d.to}`] : []));
};
