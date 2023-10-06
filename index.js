const express = require('express')
const app = express()
const port = 3000
const path = require('path');
const router = express.Router();


app.get('/users',callName);


function callName( req, res ) {
var spawn = require('child_process').spawn;
let command = spawn("php", [ "./index.php",req.query.db, req.query.shape, req.query.crm]);
  command.stdout.pipe(res)
  command.on("close", function (data) {
    console.log("done writing");
  });
};


app.use(express.static('public'))
app.use(express.static('node_modules'))
app.use(express.static('img'))


router.get('/', function(req, res) { 
	res.sendFile(path.join(__dirname + '/index.html'));
});

app.use('/', router); 
app.listen(process.env.port || 3000);
console.log('Running at Port 3000');

//------------------------------------------------------------------------------

// var app = express()
  // , server = require('https').createserver(app)
  // , io = io.listen(server);
  
// app.get('/users',callName);


// function callName( req, res ) {
// var spawn = require('child_process').spawn;
// let command = spawn("php", [ "./index.php",req.query.db, req.query.shape, req.query.crm]);
  // command.stdout.pipe(res)
  // command.on("close", function (data) {
    // console.log("done writing");
  // });
// };


// app.use(express.static('public'))
// app.use(express.static('node_modules'))
// app.use(express.static('img'))


// app.get('/', function(req, res) {
  // res.sendfile('./index.html');
// });
// server.listen(80);

//------------------------------------------------------------------------------

// const express = require('express')
// const app = express()
// const port = 3000
// const path = require('path');
// const router = express.Router();
// var pg = require('pg');

// var connectionString = "postgres://BBVGISAdmin:BBVQGIS01@sgeoportal.bbv-deutschland.de:63303/BBVCRMMirror";
// var pgClient = new pg.Client(connectionString);
// pgClient.connect();
// //var query = pgClient.query("SELECT *, ST_AsGeoJSON(ST_Transform(geometry, 4326)) As geojson FROM crm_nok_gee_mirror");

// app.get('/users',callName);

// function callName(req, res) {
	// var gebiet = req.query.level;
	// qu = pgClient.query('SELECT *, ST_AsGeoJSON(ST_Transform(geometry, 4326)) As geojson FROM crm_'+gebiet+'_gee_mirror limi 5');
	// res.send({
    // 'geo': nok
  // });
// };


// // function callName( req, res ) {
// // var spawn = require('child_process').spawn;
// // let command = spawn("php", [ "./index.php",req.query.db, req.query.shape, req.query.crm]);
  // // command.stdout.pipe(res)
  // // command.on("close", function (data) {
    // // console.log("done writing");
  // // });
// // };


// app.use(express.static('public'))
// app.use(express.static('node_modules'))
// app.use(express.static('img'))


// router.get('/', function(req, res) { 
	// res.sendFile(path.join(__dirname + '/index.html'));
// });

// app.use('/', router); 
// app.listen(process.env.port || 3000);
// console.log('Running at Port 3000');