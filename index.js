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
//const { Client } = require('pg');
const pgp = require('pg-promise')();
const fs = require('fs');
//const JSONStream = require('JSONStream');
//const QueryStream = require('pg-query-stream');
//const { spawn } = require('child_process');
const stream = require('stream');

const app = express();
const port = 3000; // Set the port you want to use

app.use(express.static('public'))
app.use(express.static('node_modules'))
app.use(express.static('img'))

//--------------------------------------------------------------------------------------------
// app.get('/get-layer/:database/:shape/:table', (req, res) => {
	// const database = req.params.database;
	// const shape = req.params.shape;
	// const table = req.params.table;
	// var geomshape = '';
	// if (shape == 'point') {
        // geomshape = 'geometry'
	// } else {
		// geomshape = 'geom'
	// }
	
	// var connectionConfig = {
		// user: 'BBVGISAdmin',
		// database: database,
		// password: 'BBVQGIS01',
		// host: 'geoportal.bbv-deutschland.de', // Change this to your database server host
		// port: 63303,      // Change this to your database server port
	// };
	// const client = new Client(connectionConfig);
	// client.connect();
	// const query = client.query('SELECT *, ST_AsGeoJSON(ST_Transform('+geomshape+', 4326)) as geojson FROM '+table+' limit 5 ');
	// res.setHeader('Content-Type', 'application/json');
	// query.stdout.pipe(res)

	// query.on("close", function (data) {
    // console.log("done writing");
   // });
// });
	
	
//-----------------------------------------------------------------------------------------

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
			 //...row
			 column1: row.geometry
        },
      }));
	  
	  const geojsonData = {
        type: 'FeatureCollection',
        features,
      };
		
    const geojsonString = JSON.stringify(geojsonData);
	
	res.setHeader('Content-Type', 'application/json');
	const geojsonStream = new stream.Readable();
	geojsonStream._read = () => {};
	geojsonStream.push(geojsonString);
	geojsonStream.push(null); // Signal the end of the stream
	geojsonStream.pipe(res);
    
	
	
	
	
	
	
	
	
	
	// const geojsonStream = JSONStream.parse('*');
	// geojsonData.pipe(geojsonStream);
	
	// geojsonStream.on('data', (feature) => {
  // Process each chunk of GeoJSON data
		// console.log(feature);

  // Send the GeoJSON chunk to your client or do other processing
	// });
	
	// const p = JSON.parse(geojsonString);
	// for(var attributename in geojsonData){
    // console.log(geojsonData[attributename]);
	// var s = JSON.stringify(geojsonData[attributename]);
	// res.send(s);
	// }
	
	// readableStream.pipe(res);
	// const parser = JSONStream.parse('*');
	// parser.on('data', (geojsonData) => {
  // Process each chunk of parsed JSON data
	// JSON.stringify(geojsonData);
  // Example: Log the data
  // console.log(geojsonString);
	// });
	// console.log("ff");
	// const parser = JSONStream.parse('*');
	// var p = geojsonData.pipe(parser);
	// var spawn = require('child_process').spawn;
	// const childProcess = spawn('node', [], { stdio: ['pipe', 'pipe', 'pipe'] });
	// let geojsonStrin = JSON.parse(JSON.stringify(geojsonData));
	// console.log(geojsonStrin);
	// geojsonString.stdout.pipe(res);
	
	// res.send(geojsonString);
	// childProcess.stdout.pipe(res)
		//res.send(geojsonString);

    //console.log(process.memoryUsage().heapUsed / 1024 / 1024);
	 
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


