"use strict";
/* ==========================================================
   Agenda+ — lógica (JavaScript puro, estado em memória)
   Seções: 1) Ícones  2) Config e dados  3) Regras  4) Renderização
           5) Formulário e modais  6) Eventos e inicialização
   ========================================================== */

/* 1) ÍCONES — SVGs inline (estilo Lucide), sem dependências externas */
const ICONS = {
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  chart: '<path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  xcircle: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4M12 17h.01"/>',
};
const icon = (name, size = 18) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;

/* 2) CONFIG E DADOS */
// Data de "hoje" fixa na semana do teste (troque por new Date() em produção).
const TODAY = new Date(2026, 9, 2);
// Movimento: respeita a preferência do sistema por menos animação
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
// Controle das animações da renderização atual (entrada em cascata, card recém-salvo)
const fx = { enter: false, step: 1, i: 0, saved: null };
const HOURS = Array.from({ length: 11 }, (_, i) => `${String(8 + i).padStart(2, "0")}:00`);
const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const SERVICES = ["Consulta de rotina", "Avaliação inicial", "Avaliação", "Limpeza", "Consulta de urgência", "Retorno"];
const STATUSES = ["Confirmado", "Pendente", "Cancelado"];
const AGENDAS = ["Dra. Helena", "Dr. Marcos"];
const STATUS_ICON = { Confirmado: "check", Pendente: "clock", Cancelado: "xcircle" };
const FILTERS = [["all", "Todos"], ["Confirmado", "Confirmados"], ["Pendente", "Pendentes"], ["Cancelado", "Cancelados"], ["conflito", "Conflitos"]];

// Dados iniciais inseridos via JS (conforme o enunciado)
const SEED = [
  ["Maria Eduarda Santos", "Consulta de rotina", "Confirmado", "2026-09-28", "09:00", 0],
  ["João Pedro Lima", "Avaliação inicial", "Confirmado", "2026-09-29", "10:00", 1],
  ["Ana Beatriz Costa", "Limpeza", "Pendente", "2026-09-30", "11:00", 0], // conflito
  ["Rafael Souza", "Consulta de urgência", "Pendente", "2026-09-30", "11:00", 0], // conflito
  ["Camila Ferreira", "Retorno", "Confirmado", "2026-10-01", "14:00", 1],
  ["Lucas Almeida", "Avaliação", "Cancelado", "2026-10-02", "16:00", 0],
];
const state = {
  appts: SEED.map(([name, service, status, date, time, ag], i) => ({ id: i + 1, name, service, status, date, time, agenda: AGENDAS[ag] })),
  nextId: SEED.length + 1,
  weekStart: new Date(2026, 8, 28),
  filter: "all", query: "", agenda: "all", editingId: null,
};

/* 3) REGRAS */
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));
const weekDays = () => Array.from({ length: 7 }, (_, i) => addDays(state.weekStart, i));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtSlot = (date, time) => { const d = fromIso(date); return `${DAYS[(d.getDay() + 6) % 7]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)} às ${time}`; };

// Agendamentos ativos (não cancelados) em um horário; cancelados não ocupam a vaga
const activeIn = (date, time, ignoreId) =>
  state.appts.filter((a) => a.date === date && a.time === time && a.status !== "Cancelado" && a.id !== ignoreId);
const isConflict = (a) => a.status !== "Cancelado" && activeIn(a.date, a.time).length > 1;
const inAgenda = (a) => state.agenda === "all" || a.agenda === state.agenda;
const matches = (a) => {
  const q = state.query.trim().toLowerCase();
  if (q && !(a.name.toLowerCase().includes(q) || a.service.toLowerCase().includes(q))) return false;
  if (state.filter === "all") return true;
  if (state.filter === "conflito") return isConflict(a);
  return a.status === state.filter;
};

/* 4) RENDERIZAÇÃO */
function render(anim = "none") {
  fx.enter = ["load", "week-next", "week-prev", "filter"].includes(anim);
  fx.step = anim === "filter" ? 0 : 1; // filtro: entrada rápida, sem cascata
  fx.i = 0;
  const days = weekDays(), first = days[0], last = days[6];
  const weekIsos = days.map(iso);
  const week = state.appts.filter((a) => weekIsos.includes(a.date) && inAgenda(a));
  const conflictSlots = new Set(week.filter(isConflict).map((a) => a.date + a.time)).size;

  $("range-label").textContent = `${first.getDate()} ${MONTHS[first.getMonth()]} a ${last.getDate()} ${MONTHS[last.getMonth()]} ${last.getFullYear()}`;
  const h = new Date().getHours();
  $("greeting").textContent = `${h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"}, Dra. Helena`;

  // Dashboard de resumo (indicadores em tempo real)
  const stats = [
    ["", "grid", week.length, "Total de agendamentos"],
    ["stat-ok", "check", week.filter((a) => a.status === "Confirmado").length, "Confirmados"],
    ["stat-pend", "clock", week.filter((a) => a.status === "Pendente").length, "Pendentes"],
    ["stat-conf", "alert", conflictSlots, "Conflitos ativos"],
  ];
  updateStats(stats);

  updateChips();

  $("side-alert").innerHTML = conflictSlots
    ? `<p>${icon("alert")}${conflictSlots} conflito${conflictSlots > 1 ? "s" : ""} para resolver</p><button data-act="conflicts">Ver agora</button>`
    : `<p>${icon("check")}Agenda sem conflitos</p>`;

  renderGrid(days, anim);
  $("empty").hidden = week.some(matches);
  fx.saved = null;
}

