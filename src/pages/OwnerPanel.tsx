import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOwnerSession } from "@/hooks/useOwnerSession";
import { type Store, uploadStoreImage } from "@/lib/platform";
import { DAY_NAMES, normalizeSettings, type DayHours } from "@/lib/storeSettings";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Loader2, LogOut, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const money = (n: number) => `£${Number(n).toFixed(2)}`;
const STATUS: Record<string, string> = { pending: "Pendente", confirmed: "Confirmado", preparing: "Preparando", out_for_delivery: "Saiu para entrega", delivered: "Entregue", cancelled: "Cancelado" };

type Product = { id: string; name: string; description: string | null; price: number; image_url: string | null; available: boolean };
type Order = { id: string; order_number: string; status: string; total_amount: number; created_at: string; delivery_instructions: string | null;
  customers: { name: string; email: string; phone: string | null } | null; addresses: { street: string; city: string; postal_code: string } | null;
  order_items: { quantity: number; total_price: number; coffee_products: { name: string } | null }[] };

const ImageInput = ({ storeId, onUrl, label }: { storeId: string; onUrl: (u: string) => void; label: string }) => {
  const [busy, setBusy] = useState(false);
  return (
    <div><Label>{label}</Label>
      <Input type="file" accept="image/*" disabled={busy} onChange={async (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        setBusy(true);
        try { onUrl(await uploadStoreImage(storeId, file)); toast.success("Imagem enviada"); }
        catch (err) { toast.error(err instanceof Error ? err.message : "Falha no envio"); }
        setBusy(false);
      }} />
    </div>
  );
};

const ProductsTab = ({ store }: { store: Store }) => {
  const [items, setItems] = useState<Product[]>([]);
  const [draft, setDraft] = useState({ name: "", description: "", price: "", image_url: "" });
  const load = useCallback(async () => {
    const { data } = await supabase.from("coffee_products").select("id, name, description, price, image_url, available").eq("store_id", store.id).order("name");
    setItems((data as Product[]) ?? []);
  }, [store.id]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    const price = Number(draft.price);
    if (!draft.name.trim() || draft.name.length > 100) return toast.error("Informe o nome do produto.");
    if (!(price > 0) || price > 1000) return toast.error("Preço inválido.");
    const { error } = await supabase.from("coffee_products").insert({
      id: crypto.randomUUID(), store_id: store.id, name: draft.name.trim(), description: draft.description.trim().slice(0, 500) || null, price, image_url: draft.image_url || null, available: true,
    });
    if (error) return toast.error("Não foi possível adicionar.");
    setDraft({ name: "", description: "", price: "", image_url: "" }); load();
  };
  const update = async (p: Product, patch: Partial<Product>) => {
    const { error } = await supabase.from("coffee_products").update(patch).eq("id", p.id);
    if (error) toast.error("Não foi possível salvar."); else load();
  };
  const remove = async (p: Product) => {
    const { error } = await supabase.from("coffee_products").delete().eq("id", p.id);
    if (error) { toast.error("Este produto já tem pedidos; marque-o como indisponível."); return; }
    load();
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl"><CardContent className="p-4 grid gap-3 tablet:grid-cols-2">
        <div><Label htmlFor="p-name">Nome</Label><Input id="p-name" value={draft.name} maxLength={100} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
        <div><Label htmlFor="p-price">Preço (£)</Label><Input id="p-price" type="number" min={0} step="0.10" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></div>
        <div className="tablet:col-span-2"><Label htmlFor="p-desc">Descrição</Label><Textarea id="p-desc" value={draft.description} maxLength={500} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
        <ImageInput storeId={store.id} label="Foto (opcional)" onUrl={(u) => setDraft((d) => ({ ...d, image_url: u }))} />
        <div className="flex items-end"><Button onClick={add} className="w-full"><Plus className="w-4 h-4 mr-1" />Adicionar produto</Button></div>
      </CardContent></Card>
      {items.length === 0 && <p className="text-muted-foreground">Nenhum produto ainda.</p>}
      {items.map((p) => (
        <Card key={p.id} className="rounded-2xl"><CardContent className="p-4 flex gap-3 items-center flex-wrap">
          {p.image_url && <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-xl object-cover" />}
          <div className="flex-1 min-w-[10rem]"><p className="font-semibold">{p.name}</p><p className="text-sm text-muted-foreground">{money(p.price)}</p></div>
          <Input type="number" className="w-24" defaultValue={p.price} aria-label={`Preço de ${p.name}`} onBlur={(e) => { const v = Number(e.target.value); if (v > 0 && v <= 1000 && v !== Number(p.price)) update(p, { price: v }); }} />
          <div className="flex items-center gap-2 text-sm"><Switch checked={p.available} onCheckedChange={(v) => update(p, { available: v })} aria-label={`${p.name} disponível`} />{p.available ? "Disponível" : "Esgotado"}</div>
          <Button size="icon" variant="ghost" aria-label={`Apagar ${p.name}`} onClick={() => remove(p)}><Trash2 className="w-4 h-4" /></Button>
        </CardContent></Card>
      ))}
    </div>
  );
};

const OrdersTab = ({ store }: { store: Store }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from("orders").select("id, order_number, status, total_amount, created_at, delivery_instructions, customers(name, email, phone), addresses(street, city, postal_code), order_items(quantity, total_price, coffee_products(name))")
      .eq("store_id", store.id).order("created_at", { ascending: false }).limit(200);
    setOrders((data as unknown as Order[]) ?? []);
  }, [store.id]);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status: status as Order["status"] as never }).eq("id", id);
    if (error) toast.error("Não foi possível alterar."); else load();
  };
  if (orders.length === 0) return <p className="text-muted-foreground">Nenhum pedido ainda. Compartilhe o link da sua loja!</p>;
  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <Card key={o.id} className="rounded-2xl"><CardContent className="p-4 space-y-2">
          <div className="flex justify-between flex-wrap gap-2">
            <div><p className="font-semibold">#{o.order_number} · {money(o.total_amount)}</p><p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</p></div>
            <Select value={o.status} onValueChange={(v) => setStatus(o.id, v)}>
              <SelectTrigger className="w-48" aria-label="Status do pedido"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <p className="text-sm">{o.customers?.name} · {o.customers?.email}{o.customers?.phone ? ` · ${o.customers.phone}` : ""}</p>
          {o.addresses && <p className="text-sm text-muted-foreground">{o.addresses.street}, {o.addresses.city}, {o.addresses.postal_code}</p>}
          <p className="text-sm">{o.order_items.map((i) => `${i.quantity}x ${i.coffee_products?.name ?? "?"}`).join(", ")}</p>
          {o.delivery_instructions && <p className="text-sm italic">{o.delivery_instructions}</p>}
        </CardContent></Card>
      ))}
    </div>
  );
};

