'use strict';
// Společný katalog. Fotky se přidávají do photos; postup ve FOTOGRAFIE.txt.
// První fotografie je titulní. Prázdné pole zachová botanickou ilustraci.
const products = [
  {
    "id": "levandulova-mast",
    "name": "Levandulová mast",
    "category": "Masti",
    "price": 220,
    "volume": "50 ml",
    "art": "lavender",
    "care": "skin",
    "description": "Bylinná mast s levandulí a řebříčkem pro váš každodenní pečující rituál.",
    "ingredients": "Kokosový olej, bambucké máslo, včelí vosk, sušená levandule, řebříček, přírodní konzervanty.",
    "published": true,
    "photos": [
      {
        "src": "/assets/products/levandulova-mast/levandulova-mast.jpg",
        "alt": "Otevřený kelímek levandulové masti se dvěma snítkami levandule"
      }
    ]
  },
  {
    "id": "rozmarynova-mast",
    "name": "Rozmarýnová mast",
    "category": "Masti",
    "price": 220,
    "volume": "50 ml",
    "art": "rosemary",
    "care": "body",
    "description": "Bylinná mast s rozmarýnem a esenciálním olejem z eukalyptu. Pro chvíle věnované péči o tělo.",
    "ingredients": "Kokosový olej, bambucké máslo, včelí vosk, sušený rozmarýn, esenciální olej eukalyptus, přírodní konzervanty.",
    "published": true,
    "photos": [
      {
        "src": "/assets/products/rozmarynova-mast/rozmarynova-mast.jpg",
        "alt": "Otevřená sklenička žluté rozmarýnové masti vedle snítek bylin"
      }
    ]
  },
  {
    "id": "mesickova-mast",
    "name": "Měsíčková mast",
    "category": "Masti",
    "price": 220,
    "volume": "50 ml",
    "art": "calendula",
    "care": "skin",
    "description": "Mast se sušeným měsíčkem a levandulí, doplněná o bambucké máslo a včelí vosk.",
    "ingredients": "Kokosový olej, bambucké máslo, včelí vosk, sušený měsíček, levandule, přírodní konzervanty.",
    "published": true,
    "photos": [
      {
        "src": "/assets/products/mesickova-mast/mesickova-mast.jpg",
        "alt": "Měsíčková mast v otevřené tmavé skleničce vedle oranžových květů měsíčku"
      }
    ]
  },
  {
    "id": "zinkova-mast",
    "name": "Zinková mast",
    "category": "Masti",
    "price": 150,
    "volume": "30 ml",
    "art": "zinc",
    "care": "skin",
    "description": "Mast s oxidem zinečnatým, jojobovým olejem a heřmánkem.",
    "ingredients": "Oxid zinečnatý, jojobový olej, bambucké máslo, včelí vosk, heřmánek.",
    "published": true,
    "photos": [
      {
        "src": "/assets/products/zinkova-mast/zinkova-mast.jpg",
        "alt": "Otevřený kovový kelímek s bílou zinkovou mastí"
      }
    ]
  },
  {
    "id": "balzam-na-rty",
    "name": "Balzám na rty",
    "category": "Kosmetika",
    "price": 45,
    "volume": "10 ml",
    "art": "lips",
    "care": "lips-nails",
    "scentChoice": true,
    "description": "Balzám pro péči o rty s bambuckým máslem a včelím voskem. Možnost vybrané vůně po domluvě.",
    "ingredients": "Kokosový olej, bambucké máslo, včelí vosk, esenciální olej dle vybrané vůně, sušená červená řepa pro barvu.",
    "published": true,
    "photos": [
      {
        "src": "/assets/products/balzam-na-rty/balzam-na-rty.jpg",
        "alt": "Balzám na rty v otevřeném kovovém kelímku s odloženým víčkem"
      }
    ]
  },
  {
    "id": "vlasovy-olej",
    "name": "Vlasový olej",
    "category": "Kosmetika",
    "price": 180,
    "volume": "50 ml",
    "art": "oil",
    "care": "hair",
    "description": "Směs čtyř olejů pro váš vlasový pečující rituál.",
    "ingredients": "Jojobový olej, rozmarýnový olej, olivový olej, ricinový olej.",
    "published": true,
    "photos": [
      {
        "src": "/assets/products/vlasovy-olej/vlasovy-olej.jpg",
        "alt": "Skleněná lahvička vlasového oleje s korkovou zátkou a snítkami rozmarýnu"
      }
    ]
  },
  {
    "id": "telove-maslo",
    "name": "Tělové máslo",
    "category": "Kosmetika",
    "price": 230,
    "volume": "100 ml",
    "art": "butter",
    "care": "body",
    "scentChoice": true,
    "description": "Bambucké a kakaové máslo v kombinaci s kokosovým olejem. Vůni lze domluvit podle nabídky.",
    "ingredients": "Bambucké máslo, kokosový olej, kakaové máslo, esenciální olej dle vybrané vůně, přírodní konzervanty.",
    "published": true,
    "photos": [
      {
        "src": "/assets/products/telove-maslo/telove-maslo.jpg",
        "alt": "Otevřený kelímek s našlehaným tělovým máslem na světlé látce"
      }
    ]
  },
  {
    "id": "nehtovy-balzam",
    "name": "Nehtový balzám",
    "category": "Kosmetika",
    "price": 100,
    "volume": "10 ml",
    "art": "nails",
    "care": "lips-nails",
    "description": "Balzám pro péči o nehtovou kůžičku s jojobovým olejem a sušeným měsíčkem.",
    "ingredients": "Kokosový olej, bambucké máslo, včelí vosk, jojobový olej, sušený měsíček, přírodní konzervanty.",
    "published": true,
    "photos": [
      {
        "src": "/assets/products/nehtovy-balzam/nehtovy-balzam.jpg",
        "alt": "Otevřený kelímek nehtového balzámu s černým víčkem na světlém podkladu"
      }
    ]
  }
];
