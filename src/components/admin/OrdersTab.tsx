import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Copy, Download, Mail, MapPin, MessageCircle, Phone, Printer, Search, X } from "lucide-react";
import { toast } from "sonner";
import {
  AdminOrder, NEXT_STEP, STATUS_LABELS, addressLine, downloadFile, formatDate, money, orderSlip, ordersToCsv, startOfDay,
} from "./adminUtils";

type Props = {
  orders: AdminOrder[];
  onStatus: (id: string, status: string) => Promise<unknown>;
};

const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" =>
  s === "cancelled" ? "destructive" : s === "pending" ? "default" : s === "delivered" ? "outline" : "secondary";

const printSlip = (o: AdminOrder) => {
  const w = window.open("", "_blank", "width=420,height=600");
  if (!w) return toast.error("Permita pop-ups para imprimir.");
  w.document.write(`<pre style="font:14px monospace;white-space:pre-wrap">${orderSlip(o).replace(/</g, "&lt;")}</pre>`);
  w.document.close();
  w.focus();
  w.print();
};

const whatsappLink = (phone: string) => `https://wa.me/${phone.replace(/[^\d]/g, "")}`;

export const OrdersTab = ({ orders, onStatus }: Props) => {
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const from = period === "today" ? startOfDay(0) : period === "7d" ? startOfDay(6) : null;
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (from && new Date(o.created_at) < from) return false;
      if (!term) return true;
      return [o.order_number, o.customers?.name, o.customers?.email, o.customers?.phone]
        .some((v) => v?.toLowerCase().includes(term));
    });
  }, [orders, status, period, q]);

  const change = async (o: AdminOrder, next: string) => {
    setBusy(o.id);
    try {
      await onStatus(o.id, next);
      toast.success(`Pedido #${o.order_number}: ${STATUS_LABELS[next]}`);
    } catch {
      toast.error("Não foi possível atualizar o pedido.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col tablet:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar nº do pedido, nome, e-mail ou telefone" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="tablet:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="tablet:w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="all">Tudo</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => downloadFile(`pedidos-${new Date().toISOString().slice(0, 10)}.csv`, ordersToCsv(filtered))}>
          <Download className="h-4 w-4 mr-2" />Exportar
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} pedido(s)</p>

      {filtered.length === 0 && (
        <Card className="rounded-2xl"><CardContent className="p-8 text-center text-muted-foreground">Nenhum pedido encontrado.</CardContent></Card>
      )}

      {filtered.map((o) => {
        const next = NEXT_STEP[o.status];
        const addr = addressLine(o);
        const phone = o.customers?.phone;
        const closed = o.status === "delivered" || o.status === "cancelled";
        return (
          <Card key={o.id} className="rounded-2xl">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Pedido #{o.order_number}</h3>
                    <Badge variant={statusVariant(o.status)}>{STATUS_LABELS[o.status] ?? o.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDate(o.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{money(o.total_amount)}</p>
                  {Number(o.discount_amount) > 0 && <p className="text-xs text-muted-foreground">desconto {money(Number(o.discount_amount))}</p>}
                </div>
              </div>

              <div className="grid tablet:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="font-medium">{o.customers?.name ?? "Cliente"}</p>
                  {o.customers?.email && <p className="text-muted-foreground">{o.customers.email}</p>}
                  {phone && <p className="text-muted-foreground">{phone}</p>}
                  {addr && <p className="text-muted-foreground">{addr}</p>}
                  {o.delivery_instructions && <p className="italic">“{o.delivery_instructions}”</p>}
                </div>
                <div className="space-y-1">
                  {(o.order_items ?? []).length === 0 ? (
                    <p className="text-muted-foreground">Sem itens registrados.</p>
                  ) : (
                    o.order_items!.map((i) => (
                      <div key={i.id} className="flex justify-between">
                        <span>{i.quantity}x {i.coffee_products?.name ?? i.coffee_product_id}</span>
                        <span>{money(i.total_price)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {next && (
                  <Button size="sm" disabled={busy === o.id} onClick={() => change(o, next.status)}>{next.label}</Button>
                )}
                {!closed && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" disabled={busy === o.id}><X className="h-4 w-4 mr-1" />Cancelar</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar pedido #{o.order_number}?</AlertDialogTitle>
                        <AlertDialogDescription>O pedido sai das receitas. Avise o cliente se necessário.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => change(o, "cancelled")}>Cancelar pedido</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Select value={o.status} onValueChange={(v) => change(o, v)}>
                  <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1 ml-auto">
                  {phone && <Button asChild size="icon" variant="ghost" aria-label="Ligar"><a href={`tel:${phone}`}><Phone className="h-4 w-4" /></a></Button>}
                  {phone && <Button asChild size="icon" variant="ghost" aria-label="WhatsApp"><a href={whatsappLink(phone)} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /></a></Button>}
                  {o.customers?.email && <Button asChild size="icon" variant="ghost" aria-label="E-mail"><a href={`mailto:${o.customers.email}?subject=Pedido%20%23${o.order_number}`}><Mail className="h-4 w-4" /></a></Button>}
                  {addr && <Button asChild size="icon" variant="ghost" aria-label="Abrir no mapa"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`} target="_blank" rel="noreferrer"><MapPin className="h-4 w-4" /></a></Button>}
                  <Button size="icon" variant="ghost" aria-label="Copiar resumo" onClick={() => navigator.clipboard.writeText(orderSlip(o)).then(() => toast.success("Resumo copiado"))}><Copy className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label="Imprimir" onClick={() => printSlip(o)}><Printer className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
