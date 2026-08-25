import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, ShoppingCart, BookOpen } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface CoffeeCardProps {
  name: string;
  description: string;
  image: string;
  prepTime: string;
  difficulty: string;
  onClick: () => void;
  buttonText?: string;
  buttonIcon?: 'recipe' | 'order';
  showPrice?: boolean;
  price?: number;
}

export const CoffeeCard = ({
  name,
  description,
  image,
  prepTime,
  difficulty,
  onClick,
  buttonText,
  buttonIcon = 'recipe',
  showPrice = false,
  price = 8.50
}: CoffeeCardProps) => {
  const { t } = useLanguage();

  const getButtonText = () => {
    if (buttonText) return buttonText;
    return buttonIcon === 'order' ? t('coffee.orderNow') : t('coffee.viewRecipe');
  };

  const getButtonIcon = () => {
    if (buttonIcon === 'order') return <ShoppingCart className="w-4 h-4 mr-2" />;
    return <BookOpen className="w-4 h-4 mr-2" />;
  };

  return (
    <Card className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-warm hover:-translate-y-1 tablet:hover:-translate-y-1.5 sm:hover:-translate-y-2 bg-card border-border">
      <div className="aspect-square overflow-hidden">
        <img
          src={image}
          alt={`${name} coffee drink`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />
      </div>
      <CardContent className="p-3 sm:p-4 tablet:p-5 md:p-6">
        <h2 className="text-lg sm:text-xl tablet:text-xl font-bold text-foreground mb-2">{name}</h2>
        <p className="text-sm sm:text-base tablet:text-base text-muted-foreground mb-3 tablet:mb-3.5 sm:mb-4 line-clamp-2">{description}</p>

        <div className="flex items-center justify-between mb-3 tablet:mb-3.5 sm:mb-4 text-xs sm:text-sm tablet:text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 tablet:w-4 tablet:h-4" />
            <span>{prepTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 tablet:w-4 tablet:h-4" />
            <span>{difficulty}</span>
          </div>
        </div>

        {showPrice && (
          <div className="mb-3 tablet:mb-3.5 sm:mb-4 text-center">
            <span className="text-xl sm:text-2xl tablet:text-2xl font-bold text-primary">£{price.toFixed(2)}</span>
          </div>
        )}

        <Button
          onClick={onClick}
          variant={buttonIcon === 'order' ? 'default' : 'secondary'}
          className="w-full h-11 sm:h-10 tablet:h-10 text-sm sm:text-base tablet:text-base transition-colors duration-300 hover:bg-accent touch-manipulation"
          size="default"
        >
          {getButtonIcon()}
          {getButtonText()}
        </Button>
      </CardContent>
    </Card>
  );
};