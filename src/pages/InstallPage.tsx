import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check, Apple, Chrome } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPage = () => {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <Download className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{t('install.title')}</h1>
          <p className="text-lg text-muted-foreground">{t('install.description')}</p>
        </div>

        {isInstalled && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-primary">
                <Check className="w-6 h-6" />
                <p className="font-semibold">{t('install.alreadyInstalled')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {isInstallable && !isInstalled && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t('install.quickInstall')}</CardTitle>
              <CardDescription>{t('install.quickInstallDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleInstallClick} size="lg" className="w-full">
                <Download className="w-5 h-5 mr-2" />
                {t('install.installNow')}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Apple className="w-6 h-6" />
                <CardTitle>{t('install.iosTitle')}</CardTitle>
              </div>
              <CardDescription>{t('install.iosDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                {[1, 2, 3, 4].map(i => (
                  <li key={i} className="flex gap-2">
                    <span className="font-semibold text-primary">{i}.</span>
                    <span>{t(`install.iosStep${i}` as any)}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Chrome className="w-6 h-6" />
                <CardTitle>{t('install.androidTitle')}</CardTitle>
              </div>
              <CardDescription>{t('install.androidDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                {[1, 2, 3, 4].map(i => (
                  <li key={i} className="flex gap-2">
                    <span className="font-semibold text-primary">{i}.</span>
                    <span>{t(`install.androidStep${i}` as any)}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-6 h-6" />
              <CardTitle>{t('install.benefitsTitle')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{t(`install.benefit${i}Title` as any)}</p>
                    <p className="text-sm text-muted-foreground">{t(`install.benefit${i}Desc` as any)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default InstallPage;
