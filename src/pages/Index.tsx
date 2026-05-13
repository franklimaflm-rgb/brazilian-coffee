import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { CoffeeCard } from "@/components/CoffeeCard";
import { Footer } from "@/components/Footer";
import { InstallPrompt } from "@/components/InstallPrompt";
import { SEO } from "@/components/SEO";
import { coffeesI18n } from "@/data/coffees-i18n";
import { useLanguage } from "@/i18n/LanguageContext";

const SITE_URL = "https://brazilian-coffee.lovable.app";

const Index = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const handleCoffeeClick = (coffeeId: string) => {
    navigate(`/coffee/${coffeeId}`);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background w-full">
      <SEO
        title="Café Academy — Recipes, Techniques & Coffee Delivery"
        description="Learn to brew espresso, cappuccino, latte and americano like a barista, and order fresh coffee delivered across Market Harborough."
        path="/"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Café Academy",
            url: SITE_URL,
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE_URL}/menu?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Café Academy",
            url: SITE_URL,
            logo: `${SITE_URL}/og-image.jpg`,
            sameAs: [],
          },
        ]}
      />
      <Navigation />
      <main className="flex-1 w-full">
        <Hero />
        <InstallPrompt />
        
        <section className="py-12 sm:py-16 landscape:py-8 px-4 sm:px-6 bg-gradient-warm pb-24 md:pb-16 landscape:pb-20">
          <div className="container mx-auto">
            <div className="text-center mb-12 landscape:mb-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl landscape:text-xl landscape:sm:text-2xl font-bold text-foreground mb-4 landscape:mb-2">
                {t('coffee.sectionTitle')}
              </h2>
              <p className="text-xl landscape:text-base text-muted-foreground max-w-2xl mx-auto">
                {t('coffee.sectionDescription')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 landscape:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 landscape:gap-3">
              {coffeesI18n.map((coffee) => (
                <CoffeeCard
                  key={coffee.id}
                  name={coffee.name[language]}
                  description={coffee.description[language]}
                  image={coffee.image}
                  prepTime={coffee.prepTime[language]}
                  difficulty={coffee.difficulty[language]}
                  onClick={() => handleCoffeeClick(coffee.id)}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
