import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Coffee, ClipboardList, Settings, Store } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(1, "Informe seu nome").max(100),
  cafe_name: z.string().trim().max(100).optional(),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().min(1, "Escreva uma mensagem").max(2000),
});

const features = [
  { icon: Store, title: "Sua loja online", text: "Cardápio, fotos, logo e cores do seu café num link próprio." },
  { icon: ClipboardList, title: "Pedidos no painel", text: "Receba pedidos de entrega e atualize o status de cada um." },
  { icon: Settings, title: "Você controla tudo", text: "Horários, taxa de entrega e pedido mínimo, sem precisar de programador." },
];

const ForCafesPage = () => {
  const [form, setForm] = useState({ name: "", cafe_name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSending(true);
    const d = parsed.data;
    const { error } = await supabase.from("contact_submissions").insert({
      name: d.name, email: d.email, message: d.message, cafe_name: d.cafe_name || null, phone: d.phone || null,
    });
    setSending(false);
    if (error) return toast.error("Não foi possível enviar. Tente novamente.");
    setSent(true);
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-[100dvh] bg-background">
      <SEO title="Crie a loja online do seu café — grátis" description="Monte a loja de entrega do seu café em minutos: cardápio, pedidos, horários e taxa de entrega num painel simples." path="/para-cafes" />
      <header className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold"><Coffee className="w-6 h-6 text-primary" />Café Academy</Link>
        <Button asChild variant="outline"><Link to="/painel">Entrar no meu painel</Link></Button>
      </header>
      <main className="max-w-5xl mx-auto px-4 pb-16 space-y-16">
        <section className="text-center pt-10 space-y-5">
          <h1 className="text-3xl tablet:text-5xl font-bold max-w-3xl mx-auto">A loja de entrega do seu café, pronta em minutos</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Cadastre-se, coloque seu cardápio e comece a receber pedidos. Grátis.</p>
          <Button asChild size="lg" className="rounded-2xl"><Link to="/criar-loja">Criar minha loja grátis</Link></Button>
        </section>
        <section className="grid tablet:grid-cols-3 gap-4">
          {features.map((f) => (
            <Card key={f.title} className="rounded-2xl"><CardContent className="p-6 space-y-2">
              <f.icon className="w-8 h-8 text-primary" /><h2 className="font-semibold text-lg">{f.title}</h2>
              <p className="text-sm text-muted-foreground">{f.text}</p>
            </CardContent></Card>
          ))}
        </section>
        <section id="contato" className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Fale conosco</h2>
          <p className="text-center text-muted-foreground mb-6">Prefere ajuda para montar sua loja? Mande uma mensagem.</p>
          {sent ? (
            <Card className="rounded-2xl"><CardContent className="p-6 text-center">Mensagem enviada! Vamos responder no seu e-mail.</CardContent></Card>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div><Label htmlFor="c-name">Seu nome</Label><Input id="c-name" value={form.name} onChange={set("name")} maxLength={100} /></div>
              <div><Label htmlFor="c-cafe">Nome do café</Label><Input id="c-cafe" value={form.cafe_name} onChange={set("cafe_name")} maxLength={100} /></div>
              <div><Label htmlFor="c-email">E-mail</Label><Input id="c-email" type="email" value={form.email} onChange={set("email")} maxLength={255} /></div>
              <div><Label htmlFor="c-phone">Telefone / WhatsApp</Label><Input id="c-phone" value={form.phone} onChange={set("phone")} maxLength={30} /></div>
              <div><Label htmlFor="c-msg">Mensagem</Label><Textarea id="c-msg" value={form.message} onChange={set("message")} maxLength={2000} rows={4} /></div>
              <Button type="submit" disabled={sending} className="w-full">{sending ? "Enviando..." : "Enviar mensagem"}</Button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
};
export default ForCafesPage;
