import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOwnerSession } from "@/hooks/useOwnerSession";
import { isValidSlug, slugify } from "@/lib/platform";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const CreateStorePage = () => {
  const { user, ready } = useOwnerSession();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", slug: "", whatsapp: "", address: "", color: "#7c4a2d", description: "" });
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!ready) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;
  if (!user) return <Navigate to="/auth?next=/criar-loja" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return toast.error("Informe o nome do café.");
    if (!isValidSlug(f.slug)) return toast.error("Link inválido: use letras minúsculas, números e hífen (3 a 40).");
    setSaving(true);
    const { error } = await supabase.rpc("create_store", {
      _name: f.name, _slug: f.slug, _whatsapp: f.whatsapp, _address: f.address, _color: f.color, _description: f.description,
    });
    setSaving(false);
    if (error) return toast.error(error.message.includes("SLUG_TAKEN") ? "Esse link já está em uso. Escolha outro." : error.message.includes("limit") ? "Limite de 3 lojas por conta." : "Não foi possível criar a loja.");
    toast.success("Loja criada! Agora adicione seu cardápio.");
    navigate("/painel");
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <SEO title="Criar minha loja" description="Crie a loja online do seu café." path="/criar-loja" />
      <main className="max-w-xl mx-auto px-4 py-10">
        <Link to="/para-cafes" className="text-sm text-muted-foreground">← Voltar</Link>
        <h1 className="text-2xl font-bold mt-4 mb-6">Criar minha loja</h1>
        <form onSubmit={submit} className="space-y-4">
          <div><Label htmlFor="s-name">Nome do café</Label>
            <Input id="s-name" value={f.name} maxLength={80} onChange={(e) => setF({ ...f, name: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) })} /></div>
          <div><Label htmlFor="s-slug">Link da loja</Label>
            <div className="flex items-center gap-1 text-sm"><span className="text-muted-foreground whitespace-nowrap">{window.location.host}/loja/</span>
              <Input id="s-slug" value={f.slug} maxLength={40} onChange={(e) => { setSlugTouched(true); setF({ ...f, slug: slugify(e.target.value) }); }} /></div></div>
          <div><Label htmlFor="s-desc">Descrição curta</Label><Textarea id="s-desc" value={f.description} maxLength={500} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div><Label htmlFor="s-wa">WhatsApp</Label><Input id="s-wa" value={f.whatsapp} maxLength={30} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
          <div><Label htmlFor="s-addr">Endereço</Label><Input id="s-addr" value={f.address} maxLength={200} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
          <div><Label htmlFor="s-color">Cor da marca</Label><Input id="s-color" type="color" className="w-20 h-10 p-1" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} /></div>
          <Button type="submit" className="w-full" disabled={saving}>{saving ? "Criando..." : "Criar loja"}</Button>
        </form>
      </main>
    </div>
  );
};
export default CreateStorePage;
