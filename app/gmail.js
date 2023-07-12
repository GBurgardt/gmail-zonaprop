const { google } = require("googleapis");

async function listMessages(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  return new Promise((resolve, reject) => {
    gmail.users.messages.list(
      {
        userId: "me",
        maxResults: 50,
        q: 'subject:"propiedades que pueden interesarte"',
      },
      (err, res) => {
        if (err) reject("The API returned an error: " + err);
        const messages = res.data.messages;
        if (messages.length) {
          resolve(messages);
        } else {
          resolve([]);
        }
      }
    );
  });
}

async function getMessage(auth, userId, messageId) {
  const gmail = google.gmail({ version: "v1", auth });
  return new Promise((resolve, reject) => {
    gmail.users.messages.get({ userId, id: messageId }, (err, res) => {
      if (err) reject("The API returned an error: " + err);
      resolve(res.data.payload.body.data);
    });
  });
}

module.exports = {
  listMessages,
  getMessage,
};
