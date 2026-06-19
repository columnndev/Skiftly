// Huvudapplikation för Skiftly

// ===========================================================================
// KONFIG — kontakt & bokning
// Klistra in din Microsoft Bookings-länk här när den är klar, t.ex.
//   "https://outlook.office365.com/book/Skiftly@dindomän.onmicrosoft.com/"
// Lämna tom ("") så används mailto-fallback till CONTACT_EMAIL istället.
// ===========================================================================
const SKIFTLY_CONFIG = {
  bookingUrl: "",                              // <-- Microsoft Bookings-länk hit
  contactEmail: "alenebrull422@outlook.com"    // mailto-fallback om bokningslänk saknas
};

class App {
  constructor() {
    this.state = {
      currentUser: null, // Inloggad användare
      employees: [],
      shifts: [],
      demand: {},
      announcements: [],
      swaps: [], // Alla förfrågningar om skiftbyten
      weekNumber: "25",
      filters: {
        roleFilter: "",
        searchFilter: ""
      }
    };
    
    this.scheduler = null;
  }

  // Initierar appen
  init() {
    // 1. Skapa defaultdata i localStorage om det saknas
    initLocalStorage();

    // 2. Läs in statet
    this.loadState();

    // 3. Initiera schemamodulen
    this.scheduler = new SchedulerManager(this);

    // 4. Läs in och tillämpa inställningar (tema, färgpalett, profilering, regler)
    this.loadSettings();

    // 5. Registrera alla event-listeners (inloggning + app)
    this.registerEvents();

    // 6. Bygg branschväljaren + koppla landningssidans knappar
    this.setupWelcomeScreen();

    // 7. Bestäm startläge.
    // Säljsidan är alltid "ytterdörren": en ren / visar landningssidan så att nya
    // besökare aldrig dumpas rakt in i en demo. Man går in i en demo därifrån.
    // Undantag: en explicit djuplänk (?view= eller ?app) tar dig direkt in om du
    // har en pågående session — bra för onboarding-länkar och "fortsätt där du var".
    const params = new URLSearchParams(window.location.search);
    const wantsApp = params.has("view") || params.has("app");

    const savedUser = localStorage.getItem("ps_current_user");
    if (wantsApp && savedUser) {
      this.state.currentUser = JSON.parse(savedUser);
      this.loginSuccess(this.state.currentUser, false); // tyst login utan toast
    } else {
      // Standard: visa alltid säljsidan/branschväljaren.
      this.showWelcomeScreen();
    }
  }

  // Laddar data från localStorage till statet
  loadState() {
    this.state.employees = JSON.parse(localStorage.getItem("ps_employees")) || [];
    
    // Auto-migrera gamla e-postdomäner till Skiftly
    let migrated = false;
    this.state.employees.forEach(emp => {
      if (emp.email.includes("@proscheduler.se")) {
        emp.email = emp.email.replace("@proscheduler.se", "@skiftly.se");
        migrated = true;
      }
    });
    
    this.state.shifts = JSON.parse(localStorage.getItem("ps_shifts")) || [];
    this.state.demand = JSON.parse(localStorage.getItem("ps_demand")) || {};
    this.state.announcements = JSON.parse(localStorage.getItem("ps_announcements")) || [];
    this.state.swaps = JSON.parse(localStorage.getItem("ps_swaps")) || [];
    this.state.weekNumber = localStorage.getItem("ps_week_number") || "25";

    if (migrated) {
      localStorage.setItem("ps_employees", JSON.stringify(this.state.employees));
    }

    const weekLabel = document.getElementById("current-week-label");
    if (weekLabel) {
      weekLabel.textContent = `Vecka ${this.state.weekNumber}`;
    }
  }

  // Sparar statet till localStorage
  saveState() {
    localStorage.setItem("ps_employees", JSON.stringify(this.state.employees));
    localStorage.setItem("ps_shifts", JSON.stringify(this.state.shifts));
    localStorage.setItem("ps_demand", JSON.stringify(this.state.demand));
    localStorage.setItem("ps_announcements", JSON.stringify(this.state.announcements));
    localStorage.setItem("ps_swaps", JSON.stringify(this.state.swaps));
  }

  // Visar inloggningsskärmen
  showLoginScreen() {
    document.body.className = "not-logged-in";
  }

  // Visar landningssidan / branschväljaren (förstagångsbesök).
  showWelcomeScreen() {
    document.body.className = "not-logged-in pre-app";
  }

  // Bygger branschkorten och kopplar landningssidans knappar.
  setupWelcomeScreen() {
    const grid = document.getElementById("scenario-grid");
    if (grid && typeof SCENARIOS !== "undefined") {
      grid.innerHTML = "";
      (typeof SCENARIO_LIST !== "undefined" ? SCENARIO_LIST : Object.keys(SCENARIOS)).forEach(id => {
        const sc = SCENARIOS[id];
        if (!sc) return;
        const card = document.createElement("div");
        card.className = "scenario-card";
        card.style.setProperty("--scenario-color", sc.brandColor);
        card.innerHTML = `
          <div class="scenario-icon">${sc.icon}</div>
          <div class="scenario-name">${sc.name}</div>
          <div class="scenario-desc">${sc.description}</div>
          <div class="scenario-company">Exempel: ${sc.companyName}</div>
          <div class="scenario-cta">
            Prova exempel
            <svg style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.5;" viewBox="0 0 24 24"><use href="#icon-chevron-right"></use></svg>
          </div>
        `;
        card.addEventListener("click", () => this.selectScenario(id));
        grid.appendChild(card);
      });
    }

    // "Testa demon gratis" scrollar ner till branschväljaren.
    const startBtn = document.getElementById("welcome-start-btn");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        const target = document.getElementById("welcome-scenarios");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    // "Logga in"-länken hoppar direkt till inloggning (väljer standarddemo om inget valts).
    const loginLink = document.getElementById("welcome-login-link");
    if (loginLink) {
      loginLink.addEventListener("click", () => {
        if (!localStorage.getItem("ps_scenario")) {
          localStorage.setItem("ps_scenario", "default");
        }
        this.showLoginScreen();
      });
    }

    // "Boka en genomgång"-knappen på säljsidan.
    const contactBtn = document.getElementById("welcome-contact-btn");
    if (contactBtn) {
      contactBtn.addEventListener("click", () => this.requestDemoContact());
    }

    // "Fortsätt i demon" — visas bara om besökaren redan utforskat en demo.
    const continueBtn = document.getElementById("welcome-continue-link");
    if (continueBtn) {
      const savedUser = localStorage.getItem("ps_current_user");
      const scenarioId = localStorage.getItem("ps_scenario");
      if (savedUser) {
        let company = "demon";
        if (scenarioId && typeof SCENARIOS !== "undefined" && SCENARIOS[scenarioId]) {
          company = SCENARIOS[scenarioId].companyName;
        }
        continueBtn.textContent = `Fortsätt i ${company}`;
        continueBtn.style.display = "";
        continueBtn.addEventListener("click", () => {
          this.state.currentUser = JSON.parse(savedUser);
          this.loginSuccess(this.state.currentUser, false);
        });
      } else {
        continueBtn.style.display = "none";
      }
    }
  }

