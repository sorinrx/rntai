const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const next = require('next');
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

nextApp.prepare().then(() => {
  // Endpoint pentru a primi mesaje WhatsApp
  app.post('/whatsapp', (req, res) => {
    const incomingMessage = req.body.Body;
    const from = req.body.From;

    console.log(`Received message from ${from}: ${incomingMessage}`);

    // Răspunde la mesaj
    client.messages.create({
      body: 'Hello from your chat application!',
      from: 'whatsapp:+14155238886', // Twilio WhatsApp number
      to: from
    }).then(message => console.log(`Message sent: ${message.sid}`))
      .catch(error => console.error(error));

    res.sendStatus(200);
  });

  // Handle all other routes with Next.js
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  // Pornirea serverului
  const port = process.env.PORT || 3000;
  app.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});