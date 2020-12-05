require('dotenv').config()
const template = require('./registration-tmpl')
const jwk = require(`./public-jwk.json`)

const app = {
  name: process.env.APP_NAME,
  uris: [
    "http://localhost:8000/step2"
  ],
  kid: process.env.APP_KID,
  jwk
}

if (!app.kid) delete app.kid;

console.log(JSON.stringify(template.registrationPayload(app)));
