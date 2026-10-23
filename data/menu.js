/* Vizi Capitali · menu
   Formato JSON: modificare dalla pagina di gestione (admin.html) oppure con attenzione a virgole e virgolette.
   JSON format: edit from admin.html, or carefully by hand (mind commas and quotes).
   Istruzioni / instructions: README.md
   ⚠️ Piatti, prezzi e allergeni sono ESEMPI: controllateli. Dishes, prices and allergens are EXAMPLES. */
window.MENU = [
  {
    "id": "vizi",
    "title": {
      "it": "I Sette Vizi",
      "en": "The Seven Vices"
    },
    "note": {
      "it": "Le pizze della casa. Una per ogni peccato capitale.",
      "en": "Our house pizzas. One for every deadly sin."
    },
    "items": [
      {
        "id": "gola",
        "name": "Gola",
        "desc": {
          "it": "Fior di latte, salsiccia, friarielli, provola affumicata, olio al peperoncino.",
          "en": "Fior di latte, sausage, friarielli greens, smoked provola, chilli oil."
        },
        "price": 11,
        "tags": [
          "top"
        ],
        "allergens": [
          "glutine",
          "latte"
        ],
        "available": true
      },
      {
        "id": "ira",
        "name": "Ira",
        "desc": {
          "it": "Pomodoro, fior di latte, 'nduja, salame piccante, peperoncino fresco.",
          "en": "Tomato, fior di latte, 'nduja, spicy salami, fresh chilli."
        },
        "price": 10.5,
        "tags": [
          "piccante"
        ],
        "allergens": [
          "glutine",
          "latte"
        ],
        "available": true
      },
      {
        "id": "lussuria",
        "name": "Lussuria",
        "desc": {
          "it": "Bianca con burrata, mortadella, granella di pistacchio e basilico.",
          "en": "White base with burrata, mortadella, crushed pistachio and basil."
        },
        "price": 12.5,
        "tags": [
          "top"
        ],
        "allergens": [
          "glutine",
          "latte",
          "frutta_a_guscio"
        ],
        "available": true
      },
      {
        "id": "superbia",
        "name": "Superbia",
        "desc": {
          "it": "Mozzarella di bufala DOP, pomodorino del Piennolo, basilico, olio EVO.",
          "en": "Buffalo mozzarella DOP, Piennolo cherry tomatoes, basil, extra-virgin olive oil."
        },
        "price": 12,
        "tags": [
          "veg"
        ],
        "allergens": [
          "glutine",
          "latte"
        ],
        "available": true
      },
      {
        "id": "avarizia",
        "name": "Avarizia",
        "desc": {
          "it": "Tanto gusto, poca spesa: pomodoro, aglio, origano, acciughe, capperi, olive.",
          "en": "Big flavour, small bill: tomato, garlic, oregano, anchovies, capers, olives."
        },
        "price": 8,
        "tags": [],
        "allergens": [
          "glutine",
          "pesce"
        ],
        "available": true
      },
      {
        "id": "invidia",
        "name": "Invidia",
        "desc": {
          "it": "Quattro formaggi, miele di castagno e noci. Te la ruberanno dal piatto.",
          "en": "Four cheeses, chestnut honey and walnuts. Everyone will steal a slice."
        },
        "price": 11.5,
        "tags": [
          "veg"
        ],
        "allergens": [
          "glutine",
          "latte",
          "frutta_a_guscio"
        ],
        "available": true
      },
      {
        "id": "accidia",
        "name": "Accidia",
        "desc": {
          "it": "Patate al forno, salsiccia, provola e rosmarino. Da mangiare sul divano.",
          "en": "Roast potatoes, sausage, provola and rosemary. Best eaten on the sofa."
        },
        "price": 10.5,
        "tags": [],
        "allergens": [
          "glutine",
          "latte"
        ],
        "available": true
      }
    ]
  },
  {
    "id": "classiche",
    "title": {
      "it": "Le Classiche",
      "en": "The Classics"
    },
    "items": [
      {
        "id": "marinara",
        "name": "Marinara",
        "desc": {
          "it": "Pomodoro, aglio, origano, olio EVO.",
          "en": "Tomato, garlic, oregano, extra-virgin olive oil."
        },
        "price": 6,
        "tags": [
          "vegan"
        ],
        "allergens": [
          "glutine"
        ],
        "available": true
      },
      {
        "id": "margherita",
        "name": "Margherita",
        "desc": {
          "it": "Pomodoro, fior di latte, basilico, olio EVO.",
          "en": "Tomato, fior di latte, basil, extra-virgin olive oil."
        },
        "price": 7,
        "tags": [
          "veg"
        ],
        "allergens": [
          "glutine",
          "latte"
        ],
        "image": "assets/img/menu/margherita.webp",
        "available": true
      },
      {
        "id": "diavola",
        "name": "Diavola",
        "desc": {
          "it": "Pomodoro, fior di latte, salame piccante. Ovviamente.",
          "en": "Tomato, fior di latte, spicy salami. Obviously."
        },
        "price": 8.5,
        "tags": [
          "piccante"
        ],
        "allergens": [
          "glutine",
          "latte"
        ],
        "image": "assets/img/menu/diavola.webp",
        "available": true
      },
      {
        "id": "capricciosa",
        "name": "Capricciosa",
        "desc": {
          "it": "Pomodoro, fior di latte, prosciutto cotto, funghi, carciofi, olive.",
          "en": "Tomato, fior di latte, cooked ham, mushrooms, artichokes, olives."
        },
        "price": 9.5,
        "tags": [],
        "allergens": [
          "glutine",
          "latte"
        ],
        "available": true
      },
      {
        "id": "boscaiola",
        "name": "Boscaiola",
        "desc": {
          "it": "Fior di latte, funghi, salsiccia.",
          "en": "Fior di latte, mushrooms, sausage."
        },
        "price": 9,
        "tags": [],
        "allergens": [
          "glutine",
          "latte"
        ],
        "available": true
      }
    ]
  },
  {
    "id": "fritti",
    "title": {
      "it": "Fritti",
      "en": "Fried Starters"
    },
    "items": [
      {
        "id": "suppli",
        "name": "Supplì classico",
        "desc": {
          "it": "Riso al sugo con cuore filante di mozzarella.",
          "en": "Rice in tomato sauce with a stretchy mozzarella heart."
        },
        "price": 2.5,
        "tags": [],
        "allergens": [
          "glutine",
          "latte",
          "uova"
        ],
        "available": true
      },
      {
        "id": "crocchette",
        "name": "Crocchette di patate",
        "desc": {
          "it": "Tre crocchette di patate e pecorino.",
          "en": "Three potato and pecorino croquettes."
        },
        "price": 4,
        "tags": [
          "veg"
        ],
        "allergens": [
          "glutine",
          "latte",
          "uova"
        ],
        "available": true
      },
      {
        "id": "fiori",
        "name": "Fiori di zucca",
        "desc": {
          "it": "Ripieni di mozzarella e alici, in pastella.",
          "en": "Courgette flowers stuffed with mozzarella and anchovies, battered."
        },
        "price": 5,
        "tags": [],
        "allergens": [
          "glutine",
          "latte",
          "pesce"
        ],
        "available": true
      }
    ]
  },
  {
    "id": "dolci",
    "title": {
      "it": "Dolci",
      "en": "Desserts"
    },
    "items": [
      {
        "id": "tiramisu",
        "name": "Tiramisù",
        "desc": {
          "it": "Fatto in casa, ogni mattina.",
          "en": "Homemade, every morning."
        },
        "price": 5,
        "tags": [
          "veg"
        ],
        "allergens": [
          "glutine",
          "latte",
          "uova"
        ],
        "available": true
      },
      {
        "id": "pizza-nutella",
        "name": "Pizza alla Nutella",
        "desc": {
          "it": "Il vizio finale. Da dividere (forse).",
          "en": "The final vice. For sharing (maybe)."
        },
        "price": 7,
        "tags": [
          "veg",
          "top"
        ],
        "allergens": [
          "glutine",
          "latte",
          "frutta_a_guscio",
          "soia"
        ],
        "available": true
      }
    ]
  },
  {
    "id": "bevande",
    "title": {
      "it": "Bevande",
      "en": "Drinks"
    },
    "items": [
      {
        "id": "acqua",
        "name": "Acqua 50cl",
        "desc": {
          "it": "Naturale o frizzante.",
          "en": "Still or sparkling."
        },
        "price": 1.5,
        "tags": [],
        "allergens": [],
        "available": true
      },
      {
        "id": "bibita",
        "name": "Bibita in lattina",
        "desc": {
          "it": "Coca-Cola, Fanta, Sprite.",
          "en": "Coca-Cola, Fanta, Sprite."
        },
        "price": 2.5,
        "tags": [],
        "allergens": [],
        "available": true
      },
      {
        "id": "birra",
        "name": "Birra artigianale 33cl",
        "desc": {
          "it": "Chiedi quella del giorno.",
          "en": "Ask for today's choice."
        },
        "price": 5,
        "tags": [],
        "allergens": [
          "glutine"
        ],
        "available": true
      }
    ]
  }
];
