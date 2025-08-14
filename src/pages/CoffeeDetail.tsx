import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Users, Coffee, Lightbulb } from "lucide-react";
import { getCoffeeById } from "@/data/coffees";

const CoffeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const coffee = getCoffeeById(id || "");

  if (!coffee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Café não encontrado</h1>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <div className="container mx-auto px-4 py-8">
        <Button 
          onClick={() => navigate("/")} 
          variant="outline" 
          className="mb-8 hover:bg-accent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Image */}
          <div className="aspect-square rounded-lg overflow-hidden shadow-warm">
            <img 
              src={coffee.image} 
              alt={coffee.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Coffee Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4">{coffee.name}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {coffee.description}
              </p>
            </div>

            <div className="flex gap-4">
              <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
                <Clock className="w-4 h-4" />
                {coffee.prepTime}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
                <Users className="w-4 h-4" />
                {coffee.difficulty}
              </Badge>
            </div>

            {/* Ingredients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-primary" />
                  Ingredientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {coffee.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-foreground">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Modo de Preparo</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {coffee.instructions.map((instruction, index) => (
                  <li key={index} className="flex gap-4">
                    <span className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-foreground leading-relaxed pt-1">{instruction}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Lightbulb className="w-6 h-6 text-accent" />
                Dicas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {coffee.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                    <p className="text-foreground leading-relaxed">{tip}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoffeeDetail;