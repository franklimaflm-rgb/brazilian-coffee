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
      
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t('coffee.sectionTitle')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('coffee.sectionDescription')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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