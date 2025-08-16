import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, QrCode, FileText, Printer } from "lucide-react";
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

      // Add business header
      pdf.setFontSize(20);
      pdf.setTextColor(58, 35, 23); // Primary color
      pdf.text('Brazilian Coffee Academy', 20, 30);

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Fresh Coffee Delivery - Market Harborough Area', 20, 45);

      // Add business contact info
      pdf.setFontSize(10);
      pdf.text('Franklin Marcelo Ferreira de Lima', 20, 60);
      pdf.text('Phone: +44 7386797734', 20, 70);
      pdf.text('Email: franklinmarceloderreiradelima@gmail.com', 20, 80);
      pdf.text('Address: Main Street, 68 - Lubenham - Market Harborough - LE16 9TG', 20, 90);

      // Add QR code
      if (qrCodeDataUrl) {
        const qrSize = 80;
        pdf.addImage(qrCodeDataUrl, 'PNG', 20, 110, qrSize, qrSize);

        // Add QR code description
        pdf.setFontSize(12);
        pdf.text('Scan to Order Online', 20, 200);
        pdf.setFontSize(10);
        pdf.text('1. Open your phone camera', 20, 215);
        pdf.text('2. Point at the QR code', 20, 225);
        pdf.text('3. Tap the link that appears', 20, 235);
        pdf.text('4. Place your order for delivery', 20, 245);

        // Add delivery info
        pdf.text('Delivery Area: 5km radius from Lubenham', 120, 120);
        pdf.text('Delivery Fee: From £3.00', 120, 130);
        pdf.text('Estimated Time: 15-45 minutes', 120, 140);
        pdf.text('Fresh coffee delivered to your door!', 120, 150);
      }

      // Add footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Visit: https://brazilian-coffee.lovable.app/', 20, 270);
      pdf.text('Generated on: ' + new Date().toLocaleDateString(), 20, 280);

      // Save the PDF
      pdf.save('brazilian-coffee-delivery-menu.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
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

        <div className="flex gap-2 justify-center flex-wrap">
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
          <Button
            onClick={() => downloadQRCode('pdf')}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};