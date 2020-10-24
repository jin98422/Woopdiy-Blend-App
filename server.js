const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const next = require('next');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path')
const url = require('url');
var request = require('request-promise');
const fs = require('fs');
const envfile = require('envfile');
const formidable = require('formidable');
const multer = require('multer');
const Jimp = require('jimp');
const {Storage} = require('@google-cloud/storage')

const mongoose = require('mongoose');
const Background = require('./models/Background');
const Drop = require('./models/Drop');
const Final = require('./models/Final');

let { 
  SHOPIFY_API_SECRET_KEY, 
  SHOPIFY_API_KEY,
  ACCESSTOKEN,
  SCOPE,
  SHOP, 
  HOST,
  DB
} = process.env;

mongoose.Promise = global.Promise;
mongoose.connect(DB, { useNewUrlParser: true, useCreateIndex: true }).then(
  () => {console.log('Database is connected') },
  err => { console.log('Can not connect to the database'+ err)}
);

var BackgroundStorage = multer.diskStorage({
  destination: function(req, file, callback) {
      callback(null, "./public/upload");
  },
  filename: function(req, file, callback) {
      callback(null, file.fieldname + "_tmp" + path.extname(file.originalname));
  }
});
var upload = multer({ storage: BackgroundStorage })

const sourcePath = '.env';
console.log(envfile.parseFileSync(sourcePath))
const port = parseInt(process.env.PORT, 10) || 8080;
const dev = process.env.NODE_ENV !== 'production';
console.log('dev', dev)
const app = next({ dev })
const handle = app.getRequestHandler()

const serviceKey = path.join(__dirname, './keys.json');

let gcd = new Storage({
  projectId: 'teak-optics-274300',
  keyFilename: serviceKey
});

let BACKGROUND_BUCKET_NAME = 'blendbackground';
let backgroundBucket = gcd.bucket(BACKGROUND_BUCKET_NAME);

let DROP_BUCKET_NAME = 'blenddrop';
let dropBucket = gcd.bucket(DROP_BUCKET_NAME);

let BLEND_BUCKET_NAME = 'blendapp';
let blendBucket = gcd.bucket(BLEND_BUCKET_NAME);



let draftImage = {};

