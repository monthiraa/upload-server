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
const Image = require('./models/image');
const Video = require('./models/Video');
const Cover = require('./models/Cover');
const async = require('async');
const exec = require('child_process').exec;
const qs = require('querystring');
const Profile = require('./models/profile');

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
    res.send(data);
  });
})

// Create profile
app.post('/profile',  async function(req, res) {

let queryString = {
  serviceKey: req.body.serviceKey,
  secretKey: req.body.secretKey 
}    

  let serviceData  =  await  checkService(queryString)
  if(serviceData != null && serviceData != undefined){
          let profileParam = {
                serviceId: serviceData._id,
                mediaType : req.body.mediaTypex,
                name: req.body.name,
                config : {
                  width : req.body.width,
                  height : req.body.height,
                  quality : req.body.quality,
                  outputType: req.body.outputType
                },
                path:'/uploads'
          };
  
          Profile.create(profileParam , function(err, data) {
            if(err){
              res.status(422).send({ error: 'Cannot create profile' })
            }else{
              res.send(data);
            }
          });
  
   }else{
            res.status(422).send({ error: 'Not found service key' })
  }

})


app.post('/upload', async (req, res) => {
  let dir;
  var busboy = new Busboy({
    headers: req.headers
  });
  let data = {};
  let cover;
  let service;
  let sumSize = 0;
  await busboy.on('field', async (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
    data[fieldname] = val;
    await busboy.on('field', async () => {
      service = await checkService(data);
      if (!service) {
        res.writeHead(500, {
          'Connection': 'close'
        });
        res.end({
          error: {
            errorCode: 500,
            message: 'Service not found'
          }
        });
      }
    });
  });

  await busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype === "image/jpeg" || mimetype === "image/png" || mimetype === "video/mp4") {
      const pathFloder = mimetype === "video/mp4" ? '/uploads/videoOriginal/' : '/uploads/imageOriginal/';
      const file_ext = filename.split('.').pop();
      const newFile = uuid();
      dir = __dirname + pathFloder + newFile + '.' + file_ext;
      file.pipe(fs.createWriteStream(dir));
      file.on('data', data => {
        sumSize = sumSize + data.length;
      });
      file.on('end', () => {
        data = {
          path: dir,
          mimetype: mimetype,
          size: sumSize,
          fileName: newFile + '.' + file_ext,
          type: file_ext
        };
      });
    }
  })

  busboy.on('finish', async () => {
    try {
      if (service && data) {
        if (data.mimetype === "video/mp4") {
          const coverVod = await coverVideo(data.path);
          const cover = await createCover(coverVod, service);
          const video = await createVideo(data, cover._id, service);
          const myVideo = await findVideo(video._id)
          res.send(myVideo);
        } else {
          const image = await createImage(data, service);
          res.send(image);
        }
      } else {
        res.writeHead(500, {
          'Connection': 'close'
        });
        res.end({
          error: {
            errorCode: 500,
            message: 'Upload fail'
          }
        });

      }
    } catch (e) {
      // console.log(e);
    }
  });
  req.pipe(busboy);
})

function checkService(service, res) {
  const serv = Service.findOne(service);
  return serv;
}

function createVideo(data, coverId, service) {
  const queryVideo = {
    host: service.host,
    path: data.path,
    type: data.mimetype,
    fileName: data.fileName,
    serviceId: service._id,
    coverId: [coverId]
  }
  const vod = Video.create(queryVideo);
  return vod;
}

function findVideo(videoId) {
  const video = Video.findById(videoId)
    .populate({
      path: 'coverId',
      model: 'Cover',
      match: {
        deleted: false
      },
    });
  return video;
}

function createCover(cover, service) {
  const queryCover = {
    host: service.host,
    path: cover.path,
    type: cover.mimetype,
    fileName: cover.fileName,
    serviceId: service._id
  }
  const newCover = Cover.create(queryCover);
  return newCover;
}

function coverVideo(url) {
  let filename = url.split('/');
  filename = filename[7].split('.');
  const coverPath = __dirname + '/uploads/coverVideoOriginal/' + filename[0] + '.jpg';
  exec(`ffmpeg -loglevel debug -y -i "${url}" -frames 10 -q:v 1 -vf fps=1 ${coverPath}`);
  const result = {
    path: coverPath,
    fileName: filename[0] + '.jpg',
    mimetype: 'image/jpg'
  }
  return result;
}

function createImage(data, service) {
  const queryImage = {
    host: service.host,
    path: data.path,
    type: data.mimetype,
    fileName: data.fileName,
    serviceId: service._id,
    size: data.size
  }
  const image = Image.create(queryImage);
  return image;
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




var server = app.listen(8081, function() {
  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)
})
