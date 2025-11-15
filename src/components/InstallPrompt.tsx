import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X } from "lucide-react";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user already dismissed or if already installed
    const hasBeenDismissed = localStorage.getItem('installPromptDismissed') === 'true';
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    if (hasBeenDismissed || isInstalled) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after 10 seconds
      setTimeout(() => setShowPrompt(true), 10000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showPrompt || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-40 max-w-sm md:ml-auto animate-fade-in">
      <Card className="shadow-lg border-primary/20">
        <CardContent className="pt-6 pb-4">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-3 mb-4">
            <Download className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                Instalar Café Academy
              </h3>
              <p className="text-sm text-muted-foreground">
                Acesse rápido e funciona offline!
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {deferredPrompt ? (
              <Button onClick={handleInstallClick} className="flex-1">
                Instalar
              </Button>
            ) : (
              <Link to="/install" className="flex-1">
                <Button className="w-full">
                  Ver Instruções
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={handleDismiss}>
              Depois
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