// Dashboard: os cards são criados uma vez e só os números mudam (contagem animada)
function updateStats(list) {
  const box = $("stats");
  if (!box.children.length) {
    box.innerHTML = list.map(([c, i, , l], k) =>
      `<div class="stat ${c} rise" style="--i:${k}"><div><strong data-v="0">0</strong><span>${l}</span></div><span class="stat-icon">${icon(i, 20)}</span></div>`).join("");
  }
  list.forEach(([, , v], k) => {
    const el = box.children[k], n = el.querySelector("strong"), from = Number(n.dataset.v);
    n.dataset.v = v;
    if (reduce.matches || from === v) { n.textContent = v; return; }
    const id = (n._id = (n._id || 0) + 1); // cancela contagem anterior ainda em curso
    const t0 = performance.now(), delay = box.dataset.ready ? 0 : 250 + k * 70, dur = 650;
    const tick = (t) => {
      if (n._id !== id) return;
      const p = Math.min(Math.max((t - t0 - delay) / dur, 0), 1);
      n.textContent = Math.round(from + (v - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    if (box.dataset.ready) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  });
  box.dataset.ready = "1";
}

// Filtros: criados uma vez, só o aria-pressed muda (permite a transição de cor)
function updateChips() {
  const box = $("chips");
  if (!box.children.length) {
    box.innerHTML = FILTERS.map(([k, l]) => `<button class="chip" data-filter="${k}">${k === "conflito" ? icon("alert", 14) : ""}${l}</button>`).join("");
  }
  box.querySelectorAll("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.filter === state.filter));
}

function renderGrid(days, anim = "none") {
  const todayIso = iso(TODAY);
  const head = days.map((d) => `<th scope="col" class="${iso(d) === todayIso ? "is-today" : ""}">${DAYS[(d.getDay() + 6) % 7]}<span class="num">${d.getDate()}</span></th>`).join("");
  const rows = HOURS.map((t) => {
    const cells = days.map((d) => {
      const date = iso(d);
      const all = state.appts.filter((a) => a.date === date && a.time === t);
      const scoped = all.filter(inAgenda);
      const shown = scoped.filter(matches);
      const conflict = all.filter((a) => a.status !== "Cancelado").length > 1;
      const cls = [date === todayIso ? "is-today" : "", conflict && shown.length ? "is-conflict" : ""].join(" ");
      let body = "";
      if (!scoped.length) {
        body = `<button class="slot-add" data-date="${date}" data-time="${t}" aria-label="Novo agendamento: ${fmtSlot(date, t)}">${icon("plus", 20)}</button>`;
      } else if (shown.length) {
        body = `<div class="stack">${conflict ? `<div class="flag${fx.enter ? " enter" : ""}">${icon("alert", 14)}Conflito de Horário</div>` : ""}${shown.map((a) => card(a, conflict && a.status !== "Cancelado")).join("")}</div>`;
      }
      return `<td class="${cls}">${body}</td>`;
    }).join("");
    return `<tr><th scope="row" class="hour">${t}</th>${cells}</tr>`;
  }).join("");
  $("grid").innerHTML = `<thead><tr><th style="width:64px"></th>${head}</tr></thead><tbody>${rows}</tbody>`;
  if (anim.startsWith("week")) { // a semana desliza na direção da navegação
    const g = $("grid");
    g.classList.remove("slide-prev", "slide-next"); void g.offsetWidth;
    g.classList.add(anim === "week-prev" ? "slide-prev" : "slide-next");
  }
}

const card = (a, conflict) =>
  `<button class="appt appt-${a.status.toLowerCase()}${conflict ? " in-conflict" : ""}${fx.enter ? " enter" : ""}${a.id === fx.saved ? " just-saved" : ""}" style="--i:${fx.enter ? Math.min(fx.i++ * fx.step, 12) : 0}" data-id="${a.id}" aria-label="Editar: ${esc(a.name)}, ${esc(a.service)}, ${a.status}">` +
  `<b>${esc(a.name)}</b><span>${esc(a.service)}</span><span class="tag">${icon(STATUS_ICON[a.status], 12)}${a.status}</span></button>`;

function toast(msg) {
  const t = $("toast");
  t.classList.remove("out");
  t.innerHTML = icon("check") + `<span>${esc(msg)}</span><i class="toast-bar"></i>`;
  t.hidden = false;
  t.style.animation = "none"; void t.offsetWidth; t.style.animation = ""; // reinicia a entrada
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    t.classList.add("out");
    setTimeout(() => (t.hidden = true), reduce.matches ? 0 : 220);
  }, 4000);
}

/* 5) FORMULÁRIO E MODAIS (usam o <dialog> nativo) */
const dlgForm = $("dlg-form"), dlgConfirm = $("dlg-confirm"), f = $("form").elements;
const fillSelect = (el, items) => (el.innerHTML = items.map((v) => `<option>${esc(v)}</option>`).join(""));

// Fecha o <dialog> com animação de saída (sem animação se o usuário prefere menos movimento)
function closeDlg(dlg) {
  if (!dlg.open) return;
  if (reduce.matches) return dlg.close();
  dlg.classList.add("closing");
  setTimeout(() => { dlg.classList.remove("closing"); dlg.close(); }, 180);
}

function openForm(a) {
  state.editingId = a.id ?? null;
  $("form-title").textContent = a.id ? "Editar agendamento" : "Novo agendamento";
  $("btn-delete").hidden = !a.id;
  f.name.value = a.name ?? "";
  f.date.value = a.date ?? iso(state.weekStart);
  f.time.value = a.time ?? "09:00";
  f.service.value = a.service ?? SERVICES[0];
  f.status.value = a.status ?? "Pendente";
  f.agenda.value = a.agenda ?? (state.agenda === "all" ? AGENDAS[0] : state.agenda);
  clearErrors();
  dlgForm.showModal();
}
function clearErrors() {
  ["name", "date"].forEach((k) => { $("err-" + k).textContent = ""; f[k].removeAttribute("aria-invalid"); });
}
function validate(d) {
  clearErrors();
  const errs = { name: !d.name && "Informe o nome do cliente.", date: !d.date && "Escolha o dia do agendamento." };
  Object.entries(errs).forEach(([k, msg]) => { if (msg) { $("err-" + k).textContent = msg; f[k].setAttribute("aria-invalid", "true"); } });
  const bad = Object.keys(errs).find((k) => errs[k]);
  if (bad) f[bad].focus();
  return !bad;
}

// Pergunta de confirmação reutilizável: devolve uma Promise<boolean>
function askConfirm({ ic, title, html, yes, no, yesClass }) {
  return new Promise((resolve) => {
    $("confirm-icon").innerHTML = icon(ic, 24);
    $("confirm-title").textContent = title;
    $("confirm-text").innerHTML = html;
    $("confirm-no").textContent = no;
    $("confirm-yes").textContent = yes;
    $("confirm-yes").className = "btn " + yesClass;
    dlgConfirm.returnValue = "";
    const done = (ok) => { dlgConfirm.returnValue = ok ? "ok" : ""; closeDlg(dlgConfirm); };
    $("confirm-yes").onclick = () => done(true);
    $("confirm-no").onclick = () => done(false);
    dlgConfirm.addEventListener("close", () => resolve(dlgConfirm.returnValue === "ok"), { once: true });
    dlgConfirm.showModal();
  });
}

function save(d) {
  let saved;
  if (state.editingId) { saved = state.appts.find((a) => a.id === state.editingId); Object.assign(saved, d); }
  else { saved = { id: state.nextId++, ...d }; state.appts.push(saved); }
  const newWeek = mondayOf(fromIso(d.date));
  const dir = newWeek > state.weekStart ? "week-next" : "week-prev";
  const weekChanged = iso(newWeek) !== iso(state.weekStart);
  state.weekStart = newWeek; // vai para a semana do agendamento
  fx.saved = saved.id;
  if (!inAgenda(saved) || !matches(saved)) { // garante que o card apareça imediatamente
    Object.assign(state, { filter: "all", query: "", agenda: "all" });
    $("search").value = ""; $("agenda-select").value = "all";
  }
  closeDlg(dlgForm);
  render(weekChanged ? dir : "none");
  toast(state.editingId ? "Agendamento atualizado" : `${d.name} agendado(a) com sucesso`);
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const d = { name: f.name.value.trim(), date: f.date.value, time: f.time.value, service: f.service.value, status: f.status.value, agenda: f.agenda.value };
  if (!validate(d)) return;

  // PONTO CHAVE: detecção de conflito ao salvar
  const old = state.appts.find((a) => a.id === state.editingId);
  const others = d.status === "Cancelado" ? [] : activeIn(d.date, d.time, state.editingId);
  const slotChanged = !old || old.date !== d.date || old.time !== d.time || old.status === "Cancelado";
  if (others.length && slotChanged) {
    const list = others.map((a) => `<li><b>${esc(a.name)}</b> — ${esc(a.service)} (${a.status})</li>`).join("");
    const ok = await askConfirm({
      ic: "alert", title: "Conflito de horário",
      html: `<p>Já existe agendamento em <b>${fmtSlot(d.date, d.time)}</b>:</p><ul>${list}</ul><p style="margin-top:10px">Deseja agendar mesmo assim?</p>`,
      yes: "Agendar mesmo assim", no: "Voltar", yesClass: "btn-primary",
    });
    if (!ok) return; // volta ao formulário, que continua aberto com os dados
  }
  save(d);
});

$("btn-delete").addEventListener("click", async () => {
  const a = state.appts.find((x) => x.id === state.editingId);
  if (!a) return;
  const ok = await askConfirm({
    ic: "trash", title: "Excluir agendamento?",
    html: `<p><b>${esc(a.name)}</b> — ${esc(a.service)}, ${fmtSlot(a.date, a.time)}. Esta ação não pode ser desfeita.</p>`,
    yes: "Excluir", no: "Manter", yesClass: "btn-danger-solid",
  });
  if (!ok) return;
  closeDlg(dlgForm);
  const el = document.querySelector(`.appt[data-id="${a.id}"]`);
  if (el && !reduce.matches) { el.classList.add("leaving"); await new Promise((r) => setTimeout(r, 240)); }
  state.appts = state.appts.filter((x) => x.id !== a.id);
  render();
  toast("Agendamento excluído");
});

/* 6) EVENTOS E INICIALIZAÇÃO */
document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => closeDlg(dlgForm)));
// Esc também fecha com animação
[dlgForm, dlgConfirm].forEach((d) => d.addEventListener("cancel", (e) => { e.preventDefault(); closeDlg(d); }));

