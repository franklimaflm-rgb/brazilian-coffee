import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Users, Coffee, Lightbulb } from "lucide-react";
import { getCoffeeByIdI18n } from "@/data/coffees-i18n";
import { useLanguage } from "@/i18n/LanguageContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

const SITE_URL = "https://brazilian-coffee.lovable.app";

const CoffeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const coffee = getCoffeeByIdI18n(id || "");

  if (!coffee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('coffee.notFound')}</h1>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('coffee.backToHome')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Navigation />
      <div className="container mx-auto px-4 tablet:px-6 py-8 tablet:py-10">
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="mb-8 tablet:mb-10 hover:bg-accent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('coffee.back')}
        </Button>

        <div className="grid lg:grid-cols-2 tablet:grid-cols-2 gap-8 tablet:gap-7 mb-8 tablet:mb-10">
          {/* Image */}
          <div className="aspect-square rounded-lg overflow-hidden shadow-warm">
            <img
              src={coffee.image}
              alt={coffee.name[language]}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Coffee Info */}
          <div className="space-y-6 tablet:space-y-5">
            <div>
              <h1 className="text-4xl tablet:text-3xl font-bold text-foreground mb-4 tablet:mb-3">{coffee.name[language]}</h1>
              <p className="text-lg tablet:text-base text-muted-foreground leading-relaxed">
                {coffee.description[language]}
              </p>
            </div>

            <div className="flex gap-4 tablet:gap-3">
              <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2 tablet:px-3 tablet:py-1.5">
                <Clock className="w-4 h-4" />
                {coffee.prepTime[language]}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2 tablet:px-3 tablet:py-1.5">
                <Users className="w-4 h-4" />
                {coffee.difficulty[language]}
              </Badge>
            </div>

            {/* Ingredients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl tablet:text-lg">
                  <Coffee className="w-5 h-5 text-primary" />
                  {t('coffee.ingredients')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 tablet:space-y-1.5">
                  {coffee.ingredients[language].map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-foreground text-base tablet:text-sm">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <div className="grid lg:grid-cols-2 tablet:grid-cols-2 gap-8 tablet:gap-7">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl tablet:text-xl">{t('coffee.instructions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4 tablet:space-y-3">
                {coffee.instructions[language].map((instruction, index) => (
                  <li key={index} className="flex gap-4 tablet:gap-3">
                    <span className="flex items-center justify-center w-8 h-8 tablet:w-7 tablet:h-7 bg-primary text-primary-foreground rounded-full text-sm tablet:text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-foreground leading-relaxed pt-1 text-base tablet:text-sm">{instruction}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl tablet:text-xl">
                <Lightbulb className="w-6 h-6 tablet:w-5 tablet:h-5 text-accent" />
                {t('coffee.tips')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 tablet:space-y-2.5">
                {coffee.tips[language].map((tip, index) => (
                  <li key={index} className="flex items-start gap-3 tablet:gap-2.5">
                    <Lightbulb className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                    <p className="text-foreground leading-relaxed text-base tablet:text-sm">{tip}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CoffeeDetail;