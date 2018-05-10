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
app.post('/profile', urlencodedParser, function(req, res) {
 // mock up
 let serviceParam = {
    serviceKey: uuid('sararons'),
    secretKey: uuid(),
    path: '/someWhere',
    name: 'sararons'
  }

  Service.create(serviceParam , function(err, service) {
     if(err) {
      console.error(err.stack)
      res.status(500).send('Error can not create data')
     }
     else{

      response = {
        serviceId: service._id,
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
    
      Profile.create(response, function(err, data) {
        console.log('data', data);
        res.send(data);
      });
   
    }
  }); //  end create


})

app.get('/file' , (req , res) => {

  fs.readFile("uploads/videoOriginal/a1908289-09f8-4784-971c-3e34a15fc0b1.mp4", "utf8", function(err, data){
    if(err) throw err;
     
  console.log(data);
  //  var resultArray = //do operation on data that generates say resultArray;
  console.log("file");
  res.send("get file");
    
 });


})

app.post('/up',(req, res) => {

  var busboy = new Busboy({
    headers: req.headers
  });


  busboy.on('field',(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
     res.status(500).send({ error: "Your image was incorrect"});
  // //  res.end();
  //    return; // THIS IS VERY IMPORTANT!
     
});

  busboy.on('finish', function() {
    // console.log(result);
    try{
     res.send('Success');
    }catch(ex){
      console.log("catch error");
    }

  });


  




  req.pipe(busboy);
})


app.post('/upload', async (req, res) => {
  // console.log("------body: "+req.body);
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
    }
  });
  req.pipe(busboy);
})

function checkService(service) {
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
      match: { deleted: false },
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
