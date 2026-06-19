// Scheduler UI & Drag-and-Drop logik för Schemly

class SchedulerManager {
  constructor(app) {
    this.app = app;
    this.draggedShiftId = null;
    this.setupDragEvents();
  }

  // Räknar arbetade timmar för ett skift (exkluderar ställt lunchavdrag för pass över 5 timmar)
  calculateShiftHours(start, end) {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    
    let diff = (endH + endM / 60) - (startH + startM / 60);
    if (diff < 0) diff += 24; // Hantera nattpass
    
    const lunchMin = parseInt(localStorage.getItem("ps_lunch_deduction") || "30", 10);
    const lunchHours = lunchMin / 60;
    
    return diff > 5 ? Math.max(0, diff - lunchHours) : diff;
  }

  // Hämta totalt antal timmar planerat för en anställd denna vecka
  getEmployeeWeeklyHours(employeeId) {
    const shifts = this.app.state.shifts.filter(s => s.employeeId === employeeId);
    return shifts.reduce((sum, shift) => {
      return sum + this.calculateShiftHours(shift.startTime, shift.endTime);
    }, 0);
  }

  // Kontrollerar om den nuvarande användaren är administratör
  isAdmin() {
    if (!this.app.state.currentUser) return false;
    const role = this.app.state.currentUser.role.toLowerCase();
    return role === "teamlead" || role === "admin";
  }

