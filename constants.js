require("dotenv").config();
const APPLE_SERVICE_ID = process.env.APPLE_SERVICE_ID;
const SERVER_URL = process.env.SERVER_URL || "http://localhost";
const PORT = process.env.PORT || 3000;
const PORT_BACKEND = process.env.PORT_BACKEND || 8000;
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;
const APPLE_KEY_ID = process.env.APPLE_KEY_ID;
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;
const ENDPOINT_URL = "https://appleid.apple.com";
module.exports = {
  APPLE_SERVICE_ID,
  SERVER_URL,
  PORT,
  PORT_BACKEND,
  APPLE_TEAM_ID,
  APPLE_KEY_ID,
  APPLE_CLIENT_ID,
  ENDPOINT_URL,
};
