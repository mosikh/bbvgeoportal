// const express = require('express')
// const app = express()
// const port = 3000
// const path = require('path');
// const router = express.Router();


// app.use(express.static('public'))
// app.use(express.static('node_modules'))
// app.use(express.static('img'))

// app.get('/users',callName);


// function callName( req, res ) {
// var spawn = require('child_process').spawn;
// let command = spawn("php", [ "./index.php",req.query.db, req.query.shape, req.query.crm]);
  // command.stdout.pipe(res)
  // command.on("close", function (data) {
    // console.log("done writing");
   // });
 // };




// router.get('/', function(req, res) { 
	// res.sendFile(path.join(__dirname + '/index.html'));
// });

// app.use('/', router); 
// app.listen(process.env.port || 3000);
// console.log('Running at Port 3000');

//------------------------------------------------------------------------------
//Chatgpt
const path = require('path');
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const pgp = require('pg-promise')();
const fs = require('fs');
//const JSONStream = require('JSONStream');



const app = express();
const port = 3000; // Set the port you want to use

app.use(express.static('public'))
app.use(express.static('node_modules'))
app.use(express.static('img'))



app.get('/get-layer/:database/:shape/:table', (req, res) => {
	const database = req.params.database;
	const shape = req.params.shape;
	const table = req.params.table;
	var geomshape = '';
	if (shape == 'point') {
        geomshape = 'geometry'
	} else {
		geomshape = 'geom'
	}
	
	var connectionConfig = {
		user: 'BBVGISAdmin',
		database: database,
		password: 'BBVQGIS01',
		host: 'geoportal.bbv-deutschland.de', // Change this to your database server host
		port: 63303,      // Change this to your database server port
	};
	var db = pgp(connectionConfig);
	
  db.any('SELECT *, ST_AsGeoJSON(ST_Transform('+geomshape+', 4326)) as geometry FROM '+table+' ')
    .then((data) => {
      const features = data.map((row) => ({
        type: 'Feature',
        geometry: JSON.parse(row.geometry),
        properties: {
			 ...row
        },
      }));
	  
	  const geojsonData = {
        type: 'FeatureCollection',
        features,
      };
		
    const geojsonString = JSON.stringify(geojsonData);
	//const parser = JSONStream.parse('*');
	//parser.on('data', (geojsonData) => {
  // Process each chunk of parsed JSON data
	// JSON.stringify(geojsonData);
  // Example: Log the data
  //console.log(geojsonString);
	//});
	//console.log("ff");
	//const parser = JSONStream.parse('*');
	// var p = geojsonData.pipe(parser);
	//var spawn = require('child_process').spawn;
	//const childProcess = spawn('node', [], { stdio: ['pipe', 'pipe', 'pipe'] });
	//let geojsonStrin = JSON.parse(geojsonString);
	//geojsonStrin.stdout.pipe(res);
	//console.log(geojsonString);
	res.send(geojsonString);
	//childProcess.stdout.pipe(res)
		//res.send(geojsonString);
     });
});
//----------------------

router.get('/', function(req, res) { 
	res.sendFile(path.join(__dirname + '/index.html'));
});

app.use('/', router); 

// app.listen(port, () => {
  // console.log(`Server is listening on port ${port}`);
// });

app.listen(process.env.port || 3000);
console.log('Running at Port 3000');


