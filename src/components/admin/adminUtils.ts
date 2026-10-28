export type AdminOrder = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  discount_amount?: number;
  created_at: string;
  delivery_instructions?: string | null;
  customers?: { id: string; name: string; email: string; phone: string | null } | null;
  addresses?: { street: string; city: string; postal_code: string; country: string } | null;
  order_items?: { id: string; coffee_product_id: string; quantity: number; unit_price: number; total_price: number; coffee_products?: { name: string } | null }[];
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const NEXT_STEP: Record<string, { status: string; label: string } | undefined> = {
  pending: { status: "confirmed", label: "Confirmar" },
  confirmed: { status: "preparing", label: "Preparar" },
  preparing: { status: "out_for_delivery", label: "Saiu para entrega" },
  out_for_delivery: { status: "delivered", label: "Marcar entregue" },
};

export const money = (n: number) => `£${Number(n || 0).toFixed(2)}`;

export const formatDate = (d: string) =>
  new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const addressLine = (o: AdminOrder) =>
  o.addresses ? `${o.addresses.street}, ${o.addresses.city} ${o.addresses.postal_code}` : "";

export const orderSlip = (o: AdminOrder) =>
  [
    `Pedido #${o.order_number} — ${formatDate(o.created_at)}`,
    `Cliente: ${o.customers?.name ?? "-"}  Tel: ${o.customers?.phone ?? "-"}`,
    `Endereço: ${addressLine(o) || "-"}`,
    o.delivery_instructions ? `Instruções: ${o.delivery_instructions}` : "",
    "",
    ...(o.order_items ?? []).map((i) => `${i.quantity}x ${i.coffee_products?.name ?? i.coffee_product_id}  ${money(i.total_price)}`),
    "",
    `Total: ${money(o.total_amount)}`,
  ].filter((l, idx, arr) => l !== "" || arr[idx - 1] !== "").join("\n");

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export const ordersToCsv = (orders: AdminOrder[]) => {
  const header = ["Pedido", "Data", "Status", "Cliente", "Email", "Telefone", "Endereço", "Itens", "Desconto", "Total"];
  const rows = orders.map((o) => [
    o.order_number,
    formatDate(o.created_at),
    STATUS_LABELS[o.status] ?? o.status,
    o.customers?.name,
    o.customers?.email,
    o.customers?.phone,
    addressLine(o),
    (o.order_items ?? []).map((i) => `${i.quantity}x ${i.coffee_products?.name ?? i.coffee_product_id}`).join("; "),
    Number(o.discount_amount ?? 0).toFixed(2),
    Number(o.total_amount).toFixed(2),
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
};

export const downloadFile = (name: string, content: string, type = "text/csv;charset=utf-8") => {
  const url = URL.createObjectURL(new Blob(["\ufeff" + content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

export const startOfDay = (offsetDays = 0) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offsetDays);
  return d;
};

/** Revenue stats; cancelled orders never count. */
export const computeStats = (orders: AdminOrder[], now = new Date()) => {
  const valid = orders.filter((o) => o.status !== "cancelled");
  const sumSince = (from: Date) => valid.filter((o) => new Date(o.created_at) >= from).reduce((s, o) => s + Number(o.total_amount), 0);
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const week = new Date(today); week.setDate(week.getDate() - 6);
  const month = new Date(today.getFullYear(), today.getMonth(), 1);
  const total = valid.reduce((s, o) => s + Number(o.total_amount), 0);
  const counts: Record<string, number> = {};
  valid.forEach((o) => (o.order_items ?? []).forEach((i) => {
    const n = i.coffee_products?.name ?? i.coffee_product_id;
    counts[n] = (counts[n] ?? 0) + i.quantity;
  }));
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return {
    today: sumSince(today),
    week: sumSince(week),
    month: sumSince(month),
    total,
    average: valid.length ? total / valid.length : 0,
    pending: orders.filter((o) => o.status === "pending").length,
    ordersToday: orders.filter((o) => new Date(o.created_at) >= today).length,
    bestSeller: best ? `${best[0]} (${best[1]})` : "—",
  };
};
