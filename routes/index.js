var express = require('express');
var router = express.Router();

var multer = require('multer');
var upload = multer({
  dest: 'public/carImages/'
});
var vision = require('@google-cloud/vision');
var client = new vision.ImageAnnotatorClient({
  keyFilename: 'My First Project-a44c63fcddcb.json'
});

var Sequelize = require('sequelize');
var sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  operatorsAliases: false,

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },

  // SQLite only
  storage: 'database.sqlite'
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

var CarLog = sequelize.define('carLog', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  numberPlate: {
    type: Sequelize.STRING
  },
  entryTime: {
    type: Sequelize.DATE
  },
  exitTime: {
    type: Sequelize.DATE
  }
});

CarLog.sync({
  force: false
}).then(() => {
  console.log('Car Log Table Initialized');
});

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Express'
  });
});

router.post('/tol1/uploadImage', upload.single('car'), function (req, res, next) {
  console.log('File uploaded: ' + req.file.path);
  client
    .textDetection(req.file.path)
    .then(results => {
      var labels = results[0].textAnnotations;
      CarLog.create({
        numberPlate: labels[0].description,
        entryTime: new Date()
      });
      console.log(labels[0].description);
    })
    .catch(err => {
      console.error('ERROR:', err);
    });

  res.end("Uploaded");
});

router.post('/tol2/uploadImage', upload.single('car'), function (req, res, next) {
  console.log('File uploaded: ' + req.file.path);
  client
    .textDetection(req.file.path)
    .then(results => {
      var labels = results[0].textAnnotations;
      CarLog.findAll({
        limit: 1,
        where: {
          numberPlate: labels[0].description
        },
        order: [
          ['entryTime', 'DESC']
        ]
      }).then(carLog => {
        var car = carLog[0];
        CarLog.update({
          exitTime: new Date()
        }, {
          where: {
            id: car.id
          }
        }).then(() => {
          console.log("Car log updated");
          res.end("Car Log Updated");
        });
      });
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
});


module.exports = router;