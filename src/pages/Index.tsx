import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { CoffeeCard } from "@/components/CoffeeCard";
import { Footer } from "@/components/Footer";
import { coffeesI18n } from "@/data/coffees-i18n";
import { useLanguage } from "@/i18n/LanguageContext";

const Index = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const handleCoffeeClick = (coffeeId: string) => {
    navigate(`/coffee/${coffeeId}`);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pb-20 md:pb-0">
      <Navigation />
      <Hero />
      
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-warm">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {t('coffee.sectionTitle')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('coffee.sectionDescription')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
      <Footer />
    </div>
  );
};

export default Index;
