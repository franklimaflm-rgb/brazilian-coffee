import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { money } from "./adminUtils";

type Product = { id: string; name: string; description: string | null; price: number; image_url: string | null; available: boolean };
const empty: Product = { id: "", name: "", description: "", price: 0, image_url: "", available: true };

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const MenuTab = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("coffee_products").select("id, name, description, price, image_url, available").order("name");
    if (error) toast.error("Não foi possível carregar o cardápio.");
    setItems((data as Product[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (p: Product) => {
    const { error } = await supabase.from("coffee_products").update({ available: !p.available }).eq("id", p.id);
    if (error) return toast.error("Não foi possível alterar.");
    toast.success(`${p.name}: ${!p.available ? "Disponível" : "Esgotado"}`);
    load();
  };

  const save = async () => {
    if (!editing) return;
    const name = editing.name.trim();
    const price = Number(editing.price);
    if (!name) return toast.error("Informe o nome.");
    if (!(price > 0) || price > 1000) return toast.error("Preço inválido.");
    setSaving(true);
    const row = { name, description: editing.description?.trim() || null, price, image_url: editing.image_url?.trim() || null, available: editing.available };
    const { error } = isNew
      ? await supabase.from("coffee_products").insert({ id: slug(name), ...row })
      : await supabase.from("coffee_products").update(row).eq("id", editing.id);
    setSaving(false);
    if (error) return toast.error(error.code === "23505" ? "Já existe um café com esse nome." : "Não foi possível salvar.");
    toast.success("Cardápio atualizado");
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Cafés esgotados somem da loja. Para manter o histórico, cafés não são apagados.</p>
        <Button onClick={() => { setIsNew(true); setEditing({ ...empty }); }}><Plus className="h-4 w-4 mr-1" />Novo café</Button>
      </div>
      <div className="grid tablet:grid-cols-2 gap-3">
        {items.map((p) => (
          <Card key={p.id} className="rounded-2xl">
            <CardContent className="p-4 flex gap-3 items-center">
              {p.image_url ? <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded-xl object-cover" /> : <div className="w-16 h-16 rounded-xl bg-muted" />}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{p.name}</p>
                <p className="text-sm text-muted-foreground">{money(p.price)}</p>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <Switch checked={p.available} onCheckedChange={() => toggle(p)} aria-label="Disponível" />
                  <span>{p.available ? "Disponível" : "Esgotado"}</span>
                </div>
              </div>
              <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => { setIsNew(false); setEditing({ ...p }); }}><Pencil className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isNew ? "Novo café" : "Editar café"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={editing.name} maxLength={80} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={editing.description ?? ""} maxLength={500} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div><Label>Preço (£)</Label><Input type="number" step="0.01" min="0" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></div>
              <div><Label>Link da foto</Label><Input value={editing.image_url ?? ""} placeholder="https://..." onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={editing.available} onCheckedChange={(v) => setEditing({ ...editing, available: v })} /><span className="text-sm">Disponível</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
