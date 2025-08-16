export const translations = {
  "pt-BR": {
    // Navigation
    nav: {
      home: "Início",
      menu: "Menu",
      delivery: "Delivery",
      qrcode: "QR Code"
    },
    
    // Hero Section
    hero: {
      title: "A Arte do Café Perfeito",
      subtitle: "Aprenda a fazer os melhores cafés do mundo",
      description: "Descubra receitas autênticas e técnicas profissionais para transformar cada xícara numa experiência única. Do espresso clássico às criações mais sofisticadas.",
      explore: "Explorar Receitas",
      favorites: "Favoritos",
      recipes: "150+ Receitas",
      techniques: "Técnicas Pro",
      community: "10k+ Membros"
    },
    
    // Coffee Section
    coffee: {
      sectionTitle: "Tipos de Café para Aprender",
      sectionDescription: "Explore nossa coleção de receitas cuidadosamente selecionadas. De clássicos atemporais a criações modernas.",
      viewRecipe: "Ver Receita",
      backToMenu: "← Voltar ao Menu",
      prepTime: "Tempo de Preparo",
      difficulty: "Dificuldade",
      ingredients: "Ingredientes",
      instructions: "Modo de Preparo",
      tips: "Dicas Importantes",
      notFound: "Café não encontrado"
    },
    
    // QR Code Page
    qrcode: {
      title: "QR Code - Café Academy",
      description: "Escaneie o QR code abaixo para acessar nosso menu de delivery",
      downloadPng: "Download PNG",
      downloadSvg: "Download SVG",
      howToUse: "Como usar:",
      step1: "Abra a câmera do seu celular",
      step2: "Aponte para o QR code",
      step3: "Toque no link que aparecer",
      step4: "Faça seu pedido online",
      printVersion: "Versão para Impressão",
      socialVersion: "Versão para Redes Sociais"
    },
    
    // Language Selector
    language: {
      portuguese: "Português",
      english: "English"
    },
    
    // Footer
    footer: {
      contact: "Contato",
      social: "Redes Sociais",
      quickAccess: "Acesso Rápido"
    }
  },
  
  "en-GB": {
    // Navigation
    nav: {
      home: "Home",
      menu: "Menu",
      delivery: "Delivery",
      qrcode: "QR Code"
    },
    
    // Hero Section
    hero: {
      title: "The Art of Perfect Coffee",
      subtitle: "Learn to make the world's finest coffee",
      description: "Discover authentic recipes and professional techniques to transform every cup into a unique experience. From classic espresso to the most sophisticated creations.",
      explore: "Explore Recipes",
      favorites: "Favourites",
      recipes: "150+ Recipes",
      techniques: "Pro Techniques",
      community: "10k+ Members"
    },
    
    // Coffee Section
    coffee: {
      sectionTitle: "Coffee Types to Learn",
      sectionDescription: "Explore our carefully curated collection of recipes. From timeless classics to modern creations.",
      viewRecipe: "View Recipe",
      backToMenu: "← Back to Menu",
      prepTime: "Prep Time",
      difficulty: "Difficulty",
      ingredients: "Ingredients",
      instructions: "Instructions",
      tips: "Important Tips",
      notFound: "Coffee not found"
    },
    
    // QR Code Page
    qrcode: {
      title: "QR Code - Café Academy",
      description: "Scan the QR code below to access our delivery menu",
      downloadPng: "Download PNG",
      downloadSvg: "Download SVG",
      howToUse: "How to use:",
      step1: "Open your phone's camera",
      step2: "Point at the QR code",
      step3: "Tap the link that appears",
      step4: "Place your order online",
      printVersion: "Print Version",
      socialVersion: "Social Media Version"
    },
    
    // Language Selector
    language: {
      portuguese: "Português",
      english: "English"
    },
    
    // Footer
    footer: {
      contact: "Contact",
      social: "Social Media",
      quickAccess: "Quick Access"
    }
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations["pt-BR"];