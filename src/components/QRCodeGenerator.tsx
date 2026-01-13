import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, QrCode, FileText } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface QRCodeGeneratorProps {
  url: string;
  size?: number;
  title?: string;
  description?: string;
  compact?: boolean;
}

export const QRCodeGenerator = ({ 
  url, 
  size = 256, 
  title, 
  description,
  compact = false
}: QRCodeGeneratorProps) => {
  const { t } = useLanguage();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateQRCode();
  }, [url, size]);

  const generateQRCode = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: size,
        margin: 2,
        color: {
          dark: '#3A2317',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadQRCode = (format: 'png' | 'svg' | 'pdf') => {
    if (format === 'png' && qrCodeDataUrl) {
      const link = document.createElement('a');
      link.download = `cafe-academy-qrcode.png`;
      link.href = qrCodeDataUrl;
      link.click();
    } else if (format === 'svg') {
      QRCode.toString(url, {
        type: 'svg',
        width: size,
        margin: 2,
        color: {
          dark: '#3A2317',
          light: '#FFFFFF'
        }
      }, (err, string) => {
        if (!err) {
          const blob = new Blob([string], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `cafe-academy-qrcode.svg`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } else if (format === 'pdf') {
      generatePDF();
    }
  };

  const generatePDF = async () => {
    try {
      const pdf = new jsPDF();

      pdf.setFontSize(20);
      pdf.setTextColor(58, 35, 23);
      pdf.text('Brazilian Coffee Academy', 20, 30);

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Fresh Coffee Delivery - Market Harborough Area', 20, 45);

      pdf.setFontSize(10);
      pdf.text('Franklin Marcelo Ferreira de Lima', 20, 60);
      pdf.text('Phone: +44 7386797734', 20, 70);
      pdf.text('Email: franklinmarceloferreiradelima@gmail.com', 20, 80);
      pdf.text('Address: Main Street, 68 - Lubenham - Market Harborough - LE16 9TG', 20, 90);

      if (qrCodeDataUrl) {
        const qrSize = 80;
        pdf.addImage(qrCodeDataUrl, 'PNG', 20, 110, qrSize, qrSize);

        pdf.setFontSize(12);
        pdf.text('Scan to Order Online', 20, 200);
        pdf.setFontSize(10);
        pdf.text('1. Open your phone camera', 20, 215);
        pdf.text('2. Point at the QR code', 20, 225);
        pdf.text('3. Tap the link that appears', 20, 235);
        pdf.text('4. Place your order for delivery', 20, 245);

        pdf.text('Delivery Area: 5km radius from Lubenham', 120, 120);
        pdf.text('Delivery Fee: From £3.00', 120, 130);
        pdf.text('Estimated Time: 15-45 minutes', 120, 140);
        pdf.text('Fresh coffee delivered to your door!', 120, 150);
      }

      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Visit: https://brazilian-coffee.lovable.app/', 20, 270);
      pdf.text('Generated on: ' + new Date().toLocaleDateString(), 20, 280);

      pdf.save('brazilian-coffee-delivery-menu.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <Card className={cn("text-center", compact ? "p-2 sm:p-4" : "p-4 sm:p-6")}>
      <CardContent className={cn("space-y-3 sm:space-y-4", compact && "p-0")}>
        {title && (
          <h3 className={cn(
            "font-semibold text-foreground",
            compact ? "text-sm sm:text-base" : "text-base sm:text-lg"
          )}>
            {title}
          </h3>
        )}
        {description && (
          <p className={cn(
            "text-muted-foreground",
            compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
          )}>
            {description}
          </p>
        )}
        
        <div className="flex justify-center">
          <div className={cn(
            "bg-white rounded-lg shadow-warm",
            compact ? "p-2 sm:p-3" : "p-3 sm:p-4"
          )}>
            {qrCodeDataUrl ? (
              <img 
                src={qrCodeDataUrl} 
                alt="QR Code" 
                className="block w-full h-auto"
                style={{ maxWidth: size }}
              />
            ) : (
              <div 
                className="flex items-center justify-center bg-muted rounded-lg aspect-square"
                style={{ maxWidth: size, width: '100%' }}
              >
                <QrCode className={cn(
                  "text-muted-foreground",
                  compact ? "w-8 h-8" : "w-12 h-12"
                )} />
              </div>
            )}
          </div>
        </div>

        <div className={cn(
          "flex gap-2 justify-center flex-wrap",
          compact && "flex-col sm:flex-row"
        )}>
          {compact ? (
            <Button
              onClick={() => downloadQRCode('png')}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </Button>
          ) : (
            <>
              <Button
                onClick={() => downloadQRCode('png')}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{t('qrcode.downloadPng')}</span>
                <span className="sm:hidden">PNG</span>
              </Button>
              <Button
                onClick={() => downloadQRCode('svg')}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{t('qrcode.downloadSvg')}</span>
                <span className="sm:hidden">SVG</span>
              </Button>
              <Button
                onClick={() => downloadQRCode('pdf')}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">{t('qrcode.downloadPdf')}</span>
                <span className="sm:hidden">PDF</span>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};