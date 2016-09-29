var doubleMetaphone = alchemy.use('double-metaphone'),
    cheerio = alchemy.use('cheerio');

/**
 * The Note Controller class
 *
 * @constructor
 * @extends       alchemy.classes.AppController
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 */
var Note = Function.inherits('Alchemy.AppController', function NoteController(conduit, options) {
	NoteController.super.call(this, conduit, options);
});

/**
 * Show all available notes
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 *
 * @param   {Conduit}   conduit
 */
Note.setMethod(function index(conduit) {

	var that = this,
	    options;
	    fields = ['_id', 'title', 'width', 'height', 'x', 'y', 'last_change_date'],
	    Note = this.getModel('Note');

	options = {
		fields  : fields,
		filter  : conduit.param('filter'),
	};

	if (!options.filter) {
		options.sort = {last_change_date: -1};
	}

	Note.scoredFind(options, function gotNotes(err, list) {

		if (err) {
			return conduit.error(err);
		}

		console.log('List:', list, JSON.clone(list));

		that.set('note_list', list);

		// Render a specific view
		that.render('notes/list');
	});
});

/**
 * Edit a new note
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 *
 * @param   {Conduit}   conduit
 * @param   {String}    id
 */
Note.setMethod(function edit(conduit, id) {

	var that = this;

	this.getModel('Note').findById(id, function gotNote(err, note) {

		if (err) {
			return conduit.error(err);
		}

		if (!note.length) {
			return conduit.notFound();
		}

		that.set('note', note[0]);

		// Render the edit view
		that.render('notes/edit');
	});
});

/**
 * Add a new note
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 *
 * @param   {Conduit}   conduit
 */
Note.setMethod(function add(conduit) {

	var that = this,
	    Setting = this.getModel('Setting');

	Setting.lockValue('note_counter', function gotValue(err, value, done) {

		var count;

		if (err) {
			done();
			return conduit.error(err);
		}

		if (value) {
			count = value;
		} else {
			count = 0;
		}

		count++;

		that.set('note_count', count);

		done(count);

		// Render a specific view
		that.render('notes/add');
	});
});

/**
 * Save a new note
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 *
 * @param   {Conduit}   conduit
 */
Note.setMethod(function save(conduit) {

	var that = this,
	    Note = this.getModel('Note'),
	    body = conduit.body;

	console.log('Saving note...', conduit, conduit.body);

	if (body.note_id) {
		Note.findById(body.note_id, function gotNote(err, note) {

			if (err) {
				return conduit.error(err);
			}

			if (!note.length) {
				return conduit.notFound();
			}

			doSave(note);
		});
	} else {
		doSave();
	}

	function doSave(note) {

		var text,
		    new_text,
		    old_text;

		if (!note) {
			note = Note.createDocument();
		}

		// Set change date when content has actually changed
		if (note.body != body.html) {

			// See if this is the first time this note is saving since being imported
			// Tinymce will most likely change the HTML layout of the note
			if (note && note.extra && note.extra.post_import) {
				new_text = body.html.replace(/<(?:.|\n)*?>/gm, '\n').decodeHTML().replace(/\s+/g, '').trim().toLowerCase();
				old_text = note.body.replace(/<(?:.|\n)*?>/gm, '\n').decodeHTML().replace(/\s+/g, '').trim().toLowerCase();

				// Only set the change date if the text has changed
				if (old_text != new_text) {
					note.last_change_date = new Date();
				}
			} else {
				note.last_change_date = new Date();
			}
		}

		// Make sure post import is set to null
		if (note && note.extra && note.extra.post_import) {
			note.extra.post_import = null;
		}

		note.width = body.width;
		note.height = body.height;
		note.x = body.x;
		note.y = body.y;
		note.open_on_startup = body.open;

		// Set the new content
		note.body = body.html;

		// Save the note
		note.save(function saved(err) {

			if (err) {
				return conduit.error(err);
			}

			// Send updates to all connected windows
			alchemy.updateData(body.note_id, note.Note);
			alchemy.broadcast('savedNote', note.Note);

			conduit.end({success: true, _id: String(note.Note._id||'')});
		});
	};
});