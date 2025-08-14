import { useNavigate } from "react-router-dom";
import { Hero } from "@/components/Hero";
import { CoffeeCard } from "@/components/CoffeeCard";
import { coffees } from "@/data/coffees";

const Index = () => {
  const navigate = useNavigate();

  const handleCoffeeClick = (coffeeId: string) => {
    navigate(`/coffee/${coffeeId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Hero />
      
      <section className="py-16 px-6 bg-gradient-warm">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Tipos de Café para Aprender
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore nossa coleção de receitas cuidadosamente selecionadas. 
              De clássicos atemporais a criações modernas.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </section>
    </div>
  );
};

export default Index;
