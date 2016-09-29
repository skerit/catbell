var cheerio = alchemy.use('cheerio'),
    doubleMetaphone = alchemy.use('double-metaphone');

/**
 * The Note Model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
var Note = Function.inherits('Alchemy.AppModel', function NoteModel(options) {
	NoteModel.super.call(this, options);

	// Process note before saving
	this.on('saving', function onSave(data, options, creating) {

		var title,
		    main,
		    text,
		    $;

		main = data.Note;

		// Make sure the html text is available
		if (!main || !main.body) {
			return;
		}

		$ = cheerio.load(main.body);

		// Get the title
		title = $('h1').first().text();

		if (title) {
			main.title = title;
		}

		// Remove all the html tags
		text = main.body.replace(/<(?:.|\n)*?>/gm, '\n')

		// Get the inner text only
		main.text = text.decodeHTML().replace(/\n+/g, '\n').trim();
		main.metaphone = getMetaphoneText(main.text);

		console.log('Got:', main);
	});
});

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Note.constitute(function addFields() {

	// The title of the note
	this.addField('title', 'String');

	// Last time the title or content was modified
	this.addField('last_change_date', 'Datetime');

	// Last time the metadata was modified
	this.addField('last_metadata_change_date', 'Datetime');

	// Where the cursor should be
	this.addField('cursor_position', 'Number');

	// Geometry of the note's window
	this.addField('width', 'Number');
	this.addField('height', 'Number');
	this.addField('x', 'Number');
	this.addField('y', 'Number');

	// Should the note open on startup?
	this.addField('open_on_startup', 'Boolean');

	// The actual HTML body
	this.addField('body', 'String');

	// Regular text representation
	this.addField('text', 'String');

	// Metaphone text representation
	this.addField('metaphone', 'String');

	// Extra properties
	this.addField('extra', 'Object');
});

/**
 * Do a scored find
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Object}   options
 */
Note.setMethod(function scoredFind(options, callback) {

	var that = this,
	    results = {},
	    filter = options.filter,
	    metaphone;

	if (!filter) {
		return this.find('list', options, callback);
	}

	metaphone = getMetaphoneText(filter);

	Function.parallel(function doContain(next) {

		var f_opts;

		if (filter.length < 2) {
			return;
		}

		f_opts = {
			conditions: {text: RegExp.interpret(filter)},
			fields: options.fields
		};

		that.find('dict', f_opts, function gotDict(err, dict) {

			if (err) {
				return next(err);
			}

			scoreDict(dict, 100);
			next();
		});
	}, function metaContain(next) {

		var f_opts = {
			conditions: {metaphone: RegExp.interpret(metaphone)},
			fields: options.fields
		};

		that.find('dict', f_opts, function gotDict(err, dict) {

			if (err) {
				return next(err);
			}

			scoreDict(dict, 50);
			next();
		});

	}, function individualMeta(next) {

		var pieces = metaphone.split(/ /g),
		    f_opts = {fields: options.fields},
		    searches = [];

		pieces.forEach(function eachPiece(piece) {

			if (piece.length < 2) {
				return;
			}

			searches.push(RegExp.interpret(piece));
		});

		f_opts.conditions = {
			metaphone : searches
		};

		that.find('dict', f_opts, function gotDict(err, dict) {

			if (err) {
				return next(err);
			}

			scoreDict(dict, 20);
			next();
		});
	}, function done(err) {

		if (err) {
			return callback(err);
		}

		// Sort results by score
		results.sortByPath('score');

		console.log('Dict result:', results);

		callback(null, Object.values(results));
	});

	function scoreDict(dict, score) {

		var record,
		    key;

		for (key in dict) {
			if (!results[key]) {
				record = dict[key];
				record.score = 0;
				results[key] = record;
			} else {
				record = results[key];
			}

			record.score += score;
		}
	};
});

/**
 * Convert a normal text to metaphones
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   text
 */
function getMetaphoneText(text) {

	var metaphone = '',
	    pieces;

	if (!text) {
		return metaphone;
	}

	// Split up the entire text
	pieces = text.split(/\n| /g);

	pieces.forEach(function eachPiece(piece) {

		var arr;

		if (metaphone) {
			metaphone += ' ';
		}

		arr = doubleMetaphone(piece);

		metaphone += arr[0] + ' ' + arr[1];
	});

	return metaphone;
}