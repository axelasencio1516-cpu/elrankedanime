import { db, doc, runTransaction } from "./firebase.js";
import { getCurrentUser, getProfile, setProfile } from "./state.js";
import { renderProfile } from "./profile.js";

async function updateProfile(mutator) {
  const user = getCurrentUser();
  if (!user) throw new Error("Debes iniciar sesión.");
  const reference = doc(db, "usuarios", user.uid);
  const next = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(reference);
    const current = snapshot.exists() ? snapshot.data() : getProfile();
    const updated = mutator({ ...current, puntos: Number(current.puntos) || 0 });
    transaction.set(reference, updated, { merge: true });
    return updated;
  });
  setProfile(next);
  renderProfile();
  return next;
}

export async function claimDailyReward() {
  const today = new Date().toISOString().slice(0, 10);
  const message = document.getElementById("suerte-result-msg");
  try {
    let reward = 0;
    await updateProfile((profile) => {
      if (profile.ultimaRacha === today) throw new Error("Ya reclamaste tu recompensa de hoy.");
      reward = Math.floor(Math.random() * 21) + 10;
      return { ...profile, puntos: profile.puntos + reward, racha: (Number(profile.racha) || 0) + 1, ultimaRacha: today };
    });
    if (message) message.textContent = `✨ Check-in registrado. Ganaste ${reward} puntos.`;
  } catch (error) { if (message) message.textContent = error.message; }
}

export async function buyMultiplier(multiplier, cost) {
  try {
    await updateProfile((profile) => {
      if (profile.puntos < cost) throw new Error("No tienes suficientes puntos.");
      return { ...profile, puntos: profile.puntos - cost, multiplicador: Number(multiplier) };
    });
    alert(`Potenciador X${multiplier} activado.`);
  } catch (error) { alert(error.message); }
}

export async function buyBadge(name, cost) {
  try {
    await updateProfile((profile) => {
      if (profile.puntos < cost) throw new Error("No tienes suficientes puntos.");
      const inventory = [...new Set([...(profile.inventario || []), name])];
      return { ...profile, puntos: profile.puntos - cost, inventario: inventory, insigniaEquipada: name };
    });
    alert(`Has adquirido: ${name}`);
  } catch (error) { alert(error.message); }
}

export async function redeemPrize(name, cost) {
  try {
    await updateProfile((profile) => {
      if (profile.puntos < cost) throw new Error("No tienes suficientes puntos.");
      const history = [...(profile.historialCanjes || []), { premio: name, costo: cost, fecha: new Date().toISOString(), estado: "Pendiente" }];
      return { ...profile, puntos: profile.puntos - cost, historialCanjes: history };
    });
    alert("Canje solicitado con éxito.");
  } catch (error) { alert(error.message); }
}
