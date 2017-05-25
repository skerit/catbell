/**
 * The Setting Controller class
 *
 * @constructor
 * @extends       Classes.Alchemy.AppController
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
var Setting = Function.inherits('Alchemy.AppController', function SettingController(conduit, options) {
	SettingController.super.call(this, conduit, options);
});

/**
 * Show settings index page
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 *
 * @param   {Conduit}   conduit
 */
Setting.setMethod(function index(conduit) {

	var that = this;

	that.render('settings/index');
});

/**
 * Import folder
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 *
 * @param   {Conduit}   conduit
 */
Setting.setMethod(function importDir(conduit) {

	var that = this,
	    scene_id = conduit.param('scene_id'),
	    session = conduit.getSession(),
	    scene = session.connections[scene_id],
	    path = conduit.param('path'),
	    cmd;

	if (!path) {
		return conduit.error(new Error('No path was selected'));
	}

	cmd = Classes.Alchemy.Command.execute('Import', {importer: 'tomboy', path: path}, function done(err) {

		if (err) {
			return conduit.error(err);
		}

		conduit.end({success: true});
	});

	// Listen for report updates
	cmd.on('report', function onReport(report) {
		scene.submit('import-update', report);
	});
});