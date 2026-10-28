import { Card, CardContent } from "@/components/ui/card";
import { AdminOrder, computeStats, money } from "./adminUtils";

export const StatsCards = ({ orders }: { orders: AdminOrder[] }) => {
  const s = computeStats(orders);
  const items = [
    { label: "Receita hoje", value: money(s.today), hint: `${s.ordersToday} pedido(s) hoje` },
    { label: "Últimos 7 dias", value: money(s.week) },
    { label: "Este mês", value: money(s.month) },
    { label: "Pendentes", value: String(s.pending), hint: "aguardando confirmação" },
    { label: "Ticket médio", value: money(s.average) },
    { label: "Mais vendido", value: s.bestSeller },
  ];
  return (
    <div className="grid grid-cols-2 tablet:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((i) => (
        <Card key={i.label} className="rounded-2xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{i.label}</p>
            <p className="text-lg font-bold mt-1 truncate">{i.value}</p>
            {i.hint && <p className="text-xs text-muted-foreground mt-0.5">{i.hint}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
