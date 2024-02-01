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
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const session = require('express-session');
const nodemailer = require('nodemailer');
//----------------------------------------------------------------------------------------

app.use(express.static('styles'))
app.use(express.static('node_modules'))
app.use(express.static('img'))
app.use(express.static('projects'))
app.use(express.static('libraries'))
//--------------------------------------------------------------------------------------------

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
	secret: '*****',
	resave: false,
	saveUninitialized: true,
}));

const pool = new Pool({
	user: '***********',
	host: '***************',
	database: '******************',
	password: '*******************',
	port: 63303,
});

const authenticate = (req, res, next) => {
	if (req.session && req.session.user) {
    // User is authenticated, proceed to the next middleware or route
		return next();
	} else {
    // Redirect to the login page if the user is not authenticated
		req.session.requestedUrl = req.originalUrl;
		res.redirect('/signin');
	}
};

app.get('/home', authenticate,(req, res) => {
  res.sendFile(__dirname + '/home.html');
});

app.get('/signin', (req, res) => {
	if (req.session.user) {
		return res.redirect('/home');
	}else{
		res.sendFile(__dirname + '/signin.html');
	}
});



app.get('/signup', (req, res) => {
	if (req.session.user) {
		return res.redirect('/home');
	}else{
		res.sendFile(__dirname + '/signup.html');
	}
});

const transporter = nodemailer.createTransport({
	host: 'smtp.office365.com',
	port: 587,
	secure: false,
	auth: {
		user: 'mostafa.kheyrollahi@infrafibre-networks.de', // Your Outlook email address
		pass: '*********************', // Your Outlook email password
	},
});

const verificationCodes = {};
let signupUserInfo = [];
app.post('/signup', async (req, res) => {
	const { name, username, password } = req.body;
	

	if (!name || !username || !password) {
		return res.json({ status: 'error', error: 'Name, username and password are required.' })
	}
	
	if (!username || typeof username !== 'string') {
		return res.json({ status: 'error', error: 'Invalid username' })
	}

	if (!password || typeof password !== 'string') {
		return res.json({ status: 'error', error: 'Invalid password' })
	}

	if (password.length < 6) {
		return res.json({
			status: 'error',
			error: 'Password too small. Should be at least 6 characters'
		})
	}
	
	try {
		const userExists = await pool.query('SELECT * FROM users WHERE username_email = $1', [username]);

		if (userExists.rows.length > 0) {
			return res.json({ status: 'error', error: 'Username already exists. Please choose another one.' })
		}
		
		const verificationCode = Math.floor(100000 + Math.random() * 900000);
		
		 req.session.registrationInfo = {
			username: req.body.username,
			password: req.body.password,
			verificationCode,
		};
		
		const mailOptions = {
			from: 'mostafa.kheyrollahi@infrafibre-networks.de',
			to: username,
			subject: 'Verification Code for Signup',
			text: `Your verification code is: ${verificationCode}`,
		};

		await transporter.sendMail(mailOptions);
		verificationCodes[username] = verificationCode;
		signupUserInfo = [ name, username, password ];
		res.redirect('/verify');

	} catch (error) {
		console.error('Error during signup:', error);
		return res.json({ status: 'error', error: 'Internal Server Error' })
	}
});

app.get('/verify', (req, res) => {
	if (req.session.user) {
		return res.redirect('/home');
	}else if (!req.session.registrationInfo) {
		res.redirect('/signup');
	}else{
		res.sendFile(__dirname + '/verify.html');
	}
});

app.post('/verify', async(req, res) => {
	const { verificationCode } = req.body;

	// Retrieve the stored verification code
	const storedVerificationCode = verificationCodes[signupUserInfo[1]];

	if (!storedVerificationCode || verificationCode !== storedVerificationCode) {
		return res.json({ status: 'error', error: 'Invalid verification code.' });
	}

	// Verification successful, insert the user into the database
	await pool.query('INSERT INTO users (personal_name, username_email, password, usertype) VALUES ($1, $2, $3, $4)', [signupUserInfo[0], signupUserInfo[1], signupUserInfo[2], 'User']);

	// Clear the stored verification code
	delete verificationCodes[signupUserInfo[1]];
	signupUserInfo.length = 0;
	delete req.session.registrationInfo;
	// Redirect to a success page or login page
	res.redirect('/signin');
});


app.post('/signin', async (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.json({ status: 'error', error: 'Username and password are required.' });
	}

	try {
		const result = await pool.query('SELECT * FROM users WHERE username_email = $1 AND password = $2', [
			username,
			password,
		]);

		if (result.rows.length === 0) {
			//return res.status(401).send('Invalid username or password.');
			return res.json({ status: 'error', error: 'Invalid username or password.'});
		}

		// Store user information in the session
		req.session.user = { username: result.rows[0].username};

		const requestedUrl = req.session.requestedUrl;
		delete req.session.requestedUrl; // Clear the stored URL

		if (requestedUrl && (requestedUrl == req.session.requestedUrl || '/:subfolder/:qgisProject')) {
			res.json({ status: 'ok', redirectUrl: requestedUrl });
		} else {
			res.json({ status: 'ok', redirectUrl: '/home' });
		}
	} catch (error) {
		console.error('Error during signin:', error);
		return res.json({ status: 'error', error: 'Internal Server Error'});
	}
});





//---------------------------------------------------------------------------------------------

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
absololute_dir['dir'] = directoryPath;
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
	//console.log(qgs.elements[1].elements[16].elements[50].elements[1].elements[23].elements[0].text)
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
var domain = "http://localhost:9000"
//var domain = "https://bbvnewgeoportal.onrender.com";

app.get('/:subfolder/:qgisProject/getWFS/:layername', async (req, res) => {
	const mainProject = req.params.subfolder;
	const QGISProject = req.params.qgisProject;
	const qgsFilePath = __dirname+'/projects/'+mainProject+'/'+QGISProject+'.qgs';

	const layerName = req.params.layername;
	const encodedLayername = layerName.replace(/ /g, '_');
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

router.get('/:subfolder/:qgisProject', authenticate,(req, res) =>{
	const mainProject = req.params.subfolder;
	const QGISProject = req.params.qgisProject;
	const qgsFilePath = __dirname+'/projects/'+mainProject+'/'+QGISProject+'.qgs';
	const qgsConfPath = __dirname+'/projects/'+mainProject+'/'+QGISProject+'.qgs.cfg';

	if ((fs.existsSync(qgsFilePath)) && (fs.existsSync(qgsConfPath))) {
		res.sendFile(path.join(__dirname + '/index.html'));
	}else{
		//res.status(404).send('The QGIS project or its config file are not found');
		return res.json({ status: 'error', error: 'The QGIS project or its config file are not found'});
	}
});
//------------------------------------------------------------------------------------

app.get('/signout', (req, res) => {
    // Destroy the user session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Internal Server Error');
        }
        // Redirect to the sign-in page after successful sign-out
        res.redirect('/signin');
    });
});

//-------------------------------------------------------------------------------------


router.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/wmtstest.html'));
});


app.use('/', router);


// app.listen(port, () => {
  // console.log(`Server is listening on port ${port}`);
// });

app.listen(process.env.port || 3000);
console.log('Running at Port 3000');


