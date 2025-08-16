import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Smartphone, Camera, Link, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QRCodePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const siteUrl = "https://brazilian-coffee.lovable.app/";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-6 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('coffee.backToMenu')}
            </Button>
            
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {t('qrcode.title')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('qrcode.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main QR Code */}
            <div className="space-y-6">
              <QRCodeGenerator
                url={siteUrl}
                size={320}
                title="Café Academy"
                description="Escaneie para acessar o menu"
              />
              
              {/* Smaller QR Codes */}
              <div className="grid grid-cols-2 gap-4">
                <QRCodeGenerator
                  url={`${siteUrl}delivery`}
                  size={180}
                  title={t('qrcode.printVersion')}
                />
                <QRCodeGenerator
                  url={siteUrl}
                  size={180}
                  title={t('qrcode.socialVersion')}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    {t('qrcode.howToUse')}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Smartphone className="w-4 h-4 text-primary" />
                          <span className="font-medium">{t('qrcode.step1')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Camera className="w-4 h-4 text-primary" />
                          <span className="font-medium">{t('qrcode.step2')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link className="w-4 h-4 text-primary" />
                          <span className="font-medium">{t('qrcode.step3')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                        4
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ShoppingCart className="w-4 h-4 text-primary" />
                          <span className="font-medium">{t('qrcode.step4')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* URL Display */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-foreground mb-2">URL do Site:</h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="text-sm text-foreground break-all">{siteUrl}</code>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;