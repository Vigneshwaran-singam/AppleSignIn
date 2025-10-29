const express = require("express");
const crypto = require("crypto");
const axios = require("axios");

const appleSignin = require("apple-signin-auth");
const {
  APPLE_SERVICE_ID,
  SERVER_URL,
  PORT,
  PORT_BACKEND,
  APPLE_CLIENT_ID,
  APPLE_TEAM_ID,
  APPLE_KEY_ID,
} = require("./constants");
const router = express.Router();
const {
  verifyAppleIdToken,
  generateJwtToken,
  generateClientSecret,
  exchangeCodeForToken,
} = require("./utils");
const path = require("path");
const fs = require("fs");

const APPLE_REDIRECT_URI = `${SERVER_URL}:${PORT_BACKEND}${process.env.APPLE_REDIRECT_URI}`;

router.get("/auth/apple/old", (req, res) => {
  console.log("APPLE_REDIRECT_URI:", APPLE_REDIRECT_URI);

  const options = {
    clientID: APPLE_SERVICE_ID, // Apple Client ID
    redirectUri: APPLE_REDIRECT_URI, // Your redirect URI
    // OPTIONAL
    state: "state", // optional, An unguessable random string. It is primarily used to protect against CSRF attacks.
    responseMode: "form_post", // Force set to form_post if scope includes 'email'
    scope: "name email", // optional
  };

  const authorizationUrl = appleSignin.getAuthorizationUrl(options);

  //   const url = `https://appleid.apple.com/auth/authorize?client_id=${APPLE_SERVICE_ID}&redirect_uri=${APPLE_REDIRECT_URI}&response_type=code id_token&scope=email name&nonce=nonce&response_mode=form_post`;
  // const url = `https://appleid.apple.com/auth/authorize?client_id=${APPLE_SERVICE_ID}&redirect_uri=${APPLE_REDIRECT_URI}&response_type=code&scope=profile email`;
  res.redirect(authorizationUrl);
});

router.get("/auth/apple", (req, res) => {
  const scope = "email name"; // we want to know the user's email
  const state = crypto.randomBytes(19).toString("hex");
  const redirectUri = APPLE_REDIRECT_URI;
  const client_id = APPLE_SERVICE_ID; // something like com.ourdomain.app

  const authorizationUri = `https://appleid.apple.com/auth/authorize?response_type=code id_token&client_id=${client_id}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}&response_mode=form_post`;

  res.redirect(authorizationUri);
});
router.post("/social/code/exchange/apple2", async (req, res) => {
  const { code, id_token, state, user } = req.body;
  console.log("req.body:", req.body);
  const privateKey = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n");
  const CLIENT_ID = APPLE_SERVICE_ID; // Service ID from Apple Developer
  const TEAM_ID = APPLE_TEAM_ID;
  const KEY_ID = APPLE_KEY_ID;
  const REDIRECT_URI = APPLE_REDIRECT_URI;
  const clientSecret = generateClientSecret({
    teamId: TEAM_ID,
    clientId: CLIENT_ID,
    keyId: KEY_ID,
    privateKey,
  });

  // const clientSecret = appleSignin.getClientSecret({
  //   clientID: CLIENT_ID,
  //   teamID: TEAM_ID,
  //   privateKey: privateKey,
  //   keyIdentifier: KEY_ID,
  //   expAfter: 15777000, // 6 months
  // });

  // const tokens = await appleSignin.getAuthorizationToken(code, {
  //   clientID: CLIENT_ID,
  //   clientSecret,
  //   redirectUri: REDIRECT_URI,
  // });

  const url = new URL(ENDPOINT_URL);
  async function exchangeCodeForToken(
    code,
    clientSecret,
    CLIENT_ID,
    REDIRECT_URI
  ) {
    const url = new URL(ENDPOINT_URL);
    url.pathname = "/auth/token";

    const newURLParams = {
      client_id: CLIENT_ID,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    };

    const params = new URLSearchParams(newURLParams).toString();
    // params.append("client_id", CLIENT_ID);
    // params.append("client_secret", clientSecret);
    // params.append("code", code);
    // params.append("grant_type", "authorization_code");
    // if (REDIRECT_URI) {
    //   params.append("redirect_uri", REDIRECT_URI);
    // }

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
  }

  const tokenResponse = await exchangeCodeForToken(
    code,
    clientSecret,
    CLIENT_ID,
    REDIRECT_URI
  );
  res.send(tokenResponse);

  // const tokenEndpoint = "https://appleid.apple.com/auth/token";
  // const params = {
  //   client_id: CLIENT_ID,
  //   client_secret: clientSecret,
  //   code: code,
  //   grant_type: "authorization_code",
  //   redirect_uri: REDIRECT_URI,
  // };

  const token = await verifyAppleIdToken({
    id_token,
    audience: APPLE_SERVICE_ID,
  });
  // console.log("State:", state);
  // console.log("Authorization Code:", code);
  res.send(token);
});

router.post("/generateJwtToken", (req, res) => {
  const { kid } = req.query;
  const privateKeyPath = path.join(__dirname, "private.key");
  console.log("privateKeyPath:", privateKeyPath);
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");
  console.log("privateKey:", privateKey);
  const customHeader = {
    kid,
  };

  const token = generateJwtToken({
    payload: req.body,
    secret: privateKey,
    header: customHeader,
  });
  res.send(`token: ${token}`);
});

router.post("/social/code/exchange/apple", async (req, res) => {
  const { code, id_token, state, user } = req.body;
  console.log("req.body:", req.body);
  const privateKey = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n");
  const CLIENT_ID = APPLE_SERVICE_ID; // Service ID from Apple Developer
  const TEAM_ID = APPLE_TEAM_ID;
  const KEY_ID = APPLE_KEY_ID;
  const REDIRECT_URI = APPLE_REDIRECT_URI;
  const clientSecret = generateClientSecret({
    teamId: TEAM_ID,
    clientId: CLIENT_ID,
    keyId: KEY_ID,
    privateKey,
  });
  const token = await exchangeCodeForToken({
    code,
    teamId: TEAM_ID,
    clientId: CLIENT_ID,
    clientSecret,
    keyId: KEY_ID,
    privateKey,
    redirectUri: REDIRECT_URI,
  });
  return res.send(token);
});
module.exports = router;
