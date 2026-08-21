export const defaultProfile = Object.freeze({
  puntos: 150,
  racha: 0,
  ultimaRacha: "",
  multiplicador: 1,
  inventario: [],
  nombrePublico: "",
  fotoPerfil: "",
  esPatreon: false,
  patreonTier: "",
});

let currentUser = null;
let profile = { ...defaultProfile };

export function setCurrentUser(user) { currentUser = user; }
export function getCurrentUser() { return currentUser; }
export function getProfile() { return profile; }
export function setProfile(nextProfile) {
  const rawMultiplier = String(nextProfile.multiplicador ?? defaultProfile.multiplicador);
  const multiplier = Number.parseInt(rawMultiplier.replace(/\D/g, ""), 10) || 1;
  profile = { ...defaultProfile, ...nextProfile, multiplicador: multiplier, inventario: nextProfile.inventario || [] };
  return profile;
}
export function getVoteMultiplier() {
  const tier = String(profile.patreonTier || "").toLowerCase();
  const patreonMultiplier = profile.esPatreon || tier === "vip" || tier === "hokage" ? 2 : 1;
  return Math.max(Number(profile.multiplicador) || 1, patreonMultiplier);
}
