import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "./LanguageSelector";
import { useLanguage } from "@/i18n/LanguageContext";
import { Coffee, Menu, Home, Truck, QrCode, HelpCircle, LogIn, LogOut, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const Navigation = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: t('auth.logoutSuccess') || "Logout successful",
        description: t('auth.logoutMessage') || "You have been logged out successfully",
      });
    } catch (error) {
      toast({
        title: t('auth.logoutFailed') || "Logout failed",
        description: "An error occurred while logging out",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { to: "/", label: t('nav.home'), icon: Home },
    { to: "/menu", label: t('nav.menu'), icon: Coffee },
    { to: "/delivery", label: t('nav.delivery'), icon: Truck },
    { to: "/qrcode", label: t('nav.qrcode'), icon: QrCode },
    { to: "/help", label: t('nav.help'), icon: HelpCircle }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 safe-top">
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

            {/* Auth & Language Selector */}
            <div className="hidden md:flex items-center gap-4">
              {!isLoading && (
                <>
                  {user ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        <span className="max-w-24 truncate">{user.user_metadata?.name || user.email}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                        className="flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('auth.logout') || 'Logout'}
                      </Button>
                    </div>
                  ) : (
                    <Link to="/auth">
                      <Button
                        variant={isActive('/auth') ? "secondary" : "outline"}
                        className="flex items-center gap-2"
                      >
                        <LogIn className="w-4 h-4" />
                        {t('auth.login')}
                      </Button>
                    </Link>
                  )}
                </>
              )}
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
                {/* @ts-ignore - SheetContent children prop type issue */}
                <SheetContent className="w-[300px] sm:w-[400px]">
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

                    {/* Mobile Auth Section */}
                    {!isLoading && (
                      <div className="mt-4 pt-4 border-t border-border space-y-2">
                        {user ? (
                          <>
                            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                              <User className="w-4 h-4" />
                              <span className="truncate">{user.user_metadata?.name || user.email}</span>
                            </div>
                            <Button
                              variant="ghost"
                              onClick={handleLogout}
                              className="w-full justify-start gap-2"
                            >
                              <LogOut className="w-4 h-4" />
                              {t('auth.logout') || 'Logout'}
                            </Button>
                          </>
                        ) : (
                          <Link to="/auth" className="w-full">
                            <Button
                              variant={isActive('/auth') ? "secondary" : "ghost"}
                              className="w-full justify-start gap-2"
                            >
                              <LogIn className="w-4 h-4" />
                              {t('auth.login')}
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}

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

      {/* Bottom Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border safe-bottom landscape:h-12">
        <div className="flex justify-around items-center px-2 py-2 landscape:py-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex-1">
              <Button
                variant={isActive(to) ? "secondary" : "ghost"}
                className="w-full h-14 landscape:h-10 flex flex-col landscape:flex-row items-center justify-center gap-1 px-2"
                size="sm"
              >
                <Icon className="w-5 h-5 landscape:w-4 landscape:h-4" />
                <span className="text-xs landscape:text-xs landscape:ml-1">{label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};