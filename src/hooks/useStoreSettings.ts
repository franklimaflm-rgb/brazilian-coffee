import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SETTINGS, normalizeSettings, type StoreSettings } from "@/lib/storeSettings";

export const useStoreSettings = () => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("store_settings")
      .select("delivery_base_fee, delivery_fee_per_km, min_order_amount, opening_hours")
      .eq("id", true)
      .maybeSingle();
    setSettings(normalizeSettings(data as never));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { settings, loading, reload: load };
};
