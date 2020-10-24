const express = require('express');
const path = require('path')
var request = require('request-promise');
const router = express.Router();
const multer = require('multer');

const { 
    SHOPIFY_API_SECRET_KEY, 
    SHOPIFY_API_KEY,
    ACCESSTOKEN,
    SCOPE,
    SHOP, 
    HOST 
  } = process.env;

const Background = require('../models/Background');

var Storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, "./public/upload");
    },
    filename: function(req, file, callback) {
        callback(null, file.fieldname + "_tmp" + path.extname(file.originalname));
        // callback(null, file.originalname);
    }
});
var upload = multer({ storage: Storage })


router.get('/', function(req, res, next){
    Background.find()
      .then((doc)=>{
        res.json(doc);
      })
      .catch((err)=>{
        console.log(err);
      });
    next()
});

router.post('/', upload.single('file'), async function (req, res, next) {
    let fileName = req.body.filename;
    let category = req.body.category;
    let changeName= fileName.replace(/ /g, '_') + path.extname(req.file.filename);
    let themeID = '';
    let imageUrl = '';

    //Get Theme Id
    let getThemeIDUrl = 'https://' + SHOP + '/admin/api/2020-01/themes.json';
    let getThemeIDOptions = {
        method: 'GET',
        uri: getThemeIDUrl,
        json: true,
        headers: {
            'X-Shopify-Access-Token': ACCESSTOKEN,
            'content-type': 'application/json'
        }
    };
    await request(getThemeIDOptions)
        .then(function (parsedBody) {
            let theme = parsedBody.themes;
            theme.forEach(element => {
            if(element.role == 'main') {
                themeID = element.id;
            }
            });
            
        })
        .catch(function (err) {
            res.json(err);
        });

    //Insert image to assets folder
    let putImageUrl = 'https://' + SHOP + '/admin/api/2020-01/themes/'+ themeID +'/assets.json';
    let new_image = {
        'asset': {
        'key': 'assets/' + changeName,
        'src': 'https://' + HOST + '/upload/' + req.file.filename
        }
    }
    let putImageOptions = {
        method: 'PUT',
        uri: putImageUrl,
        json: true,
        resolveWithFullResponse: true,
        headers: {
            'X-Shopify-Access-Token': ACCESSTOKEN,
            'content-type': 'application/json'
        },
        body: new_image
    };
    await request.put(putImageOptions)
        .then(function (response) {
        if (response.statusCode == 200) {
            imageUrl = response.body.asset.public_url;
        } else {
            res.send('fail to upload');
        }
        })
        .catch(function (err) {
            res.json(false);
        });

    // Insert Image data to MongoDB
    let background = new Background({ filename: fileName, keyname: changeName, filepath: imageUrl, category: category });
    Background.find({"filename": fileName})
        .then((doc)=>{
        if(doc.length == 0){
            background.save()
            .then(Background => {
            res.send("success");
            })
            .catch(err => {
            res.json(err);
            });
        } else {
            res.send('Image name upload');
        }
        })
        .catch((err)=>{
        res.json(err);
        });

});

module.exports = router;