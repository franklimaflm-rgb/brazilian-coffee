import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { Globe } from "lucide-react";

export const LanguageSelector = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-muted-foreground" />
      <div className="flex gap-1">
        <Button
          variant={language === 'pt-BR' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setLanguage('pt-BR')}
          className="h-8 px-2 text-sm"
        >
          🇧🇷 PT
        </Button>
        <Button
          variant={language === 'en-GB' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setLanguage('en-GB')}
          className="h-8 px-2 text-sm"
        >
          🇬🇧 EN
        </Button>
      </div>
    </div>
  );
};