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
require('alchemymvc');

// Intercept uncaught exceptions so the server won't crash
// @todo: this should be expanded and integrated into alchemy itself
process.on('uncaughtException', function(error) {

	// Indicate we caught an exception
	log.error('Uncaught Exception!', {err: error});
	console.log(error.stack)
});

alchemy.start(function onAlchemyReady() {

});