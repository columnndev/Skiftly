// SCENARIOS - Fyra realistiska branschscenarier för Skiftly-demon.
// Varje scenario följer exakt samma dataformat som mockData.js (DEFAULT_EMPLOYEES,
// DEFAULT_SHIFTS, DEFAULT_DEMAND, DEFAULT_ANNOUNCEMENTS, DEFAULT_SWAPS).
// De fyra tekniska rollerna (Support, Teamlead, Admin, Logistik) återanvänds i alla
// scenarier men ges olika branschbetydelse via shift-noteringar och skills.
// day: 0=Måndag ... 6=Söndag. demand-arrayer = [Mån,Tis,Ons,Tor,Fre,Lör,Sön].

const SCENARIOS = {
  // =====================================================================
  // 1. CAFÉ & RESTAURANG
  // =====================================================================
  cafe: {
    id: "cafe",
    name: "Café & Restaurang",
    description: "Baristas, servitörer och kök med tidiga morgnar och fullt på helgerna.",
    icon: "☕",
    companyName: "Bryggeriet Kaffe & Kök",
    companyInitials: "BK",
    brandColor: "#f59e0b",
    employees: [
      { id: "emp-1", name: "Ellen Sjöberg", role: "Support", email: "ellen.s@bryggeriet.se", password: "password", wage: 145, contractHours: 38, color: "role-support", skills: ["Svenska", "Barista", "Espresso", "Kassa"] },
      { id: "emp-2", name: "Oscar Hellström", role: "Support", email: "oscar.h@bryggeriet.se", password: "password", wage: 142, contractHours: 30, color: "role-support", skills: ["Svenska", "Engelska", "Servering", "Latte Art"] },
      { id: "emp-3", name: "Saga Lundgren", role: "Teamlead", email: "saga.l@bryggeriet.se", password: "password", wage: 185, contractHours: 40, color: "role-teamlead", skills: ["Svenska", "Skiftledning", "Hygien (HACCP)", "Bemanning"] },
      { id: "emp-4", name: "Henrik Åberg", role: "Logistik", email: "henrik.a@bryggeriet.se", password: "password", wage: 170, contractHours: 40, color: "role-logistik", skills: ["Svenska", "Kock", "Lunchberedning", "Varumottagning"] },
      { id: "emp-5", name: "Maja Bergqvist", role: "Admin", email: "maja.b@bryggeriet.se", password: "password", wage: 175, contractHours: 25, color: "role-admin", skills: ["Svenska", "Bokföring", "Dagskassa", "Beställning"] }
    ],
    shifts: [
      { id: "shift-1", employeeId: "emp-4", day: 0, startTime: "06:00", endTime: "14:00", role: "Logistik", note: "Frukost & lunchprep i köket" },
      { id: "shift-2", employeeId: "emp-1", day: 0, startTime: "06:30", endTime: "14:30", role: "Support", note: "Morgonöppning & baristadisk" },
      { id: "shift-3", employeeId: "emp-3", day: 0, startTime: "08:00", endTime: "16:30", role: "Teamlead", note: "Skiftledning & schema" },
      { id: "shift-4", employeeId: "emp-1", day: 1, startTime: "06:30", endTime: "14:30", role: "Support", note: "Morgonpass baristadisk" },
      { id: "shift-5", employeeId: "emp-2", day: 1, startTime: "11:00", endTime: "19:00", role: "Support", note: "Lunch & eftermiddagsservering" },
      { id: "shift-6", employeeId: "emp-4", day: 1, startTime: "07:00", endTime: "15:00", role: "Logistik", note: "Lunchkök & varumottagning" },
      { id: "shift-7", employeeId: "emp-2", day: 2, startTime: "06:30", endTime: "14:30", role: "Support", note: "Morgonservering" },
      { id: "shift-8", employeeId: "emp-3", day: 2, startTime: "08:00", endTime: "16:30", role: "Teamlead", note: "Skiftledning & leverantörskontakt" },
      { id: "shift-9", employeeId: "emp-5", day: 2, startTime: "09:00", endTime: "14:00", role: "Admin", note: "Dagskassa & beställningar" },
      { id: "shift-10", employeeId: "emp-1", day: 3, startTime: "06:30", endTime: "14:30", role: "Support", note: "Morgonpass baristadisk" },
      { id: "shift-11", employeeId: "emp-4", day: 3, startTime: "06:00", endTime: "14:00", role: "Logistik", note: "Bakning & lunchprep" },
      { id: "shift-12", employeeId: "emp-2", day: 3, startTime: "12:00", endTime: "20:00", role: "Support", note: "Kvällsservering" },
      { id: "shift-13", employeeId: "emp-3", day: 4, startTime: "08:00", endTime: "16:30", role: "Teamlead", note: "Skiftledning helgförberedelse" },
      { id: "shift-14", employeeId: "emp-1", day: 4, startTime: "06:30", endTime: "14:30", role: "Support", note: "Morgonöppning" },
      { id: "shift-15", employeeId: "emp-4", day: 4, startTime: "07:00", endTime: "15:00", role: "Logistik", note: "Lunchkök" },
      { id: "shift-open-1", employeeId: "", day: 5, startTime: "08:00", endTime: "16:00", role: "Support", note: "Lördag brunch-servering" },
      { id: "shift-open-2", employeeId: "", day: 5, startTime: "09:00", endTime: "17:00", role: "Logistik", note: "Lördag kök & brunchprep" },
      { id: "shift-open-3", employeeId: "", day: 6, startTime: "09:00", endTime: "16:00", role: "Support", note: "Söndag fika-servering" }
    ],
    demand: {
      "Support": [2, 2, 2, 2, 2, 2, 1],
      "Teamlead": [1, 0, 1, 0, 1, 1, 0],
      "Logistik": [1, 1, 0, 1, 1, 1, 0],
      "Admin": [0, 0, 1, 0, 0, 0, 0]
    },
    announcements: [
      { id: "ann-1", title: "Nya sommardryckerna lanseras", desc: "Från och med på fredag kör vi iskaffe-menyn. Saga håller en kort genomgång av recepten innan morgonpasset.", date: "2026-06-18", author: "Saga Lundgren" },
      { id: "ann-2", title: "Midsommarhelgen", desc: "Vi har stängt på midsommarafton men öppet som vanligt på midsommardagen. Lägg in önskemål om ledighet senast onsdag.", date: "2026-06-16", author: "Maja Bergqvist" }
    ],
    swaps: [
      { id: "swap-demo-1", type: "apply", shiftId: "shift-open-1", employeeId: "emp-2", status: "pending", date: "2026-06-18" }
    ]
  },

  // =====================================================================
  // 2. BUTIK & DETALJHANDEL
  // =====================================================================
  butik: {
    id: "butik",
    name: "Butik & Detaljhandel",
    description: "Säljare, kassa och lager i en butik med långa öppettider och shoppinghelger.",
    icon: "🛍️",
    companyName: "NordStil Mode",
    companyInitials: "NS",
    brandColor: "#8b5cf6",
    employees: [
      { id: "emp-1", name: "Wilma Forsberg", role: "Support", email: "wilma.f@nordstil.se", password: "password", wage: 152, contractHours: 38, color: "role-support", skills: ["Svenska", "Engelska", "Försäljning", "Kassa"] },
      { id: "emp-2", name: "Noah Pettersson", role: "Support", email: "noah.p@nordstil.se", password: "password", wage: 148, contractHours: 25, color: "role-support", skills: ["Svenska", "Kundservice", "Skyltning", "Kassa"] },
      { id: "emp-3", name: "Linnea Holm", role: "Teamlead", email: "linnea.h@nordstil.se", password: "password", wage: 205, contractHours: 40, color: "role-teamlead", skills: ["Svenska", "Butikschef", "Försäljningsmål", "Personalansvar"] },
      { id: "emp-4", name: "Elias Sundström", role: "Logistik", email: "elias.s@nordstil.se", password: "password", wage: 162, contractHours: 35, color: "role-logistik", skills: ["Svenska", "Lager", "Varupåfyllning", "Inventering"] },
      { id: "emp-5", name: "Astrid Lindberg", role: "Admin", email: "astrid.l@nordstil.se", password: "password", wage: 180, contractHours: 30, color: "role-admin", skills: ["Svenska", "Bokföring", "Dagsavslut", "Inköp"] },
      { id: "emp-6", name: "Hugo Almqvist", role: "Support", email: "hugo.a@nordstil.se", password: "password", wage: 146, contractHours: 20, color: "role-support", skills: ["Svenska", "Engelska", "Provrum", "Kassa"] }
    ],
    shifts: [
      { id: "shift-1", employeeId: "emp-3", day: 0, startTime: "09:30", endTime: "18:00", role: "Teamlead", note: "Butiksöppning & dagsplanering" },
      { id: "shift-2", employeeId: "emp-1", day: 0, startTime: "10:00", endTime: "18:30", role: "Support", note: "Golvförsäljning & kassa" },
      { id: "shift-3", employeeId: "emp-4", day: 0, startTime: "07:00", endTime: "15:00", role: "Logistik", note: "Varumottagning & påfyllning" },
      { id: "shift-4", employeeId: "emp-2", day: 1, startTime: "10:00", endTime: "18:30", role: "Support", note: "Golvförsäljning" },
      { id: "shift-5", employeeId: "emp-5", day: 1, startTime: "09:00", endTime: "15:00", role: "Admin", note: "Dagsavslut & inköpsorder" },
      { id: "shift-6", employeeId: "emp-1", day: 1, startTime: "11:30", endTime: "20:00", role: "Support", note: "Kvällspass kassa" },
      { id: "shift-7", employeeId: "emp-3", day: 2, startTime: "09:30", endTime: "18:00", role: "Teamlead", note: "Säljcoachning & skyltning" },
      { id: "shift-8", employeeId: "emp-4", day: 2, startTime: "07:00", endTime: "15:00", role: "Logistik", note: "Lagerinventering" },
      { id: "shift-9", employeeId: "emp-6", day: 2, startTime: "12:00", endTime: "20:00", role: "Support", note: "Provrum & kvällskassa" },
      { id: "shift-10", employeeId: "emp-1", day: 3, startTime: "10:00", endTime: "18:30", role: "Support", note: "Golvförsäljning" },
      { id: "shift-11", employeeId: "emp-2", day: 3, startTime: "11:30", endTime: "20:00", role: "Support", note: "Kvällspass" },
      { id: "shift-12", employeeId: "emp-3", day: 3, startTime: "09:30", endTime: "18:00", role: "Teamlead", note: "Personalmöte & uppföljning" },
      { id: "shift-13", employeeId: "emp-4", day: 4, startTime: "07:00", endTime: "15:00", role: "Logistik", note: "Helgpåfyllning av lager" },
      { id: "shift-14", employeeId: "emp-1", day: 4, startTime: "10:00", endTime: "18:30", role: "Support", note: "Golvförsäljning" },
      { id: "shift-15", employeeId: "emp-6", day: 4, startTime: "12:00", endTime: "20:00", role: "Support", note: "Kvällskassa" },
      { id: "shift-open-1", employeeId: "", day: 5, startTime: "10:00", endTime: "17:00", role: "Support", note: "Lördag golvförsäljning" },
      { id: "shift-open-2", employeeId: "", day: 5, startTime: "11:00", endTime: "18:00", role: "Support", note: "Lördag kassa & provrum" },
      { id: "shift-open-3", employeeId: "", day: 6, startTime: "11:00", endTime: "17:00", role: "Support", note: "Söndag golvförsäljning" }
    ],
    demand: {
      "Support": [2, 2, 2, 2, 2, 2, 1],
      "Teamlead": [1, 0, 1, 1, 0, 1, 0],
      "Logistik": [1, 0, 1, 0, 1, 0, 0],
      "Admin": [0, 1, 0, 0, 0, 0, 0]
    },
    announcements: [
      { id: "ann-1", title: "Sommarrea startar nästa vecka", desc: "Reaprislapparna ska vara på plats senast söndag kväll. Elias samordnar ompriksning i lagret under fredagspasset.", date: "2026-06-17", author: "Linnea Holm" },
      { id: "ann-2", title: "Ny rutin för dagskassan", desc: "Astrid har uppdaterat rutinen för dagsavslut. Alla kassaansvariga läser igenom checklistan i pärmen vid kassan.", date: "2026-06-15", author: "Astrid Lindberg" }
    ],
    swaps: [
      { id: "swap-demo-1", type: "apply", shiftId: "shift-open-1", employeeId: "emp-2", status: "pending", date: "2026-06-17" }
    ]
  },

  // =====================================================================
  // 3. LAGER & LOGISTIK
  // =====================================================================
  lager: {
    id: "lager",
    name: "Lager & Logistik",
    description: "Lagerarbetare, truckförare och teamledare med skift från tidig morgon till sen kväll.",
    icon: "📦",
    companyName: "SvensLog Distribution",
    companyInitials: "SL",
    brandColor: "#6366f1",
    employees: [
      { id: "emp-1", name: "Viktor Engström", role: "Logistik", email: "viktor.e@svenslog.se", password: "password", wage: 178, contractHours: 40, color: "role-logistik", skills: ["Svenska", "Truckkort A+B", "Plock & pack", "Skanner"] },
      { id: "emp-2", name: "Amina Johansson", role: "Logistik", email: "amina.j@svenslog.se", password: "password", wage: 172, contractHours: 38, color: "role-logistik", skills: ["Svenska", "Engelska", "Inleverans", "Packning"] },
      { id: "emp-3", name: "Mattias Strand", role: "Teamlead", email: "mattias.s@svenslog.se", password: "password", wage: 215, contractHours: 40, color: "role-teamlead", skills: ["Svenska", "Skiftledning", "Arbetsmiljö", "Flödesoptimering"] },
      { id: "emp-4", name: "Sofia Magnusson", role: "Support", email: "sofia.m@svenslog.se", password: "password", wage: 168, contractHours: 35, color: "role-support", skills: ["Svenska", "Engelska", "Kundorder", "Returhantering"] },
      { id: "emp-5", name: "Daniel Björk", role: "Admin", email: "daniel.b@svenslog.se", password: "password", wage: 190, contractHours: 30, color: "role-admin", skills: ["Svenska", "Transportadmin", "Fraktsedlar", "Excel"] },
      { id: "emp-6", name: "Rebecka Nyström", role: "Logistik", email: "rebecka.n@svenslog.se", password: "password", wage: 170, contractHours: 40, color: "role-logistik", skills: ["Svenska", "Truckkort", "Utleverans", "Lastning"] }
    ],
    shifts: [
      { id: "shift-1", employeeId: "emp-3", day: 0, startTime: "06:00", endTime: "14:30", role: "Teamlead", note: "Morgonmöte & skiftledning" },
      { id: "shift-2", employeeId: "emp-1", day: 0, startTime: "06:00", endTime: "14:30", role: "Logistik", note: "Plock & pack zon A" },
      { id: "shift-3", employeeId: "emp-2", day: 0, startTime: "14:00", endTime: "22:00", role: "Logistik", note: "Kvällsskift inleverans" },
      { id: "shift-4", employeeId: "emp-1", day: 1, startTime: "06:00", endTime: "14:30", role: "Logistik", note: "Truckkörning & påfyllning" },
      { id: "shift-5", employeeId: "emp-6", day: 1, startTime: "06:00", endTime: "14:30", role: "Logistik", note: "Utleverans & lastning" },
      { id: "shift-6", employeeId: "emp-4", day: 1, startTime: "08:00", endTime: "16:30", role: "Support", note: "Kundorder & returhantering" },
      { id: "shift-7", employeeId: "emp-3", day: 2, startTime: "06:00", endTime: "14:30", role: "Teamlead", note: "Flödesuppföljning & arbetsmiljö" },
      { id: "shift-8", employeeId: "emp-2", day: 2, startTime: "14:00", endTime: "22:00", role: "Logistik", note: "Kvällsskift plock" },
      { id: "shift-9", employeeId: "emp-5", day: 2, startTime: "08:00", endTime: "14:00", role: "Admin", note: "Fraktsedlar & transportbokning" },
      { id: "shift-10", employeeId: "emp-1", day: 3, startTime: "06:00", endTime: "14:30", role: "Logistik", note: "Plock & pack zon B" },
      { id: "shift-11", employeeId: "emp-6", day: 3, startTime: "06:00", endTime: "14:30", role: "Logistik", note: "Truckkörning utleverans" },
      { id: "shift-12", employeeId: "emp-4", day: 3, startTime: "08:00", endTime: "16:30", role: "Support", note: "Kundorder & support" },
      { id: "shift-13", employeeId: "emp-3", day: 4, startTime: "06:00", endTime: "14:30", role: "Teamlead", note: "Skiftledning & veckoavstämning" },
      { id: "shift-14", employeeId: "emp-2", day: 4, startTime: "06:00", endTime: "14:30", role: "Logistik", note: "Inleverans & inventering" },
      { id: "shift-15", employeeId: "emp-5", day: 4, startTime: "08:00", endTime: "14:00", role: "Admin", note: "Veckorapport transport" },
      { id: "shift-open-1", employeeId: "", day: 5, startTime: "06:00", endTime: "14:00", role: "Logistik", note: "Lördag e-handelsplock" },
      { id: "shift-open-2", employeeId: "", day: 5, startTime: "14:00", endTime: "22:00", role: "Logistik", note: "Lördag kvällsutleverans" },
      { id: "shift-open-3", employeeId: "", day: 6, startTime: "08:00", endTime: "16:00", role: "Logistik", note: "Söndag inleverans & påfyllning" }
    ],
    demand: {
      "Logistik": [2, 2, 1, 2, 1, 2, 1],
      "Teamlead": [1, 0, 1, 0, 1, 0, 0],
      "Support": [0, 1, 0, 1, 0, 0, 0],
      "Admin": [0, 0, 1, 0, 1, 0, 0]
    },
    announcements: [
      { id: "ann-1", title: "E-handelstopp inför sommaren", desc: "Vi väntar 30% högre ordervolym kommande två veckor. Mattias bemannar upp helgskiften – anmäl intresse för extrapass i appen.", date: "2026-06-18", author: "Mattias Strand" },
      { id: "ann-2", title: "Nytt WMS-system", desc: "Skannerna uppdateras till nya lagersystemet på torsdag. Daniel kör en kort utbildning vid inleveransporten kl 13:00.", date: "2026-06-16", author: "Daniel Björk" }
    ],
    swaps: [
      { id: "swap-demo-1", type: "apply", shiftId: "shift-open-2", employeeId: "emp-1", status: "pending", date: "2026-06-18" }
    ]
  },

  // =====================================================================
  // 4. VÅRD & OMSORG
  // =====================================================================
  vard: {
    id: "vard",
    name: "Vård & Omsorg",
    description: "Undersköterskor, sjuksköterska och samordnare med dygnet-runt-bemanning alla veckans dagar.",
    icon: "🩺",
    companyName: "Solgläntans Omsorg",
    companyInitials: "SO",
    brandColor: "#10b981",
    employees: [
      { id: "emp-1", name: "Emma Andersson", role: "Support", email: "emma.a@solglantan.se", password: "password", wage: 175, contractHours: 38, color: "role-support", skills: ["Svenska", "Undersköterska", "Omvårdnad", "Delegering läkemedel"] },
      { id: "emp-2", name: "Ahmed Khan", role: "Support", email: "ahmed.k@solglantan.se", password: "password", wage: 172, contractHours: 40, color: "role-support", skills: ["Svenska", "Engelska", "Undersköterska", "Demensvård"] },
      { id: "emp-3", name: "Birgitta Holmberg", role: "Teamlead", email: "birgitta.h@solglantan.se", password: "password", wage: 245, contractHours: 38, color: "role-teamlead", skills: ["Svenska", "Sjuksköterska", "Läkemedelsansvar", "Vårdplanering"] },
      { id: "emp-4", name: "Sara Lindqvist", role: "Admin", email: "sara.l@solglantan.se", password: "password", wage: 200, contractHours: 30, color: "role-admin", skills: ["Svenska", "Samordnare", "Schemaläggning", "Anhörigkontakt"] },
      { id: "emp-5", name: "Pernilla Wikström", role: "Support", email: "pernilla.w@solglantan.se", password: "password", wage: 170, contractHours: 35, color: "role-support", skills: ["Svenska", "Undersköterska", "Nattjour", "HLR"] },
      { id: "emp-6", name: "Josef Eriksson", role: "Logistik", email: "josef.e@solglantan.se", password: "password", wage: 165, contractHours: 30, color: "role-logistik", skills: ["Svenska", "Vårdmaterial", "Tvätt & förråd", "Måltidsleverans"] }
    ],
    shifts: [
      { id: "shift-1", employeeId: "emp-1", day: 0, startTime: "07:00", endTime: "15:30", role: "Support", note: "Dagpass omvårdnad avd 1" },
      { id: "shift-2", employeeId: "emp-3", day: 0, startTime: "07:00", endTime: "16:00", role: "Teamlead", note: "Sjuksköterska & läkemedelsrond" },
      { id: "shift-3", employeeId: "emp-5", day: 0, startTime: "21:30", endTime: "07:30", role: "Support", note: "Nattpass jour" },
      { id: "shift-4", employeeId: "emp-2", day: 1, startTime: "07:00", endTime: "15:30", role: "Support", note: "Dagpass omvårdnad avd 2" },
      { id: "shift-5", employeeId: "emp-1", day: 1, startTime: "14:00", endTime: "22:00", role: "Support", note: "Kvällspass omvårdnad" },
      { id: "shift-6", employeeId: "emp-4", day: 1, startTime: "08:00", endTime: "16:00", role: "Admin", note: "Samordning & anhörigkontakt" },
      { id: "shift-7", employeeId: "emp-3", day: 2, startTime: "07:00", endTime: "16:00", role: "Teamlead", note: "Vårdplanering & rond" },
      { id: "shift-8", employeeId: "emp-2", day: 2, startTime: "21:30", endTime: "07:30", role: "Support", note: "Nattpass jour" },
      { id: "shift-9", employeeId: "emp-6", day: 2, startTime: "08:00", endTime: "14:00", role: "Logistik", note: "Förrådspåfyllning & tvätt" },
      { id: "shift-10", employeeId: "emp-1", day: 3, startTime: "07:00", endTime: "15:30", role: "Support", note: "Dagpass omvårdnad avd 1" },
      { id: "shift-11", employeeId: "emp-5", day: 3, startTime: "14:00", endTime: "22:00", role: "Support", note: "Kvällspass omvårdnad" },
      { id: "shift-12", employeeId: "emp-3", day: 3, startTime: "07:00", endTime: "16:00", role: "Teamlead", note: "Sjuksköterska & läkemedel" },
      { id: "shift-13", employeeId: "emp-2", day: 4, startTime: "07:00", endTime: "15:30", role: "Support", note: "Dagpass omvårdnad avd 2" },
      { id: "shift-14", employeeId: "emp-4", day: 4, startTime: "08:00", endTime: "16:00", role: "Admin", note: "Veckosamordning & schema" },
      { id: "shift-15", employeeId: "emp-6", day: 4, startTime: "08:00", endTime: "14:00", role: "Logistik", note: "Måltidsleverans & material" },
      { id: "shift-open-1", employeeId: "", day: 5, startTime: "07:00", endTime: "15:30", role: "Support", note: "Lördag dagpass omvårdnad" },
      { id: "shift-open-2", employeeId: "", day: 5, startTime: "21:30", endTime: "07:30", role: "Support", note: "Lördag nattpass jour" },
      { id: "shift-open-3", employeeId: "", day: 6, startTime: "14:00", endTime: "22:00", role: "Support", note: "Söndag kvällspass omvårdnad" }
    ],
    demand: {
      "Support": [2, 2, 1, 2, 1, 2, 2],
      "Teamlead": [1, 0, 1, 1, 0, 1, 0],
      "Admin": [0, 1, 0, 0, 1, 0, 0],
      "Logistik": [0, 0, 1, 0, 1, 0, 0]
    },
    announcements: [
      { id: "ann-1", title: "Sommarvikarier välkomnas", desc: "Tre nya sommarvikarier börjar nästa vecka. Birgitta ansvarar för introduktion och delegering. Var extra hjälpsamma de första passen.", date: "2026-06-18", author: "Birgitta Holmberg" },
      { id: "ann-2", title: "Värmebölja – rutiner", desc: "Vid varmt väder, se till att de boende dricker tillräckligt. Sara har satt upp uppdaterade vätskerutiner på personalrummet.", date: "2026-06-17", author: "Sara Lindqvist" }
    ],
    swaps: [
      { id: "swap-demo-1", type: "apply", shiftId: "shift-open-2", employeeId: "emp-5", status: "pending", date: "2026-06-18" }
    ]
  }
};

// Lista i visningsordning för branschväljaren.
const SCENARIO_LIST = ["cafe", "butik", "lager", "vard"];

// Aktiverar ett scenario: skriver dess data till localStorage och sätter branding.
function applyScenario(scenarioId) {
  const sc = SCENARIOS[scenarioId];
  if (!sc) return false;
  localStorage.setItem("ps_employees", JSON.stringify(sc.employees));
  localStorage.setItem("ps_shifts", JSON.stringify(sc.shifts));
  localStorage.setItem("ps_demand", JSON.stringify(sc.demand));
  localStorage.setItem("ps_announcements", JSON.stringify(sc.announcements));
  localStorage.setItem("ps_swaps", JSON.stringify(sc.swaps));
  localStorage.setItem("ps_week_number", "25");
  localStorage.setItem("ps_company_name", sc.companyName);
  localStorage.setItem("ps_company_initials", sc.companyInitials);
  localStorage.setItem("ps_brand_color", sc.brandColor);
  localStorage.setItem("ps_scenario", scenarioId);
  return true;
}