  // "Boka en genomgång" — öppnar Microsoft Bookings om en länk är konfigurerad,
  // annars ett förifyllt mejl till kontaktadressen.
  requestDemoContact() {
    const url = (SKIFTLY_CONFIG.bookingUrl || "").trim();
    if (url) {
      window.open(url, "_blank", "noopener");
      return;
    }
    // Fallback: öppna ett förifyllt mejl.
    const email = SKIFTLY_CONFIG.contactEmail;
    const scenarioId = localStorage.getItem("ps_scenario");
    let bransch = "";
    if (scenarioId && typeof SCENARIOS !== "undefined" && SCENARIOS[scenarioId]) {
      bransch = ` (bransch: ${SCENARIOS[scenarioId].name})`;
    }
    const subject = encodeURIComponent("Boka en genomgång av Skiftly");
    const body = encodeURIComponent(
      `Hej!\n\nVi är intresserade av Skiftly${bransch} och vill boka en genomgång för vår verksamhet.\n\n` +
      `Företag:\nKontaktperson:\nTelefon:\nAntal anställda:\n\nVänliga hälsningar`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  // Visar demo-bannern i appen och fyller i aktuell bransch + kopplar knappar.
  setupDemoBanner() {
    const banner = document.getElementById("demo-banner");
    if (!banner) return;

    // Sätt branschnamn från aktivt scenario.
    const scenarioId = localStorage.getItem("ps_scenario");
    const industryEl = document.getElementById("demo-banner-industry");
    if (industryEl) {
      let label = "denna bransch";
      if (scenarioId && typeof SCENARIOS !== "undefined" && SCENARIOS[scenarioId]) {
        label = SCENARIOS[scenarioId].name.toLowerCase();
      }
      industryEl.textContent = label;
    }

    // Användaren kan dölja bannern (sparas för sessionen).
    if (sessionStorage.getItem("ps_demo_banner_closed") === "1") {
      banner.classList.add("is-hidden");
    }

    const closeBtn = document.getElementById("demo-banner-close");
    if (closeBtn && !closeBtn._bound) {
      closeBtn.addEventListener("click", () => {
        banner.classList.add("is-hidden");
        sessionStorage.setItem("ps_demo_banner_closed", "1");
      });
      closeBtn._bound = true;
    }

    const cta = document.getElementById("demo-banner-cta");
    if (cta && !cta._bound) {
      cta.addEventListener("click", () => this.requestDemoContact());
      cta._bound = true;
    }
  }

  // Aktiverar ett valt branschscenario och kliver in i demon som platschef.
  selectScenario(scenarioId) {
    if (typeof applyScenario !== "function" || !applyScenario(scenarioId)) return;

    // Läs in den nya datan och tillämpa branding/färg.
    this.loadState();
    this.loadSettings();

    // Logga in automatiskt som scenariots Teamlead (platschef/admin).
    const admin = this.state.employees.find(e => e.role === "Teamlead")
      || this.state.employees.find(e => e.role === "Admin")
      || this.state.employees[0];
    if (admin) {
      this.loginSuccess(admin, false);
    } else {
      this.showLoginScreen();
    }

    // Starta den guidade rundturen för nya besökare.
    if (!localStorage.getItem("ps_tour_done")) {
      setTimeout(() => this.startTour(), 600);
    }
  }

  // --- Guidad rundtur (onboarding) ---
  startTour() {
    this.tourSteps = [
      {
        selector: ".nav-menu",
        mobileSelector: "#menu-toggle-btn",
        title: "Navigering",
        text: "Här byter du mellan Översikt, Skiftplanering, Personalregister, Täckning & SLA och Inställningar. På mobilen öppnar du menyn via hamburgar-ikonen."
      },
      {
        selector: ".kpi-row",
        title: "Nyckeltal i realtid",
        text: "Få direkt koll på dagens bemanning, planerade timmar, lönekostnad och täckningsgrad — uppdateras automatiskt när du ändrar schemat."
      },
      {
        selector: "#nav-scheduler",
        title: "Skiftplanering",
        text: "Här planerar du veckan. Dra och släpp pass på datorn, eller tryck för att lägga till och redigera på mobilen. Tomma luckor och öppna pass syns tydligt."
      },
      {
        selector: ".auto-schedule-trigger, #nav-scheduler",
        title: "Auto-planera med AI",
        text: "Har du bråttom? Låt Skiftly föreslå ett komplett schema som täcker behovet per roll och dag — på sekunder."
      },
      {
        selector: "#nav-analytics",
        title: "Täckning, SLA & avtal",
        text: "Se om pass är under- eller överbemannade, estimera lönekostnad och få automatiska varningar mot arbetstidslagen. Klart att visa för chefen!"
      }
    ];
    this.tourIndex = 0;

    const overlay = document.getElementById("tour-overlay");
    if (!overlay) return;
    overlay.classList.add("active");

    // Koppla knappar en gång.
    if (!this._tourBound) {
      document.getElementById("tour-next").addEventListener("click", () => this.tourNext());
      document.getElementById("tour-prev").addEventListener("click", () => this.tourPrev());
      document.getElementById("tour-skip").addEventListener("click", () => this.endTour());
      window.addEventListener("resize", () => {
        if (overlay.classList.contains("active")) this.renderTourStep();
      });
      this._tourBound = true;
    }

    this.renderTourStep();
  }

  renderTourStep() {
    const step = this.tourSteps[this.tourIndex];
    if (!step) return;

    const isMobile = window.innerWidth <= 768;
    const selector = (isMobile && step.mobileSelector) ? step.mobileSelector : step.selector;
    // Ta första synliga matchande elementet.
    let target = null;
    selector.split(",").forEach(sel => {
      if (target) return;
      const el = document.querySelector(sel.trim());
      if (el && el.offsetParent !== null) target = el;
    });

    const spotlight = document.getElementById("tour-spotlight");
    const popover = document.getElementById("tour-popover");

    document.getElementById("tour-step-count").textContent = `${this.tourIndex + 1} / ${this.tourSteps.length}`;
    document.getElementById("tour-title").textContent = step.title;
    document.getElementById("tour-text").textContent = step.text;
    document.getElementById("tour-prev").style.visibility = this.tourIndex === 0 ? "hidden" : "visible";
    document.getElementById("tour-next").textContent = this.tourIndex === this.tourSteps.length - 1 ? "Klar" : "Nästa";

    if (target) {
      const r = target.getBoundingClientRect();
      const pad = 8;
      const top = Math.max(8, r.top - pad);
      const left = Math.max(8, r.left - pad);
      const width = r.width + pad * 2;
      const height = r.height + pad * 2;
      spotlight.style.top = `${top}px`;
      spotlight.style.left = `${left}px`;
      spotlight.style.width = `${width}px`;
      spotlight.style.height = `${height}px`;
      spotlight.style.opacity = "1";

      // Placera popover under (eller ovanför om ont om plats). På mobil styr CSS:en.
      if (!isMobile) {
        const popW = 320;
        let pLeft = Math.min(left, window.innerWidth - popW - 16);
        pLeft = Math.max(16, pLeft);
        let pTop = top + height + 14;
        if (pTop + 220 > window.innerHeight) {
          pTop = Math.max(16, top - 220);
        }
        popover.style.left = `${pLeft}px`;
        popover.style.top = `${pTop}px`;
      }
    } else {
      // Inget mål → centrera spotlighten bort och visa popover mitt på.
      spotlight.style.opacity = "0";
      spotlight.style.width = "0px";
      spotlight.style.height = "0px";
      if (!isMobile) {
        popover.style.left = `${(window.innerWidth - 320) / 2}px`;
        popover.style.top = `${window.innerHeight / 2 - 110}px`;
      }
    }
  }

  tourNext() {
    if (this.tourIndex >= this.tourSteps.length - 1) {
      this.endTour();
      return;
    }
    this.tourIndex++;
    this.renderTourStep();
  }

  tourPrev() {
    if (this.tourIndex > 0) {
      this.tourIndex--;
      this.renderTourStep();
    }
  }

  endTour() {
    const overlay = document.getElementById("tour-overlay");
    if (overlay) overlay.classList.remove("active");
    localStorage.setItem("ps_tour_done", "1");
  }

  // Körs vid framgångsrik inloggning
  loginSuccess(user, showToast = true) {
    this.state.currentUser = user;
    localStorage.setItem("ps_current_user", JSON.stringify(user));
    
    // Bestäm rollklass på body
    const isAdmin = user.role.toLowerCase() === "teamlead" || user.role.toLowerCase() === "admin";
    document.body.className = `logged-in ${isAdmin ? 'role-admin' : 'role-employee'}`;

    // Uppdatera sidofältet med användarinfo
    const initials = user.name.split(" ").map(n => n[0]).join("");
    document.getElementById("sidebar-user-avatar").textContent = initials;
    document.getElementById("sidebar-user-avatar").style.background = `linear-gradient(135deg, ${this.scheduler.getAvatarGradient(user.role)})`;
    document.getElementById("sidebar-user-name").textContent = user.name;
    document.getElementById("sidebar-user-role").textContent = user.role === "Teamlead" ? "Platschef (Admin)" : `${user.role} (Anställd)`;

    if (showToast) {
      this.showToast(`Välkommen tillbaka, ${user.name}!`, "success");
    }

    // Visa/uppdatera demo-bannern (bransch + knappar).
    this.setupDemoBanner();

    // Gå till vald vy (via ?view= om angiven, annars dashboard)
    const validViews = ["dashboard", "scheduler", "employees", "analytics", "settings"];
    const requestedView = new URLSearchParams(window.location.search).get("view");
    this.switchView(validViews.includes(requestedView) ? requestedView : "dashboard");
  }

  // Loggar ut användaren
  logout() {
    this.state.currentUser = null;
    localStorage.removeItem("ps_current_user");
    this.showLoginScreen();
    this.showToast("Du har loggats ut.", "success");
  }

  // Byter vy i applikationen
  switchView(viewId) {
    // Säkerhetskontroll: Blockera anställda från adminvyer
    const isAdmin = this.state.currentUser && (this.state.currentUser.role.toLowerCase() === "teamlead" || this.state.currentUser.role.toLowerCase() === "admin");
    if (!isAdmin && (viewId === "employees" || viewId === "settings")) {
      this.switchView("dashboard");
      return;
    }

    // Dölj alla vybehållare
    document.querySelectorAll(".view-container").forEach(view => {
      view.classList.remove("active");
    });

    // Inaktivera alla navigeringsknappar
    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.remove("active");
    });

    // Visa vald vy och markera knapp
    const activeView = document.getElementById(`view-${viewId}`);
    const activeNav = document.getElementById(`nav-${viewId}`);
    
    if (activeView) activeView.classList.add("active");
    if (activeNav) activeNav.classList.add("active");

    // Uppdatera sidans rubrik i header
    const headerTitle = document.getElementById("header-title");
    if (headerTitle) {
      const titles = {
        dashboard: "Översikt",
        scheduler: "Skiftplanering",
        employees: "Personalregister",
        analytics: "Täckningsgrad & SLA",
        settings: "Inställningar"
      };
      headerTitle.textContent = titles[viewId] || "Skiftly";
    }

    // Specifik logik vid laddning av vyer
    if (viewId === "scheduler") {
      this.scheduler.render();
    } else if (viewId === "employees") {
      this.renderEmployees();
    } else if (viewId === "analytics") {
      this.renderAnalytics();
    } else if (viewId === "dashboard") {
      this.updateKPIs();
      this.renderAnnouncements();
      this.renderRequestsQueue();
      this.renderEmployeeDashboard();
    }
  }

