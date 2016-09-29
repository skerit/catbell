/**
 * The Base Importer class
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
var Importer = Function.inherits('Alchemy.Base', function Importer() {

});

/**
 * This is a wrapper class
 */
Importer.setProperty('is_abstract_class', true);

/**
 * This wrapper class starts a new group
 */
Importer.setProperty('starts_new_group', true);

/**
 * Return the class-wide schema
 *
 * @type   {Schema}
 */
Importer.setProperty(function schema() {
	return this.constructor.schema;
});

/**
 * Set the fact schema
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Importer.constitute(function setSchema() {

	var schema;

	// Create a new schema
	schema = new Classes.Alchemy.Schema(this);
	this.schema = schema;
});