app.prepare().then(() => {
  const server = express()
  server.use(cookieParser());
  server.use(cors());
  server.use(bodyParser.json());
  server.use(bodyParser.urlencoded({extended: true}));
  server.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,GET');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
  });
  server.use(express.static(__dirname + 'public'));

  server.get('/shopify', function (req, res, next) {
    let shop = req.query.shop;
    let host = req.headers.host;
    //env file update -- add shop name and host name
    let parsedFile = envfile.parseFileSync(sourcePath);
    parsedFile.SHOP = shop;
    parsedFile.HOST = host;
    fs.writeFileSync('./.env', envfile.stringifySync(parsedFile))
    SHOP = shop;
    HOST = host;
    console.log('Shop=' + process.env.SHOP)
    //build the url
    let installUrl = `https://${SHOP}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPE}&redirect_uri=https://${HOST}/shopify/auth`;
    res.redirect(installUrl);
  });

  server.get('/shopify/auth', function (req, res, next) {
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
          ACCESSTOKEN = accessToken;
          console.log('shop token ' + accessToken);
          res.redirect('/');
      })
      .catch((error) => {
          res.status(error.statusCode).send(error.error.error_description);
      });
  });

  //Background Image Handel Part
  server.get('/background', function(req,res){
    console.log("background")
    Background.find()
      .then((doc)=>{
        res.json(doc);
      })
      .catch((err)=>{
        res.json({
          status: 'failed',
          err: err
        });
      });
  });

  server.post('/background', upload.single('file'), async function (req, res, next) {
    let filename = req.body.filename;
    let category = req.body.category;
    let dataID = req.body.id;

    let new_name = filename.replace(" ", "_") + '_' + Date.now() + path.extname(req.file.filename);

    let new_path = path.dirname(req.file.path) + '/' + new_name;
    console.log("background-path",new_path)

    fs.rename(req.file.path, new_path, async function (err) {
      if (err) throw err;
      if(dataID == undefined) {
        await backgroundBucket.upload(new_path)
        .then((file) => console.log("upload success!"))
        .catch(err => {
          res.json({
            status: 'failed',
            err: err
          });
        });  
        let imageUrl = `https://storage.googleapis.com/blendbackground/${new_name}`;

        // Insert Image data to MongoDB      
        let background = new Background({ filename: filename, filepath: imageUrl, category: category });
        await background.save()
            .then(doc => {
              res.json({
                status: 'save',
                data: doc
              });
            })
            .catch(err => {
              res.json({
                status: 'failed',
                err: err
              });
            });  
        } else {
          let deleteName = "";
          await Background.find({"_id": dataID})
          .then((doc)=>{
            deleteName = doc[0].filepath;
          })
          .catch((err)=>{
            res.json({
              status: 'failed',
              err: err
            });
          });

          await backgroundBucket.file(path.basename(deleteName)).delete()
          .then((data) => {
            console.log("gc deleted sucess");
          })
          .catch(err => {
            res.json({
              status: 'failed',
              err: err
            });
          });

          await backgroundBucket.upload(new_path)
          .then((file) => console.log("upload success!"))
          .catch(err => {
            res.json({
              status: 'failed',
              err: err
            });
          });
          let imageUrl = `https://storage.googleapis.com/blendbackground/${new_name}`;
          await Background.update({_id: dataID}, { filename: filename, filepath: imageUrl, category: category })
          .then(doc => {
            res.json({
              status: 'save',
              data: doc
            });
          })
          .catch(err => {
            res.json({
              status: 'failed',
              err: err
            });
          });
        }
        fs.unlink(new_path, function (err) {
          if (err) throw err;
          console.log('successfully deleted!');
        });
    });
  });

  server.post('/background/editWithoutFile', async function (req, res, next) {
    let dataID = req.body.data.id;
    let filename = req.body.data.filename;
    let category = req.body.data.category;

    await Background.update({_id: dataID}, { filename: filename, category: category })
    .then(doc => {
      res.json({
        status: 'save',
        data: doc
      });
    })
    .catch(err => {
      res.json({
        status: 'failed',
        err: err
      });
    });   
  });

  server.get('/background/deleteImage', async function(req,res){
    let dataID = req.query.id;
    let deleteName = "";
    await Background.find({"_id": dataID})
    .then((doc)=>{
      deleteName = doc[0].filepath;
    })
    .catch((err)=>{
      res.json({
        status: 'failed',
        err: err
      });
    });

    await backgroundBucket.file(path.basename(deleteName)).delete()
    .then((data) => {
      console.log("gc deleted sucess");
      Background.deleteOne({"_id": dataID})
      .then((doc)=>{
        res.json({
          status: 'deleted'
        });
      })
      .catch((err)=>{
        res.json({
          status: 'failed',
          err: err
        });
      });    
    })
    .catch(err => {
      res.json({
        status: 'failed',
        err: err
      });
    });   
  });

  //Drop Image Handel Part
  server.get('/drop', function(req,res){
    Drop.find()
      .then((doc)=>{
        res.json(doc);
      })
      .catch((err)=>{
        res.json({
          status: 'failed',
          err: err
        });
      });
  });

  server.post('/drop', upload.single('file'), async function (req, res, next) {
    let {
      supplierName,
      oilName,
      oilType,
      functionalSub,
      aromaticSub,
      blendsWellWith,
      aromaticDescription,
      aromaType,
      classifications,
      note,
      dataID
    } = req.body;

    console.log(supplierName, oilName, oilType, functionalSub, aromaticSub, blendsWellWith, aromaticDescription, aromaType, classifications, note)
    
    let new_name = oilName.replace(" ", "_") + '_' + Date.now() + path.extname(req.file.filename);

    let new_path = path.dirname(req.file.path) + '/' + new_name;
    console.log("drop-path",new_path)

    fs.rename(req.file.path, new_path, async function (err) {
      if (err) throw err;
      if(dataID == undefined) {
        await dropBucket.upload(new_path)
        .then((file) => console.log("upload success!"))
        .catch(err => {
          res.json({
            status: 'failed',
            err: err
          });
        });  
        let imageUrl = `https://storage.googleapis.com/blenddrop/${new_name}`;

        // Insert Image data to MongoDB      
        let drop = new Drop({ 
          oilName: oilName, 
          filepath: imageUrl, 
          supplierName: supplierName,
          oilType: oilType,
          functionalSub: functionalSub,
          aromaticSub: aromaticSub,
          blendsWellWith: blendsWellWith,
          aromaticDescription: aromaticDescription,
          aromaType: aromaType,
          classifications: classifications,
          note: note
        });
        await drop.save()
            .then(doc => {
              res.json({
                status: 'save',
                data: doc
              });
            })
            .catch(err => {
              res.json({
                status: 'failed',
                err: err
              });
            });  
        } else {
          let deleteName = "";
          await Drop.find({"_id": dataID})
          .then((doc)=>{
            deleteName = doc[0].filepath;
          })
          .catch((err)=>{
            res.json({
              status: 'failed',
              err: err
            });
          });

          await dropBucket.file(path.basename(deleteName)).delete()
          .then((data) => {
            console.log("gc deleted sucess");
          })
          .catch(err => {
            res.json({
              status: 'failed',
              err: err
            });
          });

          await dropBucket.upload(new_path)
          .then((file) => console.log("upload success!"))
          .catch(err => {
            res.json({
              status: 'failed',
              err: err
            });
          });
          let imageUrl = `https://storage.googleapis.com/blenddrop/${new_name}`;
          await Drop.update({_id: dataID}, { 
            oilName: oilName, 
            filepath: imageUrl, 
            supplierName: supplierName,
            oilType: oilType,
            functionalSub: functionalSub,
            aromaticSub: aromaticSub,
            blendsWellWith: blendsWellWith,
            aromaticDescription: aromaticDescription,
            aromaType: aromaType,
            classifications: classifications,
            note: note
          })
          .then(doc => {
            res.json({
              status: 'save',
              data: doc
            });
          })
          .catch(err => {
            res.json({
              status: 'failed',
              err: err
            });
          });
        }
        fs.unlink(new_path, function (err) {
          if (err) throw err;
          console.log('successfully deleted!');
        });
    });
  });

  server.post('/drop/editWithoutFile', async function (req, res, next) {
    let {
      supplierName,
      oilName,
      oilType,
      functionalSub,
      aromaticSub,
      blendsWellWith,
      aromaticDescription,
      aromaType,
      classifications,
      note,
      dataID
    } = req.body;   

    Drop.update({_id: dataID}, {
      supplierName: supplierName,
      oilName: oilName,
      oilType: oilType,
      functionalSub: functionalSub,
      aromaticSub: aromaticSub,
      blendsWellWith: blendsWellWith,
      aromaticDescription: aromaticDescription,
      aromaType: aromaType,
      classifications: classifications,
      note: note,
    })
    .then(doc => {
      res.json({
        status: 'save',
        data: doc
      });
    })
    .catch(err => {
      res.json({
        status: 'failed',
        err: err
      });
    }); 
  });

  server.get('/drop/deleteImage', async function(req,res){

    let dataID = req.query.id;
    let deleteName = "";
    await Drop.find({"_id": dataID})
    .then((doc)=>{
      deleteName = doc[0].filepath;
    })
    .catch((err)=>{
      res.json({
        status: 'failed',
        err: err
      });
    });

    await dropBucket.file(path.basename(deleteName)).delete()
    .then((data) => {
      console.log("gc deleted sucess");
      Drop.deleteOne({"_id": dataID})
      .then((doc)=>{
        res.json({
          status: 'deleted'
        });
      })
      .catch((err)=>{
        res.json({
          status: 'failed',
          err: err
        });
      }); 
    })
    .catch(err => {
      res.json({
        status: 'failed',
        err: err
      });
    });

    
  });

  server.post('/merger', async function(req, res){
    console.log("font",req.body.font)
    let arkana0 = await Jimp.loadFont("./public/font/font0/ArkanaScript.ttf.fnt");
    let arkana1 = await Jimp.loadFont("./public/font/font1/ArkanaScript.ttf.fnt");
    let BebasNeue0 = await Jimp.loadFont("./public/font/font0/BebasNeue-Regular.ttf.fnt");
    let BebasNeue1 = await Jimp.loadFont("./public/font/font1/BebasNeue-Regular.ttf.fnt");
    let Lato0 = await Jimp.loadFont("./public/font/font0/Lato-Regular.ttf.fnt");
    let Lato1 = await Jimp.loadFont("./public/font/font1/Lato-Regular.ttf.fnt");
    let Merriweather0 = await Jimp.loadFont("./public/font/font0/Merriweather-Regular.ttf.fnt");
    let Merriweather1 = await Jimp.loadFont("./public/font/font1/Merriweather-Regular.ttf.fnt");
    let Montserrat0 = await Jimp.loadFont("./public/font/font0/Montserrat-Regular.ttf.fnt");
    let Montserrat1 = await Jimp.loadFont("./public/font/font1/Montserrat-Regular.ttf.fnt");
    let OpenSans0 = await Jimp.loadFont("./public/font/font0/OpenSans-Regular.ttf.fnt");
    let OpenSans1 = await Jimp.loadFont("./public/font/font1/OpenSans-Regular.ttf.fnt");
    let Poppins0 = await Jimp.loadFont("./public/font/font0/Poppins-Regular.ttf.fnt");
    let Poppins1 = await Jimp.loadFont("./public/font/font1/Poppins-Regular.ttf.fnt");
    let Ubuntu0 = await Jimp.loadFont("./public/font/font0/Ubuntu-Regular.ttf.fnt");
    let Ubuntu1 = await Jimp.loadFont("./public/font/font1/Ubuntu-Regular.ttf.fnt");

    let font0 = {};
    let font1 = {};
    switch(req.body.font) {
      case "arkana":
        font0 = arkana0;
        font1 = arkana1;
        console.log("arkana")
        break;
      case "BebasNeue":
        font0 = BebasNeue0;
        font1 = BebasNeue1;
        console.log("BebasNeue")
        break;
      case "Lato":
        font0 = Lato0;
        font1 = Lato1;
        console.log("Lato")
        break;
      case "Merriweather":
        font0 = Merriweather0;
        font1 = Merriweather1;
        console.log("Merriweather")
        break;
      case "Montserrat":
        font0 = Montserrat0;
        font1 = Montserrat1;
        console.log("Montserrat")
        break;
      case "Poppins":
        font0 = Poppins0;
        font1 = Poppins1;
        console.log("Poppins")
        break;
      case "Ubuntu":
        font0 = Ubuntu0;
        font1 = Ubuntu1;
        console.log("Ubuntu")
        break;    
      default:
        font0 = OpenSans0;
        font1 = OpenSans1;
        console.log("default")
    }

    let images = [];

    if(req.body.background != "") {
      images.push({
        name: req.body.title.toUpperCase(),
        image: req.body.background
      });
    }

    let topOils = JSON.parse(req.body.top_oil);
    if(topOils.length != 0) {
      topOils.map(oil => {
        images.push({
          name: oil.name.toUpperCase(),
          image: oil.path,
          count: oil.count
        });
      })
    }

    let middleOils = JSON.parse(req.body.middle_oil);
    if(middleOils.length != 0) {
      middleOils.map(oil => {
        images.push({
          name: oil.name.toUpperCase(),
          image: oil.path,
          count: oil.count
        });
      })
    }

    let bottomOils = JSON.parse(req.body.bottom_oil);
    if(bottomOils.length != 0) {
      bottomOils.map(oil => {
        images.push({
          name: oil.name.toUpperCase(),
          image: oil.path,
          count: oil.count
        });
      })
    }


    images.push({image: "https://cdn.shopify.com/s/files/1/0025/0799/7284/files/mark1.png?v=1587375289"});

    console.log(images)

    let jimps = [];   
    console.log("color",req.body.color)
    for(let i=0; i<images.length; i++){
      jimps.push( await Jimp.read(images[i]["image"]));
    }
    await Promise.all(jimps).then(function(){
      return Promise.all(jimps);
    }).then( async function(data){
      data[0].resize(1080,  1080);
      let dropYPosition =  0;
      let titleYPosition = 0;
      let dividYPosition = 0;
      if(jimps.length > 9) {
        dropYPosition = data[0].bitmap.height/7
        titleYPosition= 30;
        dividYPosition = 15
      } else if(jimps.length > 7) {
        dropYPosition = data[0].bitmap.height/6
        titleYPosition = 20;
        dividYPosition = 50;
      } else {
        dropYPosition = data[0].bitmap.height/3
        titleYPosition = 6;
        dividYPosition = 50;
      }
      
      let titleImage = new Jimp(Jimp.measureText(font0, images[0]["name"]), Jimp.measureTextHeight(font0, images[0]["name"], 100));
      titleImage.print(font0, 0, 0, images[0]["name"]);
      if(titleImage.bitmap.width > data[0].bitmap.width) {
        titleImage.resize(data[0].bitmap.width, Jimp.AUTO)
      }
      titleImage.color([{ apply: 'xor', params: [req.body.color] }]);

      data[0].composite(titleImage, (data[0].bitmap.width/2 - titleImage.bitmap.width/2), (data[0].bitmap.height/titleYPosition))

      for(let k=1; k < images.length - 1; k++) {
        data[k].resize(50, 70);
        let dropYP = dropYPosition;
        let dividYP = dropYPosition;
        if(k != 1) {
          for(let j = 1; j < k; j++) {
            dropYP += data[j].bitmap.height + dividYPosition;
            if(j == 1) {
              dividYP += data[j].bitmap.height
            } else {
              dividYP += data[j].bitmap.height + dividYPosition;
            }
            
          }
          let dividLine = new Jimp(data[0].bitmap.width, 500);
          await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE).then(font => {
            dividLine.print(
              font,
              0,
              0,
              {
                text: '------------------------------------------------------------------------------------------',
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
              },
              1080,
              dividYPosition
            );
          });
          dividLine.resize(data[0].bitmap.width*5/6, 500);        
          data[0].composite(dividLine, (data[0].bitmap.width/2 - dividLine.bitmap.width/2), dividYP)
        }

        for(let i = 0; i < images[k]["count"]; i++) {
          data[0].composite(data[k], (data[0].bitmap.width*4/5 - data[k].bitmap.width*i), dropYP)
        }
        let oilName = new Jimp(Jimp.measureText(font1, images[k]["name"]), Jimp.measureTextHeight(font1, images[k]["name"]));
        oilName.print(font1, 0, 0, images[k]["name"]);
        oilName.write(`./public/write/test${k}.png`, function(){
            console.log("sucess!")
        });        
        oilName.color([{ apply: 'xor', params: [req.body.color] }]);       
       
        data[0].composite(oilName, (data[0].bitmap.width*2/5 - oilName.bitmap.width), (dropYP + 10))
      }

      data[0].composite(data[images.length - 1], 0, (data[0].bitmap.height - data[images.length - 1].bitmap.height))   
      
      let mergedFile =  req.body.title.replace(" ", "_") + '_' + Date.now() + "." + data[0].getExtension();
      data[0].write(`./public/write/${mergedFile}`, async function(){
        console.log("merged image!");
        await Final.find({draft: true})
        .then(doc => {
          if(doc.length != 0) {
            let deleteName = doc[0].filepath;
            blendBucket.file(path.basename(deleteName)).delete()
            .then((data) => {
              console.log("gc deleted sucess");
            })
            .catch(err => {
              res.json({
                status: 'failed',
                err: err
              })
            });
          }
        })       

        await blendBucket.upload(`./public/write/${mergedFile}`)
          .then((file) => {
            console.log("upload success!")
            fs.unlink(`./public/write/${mergedFile}`, function (err) {
              if (err) throw err;
              console.log('successfully deleted!');
            });
            Final.find({draft: true})
            .then((doc)=>{
              if(doc.length == 0) {
                let final = new Final({ blendName: req.body.title, filepath: `https://storage.googleapis.com/blendapp/${mergedFile}`, draft: true });
                final.save()
                .then(doc => {
                  res.json({
                    status: 'mergered',
                    data: `https://storage.googleapis.com/blendapp/${mergedFile}`
                  });
                })
                .catch(err => {
                  res.json({
                    status: 'failed',
                    err: err
                  });
                });
              } else {
                Final.update({draft: true}, {
                  blendName: req.body.title, 
                  filepath: `https://storage.googleapis.com/blendapp/${mergedFile}`
                })
                .then(doc => {
                  res.json({
                    status: 'mergered',
                    data: `https://storage.googleapis.com/blendapp/${mergedFile}`
                  });
                })
              }
            })
            .catch((err)=>{
              res.json({
                status: 'failed',
                err: err
              });
            });           
          })
          .catch(err => {
            res.json({
              status: 'failed',
              err: err
            });
          });
      })
    })  
  });

  server.post('/save', async function(req, res){
    let {
      email,
      first_name,
      last_name,
      title,
      background,
      top_oil,
      middle_oil,
      bottom_oil,     
      font,
      color,
      category,
      final_img,
      rate
    } = req.body;

    let final = new Final({ 
      email: email,
      first_name: first_name,
      last_name: last_name,
      blendName: title, 
      filepath: final_img, 
      draft: false,
      background: background,
      top_oil: top_oil,
      middle_oil: middle_oil,
      bottom_oil: bottom_oil,
      font: font,
      color: color,
      category: category,
      pick: false,
      rate: rate
    });
    final.save()
    .then(saveDoc => {
      Final.deleteOne({"draft": true})
      .then((doc)=>{
        console.log("deleted draft")
        res.json({
          status: 'save',
          data: saveDoc
        });
      })
      .catch((err)=>{
        res.json({
          status: 'failed',
          err: err
        });
      });  
    })
    .catch(err => {
      res.json({
        status: 'failed',
        err: err
      });
    });
  })

  server.get('/merged', function(req,res){
    Final.find({draft: false})
      .then((doc)=>{
        res.json(doc);
      })
      .catch((err)=>{
        res.json({
          status: 'failed',
          err: err
        });
      });
  });

  server.post('/customize', async function(req,res){
    const {filepath, blendName} = req.body;

    let newName =  blendName.replace(" ", "_") + '_' + Date.now() + "." + path.extname(filepath);
   
    await blendBucket.file(path.basename(filepath)).copy(blendBucket.file(newName))
    .then((data) => {
      console.log(data)
      console.log("gc copid sucess");
      Final.find({draft: true})
      .then((doc)=>{
        if(doc.length == 0) {
          let final = new Final({ blendName: blendName, filepath: `https://storage.googleapis.com/blendapp/${newName}`, draft: true });
          final.save()
          .then(doc => {
            res.json({
              status: 'copied',
              data: `https://storage.googleapis.com/blendapp/${newName}`
            });
          })
          .catch(err => {
            res.json({
              status: 'failed',
              err: err
            });
          });
        } else {
          Final.update({draft: true}, {
            blendName: blendName, 
            filepath: `https://storage.googleapis.com/blendapp/${newName}`
          })
          .then(doc => {
            res.json({
              status: 'copied',
              data: `https://storage.googleapis.com/blendapp/${newName}`
            });
          })
        }
      })
      .catch((err)=>{
        res.json({
          status: 'failed',
          err: err
        });
      })
    })
    .catch(err => {
      res.json({
        status: 'failed',
        err: err
      })
    });
  });

  server.post('/blend/deleteBlend', function(req,res){
    const {ids} = req.body
    console.log(ids)
    for(let i = 0; i < ids.length; i++) {
      let id = ids[i];
      console.log(id)
      Final.find({_id: id})
      .then((doc)=>{
        let deleteName = doc[0].filepath;
        blendBucket.file(path.basename(deleteName)).delete()
        .then((data) => {
          console.log("gc deleted sucess");
          Final.deleteOne({_id: id})
          .then(deletedDoc => {
            console.log("deleted", id)
            if(i == ids.length - 1) {
              res.json({
                status: 'deleted'
              });
            }
          })
          .catch(err => {
            res.json({
              status: 'failed',
              err: err
            })
            return
          })
        })
        .catch(err => {
          res.json({
            status: 'failed',
            err: err
          })
          return
        });
      })
      .catch((err)=>{
        res.json({
          status: 'failed',
          err: err
        });
        return
      });
    }
   
  });

  server.get('*', (req, res) => {
    return handle(req, res);
  })

  server.listen(port, () => {
    console.log(`App listening on port ${port}`)
  })
}).catch((ex) => {
  console.error(ex.stack)
  process.exit(1)
});