const StoreTab = ({ store, onSaved }: { store: Store; onSaved: () => void }) => {
  const [f, setF] = useState({ ...store, opening_hours: normalizeSettings({ opening_hours: store.opening_hours }).opening_hours });
  const [saving, setSaving] = useState(false);
  const setDay = (i: number, p: Partial<DayHours>) => setF({ ...f, opening_hours: f.opening_hours.map((d, j) => (j === i ? { ...d, ...p } : d)) });
  const save = async () => {
    const fee = Number(f.delivery_fee), min = Number(f.min_order_amount);
    if (!(fee >= 0 && fee <= 100) || !(min >= 0 && min <= 1000)) return toast.error("Valores inválidos.");
    if (f.opening_hours.some((d) => d.open && d.from >= d.to)) return toast.error("O horário de fechar deve ser depois do de abrir.");
    setSaving(true);
    const { error } = await supabase.from("stores").update({
      name: f.name.trim(), description: f.description?.trim() || null, whatsapp: f.whatsapp?.trim() || null, address: f.address?.trim() || null,
      primary_color: f.primary_color, logo_url: f.logo_url, delivery_fee: fee, min_order_amount: min, opening_hours: f.opening_hours,
    }).eq("id", store.id);
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar.");
    toast.success("Loja atualizada"); onSaved();
  };
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl"><CardContent className="p-4 grid gap-3 tablet:grid-cols-2">
        <div><Label htmlFor="st-name">Nome</Label><Input id="st-name" value={f.name} maxLength={80} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><Label htmlFor="st-wa">WhatsApp</Label><Input id="st-wa" value={f.whatsapp ?? ""} maxLength={30} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
        <div className="tablet:col-span-2"><Label htmlFor="st-desc">Descrição</Label><Textarea id="st-desc" value={f.description ?? ""} maxLength={500} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div><Label htmlFor="st-addr">Endereço</Label><Input id="st-addr" value={f.address ?? ""} maxLength={200} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
        <div><Label htmlFor="st-color">Cor da marca</Label><Input id="st-color" type="color" className="w-20 h-10 p-1" value={f.primary_color} onChange={(e) => setF({ ...f, primary_color: e.target.value })} /></div>
        <div className="flex items-center gap-3">{f.logo_url && <img src={f.logo_url} alt="Logo" className="w-12 h-12 rounded-xl object-cover" />}
          <ImageInput storeId={store.id} label="Logo" onUrl={(u) => setF((s) => ({ ...s, logo_url: u }))} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label htmlFor="st-fee">Taxa de entrega (£)</Label><Input id="st-fee" type="number" min={0} step="0.10" value={f.delivery_fee} onChange={(e) => setF({ ...f, delivery_fee: e.target.value as unknown as number })} /></div>
          <div><Label htmlFor="st-min">Pedido mínimo (£)</Label><Input id="st-min" type="number" min={0} step="0.50" value={f.min_order_amount} onChange={(e) => setF({ ...f, min_order_amount: e.target.value as unknown as number })} /></div>
        </div>
      </CardContent></Card>
      <Card className="rounded-2xl"><CardContent className="p-4 space-y-3">
        <h3 className="font-semibold">Horário de funcionamento (horário de Londres)</h3>
        {f.opening_hours.map((d, i) => (
          <div key={i} className="grid grid-cols-[6.5rem_auto_1fr] items-center gap-3">
            <span className="font-medium">{DAY_NAMES["pt-BR"][i]}</span>
            <Switch checked={d.open} onCheckedChange={(v) => setDay(i, { open: v })} aria-label={`${DAY_NAMES["pt-BR"][i]} aberto`} />
            {d.open ? <div className="flex items-center gap-2">
              <Input type="time" className="w-28" value={d.from} onChange={(e) => setDay(i, { from: e.target.value })} aria-label={`${DAY_NAMES["pt-BR"][i]} abre`} />
              <span className="text-sm text-muted-foreground">até</span>
              <Input type="time" className="w-28" value={d.to} onChange={(e) => setDay(i, { to: e.target.value })} aria-label={`${DAY_NAMES["pt-BR"][i]} fecha`} />
            </div> : <span className="text-sm text-muted-foreground">Fechado</span>}
          </div>
        ))}
      </CardContent></Card>
      <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar loja"}</Button></div>
    </div>
  );
};