  // Renderar hela schematabellen
  render() {
    const tableBody = document.getElementById("scheduler-table-body");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    const { employees, shifts } = this.app.state;
    const { roleFilter, searchFilter } = this.app.state.filters;

    // Filtrera anställda baserat på sökning och roll
    const filteredEmployees = employees.filter(emp => {
      const matchesRole = !roleFilter || emp.role.toLowerCase() === roleFilter.toLowerCase();
      const matchesSearch = !searchFilter || emp.name.toLowerCase().includes(searchFilter.toLowerCase());
      return matchesRole && matchesSearch;
    });

    if (filteredEmployees.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
            Inga anställda matchar valda filter.
          </td>
        </tr>
      `;
      this.renderOpenShifts();
      return;
    }

    const isUserAdmin = this.isAdmin();

    filteredEmployees.forEach(emp => {
      const row = document.createElement("tr");
      row.className = "scheduler-row";

      // 1. Employee Cell (Personalinfo)
      const empCell = document.createElement("td");
      const weeklyHours = this.getEmployeeWeeklyHours(emp.id);
      const isOvertime = weeklyHours > emp.contractHours;
      const hoursPercentage = Math.min((weeklyHours / emp.contractHours) * 100, 100);

      const initials = emp.name.split(" ").map(n => n[0]).join("");
      
      const warnings = this.app.checkUnionCompliance(emp.id, shifts);
      const hasWarnings = warnings.length > 0;
      const warningText = warnings.map(w => w.text).join("\n");
      const warningBadge = hasWarnings 
        ? ` <span class="compliance-indicator" style="padding: 1px 6px; background-color: var(--danger-glow); color: var(--danger); border-color: rgba(239, 68, 68, 0.2); font-size: 0.7rem; cursor: help;" title="${warningText}">⚠️ Avvikelse</span>`
        : '';

      empCell.innerHTML = `
        <div class="employee-cell">
          <div class="user-avatar" style="background: linear-gradient(135deg, ${this.getAvatarGradient(emp.role)}); width: 36px; height: 36px; font-size: 0.85rem;">
            ${initials}
          </div>
          <div class="employee-details">
            <span class="employee-name" style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
              ${emp.name}
              ${warningBadge}
            </span>
            <span class="employee-role-badge">${emp.role}</span>
            <div class="employee-hours-bar" title="Planerat: ${weeklyHours.toFixed(1)}h / Avtal: ${emp.contractHours}h">
              <div class="employee-hours-fill ${isOvertime ? 'overtime' : ''}" style="width: ${hoursPercentage}%"></div>
            </div>
            <span class="employee-hours-text ${isOvertime ? 'trend-down' : ''}">
              ${weeklyHours.toFixed(1)} / ${emp.contractHours} t
            </span>
          </div>
        </div>
      `;
      row.appendChild(empCell);

      // 2. Veckodagar Celler (0 = Måndag, 6 = Söndag)
      const dayNamesShort = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];
      for (let day = 0; day < 7; day++) {
        const dayCell = document.createElement("td");
        dayCell.className = "day-cell";
        dayCell.setAttribute("data-employee-id", emp.id);
        dayCell.setAttribute("data-day", day);
        // Etikett som visas i mobilkortets dag-band (via CSS).
        dayCell.setAttribute("data-day-label", dayNamesShort[day]);
        // Helger markeras subtilt i mobilvyn.
        if (day >= 5) dayCell.classList.add("is-weekend");

        const cellContent = document.createElement("div");
        cellContent.className = "day-cell-content";

        const dayShifts = shifts.filter(s => s.employeeId === emp.id && s.day === day);

        dayShifts.forEach(shift => {
          const shiftBox = this.createShiftElement(shift);
          cellContent.appendChild(shiftBox);
        });

        dayCell.appendChild(cellContent);

        // Skapa lägg till-knapp endast för administratörer
        if (isUserAdmin) {
          const addBtn = document.createElement("button");
          addBtn.className = "cell-add-btn";
          addBtn.innerHTML = `<svg><use href="#icon-plus"></use></svg>`;
          addBtn.title = `Planera skift för ${emp.name}`;
          addBtn.addEventListener("click", () => {
            this.app.openShiftModal({ employeeId: emp.id, day: day });
          });
          dayCell.appendChild(addBtn);
        }
        
        row.appendChild(dayCell);
      }

      tableBody.appendChild(row);
    });

    this.renderOpenShifts();
    
    // Slå endast på dropzones om användaren är admin
    if (isUserAdmin) {
      this.setupDropZones();
    }
  }

  // Renderar de oplanerade skiften (poolen längst ned)
  renderOpenShifts() {
    const container = document.getElementById("open-shifts-pool");
    if (!container) return;

    container.innerHTML = "";
    const openShifts = this.app.state.shifts.filter(s => !s.employeeId || s.employeeId === "");

    if (openShifts.length === 0) {
      container.innerHTML = `<div style="padding: 12px; color: var(--text-muted); font-size: 0.85rem; text-align: center; width: 100%;">Inga oplanerade skift.</div>`;
      return;
    }

    openShifts.forEach(shift => {
      const shiftBox = this.createShiftElement(shift);
      container.appendChild(shiftBox);
    });
  }

  // Skapar HTML-elementet för ett skift
  createShiftElement(shift) {
    const shiftBox = document.createElement("div");
    const roleClass = `role-${shift.role.toLowerCase()}`;
    shiftBox.className = `shift-box ${roleClass}`;

    const isUserAdmin = this.isAdmin();
    
    // Endast admin kan dra skift
    if (isUserAdmin) {
      shiftBox.setAttribute("draggable", "true");
    } else {
      shiftBox.setAttribute("draggable", "false");
      shiftBox.style.cursor = "default";
    }
    
    shiftBox.setAttribute("data-shift-id", shift.id);

    const hours = this.calculateShiftHours(shift.startTime, shift.endTime);
    const isMyShift = this.app.state.currentUser && shift.employeeId === this.app.state.currentUser.id;

    // Bygg skiftets HTML
    let htmlContent = `
      <div class="shift-time">
        <span>${shift.startTime} - ${shift.endTime}</span>
        <span class="shift-duration">(${hours.toFixed(1)}h)</span>
      </div>
      <div class="shift-role">${shift.role}</div>
      ${shift.note ? `<div style="font-size: 0.65rem; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${shift.note}">${shift.note}</div>` : ''}
    `;

    // 1. Om användaren är Admin, visa redigera/ta bort knappar
    if (isUserAdmin) {
      htmlContent += `
        <div class="shift-actions">
          <button class="shift-btn edit-shift-trigger" title="Redigera skift">
            <svg><use href="#icon-edit"></use></svg>
          </button>
          <button class="shift-btn delete-shift-trigger" title="Ta bort skift">
            <svg><use href="#icon-trash"></use></svg>
          </button>
        </div>
      `;
    } 
    // 2. Om användaren är Anställd och skiftet är oplanerat (öppet), visa "Ansök"
    else if (this.app.state.currentUser && (!shift.employeeId || shift.employeeId === "")) {
      const pendingApply = this.app.state.swaps.some(r => r.shiftId === shift.id && r.employeeId === this.app.state.currentUser.id && r.status === "pending");
      
      if (pendingApply) {
        htmlContent += `
          <div style="margin-top: 4px;">
            <span class="compliance-indicator" style="background-color: var(--warning-glow); color: var(--warning); border-color: rgba(245, 158, 11, 0.2); font-size: 0.65rem; padding: 1px 4px; width: 100%; justify-content: center;">Sökt pass</span>
          </div>
        `;
      } else {
        htmlContent += `
          <div style="margin-top: 4px;">
            <button class="btn btn-primary apply-open-shift-btn" style="padding: 2px 8px; font-size: 0.7rem; width: 100%; justify-content: center;">Ansök</button>
          </div>
        `;
      }
    }
    // 3. Om användaren är Anställd och det är deras eget skift, markera det
    else if (isMyShift) {
      const pendingSwap = this.app.state.swaps.some(r => r.shiftId === shift.id && r.status === "pending");
      if (pendingSwap) {
        htmlContent += `
          <div style="margin-top: 4px;">
            <span class="compliance-indicator" style="background-color: var(--warning-glow); color: var(--warning); border-color: rgba(245, 158, 11, 0.2); font-size: 0.65rem; padding: 1px 4px; width: 100%; justify-content: center;">Erbjudet för byte</span>
          </div>
        `;
      } else {
        htmlContent += `
          <div style="margin-top: 4px;">
            <span class="compliance-indicator" style="background-color: var(--success-glow); color: var(--success); border-color: rgba(16, 185, 129, 0.2); font-size: 0.65rem; padding: 1px 4px; width: 100%; justify-content: center;">Mitt skift</span>
          </div>
        `;
      }
    }

    shiftBox.innerHTML = htmlContent;

    // Koppla händelser för admin-actions
    if (isUserAdmin) {
      shiftBox.querySelector(".edit-shift-trigger").addEventListener("click", (e) => {
        e.stopPropagation();
        this.app.openShiftModal(shift);
      });

      shiftBox.querySelector(".delete-shift-trigger").addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm(`Är du säker på att du vill ta bort skiftet ${shift.startTime}-${shift.endTime}?`)) {
          this.app.deleteShift(shift.id);
        }
      });

      // Koppla drag-start
      shiftBox.addEventListener("dragstart", (e) => {
        this.draggedShiftId = shift.id;
        e.dataTransfer.setData("text/plain", shift.id);
        shiftBox.style.opacity = "0.4";
      });

      shiftBox.addEventListener("dragend", () => {
        shiftBox.style.opacity = "1";
        this.draggedShiftId = null;
        document.querySelectorAll(".day-cell, .open-shifts-container").forEach(el => {
          el.classList.remove("drag-over");
        });
      });
    } 
    // Koppla händelse för ansök-knapp för anställd
    else if (this.app.state.currentUser && (!shift.employeeId || shift.employeeId === "")) {
      const applyBtn = shiftBox.querySelector(".apply-open-shift-btn");
      if (applyBtn) {
        applyBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.app.createApplyRequest(shift.id);
        });
      }
    }

    return shiftBox;
  }

  // Ställer in drag events
  setupDragEvents() {
    document.addEventListener("dragover", (e) => {
      if (!this.isAdmin()) return; // Blockera om inte admin
      
      const dropzone = e.target.closest(".day-cell, .open-shifts-container");
      if (dropzone) {
        e.preventDefault();
      }
    });
  }

  setupDropZones() {
    const cells = document.querySelectorAll(".day-cell");
    cells.forEach(cell => {
      cell.addEventListener("dragenter", (e) => {
        e.preventDefault();
        cell.classList.add("drag-over");
      });

      cell.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      cell.addEventListener("dragleave", () => {
        cell.classList.remove("drag-over");
      });

      cell.addEventListener("drop", (e) => {
        e.preventDefault();
        cell.classList.remove("drag-over");

        const shiftId = e.dataTransfer.getData("text/plain") || this.draggedShiftId;
        if (!shiftId) return;

        const targetEmployeeId = cell.getAttribute("data-employee-id");
        const targetDay = parseInt(cell.getAttribute("data-day"), 10);

        this.moveShift(shiftId, targetEmployeeId, targetDay);
      });
    });

    const pool = document.getElementById("open-shifts-pool");
    if (pool) {
      pool.addEventListener("dragenter", (e) => {
        e.preventDefault();
        pool.classList.add("drag-over");
      });

      pool.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      pool.addEventListener("dragleave", () => {
        pool.classList.remove("drag-over");
      });

      pool.addEventListener("drop", (e) => {
        e.preventDefault();
        pool.classList.remove("drag-over");

        const shiftId = e.dataTransfer.getData("text/plain") || this.draggedShiftId;
        if (!shiftId) return;

        this.moveShift(shiftId, "", null);
      });
    }
  }

  moveShift(shiftId, employeeId, day) {
    const shiftIndex = this.app.state.shifts.findIndex(s => s.id === shiftId);
    if (shiftIndex === -1) return;

    const shift = this.app.state.shifts[shiftIndex];
    const oldEmpId = shift.employeeId;
    const oldDay = shift.day;

    if (oldEmpId === employeeId && oldDay === day) return;

    shift.employeeId = employeeId;
    if (day !== null) {
      shift.day = day;
    }

    let destName = "oplanerade poolen";
    if (employeeId) {
      const emp = this.app.state.employees.find(e => e.id === employeeId);
      const daysSwedish = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];
      destName = `${emp.name} (${daysSwedish[day]})`;
    }

    this.app.saveState();
    this.render();
    this.app.updateKPIs();
    this.app.renderAnalytics();
    this.app.renderRequestsQueue();

    this.app.showToast(`Flyttade skiftet till ${destName}`, "success");
  }

  getAvatarGradient(role) {
    switch (role.toLowerCase()) {
      case 'teamlead':
        return '#8b5cf6, #c084fc';
      case 'admin':
        return '#f59e0b, #fcd34d';
      case 'logistik':
        return '#10b981, #34d399';
      case 'support':
      default:
        return '#6366f1, #818cf8';
    }
  }
}
