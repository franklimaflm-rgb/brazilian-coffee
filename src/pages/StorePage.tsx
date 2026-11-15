import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { normalizeSettings, isOpenAt, formatHours } from "@/lib/storeSettings";
import type { Store } from "@/lib/platform";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Coffee, Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

type Product = { id: string; name: string; description: string | null; price: number; image_url: string | null };
const money = (n: number) => `£${n.toFixed(2)}`;

const checkout = z.object({
  name: z.string().trim().min(1, "Informe seu nome").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().max(30),
  street: z.string().trim().min(1, "Informe o endereço").max(200),
  city: z.string().trim().min(1, "Informe a cidade").max(100),
  postal_code: z.string().trim().min(1, "Informe o código postal").max(20),
  notes: z.string().trim().max(500),
});

const StorePage = () => {
  const { slug } = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [f, setF] = useState({ name: "", email: "", phone: "", street: "", city: "", postal_code: "", notes: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("stores").select("*").eq("slug", slug ?? "").eq("active", true).maybeSingle();
      if (s) {
        setStore(s as unknown as Store);
        const { data: p } = await supabase.from("coffee_products").select("id, name, description, price, image_url").eq("store_id", s.id).eq("available", true).order("name");
        setProducts((p as Product[]) ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  const hours = useMemo(() => normalizeSettings({ opening_hours: store?.opening_hours }).opening_hours, [store]);
  const open = store ? isOpenAt(hours) : false;
  const subtotal = products.reduce((t, p) => t + (cart[p.id] ?? 0) * Number(p.price), 0);
  const fee = Number(store?.delivery_fee ?? 0);
  const min = Number(store?.min_order_amount ?? 0);
  const add = (id: string, d: number) => setCart((c) => ({ ...c, [id]: Math.max(0, Math.min(100, (c[id] ?? 0) + d)) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    const parsed = checkout.safeParse(f);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (subtotal <= 0) return toast.error("Escolha pelo menos um produto.");
    if (subtotal < min) return toast.error(`Pedido mínimo: ${money(min)}`);
    const d = parsed.data;
    setSending(true);
    const { data, error } = await supabase.rpc("create_store_order", {
      _store_id: store.id,
      _customer: { name: d.name, email: d.email, phone: d.phone || null },
      _address: { street: d.street, city: d.city, postal_code: d.postal_code },
      _items: Object.entries(cart).filter(([, q]) => q > 0).map(([coffee_product_id, quantity]) => ({ coffee_product_id, quantity })),
      _instructions: d.notes || null,
    });
    setSending(false);
    if (error) return toast.error(error.message.includes("STORE_CLOSED") ? "A loja está fechada agora." : error.message.includes("MIN_ORDER") ? `Pedido mínimo: ${money(min)}` : "Não foi possível enviar o pedido.");
    setDone(String(data));
    setCart({});
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;
  if (!store) return <div className="max-w-xl mx-auto py-20 text-center"><h1 className="text-2xl font-bold">Loja não encontrada</h1></div>;

  const brand = { backgroundColor: store.primary_color };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="min-h-[100dvh] bg-background">
      <SEO title={store.name} description={store.description ?? `Peça online no ${store.name}`} path={`/loja/${store.slug}`} />
      <header className="text-primary-foreground" style={brand}>
        <div className="max-w-4xl mx-auto px-4 py-8 flex items-center gap-4">
          {store.logo_url ? <img src={store.logo_url} alt={`Logo ${store.name}`} className="w-16 h-16 rounded-2xl object-cover bg-card" /> : <Coffee className="w-12 h-12" />}
          <div>
            <h1 className="text-2xl tablet:text-3xl font-bold">{store.name}</h1>
            {store.description && <p className="opacity-90">{store.description}</p>}
            <p className="text-sm opacity-90 mt-1">{open ? "Aberto agora" : "Fechado agora"} · {formatHours(hours, "pt-BR")}</p>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8 grid tablet:grid-cols-[1fr_320px] gap-6">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Cardápio</h2>
          {products.length === 0 && <p className="text-muted-foreground">Esta loja ainda não tem produtos.</p>}
          {products.map((p) => (
            <Card key={p.id} className="rounded-2xl"><CardContent className="p-4 flex gap-4 items-center">
              {p.image_url && <img src={p.image_url} alt={p.name} className="w-20 h-20 rounded-xl object-cover" />}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{p.name}</h3>
                {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                <p className="font-medium mt-1">{money(Number(p.price))}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" aria-label={`Remover ${p.name}`} onClick={() => add(p.id, -1)}><Minus className="w-4 h-4" /></Button>
                <span className="w-6 text-center">{cart[p.id] ?? 0}</span>
                <Button size="icon" variant="outline" aria-label={`Adicionar ${p.name}`} onClick={() => add(p.id, 1)}><Plus className="w-4 h-4" /></Button>
              </div>
            </CardContent></Card>
          ))}
        </section>
        <aside>
          <Card className="rounded-2xl"><CardContent className="p-4 space-y-3">
            {done ? (
              <div className="text-center space-y-2"><h2 className="font-semibold text-lg">Pedido enviado!</h2><p>Número do pedido: <strong>{done}</strong></p>
                {store.whatsapp && <p className="text-sm text-muted-foreground">Dúvidas? WhatsApp: {store.whatsapp}</p>}
                <Button variant="outline" onClick={() => setDone(null)}>Fazer outro pedido</Button></div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <h2 className="font-semibold text-lg">Seu pedido</h2>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span>Produtos</span><span>{money(subtotal)}</span></div>
                  <div className="flex justify-between"><span>Entrega</span><span>{money(fee)}</span></div>
                  <div className="flex justify-between font-semibold"><span>Total</span><span>{money(subtotal > 0 ? subtotal + fee : 0)}</span></div>
                  {min > 0 && <p className="text-muted-foreground">Pedido mínimo: {money(min)}</p>}
                </div>
                <div><Label htmlFor="o-name">Nome</Label><Input id="o-name" value={f.name} onChange={set("name")} maxLength={100} /></div>
                <div><Label htmlFor="o-email">E-mail</Label><Input id="o-email" type="email" value={f.email} onChange={set("email")} maxLength={255} /></div>
                <div><Label htmlFor="o-phone">Telefone</Label><Input id="o-phone" value={f.phone} onChange={set("phone")} maxLength={30} /></div>
                <div><Label htmlFor="o-street">Endereço</Label><Input id="o-street" value={f.street} onChange={set("street")} maxLength={200} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label htmlFor="o-city">Cidade</Label><Input id="o-city" value={f.city} onChange={set("city")} maxLength={100} /></div>
                  <div><Label htmlFor="o-pc">Código postal</Label><Input id="o-pc" value={f.postal_code} onChange={set("postal_code")} maxLength={20} /></div>
                </div>
                <div><Label htmlFor="o-notes">Observações</Label><Textarea id="o-notes" value={f.notes} onChange={set("notes")} maxLength={500} rows={2} /></div>
                <Button type="submit" className="w-full" disabled={sending || !open}>{!open ? "Loja fechada" : sending ? "Enviando..." : "Fazer pedido"}</Button>
              </form>
            )}
          </CardContent></Card>
        </aside>
      </main>
    </div>
  );
};
export default StorePage;
