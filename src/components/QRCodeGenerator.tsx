import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, QrCode } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface QRCodeGeneratorProps {
  url: string;
  size?: number;
  title?: string;
  description?: string;
}

export const QRCodeGenerator = ({ 
  url, 
  size = 256, 
  title, 
  description 
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
          dark: '#3A2317', // Using primary color from design system
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadQRCode = (format: 'png' | 'svg') => {
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
    }
  };

  return (
    <Card className="p-6 text-center">
      <CardContent className="space-y-4">
        {title && (
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        )}
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
        
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg shadow-warm">
            {qrCodeDataUrl ? (
              <img 
                src={qrCodeDataUrl} 
                alt="QR Code" 
                className="block"
                style={{ width: size, height: size }}
              />
            ) : (
              <div 
                className="flex items-center justify-center bg-muted rounded-lg"
                style={{ width: size, height: size }}
              >
                <QrCode className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            onClick={() => downloadQRCode('png')}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('qrcode.downloadPng')}
          </Button>
          <Button
            onClick={() => downloadQRCode('svg')}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('qrcode.downloadSvg')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};