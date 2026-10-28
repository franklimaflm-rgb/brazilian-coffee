import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, money } from "./adminUtils";

type Code = { code: string; owner_email: string; created_at: string };
type Ref = { code: string; referred_email: string; discount_amount: number; reward_amount: number; reward_used_order_id: string | null; created_at: string };

export const ReferralsTab = () => {
  const [codes, setCodes] = useState<Code[]>([]);
  const [refs, setRefs] = useState<Ref[]>([]);

  useEffect(() => {
    supabase.from("referral_codes").select("code, owner_email, created_at").order("created_at", { ascending: false })
      .then(({ data }) => setCodes((data as Code[]) ?? []));
    supabase.from("referrals").select("code, referred_email, discount_amount, reward_amount, reward_used_order_id, created_at").order("created_at", { ascending: false })
      .then(({ data }) => setRefs((data as Ref[]) ?? []));
  }, []);

  const totalDiscount = refs.reduce((s, r) => s + Number(r.discount_amount), 0);
  const totalReward = refs.reduce((s, r) => s + Number(r.reward_amount), 0);
  const unused = refs.filter((r) => !r.reward_used_order_id).reduce((s, r) => s + Number(r.reward_amount), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
        {[["Códigos criados", String(codes.length)], ["Indicações", String(refs.length)], ["Descontos dados", money(totalDiscount)], ["Créditos (não usados)", `${money(totalReward)} (${money(unused)})`]].map(([l, v]) => (
          <Card key={l} className="rounded-2xl"><CardContent className="p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-lg font-bold">{v}</p></CardContent></Card>
        ))}
      </div>
      {codes.length === 0 && <p className="text-sm text-muted-foreground">Ninguém gerou um código de indicação ainda.</p>}
      {codes.map((c) => {
        const mine = refs.filter((r) => r.code === c.code);
        return (
          <Card key={c.code} className="rounded-2xl">
            <CardContent className="p-4 text-sm space-y-2">
              <div className="flex flex-wrap justify-between gap-2">
                <div><p className="font-semibold">{c.code}</p><p className="text-muted-foreground">{c.owner_email}</p></div>
                <p className="text-muted-foreground">{mine.length} amigo(s) · desde {formatDate(c.created_at)}</p>
              </div>
              {mine.map((r) => (
                <div key={r.referred_email} className="flex justify-between text-muted-foreground border-t border-border pt-2">
                  <span>{r.referred_email}</span>
                  <span>-{money(r.discount_amount)} / +{money(r.reward_amount)} {r.reward_used_order_id ? "(usado)" : ""}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
