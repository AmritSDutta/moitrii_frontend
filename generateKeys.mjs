// One-time key generation for Convex Auth (from the official setup docs:
// https://labs.convex.dev/auth/setup/manual). Run in YOUR terminal so the
// private key never leaves your machine:
//
//   node generateKeys.mjs
//
// Then copy each printed value into your Convex deployment:
//
//   npx convex env set JWT_PRIVATE_KEY "<value from first line>"
//   npx convex env set JWKS "<value from second line>"
//   npx convex env set SITE_URL http://localhost:3000
//
// Restart `npx convex dev` afterwards — env changes need it.
import { generateKeyPair, exportJWK, exportPKCS8 } from "jose";

const { publicKey, privateKey } = await generateKeyPair("RS256", {
  extractable: true,
});

const jwk = await exportJWK(publicKey);
const pkcs8 = await exportPKCS8(privateKey);

console.log("JWT_PRIVATE_KEY=" + pkcs8);
console.log("JWKS=" + JSON.stringify({ keys: [jwk] }));
