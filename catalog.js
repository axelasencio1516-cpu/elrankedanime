import { annualRankings } from "./archive-data.js";
import { db, doc, onSnapshot } from "./firebase.js";

const showMatching = (selector, query, display = "flex") => {
  document.querySelectorAll(selector).forEach((element) => {
    const title = (element.dataset.title || "").toLowerCase();
    element.style.display = element.textContent.toLowerCase().includes(query) || title.includes(query) ? display : "none";
  });
};

export function filterVideos() { showMatching(".video-card", document.getElementById("video-search")?.value.toLowerCase() || ""); }
export function filterTop200() { showMatching("#top200-tbody tr", document.getElementById("top200-search")?.value.toLowerCase() || "", ""); }
export function filterTop30() { showMatching(".top30-card", document.getElementById("top30-search")?.value.toLowerCase() || ""); }
export function filterMuseum() { showMatching(".museum-card", document.getElementById("museum-search")?.value.toLowerCase() || ""); }

function metricValue(text) {
  const normalized = text.trim().replace(/,/g, "").replace(/\s/g, "");
  const number = Number.parseFloat(normalized);
  if (!Number.isFinite(number)) return 0;
  if (normalized.toUpperCase().includes("B")) return number * 1_000_000_000;
  if (normalized.toUpperCase().includes("M")) return number * 1_000_000;
  if (normalized.toUpperCase().includes("K")) return number * 1_000;
  return number;
}

export function sortTop200(columnIndex) {
  const body = document.getElementById("top200-tbody");
  if (!body) return;
  const rows = [...body.querySelectorAll("tr")].filter((row) => row.cells.length > columnIndex);
  const ascending = columnIndex === 0;
  rows.sort((left, right) => {
    const leftValue = metricValue(left.cells[columnIndex].textContent);
    const rightValue = metricValue(right.cells[columnIndex].textContent);
    return ascending ? leftValue - rightValue : rightValue - leftValue;
  });
  rows.forEach((row) => body.append(row));
}

function filterByCategory(container, selector, category) {
  document.querySelectorAll(`${container} ${selector}`).forEach((card) => {
    card.style.display = category === "all" || card.dataset.category === category ? "flex" : "none";
  });
}
export function filterVideoCategory(category) { filterByCategory("#videos", ".video-card", category); }
export function filterMuseumCategory(category) { filterByCategory("#museo", ".museum-card", category); }

const groupCounts = { shonen: 16, romance: 10, spokon: 10, isekai: 6, gundam: 6 };
const categoryLabels = { shonen: "Shonen", romance: "Romance / Seinen", spokon: "Spokon / Comedia", isekai: "Isekai / Fantasía", gundam: "Gundam / Slice of Life" };

function groupName(index) {
  return `Grupo ${String.fromCharCode(65 + index)}`;
}

function renderGroup(index, entries = []) {
  const participants = Array.from({ length: 4 }, (_, participantIndex) => {
    const entry = entries[participantIndex] || {};
    const name = entry.nombre || entry.name || "[Participante por definir]";
    const votes = Number(entry.votos ?? entry.votes ?? 0) || 0;
    return `
    <li class="uefa-standing ${participantIndex < 2 ? "uefa-qualifying" : ""}">
      <span class="uefa-position">${participantIndex + 1}</span>
      <span class="uefa-team">${name}</span>
      <strong>${votes} pts</strong>
    </li>`;
  }).join("");
  return `<article class="uefa-group-card">
    <header><h3>${groupName(index)}</h3><span>4 participantes</span></header>
    <ol class="uefa-standings">${participants}</ol>
    <p class="uefa-group-note">Los votos aparecerán aquí cuando inicie la competencia.</p>
  </article>`;
}

let stopGroupUpdates = null;
function renderCategory(category, groups = {}) {
  const container = document.getElementById("uefa-categorias-container");
  if (!container) return;
  container.innerHTML = `<div class="uefa-stage-heading"><p>FASE CLASIFICATORIA</p><h3>${categoryLabels[category]}</h3><span>${groupCounts[category]} grupos · 4 participantes por grupo</span></div>${Array.from({ length: groupCounts[category] }, (_, index) => renderGroup(index, groups[String.fromCharCode(65 + index)] || groups[index + 1] || [])).join("")}`;
}

export function changeUefaCategory(category) {
  if (!groupCounts[category]) return;
  stopGroupUpdates?.();
  renderCategory(category);
  stopGroupUpdates = onSnapshot(doc(db, "uefaLeague", category), (snapshot) => {
    renderCategory(category, snapshot.exists() ? snapshot.data().grupos || {} : {});
  }, (error) => console.warn("No se pudieron actualizar los grupos en vivo", error));
}
export function showGroupStage() { changeUefaCategory("shonen"); }
export function showFinalStage() {
  const container = document.getElementById("uefa-categorias-container");
  if (!container) return;
  stopGroupUpdates?.();
  stopGroupUpdates = null;
  const rounds = [
    ["16vos de final", 16], ["8vos de final", 8], ["4tos de final", 4], ["Semifinal", 2], ["Tercer puesto", 1], ["Final", 1],
  ];
  const bracket = rounds.map(([name, count]) => `<section class="bracket-round"><header><h3>${name}</h3><span>${count} ${count === 1 ? "partido" : "partidos"}</span></header>${Array.from({ length: count }, (_, index) => `<article class="bracket-match"><p>Partido ${index + 1}</p><div><span>Por definir</span><strong>0</strong></div><div><span>Por definir</span><strong>0</strong></div></article>`).join("")}</section>`).join("");
  const schedule = rounds.flatMap(([name, count]) => Array.from({ length: count }, (_, index) => `<tr><td>${name}</td><td>Partido ${index + 1}</td><td>Por definir <span>vs</span> Por definir</td><td>Próximamente</td></tr>`)).join("");
  container.innerHTML = `<div class="uefa-finals-intro"><p>CUADRO PRINCIPAL</p><h3>Fases finales de la UEFA Ranked League</h3><span>Las llaves se completarán automáticamente con los clasificados de cada grupo.</span></div><div class="tournament-bracket">${bracket}</div><div class="match-table-wrap"><h3>Tabla de enfrentamientos</h3><table class="match-table"><thead><tr><th>Fase</th><th>Encuentro</th><th>Duelo</th><th>Estado</th></tr></thead><tbody>${schedule}</tbody></table></div>`;
}
export function openYearModal(year) {
  document.getElementById("modal-year-title").textContent = `Top Openings del Año ${year}`;
  const entries = annualRankings[year];
  const content = document.getElementById("modal-year-content");
  if (entries?.length) {
    content.innerHTML = `<div class="annual-ranking-list">${entries.map((entry) => `
      <article class="annual-ranking-row">
        <strong>#${entry.puesto}</strong>
        <div><h3>${entry.opening}</h3><p>${entry.anime}</p></div>
        <p class="annual-total">${entry.total}<span>total</span></p>
      </article>`).join("")}</div>`;
  } else {
    content.innerHTML = `<p class="archive-empty">Estamos preparando el ranking oficial de ${year}. Vuelve pronto para descubrir sus openings destacados.</p>`;
  }
  document.getElementById("year-modal").style.display = "flex";
}
export function closeYearModal() { document.getElementById("year-modal").style.display = "none"; }
