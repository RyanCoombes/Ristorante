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

  // Interruttore ordini online: metti false per chiudere gli ordini subito
  // (es. forno pieno, serata privata). Fuori orario si chiudono da soli.
  // Online orders switch: set to false to stop orders right now
  // (e.g. kitchen too busy). Outside opening hours they close automatically.
  ordersOpen: true,

  // La squadra. Ogni persona ha la stessa scheda: foto, nome, ruolo, una frase.
  // photo: percorso della foto (es. "assets/img/team/marco.jpg"), formato verticale 4:5.
  //        Lasciala vuota ("") per mostrare la mascotte.
  // The crew. Everyone gets the same card: photo, name, role, one line.
  // photo: path to a portrait (4:5) photo. Leave "" to show the mascot instead.
  team: [
    {
      name: "Nome Cognome",
      role: { it: "Gemello n°1", en: "Twin no. 1" },
      bio: { it: "Una frase su di lui/lei.", en: "One line about them." },
      photo: ""
    },
    {
      name: "Nome Cognome",
      role: { it: "Gemello n°2", en: "Twin no. 2" },
      bio: { it: "Una frase su di lui/lei.", en: "One line about them." },
      photo: ""
    },
    {
      name: "Nome Cognome",
      role: { it: "Pizzaiolo", en: "Pizzaiolo" },
      bio: { it: "Una frase su di lui/lei.", en: "One line about them." },
      photo: ""
    },
    {
      name: "Nome Cognome",
      role: { it: "Ruolo", en: "Role" },
      bio: { it: "Una frase su di lui/lei.", en: "One line about them." },
      photo: ""
    }
  ]
};
