import { initAuth, openAuthModal, closeAuthModal, register, login, loginWithGoogle, logout } from "./auth.js";
import { initProfile, openProfileModal, closeProfileModal } from "./profile.js";
import { claimDailyReward, buyMultiplier, buyBadge, redeemPrize } from "./rewards.js";
import { vote, loadMatch } from "./votes.js";
import {
  filterVideos, filterTop200, filterTop30, filterMuseum, filterVideoCategory, filterMuseumCategory, sortTop200,
  changeUefaCategory, showGroupStage, showFinalStage, openYearModal, closeYearModal,
} from "./catalog.js";

Object.assign(window, {
  abrirModalAuth: openAuthModal, cerrarModalAuth: closeAuthModal,
  ejecutarRegistroModal: register, ejecutarLoginModal: login, ejecutarGoogleModal: loginWithGoogle,
  cerrarSesionModal: logout, abrirModalPerfil: openProfileModal, cerrarModalPerfil: closeProfileModal,
  reclamarSuerteDiaria: claimDailyReward, comprarItem: buyMultiplier, comprarInsignia: buyBadge,
  canjearPremio: redeemPrize, votar: vote, filterVideos, filterTop200, filterTop30, filterMuseum, sortTop200,
  filterCategory: filterVideoCategory, filterMuseumCat: filterMuseumCategory, cambiarCategoria: changeUefaCategory,
  mostrarFaseGrupos: showGroupStage, mostrarFasesFinales: showFinalStage, openYearModal, closeYearModal,
  canjearCodigo: () => alert("Los códigos se administrarán desde el servidor antes de activarse."),
  canjearCodigoComunidad: () => alert("Los códigos se administrarán desde el servidor antes de activarse."),
});

document.addEventListener("DOMContentLoaded", () => {
  if (!window.location.hash) {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.requestAnimationFrame(() => window.scrollTo(0, 0));
    window.addEventListener("load", () => window.scrollTo(0, 0), { once: true });
  }
  document.getElementById("mobile-menu")?.addEventListener("click", () => document.getElementById("nav-menu")?.classList.toggle("active"));
  initProfile();
  initAuth();
  loadMatch();
  changeUefaCategory("shonen");
});
