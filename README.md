# Skiftly

**Schemaläggning som bara funkar** — ett modernt bemannings- och skiftplaneringssystem för svenska företag.

Skiftly är en interaktiv demo som låter företagare klicka runt i ett färdigt schema anpassat för sin bransch — café, butik, lager eller vård. Allt körs i webbläsaren (ingen backend krävs) och fungerar lika bra på mobil som på dator.

## ✨ Funktioner

- **Landningssida + branschväljare** — välj din verksamhet och kliv rakt in i en realistisk demo med riktig personal, scheman och behov.
- **Dra-och-släpp-schema** med auto-planering (AI) för att täcka behovet per roll och dag.
- **Täckning & SLA i realtid** — se direkt om ett pass är under- eller överbemannat.
- **Lönekoll & export** — estimerad lönekostnad med OB, export till Fortnox & Visma.
- **Avtal & lagar bevakas** — automatisk koll mot dygnsvila, veckovila och arbetstidslagen.
- **Guidad rundtur** (onboarding) första gången.
- **Mörkt & ljust tema**, anpassningsbar varumärkesfärg, responsiv mobil- och PC-UI.

## 🚀 Kör lokalt

Statisk app — du behöver ingen server för att testa. Öppna bara `index.html` i en webbläsare.

Vill du köra med den medföljande Node-servern (för t.ex. demo-API:t):

```bash
npm install
npm start
# Öppna http://localhost:3000
```

## 🔗 Användbara URL:er

- `/` — startsida (säljsidan visas för nya besökare).
- `/?start` eller `/?landing` — visar **alltid** säljsidan/branschväljaren, oavsett sparad session (bra för att demoa).
- `/?view=scheduler` — länka direkt till en specifik vy efter inloggning.

## 🌐 Demo

Värddes som statisk sida via GitHub Pages — se repots **Settings → Pages**.

## 🛠️ Teknik

Ren HTML, CSS och vanilla JavaScript. Ingen byggprocess, inga ramverk. Data sparas i webbläsarens `localStorage`. Den valfria `server.js` använder Express enbart för att servera filerna lokalt och ett demo-endpoint.

---

Byggd för svenska företag — caféer, butiker, lager, vård och mer.
