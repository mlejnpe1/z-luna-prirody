Z LŮNA PŘÍRODY
Statická prezentace značky, katalog a samostatné stránky produktů.

VEŘEJNÝ WEB A NÁHLED
Větev main nasazuje na https://zlunaprirody.cz/ veřejný katalog.
Do větve preview posílejte úpravy celého webu pro předvedení klientce.
Vercel sestaví katalog v prostředí Preview i Production. Poptávkový formulář
připraví zprávu na kontaktní e-mail a otevře ji v poštovní aplikaci.
Zprávu odešle zákazník ze své schránky. Pro webmail lze text zkopírovat.
Přímý e-mail a Instagram v kontaktech zůstávají funkční.
Stránka /soukromi/ se sestavuje ze scripts/privacy-content.html a odkazuje
se na ni z formuláře i patičky. Kontaktní adresu pro ostré sestavení
katalogu lze zadat v proměnné ZLP_PRIVACY_CONTACT_ADDRESS. Vercel Preview
tuto proměnnou nepoužívá. Místní sestavení s --privacy-draft čte adresu ze souboru
.private/privacy-draft/contact-address.txt, který je mimo Git.
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
Pilot na větvi preview používá Node.js 24, npm ci a soukromé Vercel Blob.

LOKÁLNÍ NÁHLED
  node scripts/preview.cjs            dočasná úvodní stránka
  node scripts/preview.cjs --catalog  celý rozpracovaný web
  node scripts/preview.cjs --catalog --privacy-draft  web s kontaktní adresou na stránce soukromí
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
public/index.html        hlavní obsah, patička a formulář poptávky
public/style.css         vzhled
public/products.js       produkty, ceny, složení, publikace a fotografie
public/site-config.js    hlavní URL, veřejné kontakty, vůně a zálohy na obaly
public/catalog.js       společné vykreslení katalogu a galerie
public/gallery.js       přepínání fotografií
public/app.js           filtrování, košík, kontakt a připravení poptávky
public/inquiry.js       text poptávky a předvyplněný odkaz mailto
public/assets/products/ fotografie podle ID produktu
scripts/build.cjs       výběr úvodní stránky nebo katalogu podle prostředí
scripts/build-catalog.cjs  generování produktových stránek, metadat a sitemap
scripts/privacy-content.html  text informací o soukromí
FOTOGRAFIE.txt          návod pro doplnění fotografií
Patička se ze šablony index.html přebírá na všechny produktové stránky.

FUNKCE A OMEZENÍ
Každý produkt má vlastní adresu /produkty/<id>/; obrázek, název i Prohlédnout
vedou přímo na jeho stránku. Produkty lze přidávat z detailu s volbou množství
a případně vůně. Košík uchovává položky a množství
v aktuální kartě a připraví společnou nezávaznou poptávku pro poštu.
Košík i zpráva uvádějí ceny výrobků, vratné zálohy a celkovou částku.
Kontaktní údaje se při zavření dialogu vymažou.
Katalog i produktové informace fungují bez JavaScriptu. Interaktivní galerie,
košík a formulář vyžadují JavaScript. Odkazy na další fotky fungují i bez něj.
Správa všech osmi produktů je na https://preview.zlunaprirody.cz/admin.
Po výběru produktu lze uložit cenu, popis, složení a titulní fotku do
soukromého konceptu a po kontrole náhledu zveřejnit jeho konkrétní revizi.
Pro pilot patří ZLP_PILOT_STORE_ID a ZLP_PILOT_ADMIN_HASH výhradně do
prostředí Preview. Úložiště musí být privátní a připojené přes Vercel OIDC.
ZLP_PILOT_ADMIN_HASH je SHA-256 strojově vygenerovaného dlouhého hesla,
které se předává editorkám bezpečným kanálem.
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
