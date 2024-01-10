
const path = require('path');
const express = require('express');
const router = express.Router();
//const pgp = require('pg-promise')();
const fs = require('fs');
//const stream = require('stream');
const app = express();
const port = 3000; // Set the port you want to use
const axios = require('axios');
const convert = require('xml-js');
//----------------------------------------------------------------------------------------

app.use(express.static('public'))
app.use(express.static('node_modules'))
app.use(express.static('img'))
app.use(express.static('projects'))
//app.use(express.static(path.join(__dirname)));
//--------------------------------------------------------------------------------------------

// Put all of the project names into a dict

function getQGISProjectsDict(projectsPath) {
	const projectsDict = {};
	const projectsImg = {};

	// Get the subdirectories in the projectsPath
	const subdirectories = fs.readdirSync(projectsPath, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);

	// Loop through each subdirectory
	subdirectories.forEach(subdir => {
		const subdirectoryPath = path.join(projectsPath, subdir);

		// Get QGIS project files in the subdirectory
		const qgsFiles = fs.readdirSync(subdirectoryPath)
			.filter(file => file.endsWith('.qgs'))
			.map(qgsFile => {
                const baseName = path.basename(qgsFile, '.qgs');
                return baseName;
            });

		// Store the subdirectory name and QGS files in the projectsDict
		projectsDict[subdir] = qgsFiles.length > 0 ? qgsFiles : null;
		
		const imgFiles = qgsFiles
			.map(qgsFile => {
				//const baseName = path.basename(qgsFile, path.extname(qgsFile));
				const pngFile = path.join(subdirectoryPath, qgsFile + '.png');
				const jpgFile = path.join(subdirectoryPath, qgsFile + '.jpg');
				const jpegFile = path.join(subdirectoryPath, qgsFile + '.jpeg');
				const tiffFile = path.join(subdirectoryPath, qgsFile + '.tiff');
				const gifFile = path.join(subdirectoryPath, qgsFile + '.gif');

				if (fs.existsSync(pngFile)) {
					return qgsFile + '.png';
				} else if (fs.existsSync(jpgFile)) {
					return qgsFile + '.jpg';
				} else if (fs.existsSync(jpegFile)) {
					return qgsFile + '.jpeg';
				} else if (fs.existsSync(tiffFile)) {
					return qgsFile + '.tiff';
				} else if (fs.existsSync(gifFile)) {
					return qgsFile + '.gif';
				} else {
					return '';
				}
			})
			.filter(imgFile => imgFile !== null);

		// Store the subdirectory name and image files in the projectsImg
		projectsImg[subdir] = imgFiles.length > 0 ? imgFiles : null;
	});

	return { projectsDict, projectsImg };
}

// Usage
const directoryPath = path.join(__dirname, 'projects');
const {projectsDict, projectsImg} = getQGISProjectsDict(directoryPath);

app.get('/projectsDict', (req, res) => {
	res.json(projectsDict);
});
app.get('/projectsImg', (req, res) => {
	res.json(projectsImg);
});

var absololute_dir = {}
absololute_dir['dir'] = directoryPath
app.get('/directoryPath', (req, res) => {
	res.json(absololute_dir);
});

//----------------------------------------------------------------------------------

app.get('/:subfolder/:qgisProject/getQgsData', (req, res) => {
	const mainProject = req.params.subfolder;
	const QGISProject = req.params.qgisProject;
	const qgsFilePath = __dirname+'/projects/'+mainProject+'/'+QGISProject+'.qgs';
	
	fs.readFile(qgsFilePath, 'utf-8', (err, data) => {
		if (err) {
			console.error(err);
			return;
		}
	const qgs = convert.xml2js(data, {compact: false });
	//console.log(qgs.elements[1].elements[14].elements[1].elements.pop().elements[0].text)
	//console.log(qgs.elements[1].elements[14].elements[2].elements[2].elements[0].text)
	res.json(qgs);
	});
});

//--------------------------------------------------------------------------------

app.get('/:subfolder/:qgisProject/getQgsConf', (req, res) => {
	const mainProject = req.params.subfolder;
	const QGISConfig = req.params.qgisProject;
	const qgsConfPath = __dirname+'/projects/'+mainProject+'/'+QGISConfig+'.qgs.cfg';
	
	fs.readFile(qgsConfPath, 'utf-8', (err, data) => {
		if (err) {
			console.error(err);
			return;
		}
	var parsedObject = JSON.parse(data);
	res.json(parsedObject);
	});
});


//--------------------------------------------------------------------------------
//var domain = "http://localhost:3000"


app.get('/:subfolder/:qgisProject/getWFS/:layername', async (req, res) => {
	const mainProject = req.params.subfolder;
	const QGISProject = req.params.qgisProject;
	const qgsFilePath = __dirname+'/projects/'+mainProject+'/'+QGISProject+'.qgs';

	const layerName = req.params.layername;
	const encodedLayername = layerName.replace(/ /g, '_');
	var domain = "https://bbvnewgeoportal.onrender.com"
	const WfsUrl = domain+'/cgi-bin/qgis_mapserv.fcgi.exe?MAP='+qgsFilePath+'&SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME='+encodedLayername+'&OUTPUTFORMAT=application/json';
	try {
    // Fetch WFS data from QGIS server
		const response = await axios.get(WfsUrl);
		const wfsData = response.data;

		res.json(wfsData);
	} catch (error) {
		console.error('Error fetching or processing WFS data:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});
 
 
//--------------------------------------------------------------------------------

router.get('/:subfolder/:qgisProject', function(req, res) {
	const mainProject = req.params.subfolder;
	const QGISProject = req.params.qgisProject;
	const qgsFilePath = __dirname+'/projects/'+mainProject+'/'+QGISProject+'.qgs';
	const qgsConfPath = __dirname+'/projects/'+mainProject+'/'+QGISProject+'.qgs.cfg';
	if ((fs.existsSync(qgsFilePath)) && (fs.existsSync(qgsConfPath))) {
		res.sendFile(path.join(__dirname + '/index.html'));
	}else{
		res.status(404).send('Project not found');
	}
});


app.use('/', router);


// app.listen(port, () => {
  // console.log(`Server is listening on port ${port}`);
// });

app.listen(process.env.port || 3000);
console.log('Running at Port 3000');


