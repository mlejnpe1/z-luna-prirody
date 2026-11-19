Z LŮNA PŘÍRODY
Statická prezentace značky, katalog a samostatné stránky produktů.

VEŘEJNÝ WEB A NÁHLED
Větev main nasazuje na https://zlunaprirody.cz/ dočasnou stránku s Instagramem.
Do větve preview posílejte úpravy celého webu pro předvedení klientce.
Vercel ve svém prostředí Preview sestaví katalog. Produktový formulář pouze
zobrazuje náhled nezávazné poptávky; neodesílá zprávy, neotevírá poštu
ani nevytváří odkaz mailto s vyplněnými údaji. Používejte testovací údaje.
Přímý e-mail a Instagram v kontaktech zůstávají funkční.
Rozpracované právní dokumenty a dřívější podoba formuláře zůstávají jen
lokálně v .private/privacy-draft/, mimo Git i nasazení. Před spuštěním
skutečného poptávkového formuláře je potřeba tuto část dokončit a propojit.
Samotná adresa na Vercelu ani tato konfigurace neomezují přístup návštěvníků.

PROJEKT A NASAZENÍ
Lokálně: C:\Users\pmlejnek\Desktop\Private\z_luna_prirody
GitHub: https://github.com/mlejnpe1/z-luna-prirody
Vercel: https://z-luna-prirody.vercel.app/
Framework: Other
Build Command: node scripts/build.cjs
Install Command: prázdné / přeskočit
Output Directory: dist
Konfigurace je ve vercel.json. V případě ručně nastavených hodnot na Vercelu
je aktualizujte nebo vypněte jejich přepsání a použijte vercel.json.
Do propojené větve main se posílají jen změny určené ke zveřejnění.
Alternativně lze z kořene projektu spustit npx.cmd vercel --prod.
Projekt nepotřebuje npm závislosti ani databázi; používá vestavěné Node API.

LOKÁLNÍ NÁHLED
  node scripts/preview.cjs            dočasná úvodní stránka
  node scripts/preview.cjs --catalog  celý rozpracovaný web
  node scripts/preview.cjs --catalog --privacy-draft  web včetně místního konceptu GDPR
Adresa: http://127.0.0.1:4174. Zastavení: Ctrl+C.
Spuštění nejprve vytvoří dist. Po změně zdrojů za běhu spusťte
node scripts/build.cjs (pro katalog s --catalog) a obnovte prohlížeč.

KONTROLY
  node scripts/build.cjs --catalog
  node scripts/check-site.cjs
  node scripts/check-gallery.cjs
  node scripts/check-inquiry.cjs

ÚPRAVY
holding/index.html       dočasná úvodní stránka
public/index.html        hlavní obsah, patička a ukázkový formulář
public/style.css         vzhled
public/products.js       produkty, ceny, složení, publikace a fotografie
public/site-config.js    hlavní URL, veřejné kontakty, vůně a zálohy na obaly
public/catalog.js       společné vykreslení katalogu a galerie
public/gallery.js       přepínání fotografií
public/app.js           filtrování, košík, kontakt a ukázka poptávky
public/inquiry.js       vytvoření textu ukázkové poptávky
public/assets/products/ fotografie podle ID produktu
scripts/build.cjs       výběr úvodní stránky nebo katalogu podle prostředí
scripts/build-catalog.cjs  generování produktových stránek, metadat a sitemap
FOTOGRAFIE.txt          návod pro doplnění fotografií
Patička se ze šablony index.html přebírá na všechny produktové stránky.

FUNKCE A OMEZENÍ
Každý produkt má vlastní adresu /produkty/<id>/; obrázek, název i Prohlédnout
vedou přímo na jeho stránku. Produkty lze přidávat z detailu s volbou množství
a případně vůně. Košík uchovává položky a množství
v aktuální kartě a připraví společný náhled nezávazné poptávky.
Košík i náhled poptávky uvádějí ceny výrobků, vratné zálohy a celkovou částku.
Kontaktní údaje se při zavření dialogu vymažou.
Katalog i produktové informace fungují bez JavaScriptu. Interaktivní galerie,
košík a formulář vyžadují JavaScript. Odkazy na další fotky fungují i bez něj.
Není implementované přihlášení, nahrávání fotografií ani administrace.
Produkty se upravují v products.js a zveřejňují novým nasazením.
Fotografie autorky je v sekci O Adéle. Všech osm výrobků má titulní fotografii.
Zkušební obrázky použité při ověřování galerie nejsou součástí katalogu.

ZNAČKA A SDÍLENÍ
Původní logo 150 × 150 px: public/assets/logo.jpg.
Logo ve vyšším rozlišení z podkladu klientky: public/assets/design/logo.webp.
Ikony: favicon.ico (16/32/48), favicon-96.png a apple-touch-icon.png (180).
Technický export ikon: PowerShell scripts/export-icons.ps1.
Sdílecí obrázek: public/assets/social-card.png (1200 × 630).
HTML předloha: scripts/social-card.html. Po změně exportujte v prohlížeči
při 1200 × 630 a uložte skutečný PNG. Vercel tuto grafiku negeneruje.
Každá produktová stránka má vlastní titulek, popis, canonical, Open Graph
 a Twitter Card metadata přímo v HTML. První fotografie produktu se použije
pro jeho náhled sdílení; bez fotografií se použije společný obrázek značky.
ID produktu je trvalá část adresy. Při změně ID přesměrujte starou adresu
ve vercel.json; samotná změna názvu adresu nemění.
