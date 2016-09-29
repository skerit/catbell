var locks = {};

/**
 * The Settings Model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
var Setting = Function.inherits('Alchemy.AppModel', function SettingModel(options) {
	SettingModel.super.call(this, options);
});

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Setting.constitute(function addFields() {

	// The name of the setting (this is a unique and alternate index)
	this.addField('name', 'String', {unique: true, alternate: true});

	// Value
	this.addField('value', 'Object');
});

/**
 * Get a value
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   name
 */
Setting.setMethod(function getValue(name, callback) {

	var that = this,
	    options;

	options = {
		conditions : {
			name : name
		},
		document : false
	};

	that.find('first', options, function gotResult(err, record) {

		var value;

		if (err) {
			return callback(err);
		}

		if (record.length) {
			value = record[0].Setting.value;
		}

		callback(null, value);
	});
});

/**
 * Lock a value
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   name
 */
Setting.setMethod(function lockValue(name, callback) {

	var that = this,
	    options;

	if (!locks[name]) {
		locks[name] = Function.createQueue({enabled: true, limit: 1});
	}

	locks[name].add(function getResult(done) {

		that.getValue(name, function gotValue(err, value) {

			if (err) {
				callback(err);
				return done();
			}

			callback(null, value, function do_release(new_value) {
				if (arguments.length == 1) {
					that.save({name: name, value: new_value}, {debug: false}, function saved(err) {

						if (err) {
							throw err;
						}

						done();
					});
				} else {
					done();
				}
			});
		});
	});
});