// AutoScheduler logik för Schemly

/**
 * Genererar ett optimalt schema baserat på personal, efterfrågan och arbetsregler.
 * @param {Array} employees Lista över anställda.
 * @param {Object} demand Krav på antal personer per roll och dag (0-6).
 * @returns {Array} En array med genererade skiftobjekt.
 */
function runAutoScheduler(employees, demand) {
  const generatedShifts = [];
  const employeeHours = {};
  
  // Nollställ arbetade timmar per anställd för denna vecka
  employees.forEach(emp => {
    employeeHours[emp.id] = 0;
  });

  // Skift-mallar för respektive roller
  const shiftTemplates = {
    "Support": [
      { start: "08:00", end: "16:30", note: "Förmiddagspass" },
      { start: "12:00", end: "20:00", note: "Eftermiddagspass" }
    ],
    "Teamlead": [
      { start: "08:00", end: "17:00", note: "Arbetsledning" }
    ],
    "Admin": [
      { start: "09:00", end: "15:30", note: "Administrativt arbete" }
    ],
    "Logistik": [
      { start: "07:00", end: "16:00", note: "Lager & Logistik" }
    ]
  };

  // Hjälpfunktion för att räkna timmar mellan två tidssträngar (t.ex. "08:00" till "16:30")
  function calculateHours(start, end) {
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    
    let diff = (endH + endM / 60) - (startH + startM / 60);
    if (diff < 0) diff += 24; // Hantera nattpass
    
    // Dra av 30 minuter lunch för pass längre än 5 timmar
    return diff > 5 ? diff - 0.5 : diff;
  }

  let shiftIdCounter = 1;

  // Gå igenom veckans alla dagar (0 = Måndag, ..., 6 = Söndag)
  for (let day = 0; day < 7; day++) {
    // Lista över anställda som redan har tilldelats ett skift denna dag (förhindra dubbelbokning)
    const scheduledToday = new Set();

    // Gå igenom varje roll
    for (const role in demand) {
      const requiredCount = demand[role][day] || 0;
      if (requiredCount === 0) continue;

      // Hitta anställda som kan ta denna roll
      let eligibleEmployees = employees.filter(emp => 
        emp.role.toLowerCase() === role.toLowerCase()
      );

      // Skapa önskat antal skift för dagen
      for (let s = 0; s < requiredCount; s++) {
        // Hitta en passande anställd som inte arbetar idag och har timmar kvar på sitt kontrakt
        // Sortera efter arbetade timmar så att de med minst timmar väljs först (rättvis fördelning)
        eligibleEmployees.sort((a, b) => employeeHours[a.id] - employeeHours[b.id]);

        let assignedEmployee = null;

        for (const emp of eligibleEmployees) {
          if (scheduledToday.has(emp.id)) continue;
          
          // Kolla om nästa skift skulle få dem att gå över kontraktstimmar
          const templates = shiftTemplates[role] || [{ start: "08:00", end: "16:00" }];
          const templateIndex = s % templates.length; // Rotera mellan förmiddag/eftermiddag
          const template = templates[templateIndex];
          const shiftDuration = calculateHours(template.start, template.end);

          if (employeeHours[emp.id] + shiftDuration <= emp.contractHours) {
            assignedEmployee = emp;
            break;
          }
        }

        // Om vi hittade en anställd, tilldela skiftet
        if (assignedEmployee) {
          const templates = shiftTemplates[role];
          const templateIndex = s % templates.length;
          const template = templates[templateIndex];
          const shiftDuration = calculateHours(template.start, template.end);

          generatedShifts.push({
            id: `auto-shift-${shiftIdCounter++}`,
            employeeId: assignedEmployee.id,
            day: day,
            startTime: template.start,
            endTime: template.end,
            role: assignedEmployee.role,
            note: `Auto-planerad: ${template.note}`
          });

          // Uppdatera status
          employeeHours[assignedEmployee.id] += shiftDuration;
          scheduledToday.add(assignedEmployee.id);
        } else {
          // Om ingen anställd var tillgänglig (t.ex. alla har nått sina maxtimmar),
          // skapa ett oplanerat/öppet skift som läggs i poolen
          const templates = shiftTemplates[role] || [{ start: "08:00", end: "16:00", note: "Oplanerad" }];
          const template = templates[0];
          
          generatedShifts.push({
            id: `auto-shift-${shiftIdCounter++}`,
            employeeId: "", // Inget ID = öppet skift
            day: day,
            startTime: template.start,
            endTime: template.end,
            role: role,
            note: `Ej tilldelat: Behöver tillsättas`
          });
        }
      }
    }
  }

  return generatedShifts;
}
