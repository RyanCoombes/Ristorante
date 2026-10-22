/* =====================================================================
   MENU DI VIZI CAPITALI  ·  VIZI CAPITALI MENU
   ---------------------------------------------------------------------
   Questo è l'unico file da modificare per aggiornare il menu.
   This is the only file you need to edit to update the menu.

   Ogni piatto / Each item:
     id:        codice unico, senza spazi (es. "margherita")
                unique code, no spaces
     name:      nome del piatto (uguale in tutte le lingue)
                dish name (same in every language)
     desc:      descrizione in italiano (it) e inglese (en)
                description in Italian (it) and English (en)
     price:     prezzo in euro, con il punto per i decimali (es. 8.50)
                price in euros, use a dot for decimals
     tags:      opzionale / optional — "veg", "piccante", "novita", "top"
     available: metti false se il piatto è finito oggi
                set to false if the item has sold out today

   Per aggiungere un piatto copia un blocco { ... }, incollalo sotto e
   cambia i valori. Ricorda la virgola tra un blocco e l'altro.
   To add an item copy a { ... } block, paste it below and change the
   values. Remember the comma between blocks.

   ⚠️ I piatti e i prezzi qui sotto sono ESEMPI: sostituiteli con i vostri.
   ⚠️ The dishes and prices below are EXAMPLES: replace them with yours.
   ===================================================================== */

