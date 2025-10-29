const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const authRoutes = require("./authRoutes");
require("dotenv").config();
const { PORT, SERVER_URL } = require("./constants");

const https = require("https");
const fs = require("fs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", authRoutes);
// Creating object of key and certificate
// for SSL
const options = {
  key: fs.readFileSync("./socialtest.login.shell.com-key.pem"),
  cert: fs.readFileSync("./socialtest.login.shell.com.pem"),
};

https.createServer(options, app).listen(PORT, function (req, res) {
  console.log(`Server started on port ${SERVER_URL}:${PORT}`);
});
