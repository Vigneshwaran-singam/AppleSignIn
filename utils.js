const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");
const crypto = require("crypto");
const axios = require("axios");
const { ENDPOINT_URL } = require("./constants");

const verifyAppleIdToken = async ({ id_token, audience }) => {
  // 1. Decode the id_token into parts. We need the header, so we pass the options complete: true.
  const parts = jwt.decode(id_token, { complete: true });

  // 2. Fetch apple public keys. There will be several. Cache if needed.
  const keyResp = await fetch(`https://appleid.apple.com/auth/keys`);
  const keyCollection = await keyResp.json();

  const publicKey64 = keyCollection.keys.find(
    (x) => x.kid === parts.header.kid && x.alg === parts.header.alg
  );

  console.log("publicKey64", publicKey64);
  const publicKey = jwkToPem(publicKey64);
  console.log("publicKey", publicKey);

  try {
    // Verify token with audience check
    const verified = jwt.verify(id_token, publicKey, {
      algorithms: [parts.header.alg],
      audience,
    });

    console.log("Token is valid:", verified);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      console.error("Token has expired");
    } else if (err.name === "JsonWebTokenError") {
      console.error("Invalid token:", err.message);
    } else {
      console.error("Token verification failed:", err);
    }
  }

  return { publicKey: publicKey, alg: parts.header.alg };
};

const generateJwtToken = ({ payload, secret, header }) => {
  const token = jwt.sign(payload, secret, {
    algorithm: "RS256",
    expiresIn: 3600,
    header: header,
  });
  return token;
};
const generateClientSecret = ({ teamId, clientId, keyId, privateKey }) => {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: teamId,
    iat: now,
    exp: now + 15777000, // 6 months
    aud: "https://appleid.apple.com",
    sub: clientId,
  };

  const header = {
    alg: "ES256",
    kid: keyId,
  };
  const clientSecret = jwt.sign(claims, privateKey, {
    algorithm: "ES256",
    header: header,
  });
  return clientSecret;
};
const exchangeCodeForToken = async ({
  code,
  teamId,
  clientId,
  clientSecret,
  keyId,
  privateKey,
  redirectUri,
}) => {
  const url = new URL(ENDPOINT_URL);
  url.pathname = "/auth/token";

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("code", code);
  params.append("grant_type", "authorization_code");
  if (redirectUri) {
    params.append("redirect_uri", redirectUri);
  }

  try {
    const response = await axios.post(url, params);
    return response.data;
  } catch (error) {
    console.error(
      "Error exchanging code for token:",
      error.response?.data || error.message
    );
    throw error;
  }
};
module.exports = {
  verifyAppleIdToken,
  generateJwtToken,
  generateClientSecret,
  exchangeCodeForToken,
};
