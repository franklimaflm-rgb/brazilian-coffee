import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, Save, Truck, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import {
  DAY_NAMES, MAX_DELIVERY_KM, computeDeliveryFee, isOpenAt, validateHours, type StoreSettings,
} from "@/lib/storeSettings";
import { money } from "./adminUtils";

export const SettingsTab = () => {
  const { settings, loading, reload } = useStoreSettings();
  const [form, setForm] = useState<StoreSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  const setDay = (i: number, patch: Partial<StoreSettings["opening_hours"][number]>) =>
    setForm((f) => ({ ...f, opening_hours: f.opening_hours.map((d, j) => (j === i ? { ...d, ...patch } : d)) }));

  const copyMondayToWeekdays = () =>
    setForm((f) => ({ ...f, opening_hours: f.opening_hours.map((d, i) => (i > 0 && i < 5 ? { ...f.opening_hours[0] } : d)) }));

  const save = async () => {
    const base = Number(form.delivery_base_fee);
    const perKm = Number(form.delivery_fee_per_km);
    const min = Number(form.min_order_amount);
    if (!(base >= 0 && base <= 100)) return toast.error("Taxa base deve ficar entre £0 e £100.");
    if (!(perKm >= 0 && perKm <= 50)) return toast.error("Valor por km deve ficar entre £0 e £50.");
    if (!(min >= 0 && min <= 1000)) return toast.error("Pedido mínimo deve ficar entre £0 e £1000.");
    const hoursError = validateHours(form.opening_hours);
    if (hoursError) return toast.error(hoursError);

    setSaving(true);
    const { error } = await supabase.from("store_settings").upsert({
      id: true,
      delivery_base_fee: base,
      delivery_fee_per_km: perKm,
      min_order_amount: min,
      opening_hours: form.opening_hours,
    });
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar as configurações.");
    toast.success("Configurações salvas — já valem no site.");
    reload();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const openNow = isOpenAt(form.opening_hours);
  const minFee = computeDeliveryFee(form, 0);
  const maxFee = computeDeliveryFee(form, MAX_DELIVERY_KM);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Horário de funcionamento</CardTitle>
            <Badge variant={openNow ? "default" : "secondary"}>{openNow ? "Aberto agora" : "Fechado agora"}</Badge>
          </div>
          <CardDescription>Fora deste horário a loja não aceita pedidos. Horário de Londres.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.opening_hours.map((d, i) => (
            <div key={i} className="grid grid-cols-[6.5rem_auto_1fr] items-center gap-3">
              <Label htmlFor={`day-${i}`} className="font-medium">{DAY_NAMES["pt-BR"][i]}</Label>
              <Switch id={`day-${i}`} checked={d.open} onCheckedChange={(v) => setDay(i, { open: v })} aria-label={`${DAY_NAMES["pt-BR"][i]} aberto`} />
              {d.open ? (
                <div className="flex items-center gap-2">
                  <Input type="time" value={d.from} onChange={(e) => setDay(i, { from: e.target.value })} className="w-28" aria-label={`${DAY_NAMES["pt-BR"][i]} abre às`} />
                  <span className="text-muted-foreground text-sm">até</span>
                  <Input type="time" value={d.to} onChange={(e) => setDay(i, { to: e.target.value })} className="w-28" aria-label={`${DAY_NAMES["pt-BR"][i]} fecha às`} />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Fechado</span>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={copyMondayToWeekdays}>Copiar horário de segunda para terça–sexta</Button>
        </CardContent>
      </Card>

      <div className="grid tablet:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-primary" />Taxa de entrega</CardTitle>
            <CardDescription>Taxa base + valor por km (raio máximo de {MAX_DELIVERY_KM} km). Para taxa fixa, use £0 por km.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="base-fee">Taxa base (£)</Label>
              <Input id="base-fee" type="number" min={0} max={100} step="0.10" value={form.delivery_base_fee}
                onChange={(e) => setForm({ ...form, delivery_base_fee: e.target.value as unknown as number })} />
            </div>
            <div>
              <Label htmlFor="per-km">Valor por km (£)</Label>
              <Input id="per-km" type="number" min={0} max={50} step="0.10" value={form.delivery_fee_per_km}
                onChange={(e) => setForm({ ...form, delivery_fee_per_km: e.target.value as unknown as number })} />
            </div>
            <p className="text-sm text-muted-foreground">
              O cliente paga entre {money(minFee)} e {money(maxFee)}.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-primary" />Pedido mínimo</CardTitle>
            <CardDescription>Valor mínimo dos cafés (sem a entrega). Use £0 para não ter mínimo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="min-order">Pedido mínimo (£)</Label>
            <Input id="min-order" type="number" min={0} max={1000} step="0.50" value={form.min_order_amount}
              onChange={(e) => setForm({ ...form, min_order_amount: e.target.value as unknown as number })} />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar configurações
        </Button>
      </div>
    </div>
  );
};
