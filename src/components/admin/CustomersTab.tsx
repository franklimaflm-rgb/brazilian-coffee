import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AdminOrder, formatDate, money } from "./adminUtils";

export const CustomersTab = ({ orders }: { orders: AdminOrder[] }) => {
  const [q, setQ] = useState("");
  const customers = useMemo(() => {
    const map = new Map<string, { name: string; email: string; phone: string | null; count: number; spent: number; last: string }>();
    orders.forEach((o) => {
      const c = o.customers;
      if (!c) return;
      const key = c.email.toLowerCase();
      const cur = map.get(key) ?? { name: c.name, email: c.email, phone: c.phone, count: 0, spent: 0, last: o.created_at };
      cur.count += 1;
      if (o.status !== "cancelled") cur.spent += Number(o.total_amount);
      if (o.created_at > cur.last) cur.last = o.created_at;
      map.set(key, cur);
    });
    const term = q.trim().toLowerCase();
    return [...map.values()]
      .filter((c) => !term || [c.name, c.email, c.phone].some((v) => v?.toLowerCase().includes(term)))
      .sort((a, b) => b.spent - a.spent);
  }, [orders, q]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar cliente" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <p className="text-sm text-muted-foreground">{customers.length} cliente(s)</p>
      {customers.map((c) => (
        <Card key={c.email} className="rounded-2xl">
          <CardContent className="p-4 flex flex-wrap justify-between gap-2 text-sm">
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-muted-foreground">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{money(c.spent)}</p>
              <p className="text-muted-foreground">{c.count} pedido(s) · último {formatDate(c.last)}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
