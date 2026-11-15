import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { DEFAULT_STORE_ID } from "@/lib/platform";

type S = { id: string; name: string; slug: string; active: boolean; created_at: string };
type M = { id: string; name: string; cafe_name: string | null; email: string; phone: string | null; message: string; created_at: string };

export const PlatformTab = () => {
  const [stores, setStores] = useState<S[]>([]);
  const [msgs, setMsgs] = useState<M[]>([]);
  const load = async () => {
    const [s, m] = await Promise.all([
      supabase.from("stores").select("id, name, slug, active, created_at").neq("id", DEFAULT_STORE_ID).order("created_at", { ascending: false }),
      supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setStores((s.data as S[]) ?? []); setMsgs((m.data as M[]) ?? []);
  };
  useEffect(() => { load(); }, []);
  const toggle = async (s: S) => {
    const { error } = await supabase.from("stores").update({ active: !s.active }).eq("id", s.id);
    if (error) toast.error("Não foi possível alterar."); else load();
  };
  return (
    <div className="grid tablet:grid-cols-2 gap-6">
      <section className="space-y-2">
        <h2 className="font-semibold">Lojas criadas ({stores.length})</h2>
        {stores.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma loja criada ainda.</p>}
        {stores.map((s) => (
          <Card key={s.id}><CardContent className="p-3 flex items-center justify-between gap-2">
            <div><a className="font-medium underline" href={`/loja/${s.slug}`} target="_blank" rel="noreferrer">{s.name}</a>
              <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR")}</p></div>
            <div className="flex items-center gap-2 text-sm"><Switch checked={s.active} onCheckedChange={() => toggle(s)} aria-label={`${s.name} ativa`} />{s.active ? "Ativa" : "Desativada"}</div>
          </CardContent></Card>
        ))}
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Mensagens de contato ({msgs.length})</h2>
        {msgs.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>}
        {msgs.map((m) => (
          <Card key={m.id}><CardContent className="p-3 space-y-1 text-sm">
            <p className="font-medium">{m.name}{m.cafe_name ? ` · ${m.cafe_name}` : ""}</p>
            <p><a className="underline" href={`mailto:${m.email}`}>{m.email}</a>{m.phone ? ` · ${m.phone}` : ""}</p>
            <p className="whitespace-pre-wrap">{m.message}</p>
            <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("pt-BR")}</p>
          </CardContent></Card>
        ))}
      </section>
    </div>
  );
};
