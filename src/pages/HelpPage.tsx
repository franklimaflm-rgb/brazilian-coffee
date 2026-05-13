import { useLanguage } from "@/i18n/LanguageContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { 
  HelpCircle, 
  Package, 
  MapPin, 
  CreditCard, 
  QrCode, 
  Coffee,
  Search,
  Phone,
  Mail,
  MapPinned,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const HelpPage = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      icon: Package,
      title: t('help.ordering.title'),
      description: t('help.ordering.description'),
      steps: [
        t('help.ordering.step1'),
        t('help.ordering.step2'),
        t('help.ordering.step3'),
        t('help.ordering.step4'),
        t('help.ordering.step5'),
        t('help.ordering.step6'),
        t('help.ordering.step7'),
        t('help.ordering.step8'),
      ]
    },
    {
      icon: Search,
      title: t('help.tracking.title'),
      description: t('help.tracking.description'),
      steps: [
        t('help.tracking.step1'),
        t('help.tracking.step2'),
        t('help.tracking.step3'),
        t('help.tracking.step4'),
        t('help.tracking.step5'),
        t('help.tracking.step6'),
      ]
    },
    {
      icon: MapPin,
      title: t('help.deliveryArea.title'),
      description: t('help.deliveryArea.description'),
      steps: [
        t('help.deliveryArea.info1'),
        t('help.deliveryArea.info2'),
        t('help.deliveryArea.info3'),
        t('help.deliveryArea.info4'),
        t('help.deliveryArea.info5'),
      ]
    },
    {
      icon: CreditCard,
      title: t('help.payment.title'),
      description: t('help.payment.description'),
      steps: [
        t('help.payment.info1'),
        t('help.payment.info2'),
        t('help.payment.info3'),
        t('help.payment.info4'),
        t('help.payment.info5'),
      ]
    },
    {
      icon: QrCode,
      title: t('help.qrcode.title'),
      description: t('help.qrcode.description'),
      steps: [
        t('help.qrcode.step1'),
        t('help.qrcode.step2'),
        t('help.qrcode.step3'),
        t('help.qrcode.step4'),
        t('help.qrcode.step5'),
      ]
    },
    {
      icon: Coffee,
      title: t('help.coffees.title'),
      description: t('help.coffees.description'),
      steps: [
        t('help.coffees.espresso'),
        t('help.coffees.americano'),
        t('help.coffees.cappuccino'),
        t('help.coffees.latte'),
        t('help.coffees.quality'),
      ]
    },
  ];

  const faqs = [
    { q: t('help.faqs.q1'), a: t('help.faqs.a1') },
    { q: t('help.faqs.q2'), a: t('help.faqs.a2') },
    { q: t('help.faqs.q3'), a: t('help.faqs.a3') },
    { q: t('help.faqs.q4'), a: t('help.faqs.a4') },
    { q: t('help.faqs.q5'), a: t('help.faqs.a5') },
    { q: t('help.faqs.q6'), a: t('help.faqs.a6') },
    { q: t('help.faqs.q7'), a: t('help.faqs.a7') },
    { q: t('help.faqs.q8'), a: t('help.faqs.a8') },
  ];

  const filteredCategories = categories.filter(cat =>
    cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.steps.some(step => step.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFaqs = faqs.filter(faq =>
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Help & FAQ — Café Academy"
        description="Find answers about ordering, delivery area, payment, QR codes and our coffee selection at Café Academy."
        path="/help"
        jsonLd={faqJsonLd}
      />
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <HelpCircle className="w-12 h-12 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                {t('help.title')}
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">
              {t('help.subtitle')}
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('help.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            {t('help.categories')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filteredCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <category.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {category.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="shrink-0">{stepIndex + 1}</Badge>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQs Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              {t('help.faqs.title')}
            </h2>
            
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-4 text-center">
              {t('help.contact.title')}
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              {t('help.contact.description')}
            </p>
            
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold">{t('help.contact.phone')}</p>
                    <a href={`tel:${t('delivery.businessPhone')}`} className="text-muted-foreground hover:text-primary">
                      {t('delivery.businessPhone')}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold">{t('help.contact.email')}</p>
                    <a href={`mailto:${t('delivery.businessEmail')}`} className="text-muted-foreground hover:text-primary break-all">
                      {t('delivery.businessEmail')}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPinned className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold">{t('help.contact.address')}</p>
                    <p className="text-muted-foreground">
                      {t('delivery.businessAddress')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold">{t('help.contact.hours')}</p>
                    <p className="text-muted-foreground">
                      {t('help.contact.hoursInfo')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HelpPage;