/* Vizi Capitali · impostazioni / settings
   Formato JSON: modificare dalla pagina di gestione (admin.html) oppure con attenzione a virgole e virgolette.
   JSON format: edit from admin.html, or carefully by hand (mind commas and quotes).
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
    "channel": "website",
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
  "promoCodes": [
    {
      "code": "BENVENUTO10",
      "type": "percent",
      "value": 10,
      "minOrder": 20,
      "validUntil": ""
    },
    {
      "code": "VIZIO2",
      "type": "fixed",
      "value": 2,
      "minOrder": 15,
      "validUntil": "2026-12-31"
    },
    {
      "code": "CONSEGNAGRATIS",
      "type": "freeDelivery",
      "value": 0,
      "minOrder": 25,
      "validUntil": ""
    }
  ],
  "admin": {
    "pinHash": "91b4d142823f7d20c5f08df69122de43f35f057a988d9619f6d3138485c9a203",
    "uploadUrl": "https://github.com/RyanCoombes/Ristorante/upload/claude/busy-einstein-cfn7dv/data"
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
