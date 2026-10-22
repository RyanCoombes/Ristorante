/* =====================================================================
   DATI DEL LOCALE  ·  BUSINESS DETAILS
   ---------------------------------------------------------------------
   Modifica qui numero WhatsApp, indirizzo, orari e contatti.
   Edit your WhatsApp number, address, opening hours and contacts here.

   ⚠️ Tutti i valori qui sotto sono SEGNAPOSTO: sostituiteli con i vostri.
   ⚠️ Every value below is a PLACEHOLDER: replace it with your own.
   ===================================================================== */

window.SITE_CONFIG = {
  // Numero WhatsApp per gli ordini: solo cifre, con prefisso internazionale,
  // senza "+" né spazi. Es. +39 333 123 4567  ->  "393331234567"
  // WhatsApp number for orders: digits only, with country code, no "+" or spaces.
  whatsapp: "390000000000",

  // Telefono da mostrare e da chiamare / Phone number to show and call
  phone: "+39 000 000 0000",

  email: "ciao@vizicapitali.it",

  // Solo il nome utente, senza @ / Username only, without @
  instagram: "vizicapitali",

  address: {
    street: "Via del Vizio, 7",
    city: "00100 Roma (RM)",
    // Testo usato per la mappa e per "Indicazioni" / Text used for the map and directions
    mapsQuery: "Via del Vizio 7, Roma"
  },

  // Fuso orario usato per dire se siete aperti ora / Time zone for the "open now" badge
  timeZone: "Europe/Rome",

  // Orari di apertura. 0 = domenica, 1 = lunedì ... 6 = sabato.
  // Lascia [] per i giorni di chiusura. Puoi mettere più fasce per giorno.
  // Se si chiude dopo mezzanotte scrivi pure "00:30".
  // Opening hours. 0 = Sunday, 1 = Monday ... 6 = Saturday.
  // Use [] for closed days. Several time slots per day are allowed.
  hours: {
    1: [],
    2: [["18:30", "23:00"]],
    3: [["18:30", "23:00"]],
    4: [["18:30", "23:00"]],
    5: [["18:30", "00:00"]],
    6: [["12:00", "15:00"], ["18:30", "00:00"]],
    0: [["12:00", "15:00"], ["18:30", "23:00"]]
  },

  // Consegna a domicilio / Home delivery
  delivery: {
    enabled: true,
    fee: 2.0,          // costo consegna in euro / delivery fee in euros (0 = gratis/free)
    minOrder: 15.0     // ordine minimo per la consegna / minimum order for delivery
  },

  // Chi siamo: lasciate name vuoto ("") per mostrare solo il ruolo.
  // About us: leave name empty ("") to show only the role.
  team: [
    {
      name: "",
      role: { it: "Gemello n°1", en: "Twin no. 1" },
      bio: {
        it: "Metà della coppia. Accoglie, consiglia e vi convince a prendere anche il fritto.",
        en: "One half of the duo. Welcomes you, recommends, and talks you into the fried starters."
      },
      image: "assets/img/mascot-welcome.png"
    },
    {
      name: "",
      role: { it: "Il Pizzaiolo", en: "The Pizzaiolo" },
      bio: {
        it: "L'amico di sempre, il re del forno. Impasti a lunga lievitazione e nessuna fretta.",
        en: "The lifelong friend and king of the oven. Long-proved dough and no shortcuts."
      },
      image: "assets/img/mascot-peel-cream.png",
      featured: true
    },
    {
      name: "",
      role: { it: "Gemello n°2", en: "Twin no. 2" },
      bio: {
        it: "L'altra metà. Stessa faccia, stesso vizio: la pizza fatta come si deve.",
        en: "The other half. Same face, same vice: pizza done properly."
      },
      image: "assets/img/mascot-welcome.png",
      mirror: true
    }
  ]
};
