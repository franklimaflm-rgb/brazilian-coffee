import { useLanguage } from "@/i18n/LanguageContext";
import { Coffee, Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Business Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Coffee className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-foreground">Café Academy</span>
            </div>
            <p className="text-muted-foreground text-sm">
              {t('delivery.description')}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{t('delivery.businessAddress')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Mon-Sat: 8:00-18:00, Sun: 9:00-16:00</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">{t('footer.contact')}</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{t('delivery.businessInfo')}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${t('delivery.businessPhone')}`} className="hover:text-primary transition-colors">
                    {t('delivery.businessPhone')}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${t('delivery.businessEmail')}`} className="hover:text-primary transition-colors">
                    {t('delivery.businessEmail')}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">{t('footer.quickAccess')}</h3>
            <div className="space-y-2">
              <Link to="/" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('nav.home')}
              </Link>
              <Link to="/menu" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('nav.menu')}
              </Link>
              <Link to="/delivery" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('nav.delivery')}
              </Link>
              <Link to="/track-order" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Track Order
              </Link>
              <Link to="/qrcode" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('nav.qrcode')}
              </Link>
            </div>
          </div>

          {/* Social Media & Additional Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">{t('footer.social')}</h3>
            <div className="flex gap-3">
              <a 
                href="#" 
                className="w-8 h-8 bg-muted rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 bg-muted rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 bg-muted rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Delivery Area:</p>
              <p>Market Harborough, Lubenham, Great Bowden, Little Bowden and surrounding villages (5km radius)</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2024 Brazilian Coffee Academy. All rights reserved.
          </div>
          <div className="text-sm text-muted-foreground">
            Made with ❤️ for coffee lovers in Leicestershire
          </div>
        </div>
      </div>
    </footer>
  );
};
