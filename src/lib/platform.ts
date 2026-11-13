// Multi-store platform helpers. The original shop is the "default store";
// its pages and admin keep working on its own rows via store_id.
import { supabase } from "@/integrations/supabase/client";
import type { DayHours } from "@/lib/storeSettings";

export const DEFAULT_STORE_ID = "00000000-0000-0000-0000-000000000001";

export type Store = {
  id: string; slug: string; name: string; description: string | null; logo_url: string | null;
  primary_color: string; whatsapp: string | null; address: string | null;
  delivery_fee: number; min_order_amount: number; opening_hours: DayHours[];
  owner_id: string | null; active: boolean; created_at: string;
};

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export const isValidSlug = (s: string) => /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(s);

/** Uploads an image under the store's folder and returns a long-lived link to it. */
export const uploadStoreImage = async (storeId: string, file: File) => {
  if (!file.type.startsWith("image/")) throw new Error("Envie uma imagem.");
  if (file.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter até 5 MB.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${storeId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("store-assets").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("store-assets").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2 || !data) throw e2 ?? new Error("upload");
  return data.signedUrl;
};
