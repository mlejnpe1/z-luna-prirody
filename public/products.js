'use strict';
// Společný katalog. Fotky se přidávají do photos; postup ve FOTOGRAFIE.txt.
// První fotografie je titulní. Prázdné pole zachová botanickou ilustraci.
const products = [
  {
    "id": "levandulova-mast",
    "name": "Levandulová mast",
    "category": "Masti",
    "price": 136,
    "volume": "50 ml",
    "art": "lavender",
    "description": "Bylinná mast s levandulí a řebříčkem pro váš každodenní pečující rituál.",
    "ingredients": "Kokosový olej, bambucké máslo, včelí vosk, sušená levandule, řebříček, přírodní konzervanty.",
    "published": true,
    "photos": []
  },
  {
    "id": "rozmarynova-mast",
    "name": "Rozmarýnová mast",
    "category": "Masti",
    "price": 136,
    "volume": "50 ml",
    "art": "rosemary",
    "description": "Bylinná mast s rozmarýnem a esenciálním olejem z eukalyptu. Pro chvíle věnované péči o tělo.",
    "ingredients": "Kokosový olej, bambucké máslo, včelí vosk, sušený rozmarýn, esenciální olej eukalyptus, přírodní konzervanty.",
    "published": true,
    "photos": []
  },
  {
    "id": "mesickova-mast",
    "name": "Měsíčková mast",
    "category": "Masti",
    "price": 136,
    "volume": "50 ml",
    "art": "calendula",
    "description": "Mast se sušeným měsíčkem a levandulí, doplněná o bambucké máslo a včelí vosk.",
    "ingredients": "Kokosový olej, bambucké máslo, včelí vosk, sušený měsíček, levandule, přírodní konzervanty.",
    "published": true,
    "photos": []
  },
  {
    "id": "zinkova-mast",
    "name": "Zinková mast",
    "category": "Masti",
    "price": 124,
    "volume": "30 ml",
    "art": "zinc",
    "description": "Mast s oxidem zinečnatým, jojobovým olejem a heřmánkem.",
    "ingredients": "Oxid zinečnatý, jojobový olej, bambucké máslo, včelí vosk, heřmánek.",
    "published": true,
    "photos": []
  },
  {
    "id": "balzam-na-rty",
    "name": "Balzám na rty",
    "category": "Kosmetika",
    "price": 32,
    "volume": "10 ml",
    "art": "lips",
    "description": "Balzám pro péči o rty s bambuckým máslem a včelím voskem. Možnost vybrané vůně po domluvě.",
    "ingredients": "Kokosový olej, bambucké máslo, včelí vosk, esenciální olej dle vybrané vůně, sušená červená řepa pro barvu.",
    "published": true,
    "photos": []
  },
  {
    "id": "vlasovy-olej",
    "name": "Vlasový olej",
    "category": "Kosmetika",
    "price": 157,
    "volume": "50 ml",
    "art": "oil",
    "description": "Směs čtyř olejů pro váš vlasový pečující rituál.",
    "ingredients": "Jojobový olej, rozmarýnový olej, olivový olej, ricinový olej.",
    "published": true,
    "photos": []
  },
  {
    "id": "telove-maslo",
    "name": "Tělové máslo",
    "category": "Kosmetika",
    "price": 223,
    "volume": "100 ml",
    "art": "butter",
    "description": "Bambucké a kakaové máslo v kombinaci s kokosovým olejem. Vůni lze domluvit podle nabídky.",
    "ingredients": "Bambucké máslo, kokosový olej, kakaové máslo, esenciální olej dle vybrané vůně, přírodní konzervanty.",
    "published": true,
    "photos": []
  },
  {
    "id": "nehtovy-balzam",
    "name": "Nehtový balzám",
    "category": "Kosmetika",
    "price": 94,
    "volume": "10 ml",
    "art": "nails",
    "description": "Balzám pro péči o nehtovou kůžičku s jojobovým olejem a sušeným měsíčkem.",
    "ingredients": "Kokosový olej, bambucké máslo, včelí vosk, jojobový olej, sušený měsíček, přírodní konzervanty.",
    "published": true,
    "photos": []
  }
];
