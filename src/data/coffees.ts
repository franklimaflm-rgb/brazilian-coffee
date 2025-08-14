import espressoImg from "@/assets/espresso.jpg";
import cappuccinoImg from "@/assets/cappuccino.jpg";
import latteImg from "@/assets/latte.jpg";
import americanoImg from "@/assets/americano.jpg";

export interface Coffee {
  id: string;
  name: string;
  description: string;
  image: string;
  prepTime: string;
  difficulty: string;
  ingredients: string[];
  instructions: string[];
  tips: string[];
}

export const coffees: Coffee[] = [
  {
    id: "espresso",
    name: "Espresso",
    description: "O café mais puro e concentrado, base para todas as outras bebidas.",
    image: espressoImg,
    prepTime: "30 segundos",
    difficulty: "Intermediário",
    ingredients: [
      "18-20g de café moído fino",
      "30ml de água quente (90-96°C)",
    ],
    instructions: [
      "Aqueça a xícara com água quente",
      "Moa o café na granulometria fina",
      "Coloque o café no porta-filtro e nivele",
      "Prense com 15kg de pressão",
      "Extraia por 25-30 segundos",
      "A extração deve ter cor caramelo dourado"
    ],
    tips: [
      "Use água filtrada para melhor sabor",
      "A temperatura ideal da água é 93°C",
      "O tempo de extração influencia no sabor",
      "Limpe sempre o porta-filtro antes de usar"
    ]
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    description: "Espresso com leite vaporizado e espuma cremosa em proporções perfeitas.",
    image: cappuccinoImg,
    prepTime: "3 minutos",
    difficulty: "Intermediário",
    ingredients: [
      "1 dose de espresso (30ml)",
      "100ml de leite integral gelado",
    ],
    instructions: [
      "Prepare um espresso em xícara de 150ml",
      "Despeje o leite gelado no jarro de inox",
      "Vaporize o leite até 60-65°C",
      "Bata o leite até formar microespuma",
      "Despeje o leite sobre o espresso",
      "Finalize com arte latte se desejar"
    ],
    tips: [
      "Use leite integral para melhor textura",
      "Não superaqueça o leite",
      "A espuma deve ser cremosa, não seca",
      "Pratique os movimentos para latte art"
    ]
  },
  {
    id: "latte",
    name: "Latte",
    description: "Café suave com muito leite vaporizado e uma fina camada de espuma.",
    image: latteImg,
    prepTime: "3 minutos",
    difficulty: "Fácil",
    ingredients: [
      "1 dose de espresso (30ml)",
      "150ml de leite integral",
    ],
    instructions: [
      "Prepare um espresso em copo alto",
      "Aqueça o leite até 60-65°C",
      "Vaporize criando microespuma sutil",
      "Despeje o leite lentamente",
      "Mantenha proporção 1:3 (café:leite)",
      "Finalize com leve camada de espuma"
    ],
    tips: [
      "Ideal para quem prefere sabor mais suave",
      "Use copo alto de vidro ou cerâmica",
      "Varie com xaropes de baunilha ou caramelo",
      "Perfeito para latte art mais elaborada"
    ]
  },
  {
    id: "americano",
    name: "Americano",
    description: "Espresso diluído em água quente, preservando o sabor intenso do café.",
    image: americanoImg,
    prepTime: "1 minuto",
    difficulty: "Fácil",
    ingredients: [
      "1-2 doses de espresso (30-60ml)",
      "120-150ml de água quente (85°C)",
    ],
    instructions: [
      "Prepare 1 ou 2 doses de espresso",
      "Aqueça a água até 85°C",
      "Despeje a água quente na xícara",
      "Adicione o espresso sobre a água",
      "Mexa delicadamente",
      "Sirva imediatamente"
    ],
    tips: [
      "Use água na temperatura correta",
      "Ajuste a proporção conforme preferência",
      "Adicione açúcar ou adoçante se desejar",
      "Ideal para quem gosta de café forte mas longo"
    ]
  }
];

export const getCoffeeById = (id: string): Coffee | undefined => {
  return coffees.find(coffee => coffee.id === id);
};