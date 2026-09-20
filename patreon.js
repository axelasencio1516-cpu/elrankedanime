import { auth, functions, httpsCallable } from "./firebase.js";

export async function connectPatreon() {
  if (!auth.currentUser) {
    window.abrirModalAuth();
    return;
  }
  try {
    const startConnection = httpsCallable(functions, "beginPatreonConnect");
    const result = await startConnection();
    if (!result.data?.url) throw new Error("No se recibió una URL de Patreon.");
    window.location.assign(result.data.url);
  } catch (error) {
    console.error("No se pudo iniciar la conexión con Patreon", error);
    alert("No se pudo conectar Patreon todavía. Verifica que el backend de Patreon esté desplegado.");
  }
}