// Delegação de eventos na grade: clicar em card edita; clicar em horário vazio cria
$("grid").addEventListener("click", (e) => {
  const c = e.target.closest(".appt"), add = e.target.closest(".slot-add");
  if (c) openForm(state.appts.find((a) => a.id === Number(c.dataset.id)));
  else if (add) openForm({ date: add.dataset.date, time: add.dataset.time });
});
$("chips").addEventListener("click", (e) => {
  const b = e.target.closest("[data-filter]");
  if (b) { state.filter = b.dataset.filter; render("filter"); }
});
$("side-alert").addEventListener("click", (e) => {
  if (e.target.closest("[data-act='conflicts']")) { state.filter = "conflito"; render("filter"); }
});
$("btn-today").addEventListener("click", () => {
  const to = mondayOf(TODAY), dir = to > state.weekStart ? "week-next" : "week-prev";
  const same = iso(to) === iso(state.weekStart);
  state.weekStart = to;
  render(same ? "none" : dir);
});
$("btn-prev").addEventListener("click", () => { state.weekStart = addDays(state.weekStart, -7); render("week-prev"); });
$("btn-next").addEventListener("click", () => { state.weekStart = addDays(state.weekStart, 7); render("week-next"); });
$("btn-new").addEventListener("click", () => openForm({}));
$("search").addEventListener("input", (e) => { state.query = e.target.value; render(); });
$("agenda-select").addEventListener("change", (e) => { state.agenda = e.target.value; render("filter"); });
$("btn-clear").addEventListener("click", () => {
  Object.assign(state, { filter: "all", query: "" });
  $("search").value = "";
  render("filter");
});

function setTheme(t, animate) {
  const dark = t === "dark";
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem("agenda-theme", t); } catch (e) {}
  $("theme-toggle").setAttribute("aria-checked", dark);
  $("theme-toggle").querySelector(".knob").innerHTML = icon(dark ? "moon" : "sun");
  $("theme-label").textContent = dark ? "Modo noturno" : "Modo claro";
  if (animate && !reduce.matches) {
    const knob = $("theme-toggle").querySelector(".knob");
    document.documentElement.classList.add("theme-anim");
    knob.classList.add("spin");
    setTimeout(() => { document.documentElement.classList.remove("theme-anim"); knob.classList.remove("spin"); }, 600);
  }
}
$("theme-toggle").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true));

// Início
document.querySelectorAll("[data-icon]").forEach((el) => { el.outerHTML = icon(el.dataset.icon); });
fillSelect(f.time, HOURS);
fillSelect(f.service, SERVICES);
fillSelect(f.status, STATUSES);
fillSelect(f.agenda, AGENDAS);
$("agenda-select").innerHTML = `<option value="all">Todas as agendas</option>` + AGENDAS.map((a) => `<option>${a}</option>`).join("");
setTheme(document.documentElement.dataset.theme);
render("load");
