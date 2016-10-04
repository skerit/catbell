var fs = alchemy.use('fs'),
    cheerio = alchemy.use('cheerio'),
    libpath = require('path');

/**
 * The Tomboy/Gnote Importer class
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
var TomboyImporter = Function.inherits('Alchemy.Importer', function TomboyImporter() {

});

/**
 * Set the schema
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
TomboyImporter.constitute(function setSchema() {

	// From where to import the files
	this.schema.addField('directory', 'String');
});

/**
 * Start importing
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
TomboyImporter.setMethod(function start(command, payload, callback) {

	var that = this,
	    Note = Model.get('Note'),
	    todo,
	    done;

	console.log('Starting tomboy import:', command, payload);

	// Get a list of all the files in the dir
	fs.readdir(payload.path, function gotPath(err, files) {

		var tasks = [];

		if (err) {
			return callback(err);
		}

		todo = files.length;
		done = 0;

		files.forEach(function eachFile(file) {

			var filepath = libpath.resolve(payload.path, file);

			tasks.push(function doFile(next) {
				fs.stat(filepath, function gotStat(err, stat) {

					var body;

					// Ignore errors
					if (err) {
						reportProgress();
						return next();
					}

					if (!stat.isFile()) {
						reportProgress();
						return next();
					}

					fs.readFile(filepath, 'utf8', function gotFile(err, file) {

						var h1_title,
						    data,
						    $;

						if (err) {
							reportProgress();
							return next();
						}

						try {
							$ = cheerio.load(file);
						} catch (err) {
							reportProgress();
							return next();
						}

						body = $('note-content').html();

						// Skip files without a body
						// (Probably some log file or whatnot)
						if (!body) {
							reportProgress();
							return next();
						}

						// Replace tomboy specific tags
						body = body.replace(/(<\/?)(bold)(.*?>)/g, '$1b$3');
						body = body.replace(/(<\/?)(bold)(.*?>)/g, '$1b$3');
						body = body.replace(/(<\/?)(italic)(.*?>)/g, '$1i$3');
						body = body.replace(/(<\/?)(underline)(.*?>)/g, '$1u$3');
						body = body.replace(/(<\/?)(strikethrough)(.*?>)/g, '$1s$3');

						// Replace "list-item" first
						body = body.replace(/(<\/?)(list-item)(.*?>)/g, '$1li$3');

						// Then do "list" elements
						body = body.replace(/(<\/?)(list)(.*?>)/g, '$1ul$3');

						body = body.replace(/(<)(highlight)(.*?>)/g, '$1span style="background-color: rgb(255, 255, 0);"$3');
						body = body.replace(/(<\/)(strikethrough)(.*?>)/g, '$1span$3');

						body = body.replace(/(<)(size\:small)(.*?>)/g, '$1span style="font-size:10px;"$3');
						body = body.replace(/(<)(size\:large)(.*?>)/g, '$1span style="font-size:20px;"$3');
						body = body.replace(/(<)(size\:huge)(.*?>)/g, '$1span style="font-size:26px;"$3');

						body = body.replace(/(<\/)(size\:small)(.*?>)/g, '$1span$3');
						body = body.replace(/(<\/)(size\:large)(.*?>)/g, '$1span$3');
						body = body.replace(/(<\/)(size\:huge)(.*?>)/g, '$1span$3');

						data = {
							title    : $('title').text(),
							body     : body,
							created  : new Date($('create-date').text()),
							width    : $('width').text(),
							height   : $('height').text(),
							x        : $('x').text(),
							y        : $('y').text(),
							extra    : {post_import: true},
							cursor_position           : $('cursor-position').text(),
							open_on_startup           : $('open-on-startup').text() == 'False',
							last_change_date          : new Date($('last-change-date').text()),
							last_metadata_change_date : new Date($('last-metadata-change-date').text())
						};

						h1_title = '<h1>' + data.title + '</h1>';

						// Make sure the title is an h1
						if (data.body.indexOf(data.title) == 0) {
							data.body = h1_title + data.body.slice(data.title.length).replace(/\n/g, '<br>\n');
						} else {
							data.body = h1_title + '\n' + data.body.replace(/\n/g, '<br>\n');
						}

						Note.find('first', {conditions: {title: data.title}}, function gotNote(err, record) {

							if (err) {
								return next(err);
							}

							// Skip notes that already exist with the same title
							if (record.length) {
								reportProgress();
								return next();
							}

							Note.save(data, function saved(err) {
								reportProgress();
								next(err);
							});
						});
					});
				});
			});
		});

		Function.parallel(5, tasks, function done(err) {

			if (err) {
				return callback(err);
			}

			command.report('done');

			callback();
		});
	});

	function reportProgress() {

		var percent;

		done++;

		percent = (done / todo) * 100;
		command.report(percent);
	}
});
