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
    mapsQuery: "Via del Vizio 7, Roma",
    // Città aggiunta alla ricerca degli indirizzi di consegna / City added to delivery address lookups
    searchArea: "Roma"
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

  // Posizione del locale (serve per calcolare la distanza di consegna).
  // Su Google Maps: tasto destro sul locale -> clic sulle coordinate per copiarle.
  // Shop location (used to work out delivery distance).
  // In Google Maps: right-click the shop -> click the coordinates to copy them.
  shopLocation: { lat: 41.8986, lng: 12.4769 },

  // ORDINI ONLINE / ONLINE ORDERS
  ordering: {
    // Interruttore: false = ordini chiusi subito (forno pieno, serata privata...).
    // Switch: false = orders closed right now (kitchen full, private event...).
    open: true,

    // Minuti PRIMA dell'apertura in cui si accettano già ordini (0 = solo da aperti).
    // Minutes BEFORE opening when orders are already accepted (0 = only once open).
    startBeforeOpenMin: 30,

    // Minuti PRIMA della chiusura in cui si smette di accettare ordini.
    // Minutes BEFORE closing when orders stop being accepted.
    stopBeforeCloseMin: 30,

    // Tempo medio di preparazione in minuti / Average preparation time in minutes
    prepMinutes: 20,

    // Serata piena? Aggiungi minuti di attesa (es. 15 o 30). 0 = normale.
    // Busy night? Add extra waiting minutes (e.g. 15 or 30). 0 = normal.
    busyExtraMinutes: 0,

    // Ogni quanti minuti proporre un orario (es. 20:00, 20:15, 20:30)
    // Time slot step in minutes
    slotMinutes: 15
  },

  // CONSEGNA A DOMICILIO / HOME DELIVERY
  // Fasce di distanza dal locale (in linea d'aria). Oltre l'ultima non si consegna.
  // Distance rings from the shop (straight line). Beyond the last one, no delivery.
  delivery: {
    enabled: true,
    zones: [
      { upToKm: 3, fee: 1.5, minOrder: 15, extraMinutes: 10 },
      { upToKm: 5, fee: 2.5, minOrder: 20, extraMinutes: 20 }
    ]
  },

  // CODICI SCONTO / PROMO CODES
  // type: "percent" (percentuale), "fixed" (euro), "freeDelivery" (consegna gratis)
  // validUntil: ultimo giorno valido "AAAA-MM-GG" ("" = senza scadenza)
  // ⚠️ I codici sono leggibili da chi guarda il codice del sito: usateli per
  //    promozioni pubbliche, e controllate lo sconto quando arriva l'ordine.
  // ⚠️ Codes can be read by anyone viewing the site source: use them for public
  //    promotions and double-check the discount when the order arrives.
  promoCodes: [
    { code: "BENVENUTO10", type: "percent", value: 10, minOrder: 20, validUntil: "" },
    { code: "VIZIO2", type: "fixed", value: 2, minOrder: 15, validUntil: "2026-12-31" },
    { code: "CONSEGNAGRATIS", type: "freeDelivery", value: 0, minOrder: 25, validUntil: "" }
  ],

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
