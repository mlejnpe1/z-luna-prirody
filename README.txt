Z LŮNA PŘÍRODY
Projekt pro produkční nasazení statické prezentace na Vercel.

UMÍSTĚNÍ
C:\Users\pmlejnek\Desktop\Private\z_luna_prirody
Na Vercelu použijte název projektu z-luna-prirody.

NASAZENÍ
V PowerShellu:

  cd "C:\Users\pmlejnek\Desktop\Private\z_luna_prirody"
  npx.cmd vercel --prod

Přihlaste se, vyberte svůj tým a nový nebo odpovídající existující projekt.
Adresář projektu je ./, tedy složka s vercel.json, nikoli přímo public.
Framework: Other. Build a instalace závislostí: přeskočeno. Výstup: public.
Žádné proměnné prostředí nejsou pro tuto statickou prezentaci potřebné.
Produkční příznak --prod přiřadí nasazení k produkční adrese Vercel projektu.
Propojení projektu se uloží lokálně do .vercel, která je ignorovaná v Gitu.

LOKÁLNÍ SPUŠTĚNÍ
  node scripts/preview.cjs
Adresa: http://127.0.0.1:4174. Zastavení: Ctrl+C.

ÚPRAVY
public/index.html        obsah stránky a představení autorky
public/style.css         vzhled
public/products.js       katalog, ceny, složení a publikace produktů
public/site-config.js    veřejný kontaktní e-mail a Instagram
public/app.js            filtrování, produktové detaily a kontaktní odkazy
public/assets/           ilustrace

Po úpravě souborů znovu spusťte npx.cmd vercel --prod.
Katalog je společný pro všechny návštěvníky. Původní zkušební localStorage
úpravy se v této verzi nenačítají a veřejný web neobsahuje demo editor.
Původní prototyp v adresáři Codex zůstává samostatně uložený.

STAV FUNKCÍ
Funguje statická prezentace, katalog, filtrování a detail produktu.
Instagram: https://www.instagram.com/z_luna_prirody/
Kontaktní e-mail: z.luna.prirody@seznam.cz.
Kontaktní odkaz a odkaz pro dotaz na konkrétní produkt otevřou e-mailový
program návštěvníka. Instagram a e-mail se nastavují v site-config.js;
záložní kontaktní odkazy pro zobrazení bez JavaScriptu jsou v index.html.
Představení autorky vychází z dodané prezentace. Fotografie autorky zatím chybí.
Přihlášená administrace a sdílené ukládání do databáze nejsou implementované;
produkty se nyní mění v products.js a změna se publikuje novým nasazením.

Zrušené je označení návrhu a zákaz indexace. robots.txt povoluje procházení.
Tato příprava sama nic na Vercel nepublikuje ani nezřizuje placené služby.

Dokumentace:
https://vercel.com/docs/project-configuration/vercel-json
https://vercel.com/docs/cli/deploy