  // Uppdaterar KPI-korten och graferna på Dashboard
  updateKPIs() {
    const { employees, shifts, demand, currentUser } = this.state;
    if (!currentUser) return;

    const isAdmin = currentUser.role.toLowerCase() === "teamlead" || currentUser.role.toLowerCase() === "admin";

    // 1. Planerade timmar (för alla om admin, annars bara den egna)
    let totalHours = 0;
    shifts.forEach(shift => {
      if (shift.employeeId) {
        if (isAdmin || shift.employeeId === currentUser.id) {
          totalHours += this.scheduler.calculateShiftHours(shift.startTime, shift.endTime);
        }
      }
    });

    const hoursEl = document.getElementById("kpi-hours-val");
    if (hoursEl) hoursEl.textContent = `${totalHours.toFixed(1)} h`;
    
    const hoursSub = document.getElementById("kpi-hours-subtitle");
    if (hoursSub) {
      hoursSub.textContent = isAdmin ? "Planerat för alla" : "Dina timmar denna vecka";
    }

    // 2. Estimerad lönekostnad (Admin) / Min beräknade lön (Anställd)
    if (isAdmin) {
      let totalCost = 0;
      shifts.forEach(shift => {
        if (shift.employeeId) {
          const emp = employees.find(e => e.id === shift.employeeId);
          if (emp) {
            const hours = this.scheduler.calculateShiftHours(shift.startTime, shift.endTime);
            totalCost += hours * emp.wage;
          }
        }
      });
      const currencySymbol = this.getCurrencySymbol();
      const costEl = document.getElementById("kpi-cost-val");
      if (costEl) costEl.textContent = `${totalCost.toLocaleString('sv-SE')} ${currencySymbol}`;
    } else {
      // För anställda: Beräkna deras egen lön
      const myHours = this.scheduler.getEmployeeWeeklyHours(currentUser.id);
      const mySalary = myHours * currentUser.wage;
      const currencySymbol = this.getCurrencySymbol();
      const salaryEl = document.getElementById("kpi-salary-val");
      if (salaryEl) salaryEl.textContent = `${mySalary.toLocaleString('sv-SE')} ${currencySymbol}`;
    }

    // 3. Skift idag / Mitt nästa skift
    // Onsdag (index 2) är vår testdag i demon.
    const todayIndex = 2; // Onsdag
    
    const activeEl = document.getElementById("kpi-active-val");
    const titleShifts = document.getElementById("kpi-title-shifts");
    
    if (isAdmin) {
      const shiftsToday = shifts.filter(s => s.day === todayIndex && s.employeeId);
      if (activeEl) activeEl.textContent = `${shiftsToday.length} pers`;
      if (titleShifts) titleShifts.textContent = "Skift idag (Ons)";
    } else {
      // För anställd: Visa om de jobbar idag eller nästa pass
      const myShiftsToday = shifts.filter(s => s.day === todayIndex && s.employeeId === currentUser.id);
      if (activeEl) {
        activeEl.textContent = myShiftsToday.length > 0 ? `${myShiftsToday[0].startTime}-${myShiftsToday[0].endTime}` : "Ledig idag";
      }
      if (titleShifts) titleShifts.textContent = "Mitt arbetspass idag";
    }

    // 4. SLA & Täckningsgrad
    let totalRequiredCells = 0;
    let satisfiedCells = 0;

    for (let day = 0; day < 7; day++) {
      for (const role in demand) {
        const target = demand[role][day] || 0;
        if (target === 0) continue;

        totalRequiredCells++;
        const actual = shifts.filter(s => s.day === day && s.role === role && s.employeeId).length;
        if (actual >= target) {
          satisfiedCells++;
        }
      }
    }

    const slaPercentage = totalRequiredCells > 0 ? Math.round((satisfiedCells / totalRequiredCells) * 100) : 100;
    const slaEl = document.getElementById("kpi-sla-val");
    if (slaEl) slaEl.textContent = `${slaPercentage}%`;

    // 5. Uppdatera stapeldiagrammet (Endast Admin)
    if (isAdmin) {
      const hoursPerDay = [0, 0, 0, 0, 0, 0, 0];
      shifts.forEach(shift => {
        if (shift.employeeId) {
          const hours = this.scheduler.calculateShiftHours(shift.startTime, shift.endTime);
          hoursPerDay[shift.day] += hours;
        }
      });

      const maxHours = Math.max(...hoursPerDay, 10);
      for (let idx = 0; idx < 7; idx++) {
        const bar = document.getElementById(`bar-day-${idx}`);
        const tooltip = document.getElementById(`tooltip-day-${idx}`);
        if (bar) {
          const heightPercent = (hoursPerDay[idx] / maxHours) * 100;
          bar.style.height = `${Math.max(heightPercent, 4)}%`;
        }
        if (tooltip) {
          tooltip.textContent = `${hoursPerDay[idx].toFixed(1)} timmar`;
        }
      }
    }
  }

  // Renderar anslagstavlan
  renderAnnouncements() {
    const list = document.getElementById("announcements-list");
    if (!list) return;

    list.innerHTML = "";
    if (this.state.announcements.length === 0) {
      list.innerHTML = `<p style="color: var(--text-muted); font-size: 0.875rem;">Inga nya anslag.</p>`;
      return;
    }

    this.state.announcements.forEach(ann => {
      const item = document.createElement("div");
      item.className = "announcement-item";
      item.innerHTML = `
        <div class="announcement-meta">
          <span>${ann.author}</span>
          <span>${ann.date}</span>
        </div>
        <div class="announcement-title">${ann.title}</div>
        <div class="announcement-desc">${ann.desc}</div>
      `;
      list.appendChild(item);
    });
  }

  // Renderar administratörens förfrågningar-lista (skiftbyten/ansökningar)
  renderRequestsQueue() {
    const list = document.getElementById("admin-requests-list");
    const badge = document.getElementById("requests-badge");
    if (!list) return;

    list.innerHTML = "";
    const pendingRequests = this.state.swaps.filter(r => r.status === "pending");

    if (badge) {
      badge.textContent = pendingRequests.length;
      badge.style.display = pendingRequests.length > 0 ? "inline-flex" : "none";
    }

    if (pendingRequests.length === 0) {
      list.innerHTML = `<p style="color: var(--text-muted); font-size: 0.825rem; text-align: center; padding: 12px;">Inga väntande förfrågningar.</p>`;
      return;
    }

    const daysSwedish = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];

