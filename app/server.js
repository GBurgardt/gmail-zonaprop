const fs = require("fs");
const express = require("express");
const { authorize } = require("./auth");
const { listMessages, getMessage } = require("./gmail");
const {
  processMessages,
  markAsVisited,
  markAsFavorite,
} = require("./messageProcessor");

const app = express();
const port = 3000;

fs.readFile(
  "../client_secret_503320778037-huroji8dl0f6c7qq23sr70caak8c17gf.apps.googleusercontent.com.json",
  async (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    const auth = await authorize(JSON.parse(content));

    app.get("/visit", (req, res) => {
      const { address, link } = req.query;
      markAsVisited(address);
      res.redirect(decodeURIComponent(link));
    });

    app.get("/favorite", (req, res) => {
      const { address, link } = req.query;
      markAsFavorite(address);
      res.redirect(decodeURIComponent(link));
    });

    const messages = await listMessages(auth);
    const html = await processMessages(auth, messages);

    app.get("/", (req, res) => {
      res.send(html);
    });
    app.listen(port, () => {
      console.log(`App listening at http://localhost:${port}`);
    });
  }
);
