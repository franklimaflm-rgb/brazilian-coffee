import { Button } from "@/components/ui/button";
import { Coffee, BookOpen, Heart } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/coffee-hero.jpg";

export const Hero = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-[100svh] portrait:min-h-fit pt-16 sm:pt-20 portrait:pt-12 safe-top flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src={heroImage} 
          alt="Beautiful coffee setup" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-4xl mx-auto w-full">
        <div className="animate-fade-in">
          <div className="flex justify-center mb-6 tablet:mb-5 portrait:mb-3">
            <Coffee className="w-16 h-16 tablet:w-14 tablet:h-14 portrait:w-12 portrait:h-12 text-accent animate-float" />
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-7xl tablet:text-4xl portrait:text-2xl portrait:sm:text-4xl font-bold mb-6 tablet:mb-5 portrait:mb-4 leading-tight break-word">
            {t('hero.title')}
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl tablet:text-xl portrait:text-base portrait:sm:text-lg mb-8 tablet:mb-7 portrait:mb-5 text-gray-200 max-w-2xl mx-auto leading-relaxed break-word">
            {t('hero.description')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 tablet:gap-4 portrait:gap-3 justify-center mb-12 tablet:mb-10 portrait:mb-6">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary-glow text-primary-foreground px-8 py-4 tablet:py-3.5 portrait:py-3 text-lg font-semibold shadow-glow transition-all duration-300 hover:scale-105"
              onClick={() => navigate('/menu')}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Explorar Receitas
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:text-primary px-8 py-4 tablet:py-3.5 portrait:py-3 text-lg font-semibold transition-all duration-300 hover:scale-105"
              onClick={() => navigate('/menu')}
            >
              <Heart className="w-5 h-5 mr-2" />
              Favoritos
            </Button>
          </div>
          
          <div className="w-full max-w-md sm:max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 tablet:gap-5 portrait:gap-3 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-2xl p-3 sm:p-6 tablet:p-5 portrait:p-3 border border-white/20">
              <h3 className="text-lg sm:text-2xl tablet:text-xl portrait:text-lg font-bold mb-1 sm:mb-2 portrait:mb-1">15+</h3>
              <p className="text-xs sm:text-base tablet:text-sm portrait:text-xs text-gray-200">Tipos de Café</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-2xl p-3 sm:p-6 tablet:p-5 portrait:p-3 border border-white/20">
              <h3 className="text-lg sm:text-2xl tablet:text-xl portrait:text-lg font-bold mb-1 sm:mb-2 portrait:mb-1">100%</h3>
              <p className="text-xs sm:text-base tablet:text-sm portrait:text-xs text-gray-200">Receitas Testadas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-2xl p-3 sm:p-6 tablet:p-5 portrait:p-3 border border-white/20">
              <h3 className="text-lg sm:text-2xl tablet:text-xl portrait:text-lg font-bold mb-1 sm:mb-2 portrait:mb-1">5★</h3>
              <p className="text-xs sm:text-base tablet:text-sm portrait:text-xs text-gray-200">Avaliação Média</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};