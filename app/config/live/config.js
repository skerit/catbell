/**
 * Live Environment configuration:
 * these settings override the default.js and can be overridden by local.js
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright   Copyright 2013-2015
 * @since       0.1.0
 * @license     http://www.opensource.org/licenses/mit-license.php MIT License
 */
module.exports = {

	// Disable debug
	debug: false,

	// Enable hawkejs client
	hawkejs_client: true,

	// Don't do expensive log traces
	log_trace: false,

	// Don't start janeway
	janeway: false,

	// Disable CSS minification
	minify_css: false,

	// Disable JS minification
	minify_js: false
};