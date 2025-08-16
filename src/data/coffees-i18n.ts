import espressoImg from "@/assets/espresso.jpg";
import cappuccinoImg from "@/assets/cappuccino.jpg";
import latteImg from "@/assets/latte.jpg";
import americanoImg from "@/assets/americano.jpg";

export interface Coffee {
  id: string;
  name: { [key: string]: string };
  description: { [key: string]: string };
  image: string;
  prepTime: { [key: string]: string };
  difficulty: { [key: string]: string };
  ingredients: { [key: string]: string[] };
  instructions: { [key: string]: string[] };
  tips: { [key: string]: string[] };
}

export const coffeesI18n: Coffee[] = [
  {
    id: "espresso",
    name: {
      "pt-BR": "Espresso",
      "en-GB": "Espresso"
    },
    description: {
      "pt-BR": "O café mais puro e concentrado, base para todas as outras bebidas.",
      "en-GB": "The purest and most concentrated coffee, foundation for all other drinks."
    },
    image: espressoImg,
    prepTime: {
      "pt-BR": "30 segundos",
      "en-GB": "30 seconds"
    },
    difficulty: {
      "pt-BR": "Intermediário",
      "en-GB": "Intermediate"
    },
    ingredients: {
      "pt-BR": [
        "18-20g de café moído fino",
        "30ml de água quente (90-96°C)",
      ],
      "en-GB": [
        "18-20g finely ground coffee",
        "30ml hot water (90-96°C)",
      ]
    },
    instructions: {
      "pt-BR": [
        "Aqueça a xícara com água quente",
        "Moa o café na granulometria fina",
        "Coloque o café no porta-filtro e nivele",
        "Prense com 15kg de pressão",
        "Extraia por 25-30 segundos",
        "A extração deve ter cor caramelo dourado"
      ],
      "en-GB": [
        "Pre-heat the cup with hot water",
        "Grind coffee to fine consistency",
        "Place coffee in portafilter and level",
        "Tamp with 15kg pressure",
        "Extract for 25-30 seconds",
        "Extraction should have golden caramel colour"
      ]
    },
    tips: {
      "pt-BR": [
        "Use água filtrada para melhor sabor",
        "A temperatura ideal da água é 93°C",
        "O tempo de extração influencia no sabor",
        "Limpe sempre o porta-filtro antes de usar"
      ],
      "en-GB": [
        "Use filtered water for better taste",
        "Ideal water temperature is 93°C",
        "Extraction time influences the flavour",
        "Always clean the portafilter before use"
      ]
    }
  },
  {
    id: "cappuccino",
    name: {
      "pt-BR": "Cappuccino",
      "en-GB": "Cappuccino"
    },
    description: {
      "pt-BR": "Espresso com leite vaporizado e espuma cremosa em proporções perfeitas.",
      "en-GB": "Espresso with steamed milk and creamy foam in perfect proportions."
    },
    image: cappuccinoImg,
    prepTime: {
      "pt-BR": "3 minutos",
      "en-GB": "3 minutes"
    },
    difficulty: {
      "pt-BR": "Intermediário",
      "en-GB": "Intermediate"
    },
    ingredients: {
      "pt-BR": [
        "1 dose de espresso (30ml)",
        "100ml de leite integral gelado",
      ],
      "en-GB": [
        "1 shot of espresso (30ml)",
        "100ml cold whole milk",
      ]
    },
    instructions: {
      "pt-BR": [
        "Prepare um espresso em xícara de 150ml",
        "Despeje o leite gelado no jarro de inox",
        "Vaporize o leite até 60-65°C",
        "Bata o leite até formar microespuma",
        "Despeje o leite sobre o espresso",
        "Finalize com arte latte se desejar"
      ],
      "en-GB": [
        "Prepare espresso in a 150ml cup",
        "Pour cold milk into stainless steel jug",
        "Steam milk to 60-65°C",
        "Froth milk until microfoam forms",
        "Pour milk over the espresso",
        "Finish with latte art if desired"
      ]
    },
    tips: {
      "pt-BR": [
        "Use leite integral para melhor textura",
        "Não superaqueça o leite",
        "A espuma deve ser cremosa, não seca",
        "Pratique os movimentos para latte art"
      ],
      "en-GB": [
        "Use whole milk for better texture",
        "Don't overheat the milk",
        "Foam should be creamy, not dry",
        "Practice movements for latte art"
      ]
    }
  },
  {
    id: "latte",
    name: {
      "pt-BR": "Latte",
      "en-GB": "Latte"
    },
    description: {
      "pt-BR": "Café suave com muito leite vaporizado e uma fina camada de espuma.",
      "en-GB": "Smooth coffee with lots of steamed milk and a thin layer of foam."
    },
    image: latteImg,
    prepTime: {
      "pt-BR": "3 minutos",
      "en-GB": "3 minutes"
    },
    difficulty: {
      "pt-BR": "Fácil",
      "en-GB": "Easy"
    },
    ingredients: {
      "pt-BR": [
        "1 dose de espresso (30ml)",
        "150ml de leite integral",
      ],
      "en-GB": [
        "1 shot of espresso (30ml)",
        "150ml whole milk",
      ]
    },
    instructions: {
      "pt-BR": [
        "Prepare um espresso em copo alto",
        "Aqueça o leite até 60-65°C",
        "Vaporize criando microespuma sutil",
        "Despeje o leite lentamente",
        "Mantenha proporção 1:3 (café:leite)",
        "Finalize com leve camada de espuma"
      ],
      "en-GB": [
        "Prepare espresso in a tall glass",
        "Heat milk to 60-65°C",
        "Steam creating subtle microfoam",
        "Pour milk slowly",
        "Maintain 1:3 ratio (coffee:milk)",
        "Finish with light foam layer"
      ]
    },
    tips: {
      "pt-BR": [
        "Ideal para quem prefere sabor mais suave",
        "Use copo alto de vidro ou cerâmica",
        "Varie com xaropes de baunilha ou caramelo",
        "Perfeito para latte art mais elaborada"
      ],
      "en-GB": [
        "Ideal for those who prefer milder flavour",
        "Use tall glass or ceramic cup",
        "Vary with vanilla or caramel syrups",
        "Perfect for more elaborate latte art"
      ]
    }
  },
  {
    id: "americano",
    name: {
      "pt-BR": "Americano",
      "en-GB": "Americano"
    },
    description: {
      "pt-BR": "Espresso diluído em água quente, preservando o sabor intenso do café.",
      "en-GB": "Espresso diluted with hot water, preserving the intense coffee flavour."
    },
    image: americanoImg,
    prepTime: {
      "pt-BR": "1 minuto",
      "en-GB": "1 minute"
    },
    difficulty: {
      "pt-BR": "Fácil",
      "en-GB": "Easy"
    },
    ingredients: {
      "pt-BR": [
        "1-2 doses de espresso (30-60ml)",
        "120-150ml de água quente (85°C)",
      ],
      "en-GB": [
        "1-2 shots of espresso (30-60ml)",
        "120-150ml hot water (85°C)",
      ]
    },
    instructions: {
      "pt-BR": [
        "Prepare 1 ou 2 doses de espresso",
        "Aqueça a água até 85°C",
        "Despeje a água quente na xícara",
        "Adicione o espresso sobre a água",
        "Mexa delicadamente",
        "Sirva imediatamente"
      ],
      "en-GB": [
        "Prepare 1 or 2 shots of espresso",
        "Heat water to 85°C",
        "Pour hot water into cup",
        "Add espresso over the water",
        "Stir gently",
        "Serve immediately"
      ]
    },
    tips: {
      "pt-BR": [
        "Use água na temperatura correta",
        "Ajuste a proporção conforme preferência",
        "Adicione açúcar ou adoçante se desejar",
        "Ideal para quem gosta de café forte mas longo"
      ],
      "en-GB": [
        "Use water at correct temperature",
        "Adjust ratio according to preference",
        "Add sugar or sweetener if desired",
        "Ideal for those who like strong but long coffee"
      ]
    }
  }
];

export const getCoffeeByIdI18n = (id: string): Coffee | undefined => {
  return coffeesI18n.find(coffee => coffee.id === id);
};