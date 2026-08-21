import {
  auth, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, signOut, onAuthStateChanged,
} from "./firebase.js";
import { setCurrentUser, setProfile, defaultProfile } from "./state.js";
import { loadProfile, renderProfile } from "./profile.js";

const emailInput = () => document.getElementById("modal-email");
const passwordInput = () => document.getElementById("modal-password");

export function openAuthModal() { document.getElementById("auth-modal")?.style.setProperty("display", "flex"); }
export function closeAuthModal() { document.getElementById("auth-modal")?.style.setProperty("display", "none"); }

export async function register() {
  try {
    await createUserWithEmailAndPassword(auth, emailInput().value.trim(), passwordInput().value);
    closeAuthModal();
    alert("Cuenta creada con éxito.");
  } catch (error) { alert(`No se pudo crear la cuenta: ${error.message}`); }
}

export async function login() {
  try {
    await signInWithEmailAndPassword(auth, emailInput().value.trim(), passwordInput().value);
    closeAuthModal();
    alert("Sesión iniciada.");
  } catch (error) { alert(`No se pudo iniciar sesión: ${error.message}`); }
}

export async function loginWithGoogle() {
  try {
    await signInWithPopup(auth, googleProvider);
    closeAuthModal();
  } catch (error) { alert(`No se pudo iniciar sesión con Google: ${error.message}`); }
}

export async function logout() { await signOut(auth); closeAuthModal(); }

export function initAuth() {
  onAuthStateChanged(auth, async (user) => {
    const form = document.getElementById("modal-form-content");
    const logged = document.getElementById("modal-logged-content");
    const label = document.getElementById("modal-user-email");
    setCurrentUser(user);
    if (user) {
      if (form) form.style.display = "none";
      if (logged) logged.style.display = "block";
      if (label) label.textContent = `Conectado como: ${user.email}`;
      try { await loadProfile(user); } catch (error) { console.error("No se pudo cargar el perfil", error); }
    } else {
      setProfile(defaultProfile);
      if (form) form.style.display = "block";
      if (logged) logged.style.display = "none";
      renderProfile();
    }
  });
}
