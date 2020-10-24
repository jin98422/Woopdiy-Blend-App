const express = require('express');
const server = express()
const fs = require('fs')
const envfile = require('envfile')
const sourcePath = '.env'

const { 
    SHOPIFY_API_SECRET_KEY, 
    SHOPIFY_API_KEY,
    SCOPE,
    SHOP, 
  } = process.env;

server.get('/', function (req, res, next) {
        //build the url
    const shop =  req.query.shop;
    const host =  req.header.host;

    console.log(envfile.parseFileSync(sourcePath))
    let parsedFile = envfile.parseFileSync(sourcePath);
    parsedFile.SHOP = shop;
    parsedFile.HOST = host;
    fs.writeFileSync('./.env', envfile.stringifySync(parsedFile)) 
    console.log(envfile.stringifySync(parsedFile))

    let installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPE}&redirect_uri=https://${host}/shopify/auth`;
    res.redirect(installUrl);
});

server.get('/auth', function (req, res, next) {
    let code = req.query.code;
    //Exchange temporary code for a permanent access token
    let accessTokenRequestUrl = 'https://' + SHOP + '/admin/oauth/access_token';
    let accessTokenPayload = {
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET_KEY,
        code,
    };

    request.post(accessTokenRequestUrl, { json: accessTokenPayload })
        .then((accessTokenResponse) => {
            let accessToken = accessTokenResponse.access_token;
            let parsedFile = envfile.parseFileSync(sourcePath);
            parsedFile.ACCESSTOKEN = accessToken;
            fs.writeFileSync('./.env', envfile.stringifySync(parsedFile)) 
            console.log(envfile.stringifySync(parsedFile))
            res.redirect('/');
        })
        .catch((error) => {
            res.status(error.statusCode).send(error.error.error_description);
        });
});


module.exports = server;