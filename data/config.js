/* Vizi Capitali · impostazioni / settings
   Valori di partenza. Sul sito online si modifica tutto da ordini.html → Gestione
   (salvato in data/live.js, che ha la precedenza su questo file).
   Starting values. On the live site everything is edited from ordini.html → Gestione
   (saved to data/live.js, which takes priority over this file).
   Istruzioni / instructions: README.md */
window.SITE_CONFIG = {
  "whatsapp": "390000000000",
  "phone": "+39 000 000 0000",
  "email": "ciao@vizicapitali.it",
  "instagram": "vizi_capitali_",
  "address": {
    "street": "Via del Vizio, 7",
    "city": "00100 Roma (RM)",
    "mapsQuery": "Via del Vizio 7, Roma",
    "searchArea": "Roma"
  },
  "timeZone": "Europe/Rome",
  "hours": {
    "0": [
      [
        "12:00",
        "15:00"
      ],
      [
        "18:30",
        "23:00"
      ]
    ],
    "1": [],
    "2": [
      [
        "18:30",
        "23:00"
      ]
    ],
    "3": [
      [
        "18:30",
        "23:00"
      ]
    ],
    "4": [
      [
        "18:30",
        "23:00"
      ]
    ],
    "5": [
      [
        "18:30",
        "00:00"
      ]
    ],
    "6": [
      [
        "12:00",
        "15:00"
      ],
      [
        "18:30",
        "00:00"
      ]
    ]
  },
  "shopLocation": {
    "lat": 41.8986,
    "lng": 12.4769
  },
  "ordering": {
    "open": true,
    "startBeforeOpenMin": 30,
    "stopBeforeCloseMin": 30,
    "prepMinutes": 20,
    "busyExtraMinutes": 0,
    "slotMinutes": 15,
    "channel": "whatsapp",
    "alertAfterMin": 5,
    "cashOptions": [
      20,
      50
    ]
  },
  "delivery": {
    "enabled": true,
    "zones": [
      {
        "upToKm": 3,
        "fee": 1.5,
        "minOrder": 15,
        "extraMinutes": 10
      },
      {
        "upToKm": 5,
        "fee": 2.5,
        "minOrder": 20,
        "extraMinutes": 20
      }
    ]
  },
  "team": [
    {
      "name": "Nome Cognome",
      "role": {
        "it": "Gemello n°1",
        "en": "Twin no. 1"
      },
      "bio": {
        "it": "Una frase su di lui/lei.",
        "en": "One line about them."
      },
      "photo": ""
    },
    {
      "name": "Nome Cognome",
      "role": {
        "it": "Gemello n°2",
        "en": "Twin no. 2"
      },
      "bio": {
        "it": "Una frase su di lui/lei.",
        "en": "One line about them."
      },
      "photo": ""
    },
    {
      "name": "Nome Cognome",
      "role": {
        "it": "Pizzaiolo",
        "en": "Pizzaiolo"
      },
      "bio": {
        "it": "Una frase su di lui/lei.",
        "en": "One line about them."
      },
      "photo": ""
    },
    {
      "name": "Nome Cognome",
      "role": {
        "it": "Ruolo",
        "en": "Role"
      },
      "bio": {
        "it": "Una frase su di lui/lei.",
        "en": "One line about them."
      },
      "photo": ""
    }
  ]
};
