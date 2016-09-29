/**
 * Alchemy: a node.js framework
 * Copyright 2014-2015, Jelle De Loecker
 *
 * Licensed under The MIT License
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright 2014-2015, Jelle De Loecker
 * @link          
 * @license       MIT License (http://www.opensource.org/licenses/mit-license.php)
 */
var electron = require('electron'),
    BrowserWindow = electron.BrowserWindow,
    protocol = electron.protocol,
    libpath = require('path'),
    app = electron.app,
    win;

process.on('uncaughtException', function onException(error) {
	console.log('Error:', error);
});

// Start alchemy
require('alchemymvc');

if (alchemy.settings.environment == 'dev') {
	app.setPath('userData', libpath.resolve(app.getPath('appData'), 'catbell_dev'));
}

// Override some defaults
//alchemy.hawkejs.root = 'alc://';

// Client file download strategy
// blocking   : download and execute in the head
// preventing : downloading asynchronously, but preventing "ready" event (default)
// defer      : only execute after ready event
alchemy.hawkejs.strategy = 'blocking';

protocol.registerStandardSchemes(['alc']);

// Start alchemy immediately (that's what the false is for)
Function.parallel(false, function startAlchemy(next) {
	alchemy.start(next);
}, function waitForApp(next) {
	app.on('ready', function onReady() {
		next();
	});
}, function ready(err) {

	var local_url;

	if (err) {
		return console.error('Electron encountered an error:', err);
	}

	local_url = 'http://localhost:' + alchemy.settings.port + '/';

	// Currently doesn't support setting headers, unfortunately
	protocol.registerBufferProtocol('b_alc', function onAlchemyRequest(request, callback) {
		//var url = request.url.substr(7);
		console.log('Alchemy request:', request);
		Router.resolveElectron(request, callback);
		
		//callback({path: path.normalize(__dirname + '/' + url)});
	}, function onProtocolError(error) {
		if (error)
		console.error('Failed to register protocol')
	});

	protocol.registerHttpProtocol('alc', function onAlchemyHttpRequest(request, callback) {

		var originalUrl = request.url,
		    url;

		url = originalUrl.replace('alc:///', 'http://localhost:3000/');
		url = url.replace('alc://', 'http://localhost:3000/');
		url = url.replace('alc:/', 'http://localhost:3000/');

		//console.log('Redirecting request', request, 'to', url);

		request.url = url;
		callback(request);
	});

	// Create the browser window.
	mainWindow = new BrowserWindow({
		width              : 800,
		height             : 600,
		title              : 'Catbell notes',
		'node-integration' : false,
		icon               : libpath.resolve(PATH_APP, 'assets', 'images', 'oxygen_note.png')
	});

	// and load the index.html of the app.
	//mainWindow.loadURL('alc:///');
	mainWindow.loadURL(local_url + 'notes');

	// Open the DevTools.
	mainWindow.webContents.openDevTools();

	// Emitted when the window is closed.
	mainWindow.on('closed', function() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});
});