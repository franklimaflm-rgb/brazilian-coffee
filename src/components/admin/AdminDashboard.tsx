import { useEffect, useRef } from "react";
import { useAdmin, useAdminAuth, OrderStatus } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coffee, Loader2, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { StatsCards } from "./StatsCards";
import { OrdersTab } from "./OrdersTab";
import { MenuTab } from "./MenuTab";
import { CustomersTab } from "./CustomersTab";
import { ReferralsTab } from "./ReferralsTab";
import type { AdminOrder } from "./adminUtils";

const beep = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(); osc.stop(ctx.currentTime + 0.6);
  } catch { /* audio not allowed */ }
};

export const AdminDashboard = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const { orders, loading, error, updateOrderStatus, fetchOrders } = useAdmin(isAuthenticated);
  const { logout } = useAdminAuth();
  const list = orders as unknown as AdminOrder[];
  const known = useRef<Set<string> | null>(null);

  // Alert on orders that arrive while the panel is open.
  useEffect(() => {
    if (loading) return;
    const ids = new Set(list.map((o) => o.id));
    if (known.current) {
      const fresh = list.filter((o) => !known.current!.has(o.id));
      if (fresh.length) {
        beep();
        toast.success(`Novo pedido #${fresh[0].order_number}!`, { duration: 10000 });
      }
    }
    known.current = ids;
  }, [list, loading]);

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Coffee className="w-7 h-7 text-primary" />
            <div>
              <h1 className="font-bold text-lg leading-tight">Painel do Dono</h1>
              <p className="text-xs text-muted-foreground">Brazilian Coffee Academy</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" aria-label="Atualizar" onClick={() => fetchOrders()}><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="outline" onClick={logout}><LogOut className="h-4 w-4 mr-1" />Sair</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {loading && list.length === 0 ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <>
            {error && <p className="text-sm text-destructive">Erro ao carregar pedidos: {error}</p>}
            <StatsCards orders={list} />
            <Tabs defaultValue="orders">
              <TabsList className="w-full tablet:w-auto grid grid-cols-4 tablet:inline-flex">
                <TabsTrigger value="orders">Pedidos</TabsTrigger>
                <TabsTrigger value="menu">Cardápio</TabsTrigger>
                <TabsTrigger value="customers">Clientes</TabsTrigger>
                <TabsTrigger value="referrals">Indicações</TabsTrigger>
              </TabsList>
              <TabsContent value="orders" className="mt-4">
                <OrdersTab orders={list} onStatus={(id, s) => updateOrderStatus(id, s as OrderStatus)} />
              </TabsContent>
              <TabsContent value="menu" className="mt-4"><MenuTab /></TabsContent>
              <TabsContent value="customers" className="mt-4"><CustomersTab orders={list} /></TabsContent>
              <TabsContent value="referrals" className="mt-4"><ReferralsTab /></TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};
