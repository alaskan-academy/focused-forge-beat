// Cardápio do Coffee Cats: opções do balcão e detalhes de cada item (tags e preço).
// As tags são usadas para conferir as atividades de alergia (`avoid`) e recomendação (`wants`).

export const MENU = {
  size: ['small', 'medium', 'large'],
  drink: ['latte', 'cappuccino', 'espresso', 'flat white', 'mocha', 'hot chocolate', 'iced tea', 'black coffee', 'chai latte', 'green tea', 'orange juice'],
  temp: ['hot', 'iced'],
  milk: ['whole milk', 'oat milk', 'almond milk'],
  extras: ['extra shot', 'whipped cream', 'caramel syrup', 'cinnamon', 'decaf', 'no sugar', 'less ice'],
  food: [
    'croissant',
    'almond croissant',
    'blueberry muffin',
    'banana bread',
    'cheese toastie',
    'egg sandwich',
    'chocolate cookie',
    'brownie',
    'carrot cake',
    'lemon cake',
    'fruit cup',
    'gluten-free muffin',
    'veggie wrap',
    'yogurt bowl',
  ],
  where: ['for here', 'to go'],
} as const;

export type MenuField = keyof typeof MENU;
export const SINGLE_FIELDS = ['size', 'drink', 'temp', 'milk', 'where'] as const;
export const MULTI_FIELDS = ['extras', 'food'] as const;

export type MenuTag = 'nuts' | 'gluten' | 'dairy' | 'egg' | 'vegan' | 'sweet' | 'savory' | 'light' | 'heavy' | 'breakfast' | 'caffeine' | 'cold';

export type MenuItem = { name: string; price_cents: number; tags: MenuTag[]; pt: string };

export const MENU_ITEMS: MenuItem[] = [
  { name: 'latte', price_cents: 450, tags: ['dairy', 'caffeine'], pt: 'latte' },
  { name: 'cappuccino', price_cents: 425, tags: ['dairy', 'caffeine'], pt: 'cappuccino' },
  { name: 'espresso', price_cents: 300, tags: ['caffeine'], pt: 'expresso' },
  { name: 'flat white', price_cents: 450, tags: ['dairy', 'caffeine'], pt: 'flat white' },
  { name: 'mocha', price_cents: 500, tags: ['dairy', 'caffeine', 'sweet'], pt: 'mocha' },
  { name: 'hot chocolate', price_cents: 400, tags: ['dairy', 'sweet'], pt: 'chocolate quente' },
  { name: 'iced tea', price_cents: 350, tags: ['cold', 'vegan'], pt: 'chá gelado' },
  { name: 'black coffee', price_cents: 275, tags: ['caffeine', 'vegan'], pt: 'café preto' },
  { name: 'chai latte', price_cents: 475, tags: ['dairy', 'sweet', 'caffeine'], pt: 'chai latte' },
  { name: 'green tea', price_cents: 300, tags: ['vegan', 'light'], pt: 'chá verde' },
  { name: 'orange juice', price_cents: 375, tags: ['vegan', 'cold', 'sweet', 'breakfast'], pt: 'suco de laranja' },

  { name: 'croissant', price_cents: 325, tags: ['gluten', 'dairy', 'light', 'breakfast'], pt: 'croissant' },
  { name: 'almond croissant', price_cents: 375, tags: ['gluten', 'dairy', 'nuts', 'sweet'], pt: 'croissant de amêndoas' },
  { name: 'blueberry muffin', price_cents: 350, tags: ['gluten', 'dairy', 'sweet', 'breakfast'], pt: 'muffin de mirtilo' },
  { name: 'banana bread', price_cents: 350, tags: ['gluten', 'vegan', 'nuts', 'sweet'], pt: 'pão de banana (com nozes)' },
  { name: 'cheese toastie', price_cents: 650, tags: ['gluten', 'dairy', 'savory', 'heavy'], pt: 'misto quente de queijo' },
  { name: 'egg sandwich', price_cents: 600, tags: ['gluten', 'egg', 'savory', 'breakfast'], pt: 'sanduíche de ovo' },
  { name: 'chocolate cookie', price_cents: 250, tags: ['gluten', 'dairy', 'sweet'], pt: 'cookie de chocolate' },
  { name: 'brownie', price_cents: 375, tags: ['gluten', 'dairy', 'sweet', 'heavy'], pt: 'brownie' },
  { name: 'carrot cake', price_cents: 425, tags: ['gluten', 'dairy', 'nuts', 'sweet', 'heavy'], pt: 'bolo de cenoura (com nozes)' },
  { name: 'lemon cake', price_cents: 400, tags: ['gluten', 'dairy', 'sweet', 'light'], pt: 'bolo de limão' },
  { name: 'fruit cup', price_cents: 400, tags: ['vegan', 'sweet', 'light'], pt: 'copo de frutas' },
  { name: 'gluten-free muffin', price_cents: 375, tags: ['dairy', 'egg', 'sweet', 'breakfast'], pt: 'muffin sem glúten' },
  { name: 'veggie wrap', price_cents: 650, tags: ['gluten', 'vegan', 'savory', 'heavy'], pt: 'wrap de legumes' },
  { name: 'yogurt bowl', price_cents: 500, tags: ['dairy', 'light', 'breakfast'], pt: 'tigela de iogurte' },
];

export const MENU_BY_NAME: Record<string, MenuItem> = Object.fromEntries(MENU_ITEMS.map((m) => [m.name, m]));

export const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
