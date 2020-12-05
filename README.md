<p align="center">
  <img src="src/assets/logo.svg" alt="checkr logo" width="350px" />
</p>
<br/>

This is my hackathon submission for the [Santander Digital Trust Hackathon](https://santander.devpost.com/). It's derived from the [digital trust example journey template](https://github.com/gruposantander/digital-trust-example-journey).

This repo holds both the front-end and back-end code.

## Setup

```
npm install
npm run build
cd backend
npm install
npm start
```

## Usage

Once running, navigate to [`localhost:8000`](http://localhost:8000).

In the Santander sandbox, you can use username `hilton` and password `12345` for a dummy account.

## Backend endpoints

### GET /initiate-authorize

Returns a `redirect_to` url required for the user to consent in the flow.

### POST /token

Request body sends the code that is returned to the frontend from the digital ID flow. The endpoint uses the SDK to exchange the code for a JWT with the user's info. The token is verified to check the user has the right to work, and the relevant data or errors are returned to the front-end.
