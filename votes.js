import { db, doc, getDoc, runTransaction } from "./firebase.js";
import { getCurrentUser, getVoteMultiplier } from "./state.js";

export async function loadMatch() {
  try {
    const snapshot = await getDoc(doc(db, "votaciones", "partido_2"));
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    document.getElementById("nombre-A")?.replaceChildren(data.NombreA || "Opening A");
    document.getElementById("nombre-B")?.replaceChildren(data.NombreB || "Opening B");
  } catch (error) { console.error("No se pudo cargar el partido", error); }
}

export async function vote(matchId, option) {
  const user = getCurrentUser();
  if (!user) { window.abrirModalAuth(); return; }
  const reference = doc(db, "votaciones", matchId);
  try {
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) throw new Error("El enfrentamiento no está disponible.");
      const data = snapshot.data();
      const voters = data.votantes || [];
      if (voters.includes(user.uid)) throw new Error("Ya votaste en este enfrentamiento.");
      const field = option === "opcionA" ? "VotosA" : "VotosB";
      const multiplier = getVoteMultiplier();
      transaction.update(reference, { [field]: (Number(data[field]) || 0) + multiplier, votantes: [...voters, user.uid] });
    });
    alert("Voto registrado con éxito.");
  } catch (error) { alert(error.message); }
}
