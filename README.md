# Verificación de Patreon

Este backend aplica el doble de votos solo después de verificar una membresía
activa con la API v2 de Patreon. Las claves nunca se exponen en la web.

## Preparación

1. En Patreon Developers, crea un cliente OAuth v2 y solicita los permisos
   `identity` e `identity.memberships`.
2. Instala las dependencias y autentica Firebase CLI:

   ```bash
   cd functions
   npm install
   cd ..
   firebase login
   ```

3. Configura estos secretos en Firebase. No los subas a GitHub:

   ```bash
   firebase functions:secrets:set PATREON_CLIENT_ID
   firebase functions:secrets:set PATREON_CLIENT_SECRET
   firebase functions:secrets:set PATREON_CAMPAIGN_ID
   firebase functions:secrets:set PATREON_REDIRECT_URI
   firebase functions:secrets:set PATREON_SUCCESS_URL
   ```

`PATREON_REDIRECT_URI` debe coincidir exactamente con la URL pública de
`patreonCallback`, normalmente:

```text
https://us-central1-uefarankedleague.cloudfunctions.net/patreonCallback
```

`PATREON_SUCCESS_URL` es la URL publicada de tu sitio en GitHub Pages.
Registra también el valor de `PATREON_REDIRECT_URI` como callback autorizado
en el cliente de Patreon.

4. Despliega funciones y reglas:

   ```bash
   firebase deploy --only functions,firestore:rules
   ```

## Resultado

Al pulsar **Vincular Patreon**, el usuario inicia OAuth. El backend consulta
la membresía activa de tu campaña y actualiza `esPatreon` desde Admin SDK. Un
usuario normal con X3 emite 3 votos; un miembro Patreon con X3 emite 6.
