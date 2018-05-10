const express = require('express');
const app = express();
const fs = require("fs");
const bodyParser = require('body-parser');
const uuid = require('uuidv4');
const path = require('path');
const Busboy = require('busboy');
const Jimp = require('jimp');
const mongoDB = 'mongodb://127.0.0.1/media';
const mongoose = require('mongoose');
const Service = require('./models/service');
const Media = require('./models/media');
const async = require('async');
const exec = require('child_process').exec;
var qs = require('querystring');

mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(express.static('public'));
app.use(bodyParser.raw("application/from-data"))
app.use(bodyParser.urlencoded({
  extended: true
}));
var urlencodedParser = bodyParser.urlencoded({
  extended: false
})

app.get('/index.html', function(req, res) {
  res.sendFile(__dirname + "/" + "index.html");
})

app.post('/service', urlencodedParser, function(req, res) {
  const serviceKey = uuid(req.body.name);
  const secretKey = uuid();
  const nameService = req.body.name;
  console.log('nameService', nameService);
  response = {
    serviceKey: serviceKey,
    path: '/test',
    secretKey: secretKey,
    name: req.body.name
  };

  Service.create(response, function(err, data) {
    console.log('data', data);
    console.log(err);
    res.send(data);
  });
})

app.post('/upload', async (req, res) => {
  // console.log("------body: "+req.body);
  let dir;
  var busboy = new Busboy({
    headers: req.headers
  });
  let data = {}
  let media = {}
  const result = [];
  let serviceKey = {};
  await busboy.on('field', async (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
    data[fieldname] = val;
    console.log('========1==========');
    await busboy.on('field', async (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
      serviceKey = await Service.findOne(data);
      console.log('========2==========');
      res.end();
    });
  });

  await busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
    console.log('========3==========');
    console.log('serviceKey', serviceKey);
    if (mimetype === "image/jpeg" || mimetype === "image/png" || mimetype === "video/mp4") {
      const pathFloder = mimetype === "video/mp4" ? '/uploads/videoOriginal/' : '/uploads/imageOriginal/';
      const file_ext = filename.split('.').pop();
      const newFile = uuid();
      dir = __dirname + pathFloder + newFile + '.' + file_ext;
      file.pipe(fs.createWriteStream(dir));
      const data = {
        path: dir,
        mimetype: mimetype
      };
      result.push(data);
      file.on('end', function() {
        console.log('Finished');
      });
    }
  })

  //   -F upload=@/Users/slim/Desktop/S__29261855.jpg \
  // curl -v \
  // -F serviceKey=bb29038a-78a1-49e6-b18e-60201bb4e557 \
  // -F secretKey=4befb4af-867b-46f0-bec0-f42da96ffc95 \
  // http://127.0.0.1:8081/upload

  busboy.on('finish', function() {
    // console.log(result);
    console.log('Done parsing form!');
    // checkType(result);
    // res.writeHead(303, {
    //   Connection: 'close',
    //   Location: '/'
    // });
    // return res.end();
    return res.send('Success');

  });
  req.pipe(busboy);
})

function createMedia(obj) {
  Media.create(obj)
}

function checkType(path) {
  path.map(url => {
    if (url.mimetype === "image/jpeg" || url.mimetype === "image/png") {
      resizeImageSmall(url)
    }
    if (url.mimetype === "video/mp4") {
      coverVideo(url)
    }
  })
}

function resizeImageSmall(url) {
  const width = 300;
  const quality = 90;
  const filename = url.path.split('/');
  const pathSmall = __dirname + '/uploads/imageSmall/' + filename[7];

  Jimp.read(url.path)
    .then(obj => {
      obj
        //   .exifRotate() // set Rotate img
        .resize(width, obj.bitmap.height * (width / obj.bitmap.width), Jimp.RESIZE_BEZIER) // resize
        .quality(quality) // set JPEG quality
        .write(`${pathSmall}`); // set JPEG quality })
    })
}

function coverVideo(url) {
  let filename = url.path.split('/');
  filename = filename[7].split('.');
  console.log('filename', filename);
  const coverSmall = __dirname + '/uploads/coverVideoSmall/' + filename[0] + '.jpg';

  console.log('coverSmall', coverSmall, url.path);
  exec(`ffmpeg -loglevel debug -y -i "${url.path}" -frames 10 -q:v 1 -vf fps=1 ${coverSmall}`);
}

var server = app.listen(8081, function() {
  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)
})
