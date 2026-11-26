const crypto = require("crypto");

const decode = (part) => JSON.parse(Buffer.from(part, "base64url").toString("utf8"));

// Returns the claims of a valid, unexpired HS256 token, otherwise null
function verifyToken(token, secret) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;

  // Always HS256: the token's header never chooses the algorithm
  const expected = Buffer.from(
    crypto.createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url"),
  );
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected))
    return null;

  try {
    if (decode(header).alg !== "HS256") return null;
    const claims = decode(payload);
    if (typeof claims.sub !== "string" || !claims.sub) return null;
    if (typeof claims.exp !== "number" || claims.exp <= Date.now() / 1000) return null;
    return claims;
  } catch {
    return null;
  }
}

function readCookie(req, name) {
  for (const pair of (req.headers.cookie || "").split(";")) {
    const [key, ...rest] = pair.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

module.exports = { verifyToken, readCookie };