window.MENU = [
  {
    id: "vizi",
    title: { it: "I Sette Vizi", en: "The Seven Vices" },
    note: {
      it: "Le pizze della casa. Una per ogni peccato capitale.",
      en: "Our house pizzas. One for every deadly sin."
    },
    items: [
      {
        id: "gola",
        name: "Gola",
        desc: {
          it: "Fior di latte, salsiccia, friarielli, provola affumicata, olio al peperoncino.",
          en: "Fior di latte, sausage, friarielli greens, smoked provola, chilli oil."
        },
        price: 11.0,
        tags: ["top"],
        available: true
      },
      {
        id: "ira",
        name: "Ira",
        desc: {
          it: "Pomodoro, fior di latte, 'nduja, salame piccante, peperoncino fresco.",
          en: "Tomato, fior di latte, 'nduja, spicy salami, fresh chilli."
        },
        price: 10.5,
        tags: ["piccante"],
        available: true
      },
      {
        id: "lussuria",
        name: "Lussuria",
        desc: {
          it: "Bianca con burrata, mortadella, granella di pistacchio e basilico.",
          en: "White base with burrata, mortadella, crushed pistachio and basil."
        },
        price: 12.5,
        tags: ["top"],
        available: true
      },
      {
        id: "superbia",
        name: "Superbia",
        desc: {
          it: "Mozzarella di bufala DOP, pomodorino del Piennolo, basilico, olio EVO.",
          en: "Buffalo mozzarella DOP, Piennolo cherry tomatoes, basil, extra-virgin olive oil."
        },
        price: 12.0,
        tags: ["veg"],
        available: true
      },
      {
        id: "avarizia",
        name: "Avarizia",
        desc: {
          it: "Tanto gusto, poca spesa: pomodoro, aglio, origano, acciughe, capperi, olive.",
          en: "Big flavour, small bill: tomato, garlic, oregano, anchovies, capers, olives."
        },
        price: 8.0,
        tags: [],
        available: true
      },
      {
        id: "invidia",
        name: "Invidia",
        desc: {
          it: "Quattro formaggi, miele di castagno e noci. Te la ruberanno dal piatto.",
          en: "Four cheeses, chestnut honey and walnuts. Everyone will steal a slice."
        },
        price: 11.5,
        tags: ["veg"],
        available: true
      },
      {
        id: "accidia",
        name: "Accidia",
        desc: {
          it: "Patate al forno, salsiccia, provola e rosmarino. Da mangiare sul divano.",
          en: "Roast potatoes, sausage, provola and rosemary. Best eaten on the sofa."
        },
        price: 10.5,
        tags: [],
        available: true
      }
    ]
  },

  {
    id: "classiche",
    title: { it: "Le Classiche", en: "The Classics" },
    items: [
      {
        id: "marinara",
        name: "Marinara",
        desc: {
          it: "Pomodoro, aglio, origano, olio EVO.",
          en: "Tomato, garlic, oregano, extra-virgin olive oil."
        },
        price: 6.0,
        tags: ["veg"],
        available: true
      },
      {
        id: "margherita",
        name: "Margherita",
        desc: {
          it: "Pomodoro, fior di latte, basilico, olio EVO.",
          en: "Tomato, fior di latte, basil, extra-virgin olive oil."
        },
        price: 7.0,
        tags: ["veg"],
        available: true
      },
      {
        id: "diavola",
        name: "Diavola",
        desc: {
          it: "Pomodoro, fior di latte, salame piccante. Ovviamente.",
          en: "Tomato, fior di latte, spicy salami. Obviously."
        },
        price: 8.5,
        tags: ["piccante"],
        available: true
      },
      {
        id: "capricciosa",
        name: "Capricciosa",
        desc: {
          it: "Pomodoro, fior di latte, prosciutto cotto, funghi, carciofi, olive.",
          en: "Tomato, fior di latte, cooked ham, mushrooms, artichokes, olives."
        },
        price: 9.5,
        tags: [],
        available: true
      },
      {
        id: "boscaiola",
        name: "Boscaiola",
        desc: {
          it: "Fior di latte, funghi, salsiccia.",
          en: "Fior di latte, mushrooms, sausage."
        },
        price: 9.0,
        tags: [],
        available: true
      }
    ]
  },

  {
    id: "fritti",
    title: { it: "Fritti", en: "Fried Starters" },
    items: [
      {
        id: "suppli",
        name: "Supplì classico",
        desc: {
          it: "Riso al sugo con cuore filante di mozzarella.",
          en: "Rice in tomato sauce with a stretchy mozzarella heart."
        },
        price: 2.5,
        tags: [],
        available: true
      },
      {
        id: "crocchette",
        name: "Crocchette di patate",
        desc: {
          it: "Tre crocchette di patate e pecorino.",
          en: "Three potato and pecorino croquettes."
        },
        price: 4.0,
        tags: ["veg"],
        available: true
      },
      {
        id: "fiori",
        name: "Fiori di zucca",
        desc: {
          it: "Ripieni di mozzarella e alici, in pastella.",
          en: "Courgette flowers stuffed with mozzarella and anchovies, battered."
        },
        price: 5.0,
        tags: [],
        available: true
      }
    ]
  },

  {
    id: "dolci",
    title: { it: "Dolci", en: "Desserts" },
    items: [
      {
        id: "tiramisu",
        name: "Tiramisù",
        desc: {
          it: "Fatto in casa, ogni mattina.",
          en: "Homemade, every morning."
        },
        price: 5.0,
        tags: ["veg"],
        available: true
      },
      {
        id: "pizza-nutella",
        name: "Pizza alla Nutella",
        desc: {
          it: "Il vizio finale. Da dividere (forse).",
          en: "The final vice. For sharing (maybe)."
        },
        price: 7.0,
        tags: ["veg", "top"],
        available: true
      }
    ]
  },

  {
    id: "bevande",
    title: { it: "Bevande", en: "Drinks" },
    items: [
      {
        id: "acqua",
        name: "Acqua 50cl",
        desc: { it: "Naturale o frizzante.", en: "Still or sparkling." },
        price: 1.5,
        tags: [],
        available: true
      },
      {
        id: "bibita",
        name: "Bibita in lattina",
        desc: { it: "Coca-Cola, Fanta, Sprite.", en: "Coca-Cola, Fanta, Sprite." },
        price: 2.5,
        tags: [],
        available: true
      },
      {
        id: "birra",
        name: "Birra artigianale 33cl",
        desc: { it: "Chiedi quella del giorno.", en: "Ask for today's choice." },
        price: 5.0,
        tags: [],
        available: true
      }
    ]
  }
];
