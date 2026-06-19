// MockData för Schemly (Svensk bemanningsplanering) — standarddemo (Kundtjänst)

const DEFAULT_EMPLOYEES = [
  {
    id: "emp-1",
    name: "Elsa Bergström",
    role: "Support", // 'support', 'admin', 'teamlead', 'logistik'
    email: "elsa.b@schemly.se",
    password: "password",
    wage: 165, // SEK / timme
    contractHours: 40, // max timmar per vecka
    color: "role-support",
    skills: ["Svenska", "Engelska", "Support L2", "Telefon"]
  },
  {
    id: "emp-2",
    name: "Lukas Lindqvist",
    role: "Support",
    email: "lukas.l@schemly.se",
    password: "password",
    wage: 160,
    contractHours: 35,
    color: "role-support",
    skills: ["Svenska", "Engelska", "Support L1", "Chatt"]
  },
  {
    id: "emp-3",
    name: "Johan Karlsson",
    role: "Teamlead",
    email: "johan.k@schemly.se",
    password: "password",
    wage: 210,
    contractHours: 40,
    color: "role-teamlead",
    skills: ["Svenska", "Engelska", "Ledarskap", "Eskalering"]
  },
  {
    id: "emp-4",
    name: "Karin Nilsson",
    role: "Admin",
    email: "karin.n@schemly.se",
    password: "password",
    wage: 185,
    contractHours: 30,
    color: "role-admin",
    skills: ["Svenska", "Bokföring", "Systemadmin", "Excel"]
  },
  {
    id: "emp-5",
    name: "Anders Ek",
    role: "Logistik",
    email: "anders.e@schemly.se",
    password: "password",
    wage: 170,
    contractHours: 40,
    color: "role-logistik",
    skills: ["Svenska", "Engelska", "Lager", "Truckkort"]
  }
];

const DEFAULT_SHIFTS = [
  // Måndag (Dag index 0)
  {
    id: "shift-1",
    employeeId: "emp-1",
    day: 0,
    startTime: "08:00",
    endTime: "16:30",
    role: "Support",
    note: "Ordinarie telefonsupport"
  },
  {
    id: "shift-2",
    employeeId: "emp-3",
    day: 0,
    startTime: "08:00",
    endTime: "17:00",
    role: "Teamlead",
    note: "Arbetsledning & Möten"
  },
  {
    id: "shift-3",
    employeeId: "emp-4",
    day: 0,
    startTime: "09:00",
    endTime: "15:00",
    role: "Admin",
    note: "Fakturering & Löner"
  },

  // Tisdag (Dag index 1)
  {
    id: "shift-4",
    employeeId: "emp-1",
    day: 1,
    startTime: "08:00",
    endTime: "16:30",
    role: "Support",
    note: "Telefon & Mail"
  },
  {
    id: "shift-5",
    employeeId: "emp-2",
    day: 1,
    startTime: "12:00",
    endTime: "20:00",
    role: "Support",
    note: "Kvällspass chatt"
  },
  {
    id: "shift-6",
    employeeId: "emp-3",
    day: 1,
    startTime: "08:30",
    endTime: "17:00",
    role: "Teamlead",
    note: "Coachning och SLA-uppföljning"
  },

  // Onsdag (Dag index 2)
  {
    id: "shift-7",
    employeeId: "emp-2",
    day: 2,
    startTime: "08:00",
    endTime: "16:30",
    role: "Support",
    note: "Chattsupport"
  },
  {
    id: "shift-8",
    employeeId: "emp-4",
    day: 2,
    startTime: "09:00",
    endTime: "15:30",
    role: "Admin",
    note: "Systemunderhåll"
  },
  {
    id: "shift-9",
    employeeId: "emp-5",
    day: 2,
    startTime: "07:00",
    endTime: "16:00",
    role: "Logistik",
    note: "Varuinkast och lagerhantering"
  },

  // Torsdag (Dag index 3)
  {
    id: "shift-10",
    employeeId: "emp-1",
    day: 3,
    startTime: "08:00",
    endTime: "16:30",
    role: "Support",
    note: "Telefon & Ärendehantering"
  },
  {
    id: "shift-11",
    employeeId: "emp-2",
    day: 3,
    startTime: "08:00",
    endTime: "16:30",
    role: "Support",
    note: "Chattsupport"
  },
  {
    id: "shift-12",
    employeeId: "emp-3",
    day: 3,
    startTime: "08:00",
    endTime: "17:00",
    role: "Teamlead",
    note: "Arbetsledning"
  },
  {
    id: "shift-13",
    employeeId: "emp-5",
    day: 3,
    startTime: "07:00",
    endTime: "16:00",
    role: "Logistik",
    note: "Inventering"
  },

  // Fredag (Dag index 4)
  {
    id: "shift-14",
    employeeId: "emp-1",
    day: 4,
    startTime: "08:00",
    endTime: "16:00",
    role: "Support",
    note: "Halvdag support"
  },
  {
    id: "shift-15",
    employeeId: "emp-2",
    day: 4,
    startTime: "12:00",
    endTime: "20:00",
    role: "Support",
    note: "Kvällspass"
  },
  {
    id: "shift-16",
    employeeId: "emp-3",
    day: 4,
    startTime: "08:00",
    endTime: "16:30",
    role: "Teamlead",
    note: "Rapportering & avstämning"
  },
  {
    id: "shift-17",
    employeeId: "emp-5",
    day: 4,
    startTime: "07:00",
    endTime: "15:30",
    role: "Logistik",
    note: "Utleveranser"
  },

  // Oplanerade skift (lediga för ansökan)
  {
    id: "shift-open-1",
    employeeId: "",
    day: 5, // Lördag
    startTime: "09:00",
    endTime: "17:00",
    role: "Support",
    note: "Helgsupport pass 1"
  },
  {
    id: "shift-open-2",
    employeeId: "",
    day: 6, // Söndag
    startTime: "10:00",
    endTime: "18:00",
    role: "Support",
    note: "Helgsupport pass 2"
  }
];

