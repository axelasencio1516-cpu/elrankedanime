import { db, doc, getDoc, setDoc, updateDoc } from "./firebase.js";
import { defaultProfile, getCurrentUser, getProfile, getVoteMultiplier, setProfile } from "./state.js";

function renderProfile() {
  const profile = getProfile();
  const points = document.getElementById("user-points");
  const streak = document.getElementById("user-streak-badge-display");
  const multiplier = document.getElementById("user-multiplier");
  const modalPoints = document.getElementById("modal-profile-puntos");
  const email = document.getElementById("modal-profile-email");
  const name = document.getElementById("modal-input-nombre");
  const avatar = document.getElementById("modal-avatar-preview");

  if (points) points.textContent = profile.puntos;
  if (streak) streak.textContent = `🔥 Racha: ${profile.racha} Días`;
  if (multiplier) {
    const voteMultiplier = getVoteMultiplier();
    multiplier.textContent = `X${voteMultiplier}${profile.esPatreon ? " (Patreon)" : voteMultiplier === 1 ? " (Normal)" : " (Activo)"}`;
  }
  if (modalPoints) modalPoints.textContent = profile.puntos;
  if (email) email.textContent = getCurrentUser()?.email || "";
  if (name) name.value = profile.nombrePublico || "";
  if (avatar && profile.fotoPerfil) avatar.src = profile.fotoPerfil;
}

export async function loadProfile(user) {
  const reference = doc(db, "usuarios", user.uid);
  const snapshot = await getDoc(reference);
  if (snapshot.exists()) {
    setProfile(snapshot.data());
  } else {
    await setDoc(reference, { ...defaultProfile, email: user.email || "" });
    setProfile(defaultProfile);
  }
  renderProfile();
}

export async function saveProfile(changes) {
  const user = getCurrentUser();
  if (!user) throw new Error("No hay una sesión activa.");
  const next = { ...getProfile(), ...changes };
  await updateDoc(doc(db, "usuarios", user.uid), changes);
  setProfile(next);
  renderProfile();
}

export function openProfileModal() {
  if (!getCurrentUser()) {
    window.abrirModalAuth();
    return;
  }
  renderProfile();
  document.getElementById("perfil-modal")?.style.setProperty("display", "flex");
}

export function closeProfileModal() {
  document.getElementById("perfil-modal")?.style.setProperty("display", "none");
}

export function initProfile() {
  let pendingAvatar = "";
  document.getElementById("modal-input-archivo-avatar")?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      pendingAvatar = reader.result;
      const image = document.getElementById("modal-avatar-preview");
      if (image) image.src = pendingAvatar;
    });
    reader.readAsDataURL(file);
  });
  document.getElementById("btn-cerrar-perfil")?.addEventListener("click", closeProfileModal);
  document.getElementById("btn-guardar-perfil")?.addEventListener("click", async () => {
    const publicName = document.getElementById("modal-input-nombre")?.value.trim() || "";
    const profile = getProfile();
    if (publicName !== profile.nombrePublico && profile.nombrePublico && profile.puntos < 50) {
      alert("No tienes suficientes puntos para cambiar tu nombre (costo: 50 puntos).");
      return;
    }
    const changes = { nombrePublico: publicName };
    if (publicName !== profile.nombrePublico && profile.nombrePublico) changes.puntos = profile.puntos - 50;
    if (pendingAvatar) changes.fotoPerfil = pendingAvatar;
    try {
      await saveProfile(changes);
      pendingAvatar = "";
      closeProfileModal();
      alert("Perfil guardado con éxito.");
    } catch (error) {
      console.error(error);
      alert(`No se pudo guardar el perfil: ${error.message}`);
    }
  });
  renderProfile();
}

export { renderProfile };