    pendingRequests.forEach(req => {
      const emp = this.state.employees.find(e => e.id === req.employeeId);
      const shift = this.state.shifts.find(s => s.id === req.shiftId);
      if (!emp || !shift) return;

      const item = document.createElement("div");
      item.className = "request-item";

      const isApply = req.type === "apply";
      const typeBadgeClass = isApply ? "badge-apply" : "badge-swap";
      const typeText = isApply ? "Ansökan om extrapass" : "Begäran om byte/ledighet";

      item.innerHTML = `
        <div class="request-item-header">
          <span class="request-badge ${typeBadgeClass}">${typeText}</span>
          <span style="font-size: 0.7rem; color: var(--text-muted);">${req.date}</span>
        </div>
        <div class="request-item-desc">
          <strong>${emp.name}</strong> vill ${isApply ? 'arbeta extrapasset' : 'byta bort sitt skift'} på 
          <strong>${daysSwedish[shift.day]} ${shift.startTime}-${shift.endTime}</strong> (${shift.role}).
        </div>
        <div class="request-item-actions">
          <button class="btn btn-secondary reject-req-btn" style="padding: 4px 10px; font-size: 0.75rem; border-color: rgba(239, 68, 68, 0.2); color: var(--danger);">Avböj</button>
          <button class="btn btn-primary approve-req-btn" style="padding: 4px 10px; font-size: 0.75rem; background-color: var(--success); color: white;">Godkänn</button>
        </div>
      `;

      item.querySelector(".approve-req-btn").addEventListener("click", () => this.handleRequestAction(req.id, "approved"));
      item.querySelector(".reject-req-btn").addEventListener("click", () => this.handleRequestAction(req.id, "rejected"));

      list.appendChild(item);
    });
  }

  // Godkänner eller avböjer en förfrågan
  handleRequestAction(requestId, status) {
    const reqIndex = this.state.swaps.findIndex(r => r.id === requestId);
    if (reqIndex === -1) return;

    const req = this.state.swaps[reqIndex];
    req.status = status;

    if (status === "approved") {
      const shift = this.state.shifts.find(s => s.id === req.shiftId);
      if (shift) {
        if (req.type === "apply") {
          // Tilldela passet till personen
          shift.employeeId = req.employeeId;
          this.showToast("Ansökan godkänd. Skiftet har tilldelats.", "success");
        } else if (req.type === "swap") {
          // Gör passet öppet (oplanerat) igen så att andra kan ta det
          shift.employeeId = "";
          this.showToast("Skiftbytet godkänt. Passet ligger nu i den öppna poolen.", "success");
        }
      }
    } else {
      this.showToast("Förfrågan avslogs.", "info");
    }

    this.saveState();
    this.renderRequestsQueue();
    this.scheduler.render();
    this.updateKPIs();
    this.renderAnalytics();
  }

  // Renderar specifika widgets på Dashboard för en inloggad anställd
  renderEmployeeDashboard() {
    const list = document.getElementById("employee-shifts-list");
    if (!list || !this.state.currentUser) return;

    const isAdmin = this.state.currentUser.role.toLowerCase() === "teamlead" || this.state.currentUser.role.toLowerCase() === "admin";
    if (isAdmin) return; // Gör inget om det är admin

    list.innerHTML = "";
    
    // Hitta alla skift för den inloggade
    const myShifts = this.state.shifts.filter(s => s.employeeId === this.state.currentUser.id);
    const daysSwedish = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];

    if (myShifts.length === 0) {
      list.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">Du har inga planerade skift denna vecka.</p>`;
      return;
    }

    // Sortera efter veckodag
    myShifts.sort((a, b) => a.day - b.day);

    myShifts.forEach(shift => {
      // Kolla om personen har skickat in en swap-begäran för detta skift
      const hasSwapReq = this.state.swaps.some(r => r.shiftId === shift.id && r.status === "pending");

      const item = document.createElement("div");
      item.className = "cost-item";
      item.innerHTML = `
        <div>
          <div class="cost-name">${daysSwedish[shift.day]}</div>
          <div class="cost-role">${shift.startTime} - ${shift.endTime} | ${shift.role}</div>
          ${shift.note ? `<div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">${shift.note}</div>` : ''}
        </div>
        <div class="cost-value-group">
          ${hasSwapReq 
            ? `<span class="compliance-indicator" style="background-color: var(--warning-glow); color: var(--warning); border-color: rgba(245, 158, 11, 0.2); font-size: 0.7rem;">Bytesförfrågan skickad</span>` 
            : `<button class="btn btn-secondary request-swap-btn" style="padding: 4px 8px; font-size: 0.75rem;">Erbjud byte / ledig</button>`
          }
        </div>
      `;

      if (!hasSwapReq) {
        item.querySelector(".request-swap-btn").addEventListener("click", () => {
          if (confirm(`Vill du erbjuda ditt skift på ${daysSwedish[shift.day]} ${shift.startTime}-${shift.endTime} för byte/ledighet?`)) {
            this.createSwapRequest(shift.id);
          }
        });
      }

      list.appendChild(item);
    });
  }

  // Skapar en bytesförfrågan för ett skift
  createSwapRequest(shiftId) {
    const newReq = {
      id: `swap-${Date.now()}`,
      type: "swap",
      shiftId: shiftId,
      employeeId: this.state.currentUser.id,
      status: "pending",
      date: new Date().toISOString().split("T")[0]
    };

    this.state.swaps.push(newReq);
    this.saveState();
    this.renderEmployeeDashboard();
    this.showToast("Skiftet har lagts ut för byte. Administratören måste godkänna bytet.", "success");
  }

  // Skapar en ansökan om ett öppet skift
  createApplyRequest(shiftId) {
    // Kolla om ansökan redan finns
    const alreadyApplied = this.state.swaps.some(r => r.shiftId === shiftId && r.employeeId === this.state.currentUser.id && r.status === "pending");
    if (alreadyApplied) {
      this.showToast("Du har redan skickat en ansökan för det här skiftet.", "warning");
      return;
    }

    const newReq = {
      id: `swap-${Date.now()}`,
      type: "apply",
      shiftId: shiftId,
      employeeId: this.state.currentUser.id,
      status: "pending",
      date: new Date().toISOString().split("T")[0]
    };

    this.state.swaps.push(newReq);
    this.saveState();
    this.scheduler.render(); // Uppdatera öppna skift-poolen
    this.showToast("Din ansökan om extrapasset har skickats till platschefen.", "success");
  }

  // Renderar Personalregister-vyn
  renderEmployees() {
    const grid = document.getElementById("employees-grid");
    if (!grid) return;

    grid.innerHTML = "";
    const searchVal = document.getElementById("employee-search-input")?.value.toLowerCase() || "";

    const filtered = this.state.employees.filter(emp => 
      emp.name.toLowerCase().includes(searchVal) || 
      emp.role.toLowerCase().includes(searchVal)
    );

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          Ingen personal hittades som matchar sökningen.
        </div>
      `;
      return;
    }

    filtered.forEach(emp => {
      const card = document.createElement("div");
      card.className = "employee-card";

      // Räkna totala veckotimmar
      const totalHours = this.scheduler.getEmployeeWeeklyHours(emp.id);
      
      const initials = emp.name.split(" ").map(n => n[0]).join("");
      const avatarGrad = this.scheduler.getAvatarGradient(emp.role);

      card.innerHTML = `
        <div class="employee-card-avatar" style="background: linear-gradient(135deg, ${avatarGrad})">
          ${initials}
        </div>
        <div class="employee-card-name">${emp.name}</div>
        <div class="employee-card-role">${emp.role}</div>
        
        <div class="employee-card-details">
          <div>
            <div class="detail-label">Timlön</div>
            <div class="detail-value">${emp.wage} ${this.getCurrencySymbol()}/h</div>
          </div>
          <div>
            <div class="detail-label">Veckoavtal</div>
            <div class="detail-value">${emp.contractHours}h</div>
          </div>
          <div>
            <div class="detail-label">Planerad tid</div>
            <div class="detail-value ${totalHours > emp.contractHours ? 'trend-down' : ''}">${totalHours.toFixed(1)}h</div>
          </div>
          <div>
            <div class="detail-label">E-post</div>
            <div class="detail-value" style="font-size: 0.7rem; word-break: break-all;" title="${emp.email}">${emp.email}</div>
          </div>
        </div>

        <div class="employee-card-skills">
          ${emp.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join("")}
        </div>

        <div class="employee-card-actions">
          <button class="card-btn edit-emp-btn" title="Redigera personal">
            <svg><use href="#icon-edit"></use></svg>
          </button>
          <button class="card-btn delete-emp-btn" title="Ta bort personal">
            <svg><use href="#icon-trash"></use></svg>
          </button>
        </div>
      `;

      card.querySelector(".edit-emp-btn").addEventListener("click", () => this.openEmployeeModal(emp));
      card.querySelector(".delete-emp-btn").addEventListener("click", () => {
        if (confirm(`Är du säker på att du vill ta bort ${emp.name}? Detta tar även bort alla personens tillhörande skift.`)) {
          this.deleteEmployee(emp.id);
        }
      });

      grid.appendChild(card);
    });
  }

  // Renderar Analys-vyn
  renderAnalytics() {
    const matrixContainer = document.getElementById("coverage-matrix-body");
    const costsContainer = document.getElementById("analytics-costs-list");
    if (!matrixContainer || !costsContainer) return;

    matrixContainer.innerHTML = "";
    costsContainer.innerHTML = "";

    const { employees, shifts, demand, currentUser } = this.state;
    const roles = Object.keys(demand);
    const currencySymbol = this.getCurrencySymbol();

    // 1. Rendera Täckningsmatrisen
    roles.forEach(role => {
      const row = document.createElement("div");
      row.className = "coverage-row";

      // Rollkolumn
      const roleCell = document.createElement("div");
      roleCell.className = "coverage-cell";
      roleCell.innerHTML = `<div>${role}</div>`;
      row.appendChild(roleCell);

      // Dagars täckning
      for (let day = 0; day < 7; day++) {
        const target = demand[role][day] || 0;
        const actual = shifts.filter(s => s.day === day && s.role === role && s.employeeId).length;

        const cell = document.createElement("div");
        cell.className = "coverage-cell";

        if (target === 0) {
          cell.innerHTML = `<span style="color: var(--text-muted); font-size: 0.75rem;">Inga krav</span>`;
        } else {
          let indicatorClass = "full";
          let diffText = "Optimal";

          if (actual < target) {
            indicatorClass = "under";
            diffText = `Underbemannad (-${target - actual})`;
          } else if (actual > target) {
            indicatorClass = "over";
            diffText = `Överbemannad (+${actual - target})`;
          }

          cell.innerHTML = `
            <div class="coverage-indicator ${indicatorClass}" title="${diffText}"></div>
            <div class="coverage-ratio">${actual}/${target}</div>
            <div class="coverage-numbers" style="font-size:0.65rem;">Schemalagda / Krav</div>
          `;
        }

        row.appendChild(cell);
      }

      matrixContainer.appendChild(row);
    });

    // 2. Rendera Kostnadssammanställningen (Admin) / Personliga stats (Anställd)
    const isAdmin = currentUser.role.toLowerCase() === "teamlead" || currentUser.role.toLowerCase() === "admin";
    
    if (isAdmin) {
      let totalCost = 0;
      const employeeCostDetails = employees.map(emp => {
        const weeklyHours = this.scheduler.getEmployeeWeeklyHours(emp.id);
        const cost = weeklyHours * emp.wage;
        totalCost += cost;

        return {
          name: emp.name,
          role: emp.role,
          hours: weeklyHours,
          cost: cost
        };
      });

      employeeCostDetails.sort((a, b) => b.cost - a.cost);

      employeeCostDetails.forEach(item => {
        const el = document.createElement("div");
        el.className = "cost-item";
        el.innerHTML = `
          <div>
            <div class="cost-name">${item.name}</div>
            <div class="cost-role">${item.role}</div>
          </div>
          <div class="cost-value-group">
            <div class="cost-sek">${item.cost.toLocaleString('sv-SE')} ${currencySymbol}</div>
            <div class="cost-hours">${item.hours.toFixed(1)} h planerade</div>
          </div>
        `;
        costsContainer.appendChild(el);
      });

      const totalEl = document.getElementById("analytics-total-cost");
      if (totalEl) {
        totalEl.textContent = `${totalCost.toLocaleString('sv-SE')} ${currencySymbol}`;
      }

      // 3. Facklig Compliance - Revisionsprotokoll för alla anställda (Admin)
      const complianceList = document.getElementById("compliance-violations-list");
      if (complianceList) {
        complianceList.innerHTML = "";
        let totalViolationsCount = 0;

        employees.forEach(emp => {
          const warnings = this.checkUnionCompliance(emp.id, shifts);
          if (warnings.length > 0) {
            totalViolationsCount += warnings.length;
            const el = document.createElement("div");
            el.className = "cost-item";
            el.style.borderLeft = "3px solid var(--danger)";
            el.style.background = "rgba(239, 68, 68, 0.05)";
            el.style.padding = "10px 14px";
            el.innerHTML = `
              <div>
                <div class="cost-name" style="color: var(--danger); font-weight: 600;">${emp.name} (${emp.role})</div>
                <div style="font-size: 0.8rem; margin-top: 4px; display: flex; flex-direction: column; gap: 4px;">
                  ${warnings.map(w => `<span style="display: flex; align-items: center; gap: 6px;">⚠️ ${w.text}</span>`).join("")}
                </div>
              </div>
            `;
            complianceList.appendChild(el);
          }
        });

        if (totalViolationsCount === 0) {
          complianceList.innerHTML = `
            <div style="padding: 16px; border: 1px dashed var(--success); color: var(--success); background: var(--success-glow); border-radius: var(--radius-md); text-align: center; font-size: 0.875rem; width: 100%;">
              ✅ Inga kollektivavtals- eller LAS-avvikelser identifierade. Schemat är fullt compliant!
            </div>
          `;
        }
      }
    } else {
      // Uppdatera anställdas stats på fliken
      const myHours = this.scheduler.getEmployeeWeeklyHours(currentUser.id);
      
      document.getElementById("emp-contract-val-display").textContent = `${currentUser.contractHours} h`;
      document.getElementById("emp-actual-val-display").textContent = `${myHours.toFixed(1)} h`;
      document.getElementById("emp-wage-val-display").textContent = `${currentUser.wage} ${currencySymbol}/h`;

      // Facklig Compliance - Personliga avvikelser (Anställd)
      const empComplianceList = document.getElementById("employee-compliance-list");
      if (empComplianceList) {
        empComplianceList.innerHTML = "";
        const warnings = this.checkUnionCompliance(currentUser.id, shifts);

        if (warnings.length > 0) {
          const el = document.createElement("div");
          el.className = "cost-item";
          el.style.borderLeft = "3px solid var(--danger)";
          el.style.background = "rgba(239, 68, 68, 0.05)";
          el.style.padding = "10px 14px";
          el.innerHTML = `
            <div>
              <div class="cost-name" style="color: var(--danger); font-weight: 600;">Dina avtalsavvikelser:</div>
              <div style="font-size: 0.8rem; margin-top: 4px; display: flex; flex-direction: column; gap: 4px;">
                ${warnings.map(w => `<span style="display: flex; align-items: center; gap: 6px;">⚠️ ${w.text}</span>`).join("")}
              </div>
            </div>
          `;
          empComplianceList.appendChild(el);
        } else {
          empComplianceList.innerHTML = `
            <div style="padding: 12px; border: 1px dashed var(--success); color: var(--success); background: var(--success-glow); border-radius: var(--radius-md); text-align: center; font-size: 0.8rem; width: 100%;">
              ✅ Dina planerade pass följer alla fackliga regler för vila och arbetstid.
            </div>
          `;
        }
      }
    }
  }

  // Kontrollerar kollektivavtals- och LAS-regler för en anställd
  checkUnionCompliance(employeeId, shifts) {
    const warnings = [];
    const emp = this.state.employees.find(e => e.id === employeeId);
    if (!emp) return warnings;

    // Hämta skift för denna anställd
    const empShifts = shifts.filter(s => s.employeeId === employeeId);
    if (empShifts.length === 0) return warnings;

    // 1. Kontrollera max veckoarbetstid (overtime)
    let totalHours = 0;
    empShifts.forEach(shift => {
      totalHours += this.scheduler.calculateShiftHours(shift.startTime, shift.endTime);
    });
    
    if (totalHours > emp.contractHours) {
      warnings.push({
        type: "overtime",
        text: `Planerad tid (${totalHours.toFixed(1)}h) överskrider avtalade kontraktstimmar (${emp.contractHours}h).`
      });
    }

    // 2. Kontrollera 11h Dygnsvila (consecutive rest between shifts)
    // Sortera skift efter dag och starttid
    const sortedShifts = [...empShifts].sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      const [aH, aM] = a.startTime.split(":").map(Number);
      const [bH, bM] = b.startTime.split(":").map(Number);
      return (aH + aM/60) - (bH + bM/60);
    });

    const daysSwedish = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];

    for (let day = 0; day < 6; day++) {
      const dayShifts = sortedShifts.filter(s => s.day === day);
      const nextDayShifts = sortedShifts.filter(s => s.day === day + 1);

      if (dayShifts.length > 0 && nextDayShifts.length > 0) {
        const lastShift = dayShifts[dayShifts.length - 1];
        const firstShift = nextDayShifts[0];

        const [lastEndH, lastEndM] = lastShift.endTime.split(":").map(Number);
        const [firstStartH, firstStartM] = firstShift.startTime.split(":").map(Number);

        const lastEndDec = lastEndH + lastEndM / 60;
        const firstStartDec = firstStartH + firstStartM / 60;

        // Vila mellan skiften (timmar kvar på dag d + timmar i början på dag d+1)
        const restHours = (24 - lastEndDec) + firstStartDec;
        if (restHours < 11) {
          warnings.push({
            type: "daily-rest",
            text: `Bruten dygnsvila: Endast ${restHours.toFixed(1)}h sammanhängande vila mellan ${daysSwedish[day]} och ${daysSwedish[day+1]} (Krav: 11h).`
          });
        }
      }
    }

    // 3. Kontrollera 36h Veckovila (consecutive weekly rest gap)
    // Konvertera alla skift till absoluta timmar sedan måndag 00:00 (0) till söndag 24:00 (168)
    const intervals = empShifts.map(s => {
      const [startH, startM] = s.startTime.split(":").map(Number);
      const [endH, endM] = s.endTime.split(":").map(Number);
      const startAbs = s.day * 24 + (startH + startM / 60);
      const endAbs = s.day * 24 + (endH + endM / 60);
      return { start: startAbs, end: endAbs };
    });

    // Sortera efter starttid
    intervals.sort((a, b) => a.start - b.start);

    // Hitta längsta lediga perioden
    let maxRestGap = 0;
    let currentPos = 0; // Början på veckan (mån 00:00)

    for (let i = 0; i < intervals.length; i++) {
      const gap = intervals[i].start - currentPos;
      if (gap > maxRestGap) {
        maxRestGap = gap;
      }
      if (intervals[i].end > currentPos) {
        currentPos = intervals[i].end;
      }
    }

    // Gap i slutet av veckan (fram till sön 24:00 / timme 168)
    const endGap = 168 - currentPos;
    if (endGap > maxRestGap) {
      maxRestGap = endGap;
    }

    if (maxRestGap < 36) {
      warnings.push({
        type: "weekly-rest",
        text: `Bruten veckovila: Längsta lediga perioden är endast ${maxRestGap.toFixed(1)}h under veckan (Krav: 36h).`
      });
    }

    return warnings;
  }

  // --- Modals kontroll ---

  // Öppna Skiftmodalen
  openShiftModal(shiftData = {}) {
    const modal = document.getElementById("shift-modal");
    const title = document.getElementById("shift-modal-title");
    const deleteBtn = document.getElementById("shift-modal-delete-btn");

    if (!modal) return;

    // Töm/återställ
    document.getElementById("shift-id-input").value = shiftData.id || "";
    document.getElementById("shift-note-input").value = shiftData.note || "";
    document.getElementById("shift-start-input").value = shiftData.startTime || "08:00";
    document.getElementById("shift-end-input").value = shiftData.endTime || "16:30";

    // Fyll i personalväljare
    const empSelect = document.getElementById("shift-employee-select");
    empSelect.innerHTML = `<option value="">-- Oplanerat skift (Pool) --</option>`;
    this.state.employees.forEach(emp => {
      const selected = shiftData.employeeId === emp.id ? "selected" : "";
      empSelect.innerHTML += `<option value="${emp.id}" ${selected}>${emp.name} (${emp.role})</option>`;
    });

    // Fyll i dagsväljare
    const daySelect = document.getElementById("shift-day-select");
    const daysSwedish = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];
    daySelect.innerHTML = "";
    daysSwedish.forEach((dayName, idx) => {
      const selected = shiftData.day === idx ? "selected" : "";
      daySelect.innerHTML += `<option value="${idx}" ${selected}>${dayName}</option>`;
    });

    // Fyll i rollväljare
    const roleSelect = document.getElementById("shift-role-select");
    const roles = ["Support", "Teamlead", "Admin", "Logistik"];
    roleSelect.innerHTML = "";
    roles.forEach(role => {
      const selected = shiftData.role === role ? "selected" : "";
      roleSelect.innerHTML += `<option value="${role}" ${selected}>${role}</option>`;
    });

    if (shiftData.id) {
      title.textContent = "Redigera skift";
      deleteBtn.style.display = "block";
    } else {
      title.textContent = "Planera nytt skift";
      deleteBtn.style.display = "none";
      if (shiftData.employeeId) empSelect.value = shiftData.employeeId;
      if (shiftData.day !== undefined) daySelect.value = shiftData.day;
    }

    modal.classList.add("active");
  }

  closeShiftModal() {
    const modal = document.getElementById("shift-modal");
    if (modal) modal.classList.remove("active");
  }

  // Spara skift
  saveShiftFromModal() {
    const id = document.getElementById("shift-id-input").value;
    const employeeId = document.getElementById("shift-employee-select").value;
    const day = parseInt(document.getElementById("shift-day-select").value, 10);
    const startTime = document.getElementById("shift-start-input").value;
    const endTime = document.getElementById("shift-end-input").value;
    const role = document.getElementById("shift-role-select").value;
    const note = document.getElementById("shift-note-input").value;

    if (!startTime || !endTime) {
      this.showToast("Fyll i starttid och sluttid.", "error");
      return;
    }

    if (id) {
      // Uppdatera
      const idx = this.state.shifts.findIndex(s => s.id === id);
      if (idx !== -1) {
        this.state.shifts[idx] = { id, employeeId, day, startTime, endTime, role, note };
        this.showToast("Skiftet uppdaterades.", "success");
      }
    } else {
      // Skapa
      const newShift = {
        id: `shift-${Date.now()}`,
        employeeId,
        day,
        startTime,
        endTime,
        role,
        note
      };
      this.state.shifts.push(newShift);
      this.showToast("Nytt skift har skapats.", "success");
    }

    this.saveState();
    this.closeShiftModal();
    this.scheduler.render();
    this.updateKPIs();
    this.renderAnalytics();
  }

  deleteShift(id) {
    this.state.shifts = this.state.shifts.filter(s => s.id !== id);
    // Ta även bort eventuella förfrågningar kopplade till skiftet
    this.state.swaps = this.state.swaps.filter(r => r.shiftId !== id);
    this.saveState();
    this.scheduler.render();
    this.updateKPIs();
    this.renderAnalytics();
    this.showToast("Skiftet togs bort.", "success");
  }

  // Öppna Personalmodalen
  openEmployeeModal(empData = {}) {
    const modal = document.getElementById("employee-modal");
    const title = document.getElementById("employee-modal-title");

    if (!modal) return;

    document.getElementById("emp-id-input").value = empData.id || "";
    document.getElementById("emp-name-input").value = empData.name || "";
    document.getElementById("emp-role-select").value = empData.role || "Support";
    document.getElementById("emp-email-input").value = empData.email || "";
    document.getElementById("emp-wage-input").value = empData.wage || 160;
    document.getElementById("emp-hours-input").value = empData.contractHours || 40;
    document.getElementById("emp-skills-input").value = empData.skills ? empData.skills.join(", ") : "Svenska, Engelska";

    if (empData.id) {
      title.textContent = "Redigera anställd";
    } else {
      title.textContent = "Lägg till ny anställd";
    }

    modal.classList.add("active");
  }

  closeEmployeeModal() {
    const modal = document.getElementById("employee-modal");
    if (modal) modal.classList.remove("active");
  }

  // Spara anställd
  saveEmployeeFromModal() {
    const id = document.getElementById("emp-id-input").value;
    const name = document.getElementById("emp-name-input").value.trim();
    const role = document.getElementById("emp-role-select").value;
    const email = document.getElementById("emp-email-input").value.trim();
    const wage = parseInt(document.getElementById("emp-wage-input").value, 10);
    const contractHours = parseInt(document.getElementById("emp-hours-input").value, 10);
    const skillsString = document.getElementById("emp-skills-input").value;

    if (!name || !email) {
      this.showToast("Vänligen fyll i namn och e-postadress.", "error");
      return;
    }

    const skills = skillsString.split(",").map(s => s.trim()).filter(s => s.length > 0);
    const colorMap = {
      "Support": "role-support",
      "Teamlead": "role-teamlead",
      "Admin": "role-admin",
      "Logistik": "role-logistik"
    };
    const color = colorMap[role] || "role-support";

    if (id) {
      // Uppdatera
      const idx = this.state.employees.findIndex(e => e.id === id);
      if (idx !== -1) {
        // Behåll lösenord
        const oldPass = this.state.employees[idx].password || "password";
        this.state.employees[idx] = { id, name, role, email, password: oldPass, wage, contractHours, color, skills };
        
        this.state.shifts.forEach(s => {
          if (s.employeeId === id) {
            s.role = role;
          }
        });
        
        this.showToast(`${name} har uppdaterats.`, "success");
      }
    } else {
      // Skapa
      const newEmp = {
        id: `emp-${Date.now()}`,
        name,
        role,
        email,
        password: "password", // default lösenord
        wage,
        contractHours,
        color,
        skills
      };
      this.state.employees.push(newEmp);
      this.showToast(`${name} har lagts till.`, "success");
    }

    this.saveState();
    this.closeEmployeeModal();
    this.renderEmployees();
    this.updateKPIs();
  }

  deleteEmployee(id) {
    const emp = this.state.employees.find(e => e.id === id);
    const name = emp ? emp.name : "Personalen";

    this.state.employees = this.state.employees.filter(e => e.id !== id);
    this.state.shifts = this.state.shifts.filter(s => s.employeeId !== id);
    this.state.swaps = this.state.swaps.filter(r => r.employeeId !== id);

    this.saveState();
    this.renderEmployees();
    this.updateKPIs();
    this.showToast(`${name} raderades.`, "success");
  }

  // --- Auto-planering trigger ---
  triggerAutoScheduler() {
    const overlay = document.getElementById("processing-overlay");
    const progressFill = document.getElementById("processing-progress-fill");
    const textEl = document.getElementById("processing-step-text");

    if (!overlay) return;

    overlay.classList.add("active");
    progressFill.style.width = "0%";
    textEl.textContent = "Analyserar personalregister och kompetenser...";

    const steps = [
      { progress: 25, text: "Beräknar optimalt bemanningsbehov för veckan...", delay: 800 },
      { progress: 60, text: "Matchar arbetstidsregler, dygnsvila & veckoavtal...", delay: 1600 },
      { progress: 85, text: "Finslipar schemaläggning och fördelar rest-skift...", delay: 2400 },
      { progress: 100, text: "Skriver nytt schema till databasen...", delay: 3000 }
    ];

    steps.forEach(step => {
      setTimeout(() => {
        progressFill.style.width = `${step.progress}%`;
        textEl.textContent = step.text;
        
        if (step.progress === 100) {
          setTimeout(() => {
            const generatedShifts = runAutoScheduler(this.state.employees, this.state.demand);
            this.state.shifts = generatedShifts;
            
            // Rensa alla skiftansökningar eftersom gamla öppna skift inte längre finns kvar
            this.state.swaps = [];
            
            this.saveState();
            
            overlay.classList.remove("active");
            this.scheduler.render();
            this.updateKPIs();
            this.renderAnalytics();
            this.renderRequestsQueue();
            
            this.showToast("Nytt schema auto-planerat för hela veckan!", "success");
          }, 600);
        }
      }, step.delay);
    });
  }

  // --- Toast Meddelanden ---
  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconSymbol = "#icon-info";
    if (type === "success") iconSymbol = "#icon-check-circle";
    if (type === "warning") iconSymbol = "#icon-alert";
    if (type === "error") iconSymbol = "#icon-alert-octagon";

    toast.innerHTML = `
      <svg style="width: 20px; height: 20px; stroke: currentColor; stroke-width: 2; fill: none;">
        <use href="${iconSymbol}"></use>
      </svg>
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.25) reverse forwards";
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // --- Löneexport till CSV ---
  exportSalaryReport() {
    const { employees, weekNumber } = this.state;
    const companyName = document.getElementById("settings-company-name-input")?.value || "Skiftly";
    const currency = this.getCurrencySymbol();
    
    // Header row
    let csvContent = "Personal-ID;Namn;Roll;Timlon (kr/h);Planerade timmar;Helgtimmar (OB);OB-ersattning;Bruttolon\n";
    
    employees.forEach(emp => {
      const weeklyHours = this.scheduler.getEmployeeWeeklyHours(emp.id);
      
      // Calculate weekend hours
      const weekendShifts = this.state.shifts.filter(s => s.employeeId === emp.id && s.day >= 5);
      let weekendHours = 0;
      weekendShifts.forEach(s => {
        const [startH, startM] = s.startTime.split(":").map(Number);
        const [endH, endM] = s.endTime.split(":").map(Number);
        let diff = (endH + endM / 60) - (startH + startM / 60);
        if (diff < 0) diff += 24;
        const duration = diff > 5 ? diff - 0.5 : diff;
        weekendHours += duration;
      });
      
      const obRate = 55; // 55 kr/hour OB allowance
      const obErsattning = Math.round(weekendHours * obRate);
      const basicWage = Math.round(weeklyHours * emp.wage);
      const grossSalary = basicWage + obErsattning;
      
      csvContent += `${emp.id};${emp.name};${emp.role};${emp.wage};${weeklyHours.toFixed(1)};${weekendHours.toFixed(1)};${obErsattning};${grossSalary}\n`;
    });
    
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const cleanCompany = companyName.replace(/[^a-zA-Z0-9]/g, "_");
    link.setAttribute("download", `Lonerapport_vecka_${weekNumber}_${cleanCompany}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showToast("Lönerapport (CSV) nedladdad!", "success");
  }

  // --- Fortnox PA-fil Export ---
  exportFortnoxPA() {
    const { employees, weekNumber } = this.state;
    const companyName = document.getElementById("settings-company-name-input")?.value || "Skiftly";
    
    let csvContent = "Personalnr;Datum;Loneart;Kvantitet\n";
    
    this.state.shifts.forEach(s => {
      if (!s.employeeId) return; 
      
      const emp = employees.find(e => e.id === s.employeeId);
      if (!emp) return;
      
      const [startH, startM] = s.startTime.split(":").map(Number);
      const [endH, endM] = s.endTime.split(":").map(Number);
      let diff = (endH + endM / 60) - (startH + startM / 60);
      if (diff < 0) diff += 24;
      const duration = diff > 5 ? diff - 0.5 : diff;
      
      const daysSwedish = ["Mandag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lordag", "Sondag"];
      const dayName = daysSwedish[s.day];
      
      csvContent += `${emp.id};Vecka ${weekNumber} (${dayName});TID;${duration.toFixed(2)}\n`;
      
      if (s.day >= 5) {
        csvContent += `${emp.id};Vecka ${weekNumber} (${dayName});OB1;${duration.toFixed(2)}\n`;
      }
    });
    
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const cleanCompany = companyName.replace(/[^a-zA-Z0-9]/g, "_");
    link.setAttribute("download", `Fortnox_PA_vecka_${weekNumber}_${cleanCompany}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showToast("Fortnox PA-fil exporterad!", "success");
  }

  // --- Tema toggle ---
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("ps_theme", newTheme);
    this.updateThemeIcon(newTheme);
    
    const themeSelect = document.getElementById("settings-theme-select");
    if (themeSelect) themeSelect.value = newTheme;

    this.showToast(`Bytte till ${newTheme === "light" ? "Ljust" : "Mörkt"} tema.`, "success");
  }

  updateThemeIcon(theme) {
    const btn = document.getElementById("theme-toggle-btn");
    if (!btn) return;
    btn.innerHTML = theme === "light" ? `<svg><use href="#icon-moon"></use></svg>` : `<svg><use href="#icon-sun"></use></svg>`;
  }

  getCurrencySymbol() {
    const currency = localStorage.getItem("ps_currency") || "SEK";
    return currency === "EUR" ? "€" : "kr";
  }

  applyBrandColor(color) {
    const root = document.documentElement;
    const colorMap = {
      "#6366f1": { // Indigo
        primary: "#6366f1",
        glow: "rgba(99, 102, 241, 0.15)",
        hover: "#4f46e5"
      },
      "#10b981": { // Emerald
        primary: "#10b981",
        glow: "rgba(16, 185, 129, 0.15)",
        hover: "#059669"
      },
      "#8b5cf6": { // Violet
        primary: "#8b5cf6",
        glow: "rgba(139, 92, 246, 0.15)",
        hover: "#7c3aed"
      },
      "#f59e0b": { // Amber
        primary: "#f59e0b",
        glow: "rgba(245, 158, 11, 0.15)",
        hover: "#d97706"
      },
      "#ef4444": { // Red
        primary: "#ef4444",
        glow: "rgba(239, 68, 68, 0.15)",
        hover: "#dc2626"
      }
    };

    const scheme = colorMap[color] || colorMap["#6366f1"];
    root.style.setProperty("--primary", scheme.primary);
    root.style.setProperty("--primary-glow", scheme.glow);
    root.style.setProperty("--primary-hover", scheme.hover);

    localStorage.setItem("ps_brand_color", color);

    document.querySelectorAll(".color-dot").forEach(dot => {
      if (dot.getAttribute("data-color") === color) {
        dot.classList.add("active");
        dot.style.boxShadow = `0 0 8px ${color}`;
      } else {
        dot.classList.remove("active");
        dot.style.boxShadow = "none";
      }
    });
  }

  // Delar upp ett företagsnamn i en "vanlig del" + en färgad ändelse för logotypen.
  // Stödjer t.ex. "Skiftly" -> Skift + ly, och äldre "...Schema" -> ... + Schema.
  brandLogoHTML(companyName) {
    const lower = companyName.toLowerCase();
    let base = companyName;
    let accent = "";
    if (lower.endsWith("schema") && companyName.length > 6) {
      base = companyName.substring(0, companyName.length - 6);
      accent = companyName.substring(companyName.length - 6);
    } else if (lower.endsWith("ly") && companyName.length > 2) {
      base = companyName.substring(0, companyName.length - 2);
      accent = companyName.substring(companyName.length - 2);
    }
    if (accent) {
      return `${base}<span style="font-weight: 800; color: var(--primary);">${accent}</span>`;
    }
    return companyName;
  }

  applyBranding() {
    const companyName = localStorage.getItem("ps_company_name") || "Skiftly";
    const companyInitials = localStorage.getItem("ps_company_initials") || "Sk";

    const logoSidebar = document.getElementById("logo-text-sidebar");
    if (logoSidebar) {
      logoSidebar.innerHTML = this.brandLogoHTML(companyName);
    }

    const logoLogin = document.getElementById("logo-text-login");
    if (logoLogin) {
      logoLogin.innerHTML = this.brandLogoHTML(companyName);
    }

    const iconSidebar = document.getElementById("logo-icon-sidebar");
    const iconLogin = document.getElementById("logo-icon-login");
    
    const initialsHTML = `<span style="font-family: var(--font-title); font-weight: 800; font-size: 0.95rem; color: white; line-height: 1; text-transform: uppercase;">${companyInitials}</span>`;
    const sparklesHTML = `
      <svg style="width: 22px; height: 22px; stroke: white; stroke-width: 2.5; fill: none;" viewBox="0 0 24 24">
        <use href="#icon-sparkles"></use>
      </svg>
    `;
    const sparklesLoginHTML = `
      <svg style="width: 24px; height: 24px; stroke: white; stroke-width: 2.5; fill: none;" viewBox="0 0 24 24">
        <use href="#icon-sparkles"></use>
      </svg>
    `;

    if (iconSidebar) {
      if (companyInitials && companyInitials !== "Sk") {
        iconSidebar.innerHTML = initialsHTML;
      } else {
        iconSidebar.innerHTML = sparklesHTML;
      }
    }

    if (iconLogin) {
      if (companyInitials && companyInitials !== "Sk") {
        iconLogin.innerHTML = `<span style="font-family: var(--font-title); font-weight: 800; font-size: 1.1rem; color: white; line-height: 1; text-transform: uppercase;">${companyInitials}</span>`;
      } else {
        iconLogin.innerHTML = sparklesLoginHTML;
      }
    }

    const nameInput = document.getElementById("settings-company-name-input");
    const initialsInput = document.getElementById("settings-company-initials-input");
    if (nameInput) nameInput.value = companyName;
    if (initialsInput) initialsInput.value = companyInitials;
  }

  loadSettings() {
    const savedTheme = localStorage.getItem("ps_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    this.updateThemeIcon(savedTheme);
    const themeSelect = document.getElementById("settings-theme-select");
    if (themeSelect) themeSelect.value = savedTheme;

    const savedColor = localStorage.getItem("ps_brand_color") || "#6366f1";
    this.applyBrandColor(savedColor);

    this.applyBranding();

    const restWarning = localStorage.getItem("ps_rest_warning") !== "false";
    const restWarningCheck = document.getElementById("settings-rest-warning");
    if (restWarningCheck) restWarningCheck.checked = restWarning;

    const lunchDeduction = localStorage.getItem("ps_lunch_deduction") || "30";
    const lunchSelect = document.getElementById("settings-lunch-deduction");
    if (lunchSelect) lunchSelect.value = lunchDeduction;

    const currency = localStorage.getItem("ps_currency") || "SEK";
    const currencySelect = document.getElementById("settings-currency");
    if (currencySelect) currencySelect.value = currency;
  }

  saveSettingsFromUI() {
    const nameInput = document.getElementById("settings-company-name-input");
    const initialsInput = document.getElementById("settings-company-initials-input");
    const themeSelect = document.getElementById("settings-theme-select");
    const restCheck = document.getElementById("settings-rest-warning");
    const lunchSelect = document.getElementById("settings-lunch-deduction");
    const currencySelect = document.getElementById("settings-currency");

    if (nameInput) localStorage.setItem("ps_company_name", nameInput.value.trim() || "Skiftly");
    if (initialsInput) localStorage.setItem("ps_company_initials", initialsInput.value.trim().toUpperCase() || "ES");
    
    if (themeSelect) {
      const selectedTheme = themeSelect.value;
      localStorage.setItem("ps_theme", selectedTheme);
      document.documentElement.setAttribute("data-theme", selectedTheme);
      this.updateThemeIcon(selectedTheme);
    }

    if (restCheck) localStorage.setItem("ps_rest_warning", restCheck.checked.toString());
    if (lunchSelect) localStorage.setItem("ps_lunch_deduction", lunchSelect.value);
    if (currencySelect) localStorage.setItem("ps_currency", currencySelect.value);

    this.applyBranding();

    this.scheduler.render();
    this.updateKPIs();
    this.renderAnalytics();

    this.showToast("Inställningar och profilering har sparats!", "success");
  }

  // --- Event listeners ---
  // --- Mobil navigering (slide-in drawer) ---
  setupMobileNav() {
    const toggleBtn = document.getElementById("menu-toggle-btn");
    const backdrop = document.getElementById("sidebar-backdrop");

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => this.toggleMobileNav());
    }
    if (backdrop) {
      backdrop.addEventListener("click", () => this.closeMobileNav());
    }

    // Stäng menyn med Escape-tangenten
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeMobileNav();
    });

    // Stäng menyn automatiskt om man förstorar fönstret förbi mobilbrytpunkten
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) this.closeMobileNav();
    });
  }

  openMobileNav() {
    document.body.classList.add("nav-open");
    const toggleBtn = document.getElementById("menu-toggle-btn");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
  }

  closeMobileNav() {
    document.body.classList.remove("nav-open");
    const toggleBtn = document.getElementById("menu-toggle-btn");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
  }

  toggleMobileNav() {
    if (document.body.classList.contains("nav-open")) {
      this.closeMobileNav();
    } else {
      this.openMobileNav();
    }
  }

  registerEvents() {
    // 1. Inloggningsformulär
    const loginSubmitBtn = document.getElementById("login-submit-btn");
    if (loginSubmitBtn) {
      loginSubmitBtn.addEventListener("click", () => {
        const email = document.getElementById("login-email").value.trim().toLowerCase();
        const pass = document.getElementById("login-password").value;

        if (!email || !pass) {
          this.showToast("Skriv in e-post och lösenord.", "error");
          return;
        }

        const user = this.state.employees.find(e => e.email.toLowerCase() === email && e.password === pass);
        if (user) {
          this.loginSuccess(user);
        } else {
          this.showToast("Felaktig e-post eller lösenord. För test, använd demolisterna nedan.", "error");
        }
      });
    }

    // 2. Demo-inloggningar
    const demoAdmin = document.getElementById("demo-login-admin");
    const demoEmp = document.getElementById("demo-login-employee");

    if (demoAdmin) {
      demoAdmin.addEventListener("click", () => {
        const user = this.state.employees.find(e => e.id === "emp-3"); // Johan Karlsson
        if (user) this.loginSuccess(user);
      });
    }

    if (demoEmp) {
      demoEmp.addEventListener("click", () => {
        const user = this.state.employees.find(e => e.id === "emp-1"); // Elsa Bergström
        if (user) this.loginSuccess(user);
      });
    }

    // 3. Utloggning
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.logout());
    }

    // 4. Sidnavigering
    document.querySelectorAll(".nav-item button").forEach(btn => {
      btn.addEventListener("click", () => {
        const viewId = btn.parentElement.id.replace("nav-", "");
        this.switchView(viewId);
        this.closeMobileNav();
      });
    });

    // 4b. Mobil meny (hamburgar-drawer)
    this.setupMobileNav();

    // 5. Tema-knapp
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => this.toggleTheme());
    }

    // 6. Auto-planera
    const autoBtns = document.querySelectorAll(".auto-schedule-trigger");
    autoBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        if (confirm("Är du säker på att du vill auto-planera? Detta kommer att skriva över nuvarande schema och rensa ansökningar.")) {
          this.triggerAutoScheduler();
        }
      });
    });

    // 7. Skapa skift knappar
    const createShiftBtns = document.querySelectorAll(".create-shift-trigger");
    createShiftBtns.forEach(btn => {
      btn.addEventListener("click", () => this.openShiftModal());
    });

    // 8. Skapa personal knappar
    const createEmpBtns = document.querySelectorAll(".create-employee-trigger");
    createEmpBtns.forEach(btn => {
      btn.addEventListener("click", () => this.openEmployeeModal());
    });

    // 9. Skiftmodal spara/avbryt
    document.getElementById("shift-modal-save").addEventListener("click", () => this.saveShiftFromModal());
    document.getElementById("shift-modal-cancel").addEventListener("click", () => this.closeShiftModal());
    document.getElementById("shift-modal-close").addEventListener("click", () => this.closeShiftModal());
    document.getElementById("shift-modal-delete-btn").addEventListener("click", () => {
      const id = document.getElementById("shift-id-input").value;
      if (id && confirm("Vill du radera detta skift?")) {
        this.deleteShift(id);
        this.closeShiftModal();
      }
    });

    // 10. Personalmodal spara/avbryt
    document.getElementById("employee-modal-save").addEventListener("click", () => this.saveEmployeeFromModal());
    document.getElementById("employee-modal-cancel").addEventListener("click", () => this.closeEmployeeModal());
    document.getElementById("employee-modal-close").addEventListener("click", () => this.closeEmployeeModal());

    // 11. Filter och sök i Schemat
    const roleSelect = document.getElementById("filter-role-select");
    if (roleSelect) {
      roleSelect.addEventListener("change", (e) => {
        this.state.filters.roleFilter = e.target.value;
        this.scheduler.render();
      });
    }

    const searchInput = document.getElementById("filter-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.state.filters.searchFilter = e.target.value;
        this.scheduler.render();
      });
    }

    // 12. Sök i personalregistret
    const empSearchInput = document.getElementById("employee-search-input");
    if (empSearchInput) {
      empSearchInput.addEventListener("input", () => {
        this.renderEmployees();
      });
    }

    // 13. Vecka Fram / Bak knappar (Simulering)
    const prevWeekBtn = document.getElementById("prev-week-btn");
    const nextWeekBtn = document.getElementById("next-week-btn");
    
    if (prevWeekBtn && nextWeekBtn) {
      prevWeekBtn.addEventListener("click", () => {
        let w = parseInt(this.state.weekNumber, 10) - 1;
        if (w < 1) w = 52;
        this.state.weekNumber = w.toString();
        localStorage.setItem("ps_week_number", this.state.weekNumber);
        document.getElementById("current-week-label").textContent = `Vecka ${this.state.weekNumber}`;
        this.showToast(`Visar schema för vecka ${this.state.weekNumber}`, "info");
        this.scheduler.render();
        this.updateKPIs();
        this.renderEmployeeDashboard();
      });

      nextWeekBtn.addEventListener("click", () => {
        let w = parseInt(this.state.weekNumber, 10) + 1;
        if (w > 52) w = 1;
        this.state.weekNumber = w.toString();
        localStorage.setItem("ps_week_number", this.state.weekNumber);
        document.getElementById("current-week-label").textContent = `Vecka ${this.state.weekNumber}`;
        this.showToast(`Visar schema för vecka ${this.state.weekNumber}`, "info");
        this.scheduler.render();
        this.updateKPIs();
        this.renderEmployeeDashboard();
      });
    }

    // 14. Varumärkesfärg väljare (Color Dot Picker)
    const colorDots = document.querySelectorAll(".color-dot");
    colorDots.forEach(dot => {
      dot.addEventListener("click", () => {
        const color = dot.getAttribute("data-color");
        if (color) {
          this.applyBrandColor(color);
          this.showToast("Ändrade varumärkesfärg!", "success");
        }
      });
    });

    // 15. Spara företagsinställningar
    const saveBrandingBtn = document.getElementById("save-branding-btn");
    if (saveBrandingBtn) {
      saveBrandingBtn.addEventListener("click", () => this.saveSettingsFromUI());
    }

    // 16. Utskriftsknapp
    const printBtn = document.getElementById("print-schedule-btn");
    if (printBtn) {
      printBtn.addEventListener("click", () => {
        window.print();
      });
    }

    // 17. Exportera Lönerapport & Fortnox PA
    const exportSalaryBtn = document.getElementById("btn-export-salary-csv");
    if (exportSalaryBtn) {
      exportSalaryBtn.addEventListener("click", () => this.exportSalaryReport());
    }

    const exportFortnoxBtn = document.getElementById("btn-export-fortnox-pa");
    if (exportFortnoxBtn) {
      exportFortnoxBtn.addEventListener("click", () => this.exportFortnoxPA());
    }
  }
}

// Starta appen när dokumentet har laddats
window.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();
  window.psApp = app;
});
