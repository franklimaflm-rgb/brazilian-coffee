import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CoffeeCard } from "@/components/CoffeeCard";
import { coffeesI18n } from "@/data/coffees-i18n";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";

const MenuPage = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const handleCoffeeOrder = (coffeeId: string) => {
    // Redirect to delivery page with pre-selected coffee
    navigate(`/delivery?coffee=${coffeeId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 tablet:py-10 lg:py-12">
        <div className="text-center mb-8 tablet:mb-10 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl tablet:text-3xl lg:text-4xl font-bold text-foreground mb-3 tablet:mb-3.5 sm:mb-4">
            {t('coffee.sectionTitle')}
          </h1>
          <p className="text-base sm:text-lg tablet:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
            {t('coffee.sectionDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 tablet:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 tablet:gap-5 sm:gap-6">
          {coffeesI18n.map((coffee) => (
            <CoffeeCard
              key={coffee.id}
              name={coffee.name[language]}
              description={coffee.description[language]}
              image={coffee.image}
              prepTime={coffee.prepTime[language]}
              difficulty={coffee.difficulty[language]}
              onClick={() => handleCoffeeOrder(coffee.id)}
              buttonIcon="order"
              showPrice={true}
              price={8.50}
            />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MenuPage;