// Målvärden för täckningsanalys (demand) - hur många som behövs per roll och dag
// [Mån, Tis, Ons, Tor, Fre, Lör, Sön]
const DEFAULT_DEMAND = {
  "Support": [2, 2, 2, 2, 2, 0, 0],
  "Admin": [1, 0, 1, 0, 0, 0, 0],
  "Teamlead": [1, 1, 0, 1, 1, 0, 0],
  "Logistik": [0, 0, 1, 1, 1, 0, 0]
};

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: "ann-1",
    title: "Midsommar Planering",
    desc: "Glöm inte att lägga in era önskemål om ledighet inför midsommarveckan innan fredag.",
    date: "2026-06-17",
    author: "Johan Karlsson"
  },
  {
    id: "ann-2",
    title: "Nytt lönesystem",
    desc: "Från och med nästa månad exporterar vi tidrapporter direkt till vårt nya system Fortnox. Se till att alla tider stämmer i Schemly.",
    date: "2026-06-15",
    author: "Karin Nilsson"
  }
];

// Standardförfrågningar för demo (Skiftbyten/ansökningar)
const DEFAULT_SWAPS = [
  {
    id: "swap-demo-1",
    type: "apply", // 'swap' = erbjud byte / drop, 'apply' = ansök om öppet skift
    shiftId: "shift-open-1", // Helgpasset på lördag
    employeeId: "emp-2", // Lukas Lindqvist ansöker
    status: "pending",
    date: "2026-06-17"
  }
];

// Helper to initialize local storage
function initLocalStorage() {
  if (!localStorage.getItem("ps_employees")) {
    localStorage.setItem("ps_employees", JSON.stringify(DEFAULT_EMPLOYEES));
  }
  if (!localStorage.getItem("ps_shifts")) {
    localStorage.setItem("ps_shifts", JSON.stringify(DEFAULT_SHIFTS));
  }
  if (!localStorage.getItem("ps_demand")) {
    localStorage.setItem("ps_demand", JSON.stringify(DEFAULT_DEMAND));
  }
  if (!localStorage.getItem("ps_announcements")) {
    localStorage.setItem("ps_announcements", JSON.stringify(DEFAULT_ANNOUNCEMENTS));
  }
  if (!localStorage.getItem("ps_swaps")) {
    localStorage.setItem("ps_swaps", JSON.stringify(DEFAULT_SWAPS));
  }
  if (!localStorage.getItem("ps_week_number")) {
    localStorage.setItem("ps_week_number", "25");
  }
}
