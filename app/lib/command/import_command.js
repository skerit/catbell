/**
 * The Import Command class
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
var Import = Function.inherits('Alchemy.Command', function ImportCommand() {
	ImportCommand.super.call(this);
});

/**
 * Execute the import command
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Object}   payload    User provided data
 * @param    {Object}   callback
 */
Import.setMethod(function execute(payload, callback) {

	var constructor = Classes.Alchemy[payload.importer.classify() + 'Importer'],
	    importer;

	if (!constructor) {
		return callback(new Error('Could not find importer class'));
	}

	importer = new constructor();

	console.log('Should execute import:', payload);

	importer.start(this, payload, function done(err) {

		console.log('Import is done?', err);

	});
});