import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { Gift, Copy, Share2 } from "lucide-react";

const ReferralPage = () => {
  const { language } = useLanguage();
  const pt = language === "pt-BR";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState<{ referrals_count: number; rewards_available: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const link = code ? `${window.location.origin}/delivery?ref=${code}` : "";

  const getCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.rpc("get_or_create_referral_code", { _email: email });
    if (error || !data) {
      toast.error(pt ? "E-mail inválido." : "Invalid email.");
    } else {
      setCode(data as string);
      const { data: s } = await supabase.rpc("get_referral_stats", { _code: data as string });
      if (s && s[0]) setStats({ referrals_count: s[0].referrals_count, rewards_available: Number(s[0].rewards_available) });
    }
    setLoading(false);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    toast.success(pt ? "Link copiado!" : "Link copied!");
  };

  const message = pt
    ? `Ganhe 10% de desconto no seu primeiro café da Brazilian Coffee com meu código ${code}: ${link}`
    : `Get 10% off your first Brazilian Coffee order with my code ${code}: ${link}`;

  return (
    <div className="min-h-[100dvh] bg-background">
      <SEO title={pt ? "Indique e Ganhe | Brazilian Coffee" : "Refer a Friend | Brazilian Coffee"} description={pt ? "Indique amigos: eles ganham 10% e você ganha £3." : "Refer friends: they get 10% off, you get £3."} />
      <Navigation />
      <main className="container mx-auto px-4 py-16 max-w-xl">
        <Card className="rounded-2xl">
          <CardHeader className="text-center">
            <Gift className="mx-auto h-10 w-10 text-primary mb-2" />
            <CardTitle className="text-2xl">{pt ? "Indique e Ganhe" : "Refer a Friend"}</CardTitle>
            <p className="text-muted-foreground">
              {pt
                ? "Seu amigo ganha 10% de desconto no primeiro pedido. Você ganha £3 de crédito no seu próximo pedido."
                : "Your friend gets 10% off their first order. You get £3 credit on your next order."}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={getCode} className="space-y-3">
              <Label htmlFor="ref-email">{pt ? "E-mail usado nos seus pedidos" : "Email used for your orders"}</Label>
              <Input id="ref-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button type="submit" className="w-full" disabled={loading}>
                {pt ? "Gerar meu código" : "Get my code"}
              </Button>
            </form>

            {code && (
              <div className="space-y-4 border-t pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{pt ? "Seu código" : "Your code"}</p>
                  <p className="text-3xl font-bold tracking-widest">{code}</p>
                </div>
                <div className="flex gap-2">
                  <Input readOnly value={link} aria-label="Link" />
                  <Button type="button" variant="outline" onClick={copy} aria-label={pt ? "Copiar" : "Copy"}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button asChild className="w-full" variant="secondary">
                  <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
                    <Share2 className="h-4 w-4 mr-2" /> WhatsApp
                  </a>
                </Button>
                {stats && (
                  <p className="text-center text-sm text-muted-foreground">
                    {pt
                      ? `${stats.referrals_count} indicação(ões) · £${stats.rewards_available.toFixed(2)} de crédito disponível`
                      : `${stats.referrals_count} referral(s) · £${stats.rewards_available.toFixed(2)} credit available`}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ReferralPage;
