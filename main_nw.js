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
var gui = require('nw.gui'),
    win,
    bg;

process.on('uncaughtException', function onException(error) {
	console.log('Uncaught exception:', e);
	//process.stdout.write('Error: ' + error + '\n');
});

// Get background window
bg = nw.Window.get();
bg.showDevTools();

require('alchemymvc');

alchemy.start(function onAlchemyReady() {

	console.log('Alchemy is ready!');

	// Do certain things when alchemy is ready
	new_win = gui.Window.open('http://127.0.0.1:3000/');

});