require('dotenv').config()
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { Claims, AssertionClaims, Address, Balance } = require('@gruposantander/rp-client-typescript').Model
const { VerifiedIdClient, InitiateAuthorizeRequestBuilder, TokenRequestBuilder } = require('@gruposantander/rp-client-typescript').Client
const uuid = require('uuid').v4;
const resolve = require('path').resolve;

const port = process.env.PORT || 8000;
const wellKnown = process.env.WELL_KNOWN_URL || 'https://live.iamid.io/.well-known/openid-configuration';
const clientId = process.env.CLIENT_ID || 'CWzuglydaQWAAMsCaweXn';
const redirectUri = process.env.REDIRECT_URI || 'http://localhost:4201/assets/callback';

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.get('/initiate-authorize', async (req, res) => {
    const trace_id = uuid();

    const claims = new Claims();
    claims.email()
        .withPurpose('If you provide an email, we\'ll send you a confirmation of your check.')

    claims.givenName()
        .withEssential(true)
        .withPurpose('We need to check your official name to prove your right to work.')
    claims.familyName()
        .withEssential(true)
        .withPurpose('We need to check your official name to prove your right to work.')

    claims.nationality()
        .withEssential(true)
        .withPurpose('We need to check your nationality to prove your right to work in the UK.')

    claims.passportId()
        .withPurpose('We need to record your passport number as a regulatory requirement for proving your right to work. Either passport number or national card ID must be provided.')
    claims.nationalCardId()
        .withPurpose('We need to record your national card ID as a regulatory requirement for proving your right to work. Either passport number or national card ID must be provided.')

    let verifyidclient;
    try {
        verifyidclient = await VerifiedIdClient.createInstance({
            wellKnownURI: wellKnown,
            privateJWK: resolve('./private-jwk.json'),
            clientId: clientId,
        });
        await verifyidclient.setUpClient();
    } catch (e) {
        console.error(trace_id, e);
        res.status(500).json({ error_description: 'Unable to create client instance - unset proxies', trace_id });
        return;
    }

    try {
        const request = new InitiateAuthorizeRequestBuilder()
            .withRedirectURI(redirectUri)
            .withClaims(claims)
            .withAssertionClaims(new AssertionClaims())
            .withPurpose('We want to check your details to prove your right to work.')
            .build()

        const initiateAuthorize = await verifyidclient.initiateAuthorize(request)
        res.status(200).json({ redirect_to: initiateAuthorize.redirectionUri });
    } catch (e) {
        console.error(trace_id, e);
        res.status(500).json({ error_description: "An unexpected error occured", trace_id });
    }
});

app.post('/token', async (req, res) => {
    const trace_id = uuid();

    if (!req.body.code) {
        res.status(400).json({ error_description: 'No code has been sent', trace_id });
    }

    let verifyidclient, request;
    try {
        verifyidclient = await VerifiedIdClient.createInstance({
            wellKnownURI: wellKnown,
            privateJWK: resolve('./private-jwk.json'),
            clientId: clientId
        });
        await verifyidclient.setUpClient();
        request = new TokenRequestBuilder()
            .withRedirectUri(redirectUri)
            .withCode(req.body.code)
            .build();
    } catch (e) {
        console.error(trace_id, e)
        res.status(500).json({ error_description: 'Internal error while preparing to verify token', trace_id });
        return;
    }

    let token;
    try {
        token = await verifyidclient.token(request)
    } catch (e) {
        if (e.isAxiosError && e.response && e.response.data && e.response.data.error_description) {
            if (e.response.data.error_description == "grant request is invalid") {
                res.status(400).json({ error_description: 'Code already used, avoid using your browser\'s back button', trace_id });
                return;
            }

            res.status(400).json({ error_description: e.response.data.error_description, trace_id });
            return;
        }
        if (e.isAxiosError) {
            res.status(400).json({ error_description: 'Failed to verify token with Santander server', trace_id });
            return;
        }
        
        console.error(trace_id, e)
        res.status(400).json({ error_description: 'Error occurred verifying code', trace_id });
        return;
    }

    const errors = validateToken(token);
    if (errors.length == 0) {
        res.status(200).json({ email: token.email, given_name: token.given_name, family_name: token.family_name, nationality: token.nationality, passport_id: token.passport_id, national_card_id: token.national_card_id });
    } else {
        res.status(400).json({ error_description: 'Token recieved was invalid', errors, trace_id })
    }

    // At this point the token data would be persisted to a database and the user would be sent a confirmation email, if they had shared their email address
});

const eeaCountries = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','EL','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','NO','IS','LI'];

/**
 * Validates a token, returning validation errors
 * @param {Object} token Token from the VerifiedIdClient
 * @returns {string[]} Array of validation errors. Empty for a valid token
 */
function validateToken(token) {
    if (!token) {
        return ['Bad token receieved for code'];
    }

    const errors = [];
    
    ['given_name', 'family_name', 'nationality'].forEach(key => {
        if (!token[key]) {
            errors.push('Missing ' + key.split('_').join(' ') + ' needed to prove your right to work');
        }
    });

    if (!token.passport_id && !token.national_card_id) {
        errors.push('Missing passport number and national card ID, at least one must be provided to prove your right to work');
    }

    if (token.nationality != 'GB' && !eeaCountries.includes(token.nationality)) {
        errors.push('Cannot automatically verify your non-EEA nationality (' + token.nationality + ')');
    }

    return errors;
}

app.listen(port, () => { console.log('Started on port', port) });