const OwnerPanel = () => {
  const { user, ready } = useOwnerSession();
  const [stores, setStores] = useState<Store[] | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("stores").select("*").eq("owner_id", user.id).order("created_at");
    const list = (data as unknown as Store[]) ?? [];
    setStores(list);
    setCurrent((c) => c ?? list[0]?.id ?? null);
  }, [user]);
  useEffect(() => { load(); }, [load]);

  if (!ready) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;
  if (!user) return <Navigate to="/auth?next=/painel" replace />;
  if (!stores) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;
  if (stores.length === 0) return <Navigate to="/criar-loja" replace />;
  const store = stores.find((s) => s.id === current) ?? stores[0];

  return (
    <div className="min-h-[100dvh] bg-background">
      <SEO title="Painel da minha loja" description="Gerencie sua loja." path="/painel" />
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg">{store.name}</h1>
            {!store.active && <Badge variant="destructive">Desativada</Badge>}
            {stores.length > 1 && (
              <Select value={store.id} onValueChange={setCurrent}>
                <SelectTrigger className="w-44" aria-label="Escolher loja"><SelectValue /></SelectTrigger>
                <SelectContent>{stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to={`/loja/${store.slug}`} target="_blank"><ExternalLink className="w-4 h-4 mr-1" />Ver loja</Link></Button>
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/loja/${store.slug}`); toast.success("Link copiado"); }}>Copiar link</Button>
            <Button variant="ghost" onClick={() => supabase.auth.signOut()}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="orders" key={store.id}>
          <TabsList><TabsTrigger value="orders">Pedidos</TabsTrigger><TabsTrigger value="menu">Cardápio</TabsTrigger><TabsTrigger value="store">Minha loja</TabsTrigger></TabsList>
          <TabsContent value="orders" className="mt-4"><OrdersTab store={store} /></TabsContent>
          <TabsContent value="menu" className="mt-4"><ProductsTab store={store} /></TabsContent>
          <TabsContent value="store" className="mt-4"><StoreTab store={store} onSaved={load} /></TabsContent>
        </Tabs>
        <p className="text-sm text-muted-foreground mt-8"><Link to="/criar-loja" className="underline">Criar outra loja</Link></p>
      </main>
    </div>
  );
};
export default OwnerPanel;
