import { randomBytes } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

initializeApp();
const db = getFirestore();

const patreonClientId = defineSecret("PATREON_CLIENT_ID");
const patreonClientSecret = defineSecret("PATREON_CLIENT_SECRET");
const patreonRedirectUri = defineSecret("PATREON_REDIRECT_URI");
const patreonSuccessUrl = defineSecret("PATREON_SUCCESS_URL");
const patreonCampaignId = defineSecret("PATREON_CAMPAIGN_ID");

const secrets = [patreonClientId, patreonClientSecret, patreonRedirectUri, patreonSuccessUrl, patreonCampaignId];

export const beginPatreonConnect = onCall({ region: "us-central1", secrets }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Inicia sesión antes de vincular Patreon.");

  const state = randomBytes(32).toString("hex");
  await db.collection("_patreonOAuthStates").doc(state).set({
    uid: request.auth.uid,
    expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
  });

  const url = new URL("https://www.patreon.com/oauth2/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", patreonClientId.value());
  url.searchParams.set("redirect_uri", patreonRedirectUri.value());
  url.searchParams.set("scope", "identity identity.memberships");
  url.searchParams.set("state", state);
  return { url: url.toString() };
});

export const patreonCallback = onRequest({ region: "us-central1", secrets }, async (request, response) => {
  const { code, state } = request.query;
  if (typeof code !== "string" || typeof state !== "string") {
    response.status(400).send("Solicitud de Patreon incompleta.");
    return;
  }

  const stateReference = db.collection("_patreonOAuthStates").doc(state);
  const stateSnapshot = await stateReference.get();
  if (!stateSnapshot.exists || stateSnapshot.data().expiresAt.toMillis() < Date.now()) {
    response.status(400).send("La conexión con Patreon expiró. Inténtalo de nuevo.");
    return;
  }
  await stateReference.delete();

  const tokenResponse = await fetch("https://www.patreon.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: patreonClientId.value(),
      client_secret: patreonClientSecret.value(),
      redirect_uri: patreonRedirectUri.value(),
    }),
  });
  if (!tokenResponse.ok) {
    response.status(502).send("Patreon no pudo autorizar la conexión.");
    return;
  }
  const token = await tokenResponse.json();
  const identityUrl = new URL("https://www.patreon.com/api/oauth2/v2/identity");
  identityUrl.searchParams.set("include", "memberships,memberships.campaign");
  identityUrl.searchParams.set("fields[member]", "patron_status,currently_entitled_amount_cents");
  const identityResponse = await fetch(identityUrl, { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!identityResponse.ok) {
    response.status(502).send("No se pudo verificar la membresía en Patreon.");
    return;
  }

  const identity = await identityResponse.json();
  const membership = (identity.included || []).find((item) =>
    item.type === "member"
    && item.attributes?.patron_status === "active_patron"
    && Number(item.attributes?.currently_entitled_amount_cents || 0) > 0
    && item.relationships?.campaign?.data?.id === patreonCampaignId.value(),
  );
  const active = Boolean(membership);
  const uid = stateSnapshot.data().uid;
  await db.collection("usuarios").doc(uid).set({
    esPatreon: active,
    patreonTier: active ? "patreon" : "",
    patreonMemberId: membership?.id || null,
    patreonVerifiedAt: Timestamp.now(),
  }, { merge: true });

  const destination = new URL(patreonSuccessUrl.value());
  destination.searchParams.set("patreon", active ? "connected" : "inactive");
  response.redirect(destination.toString());
});
