import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users } from "lucide-react";

interface CoffeeCardProps {
  name: string;
  description: string;
  image: string;
  prepTime: string;
  difficulty: string;
  onClick: () => void;
}

export const CoffeeCard = ({ name, description, image, prepTime, difficulty, onClick }: CoffeeCardProps) => {
  return (
    <Card className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-warm hover:-translate-y-2 bg-card border-border">
      <div className="aspect-square overflow-hidden">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-2">{name}</h3>
        <p className="text-muted-foreground mb-4 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{prepTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{difficulty}</span>
          </div>
        </div>
        
        <Button 
          onClick={onClick}
          variant="secondary"
          className="w-full transition-colors duration-300 hover:bg-accent"
        >
          Ver Receita
        </Button>
      </CardContent>
    </Card>
  );
};