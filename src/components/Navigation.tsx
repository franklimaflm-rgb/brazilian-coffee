import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "./LanguageSelector";
import { useLanguage } from "@/i18n/LanguageContext";
import { Coffee, Menu, Home, Truck, QrCode, HelpCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Navigation = () => {
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { to: "/", label: t('nav.home'), icon: Home },
    { to: "/menu", label: t('nav.menu'), icon: Coffee },
    { to: "/delivery", label: t('nav.delivery'), icon: Truck },
    { to: "/qrcode", label: t('nav.qrcode'), icon: QrCode },
    { to: "/help", label: t('nav.help'), icon: HelpCircle }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Coffee className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Café Academy</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}>
                <Button
                  variant={isActive(to) ? "secondary" : "ghost"}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Language Selector */}
          <div className="hidden md:flex">
            <LanguageSelector />
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  {navItems.map(({ to, label, icon: Icon }) => (
                    <Link key={to} to={to} className="w-full">
                      <Button
                        variant={isActive(to) ? "secondary" : "ghost"}
                        className="w-full justify-start gap-2"
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </Button>
                    </Link>
                  ))}
                  <div className="mt-4 pt-4 border-t border-border">
                    <LanguageSelector />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};