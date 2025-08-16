import { Navigation } from "@/components/Navigation";
import { CoffeeCard } from "@/components/CoffeeCard";
import { coffees } from "@/data/coffees";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";

const MenuPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleCoffeeClick = (coffeeId: string) => {
    navigate(`/coffee/${coffeeId}`);
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
          {coffees.map((coffee) => (
            <CoffeeCard
              key={coffee.id}
              name={coffee.name}
              description={coffee.description}
              image={coffee.image}
              prepTime={coffee.prepTime}
              difficulty={coffee.difficulty}
              onClick={() => handleCoffeeClick(coffee.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuPage;