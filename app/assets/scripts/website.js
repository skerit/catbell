var electron = require('electron').remote,
    filter_text,
    selected = [];

hawkejs.scene.on({type: 'set', name: 'main', template: 'notes/index'}, function onIndex(el) {

	var $el = $(el);

	// Create a new note
	$('button.note-create', $el).on('click', function onClickCreate(e) {
		var strWindowFeatures = "menubar=no,location=no,resizable=yes,scrollbars=yes,status=no,width=741,height=600";
		var windowObjectReference = window.open('/add', 'Notes', strWindowFeatures);
	});

	// Open settings window
	$('button.settings', $el).on('click', function onClickSettings(e) {
		var strWindowFeatures = "menubar=no,location=no,resizable=no,scrollbars=yes,status=no,width=780,height=200";
		var windowObjectReference = window.open('/settings', 'Settings', strWindowFeatures);
	});

	// Select a note in the index list
	$('.note-list').on('click', 'tbody tr', function onClick(e) {

		var $row = $(this);

		// Deselect everything in the array, first
		selected.length = 0;
		selected.push($row.data('id'));

		// Select this row
		$row.addClass('selected');

		// Unselect all the other rows
		$row.siblings().removeClass('selected');
	});

	// Open an existing note
	$('.note-list').on('dblclick', 'tbody tr', function onDblClick(e) {

		var window_features,
		    window_ref,
		    $row = $(this),
		    id = $row.data('id'),
		    w = $row.data('width') || 780,
		    h = $row.data('height') || 600,
		    x = $row.data('x'),
		    y = $row.data('y');

		window_features = 'menubar=no,location=no,resizable=yes,scrollbars=yes,status=no';
		window_features += ',width=' + w;
		window_features += ',height=' + h;

		if (x !== '' && !isNaN(x)) {
			window_features += ',left=' + x;
		}

		if (y !== '' && !isNaN(y)) {
			window_features += ',top=' + y;
		}

		window_ref = window.open('/edit/' + id, 'Notes', window_features);
	});

	// Update note data
	$('.note-list').on('dataUpdate', 'tbody tr', function onUpdate(e) {

		var $this,
		    data = e.detail;

		if (!data) {
			return;
		}

		$this = $(this);

		$this.data('width', data.width);
		$this.data('height', data.height);
		$this.data('x', data.x);
		$this.data('y', data.y);
	});

	// Re-create the index list?
	alchemy.on('savedNote', function onSavedNote(e) {
		hawkejs.scene.openUrl('/notes', {get: {filter: filter_text}}, function done(err) {

			var $element,
			    id,
			    i;

			if (err) {
				throw err;
			}

			// Select all the previously selected rows
			for (i = 0; i < selected.length; i++) {
				id = selected[i];
				$element = $('tr[data-id="' + id + '"]');
				$element.addClass('selected');
			}
		});
	});

	// Listen to filter changes
	$('#index-filter').on('keyup', Function.throttle(function onPress(e) {

		filter_text = this.value;

		hawkejs.scene.openUrl('/notes', {get: {filter: filter_text}});

	}, 550));
});

hawkejs.scene.on({type: 'set', name: 'main', template: 'settings/index'}, function onSettings(el) {

	var $progress = $('.import-progress');

	alchemy.on('import-update', function gotUpdate(report) {

		$progress.show();

		console.log('IU:', report.percentage);

		$progress.val(report.percentage);
	});

	$('.import-notes').on('click', function onClick(e) {

		var options;

		options = {
			title       : 'Select directory to import',
			buttonLabel : 'Start import',
			properties  : ['openDirectory', 'showHiddenFiles'],
			defaultPath : electron.app.getPath('home') + '/.local/share'
		};

		electron.dialog.showOpenDialog(options, function closed(selections) {

			if (!selections) {
				return;
			}

			hawkejs.scene.fetch('/settings/import', {post: {path: selections[0], scene_id: hawkejs.scene.sceneId}});
		});
	});

});

hawkejs.scene.on({type: 'set', name: 'main', template: 'notes/add'}, addNoteListener);
hawkejs.scene.on({type: 'set', name: 'main', template: 'notes/edit'}, addNoteListener);

/**
 * Apply functionality to note add/edit page
 *
 * @author        Jelle De Loecker   <jelle@develry.be>
 * @since         0.1.0
 * @version       0.1.0
 *
 * @param   {HTMLElement}   el
 * @param   {Object}        vars
 * @param   {Object}        view_render
 */
function addNoteListener(el, vars, view_render) {

	var last_saved,
	    save_timer,
	    save_url,
	    changed,
	    record,
	    $note,
	    open,
	    $el;

	$el = $(el);
	$note = $('.note-doc', $el);
	record = vars.note;

	// Set to true when the window is open
	open = true;

	// Set changed to false by default
	// As soon as the user types something, its set to true
	changed = false;

	if (record) {
		record = record.Note;
	}

	if (!record) {
		record = {};
	}

	// Construct the url where to save to
	save_url = hawkejs.scene.helpers.Router.routeUrl('Note#save');

	// Make sure tinymce has loaded
	hawkejs.require('tinymce/tinymce.min', function gotTinyMce() {

		// Initialize tinymce
		tinymce.init({
			fixed_toolbar_container: '#wysiwyg-toolbar',
			menubar: true,
			selector: '.note-doc',
			auto_focus: 'mce_0',
			inline: true,
			plugins: 'paste link table textcolor property media image imagetools',
			toolbar: 'undo redo | styleselect | table | forecolor backcolor | bold italic underline | alignleft aligncenter alignright | bullist numlist | indent outdent | link', // | property
			// New links should open in a new window
			default_link_target: '_blank',
			automatic_uploads: true,

			// Allow data:url images
			paste_data_images: true,
			statusbar: false,
			setup: function setupEditor(editor) {
				// Custom Blur Event to stop hiding the toolbar
				editor.on('blur', function onBlur(e) {
					e.stopImmediatePropagation();
					e.preventDefault();
				});
			}
		});
	});

	// Listen to input events, meaning the note changed
	$el.on('input', function onNoteInput(e) {

		var now;

		changed = true;

		if (save_timer) {
			now = Date.now();

			clearTimeout(save_timer);

			// If last save is over 30 seconds ago, force a save now
			if ((now - last_saved) > 30000) {
				last_saved = now;
				return saveNote();
			}
		}

		save_timer = setTimeout(function() {
			console.log('The note changed, saving!');
			saveNote();
		}, 5000);
	});

	/**
	 * Actually save the note
	 * Called on input and on window close
	 */
	function saveNote(callback) {

		var html = tinymce.editors[0].getBody().innerHTML,
		    data;

		if (!callback) {
			callback = Function.thrower;
		}

		data = {
			note_id : record._id,
			height  : window.innerHeight,
			width   : window.innerWidth,
			open    : open,
			html    : html,
			x       : window.screenLeft,
			y       : window.screenTop
		};

		hawkejs.scene.fetch(save_url, {post: data}, function gotResponse(err, data) {

			if (err) {
				console.error('Could not save note: ' + err);
				return callback(err);
			}

			if (!record._id) {
				record._id = data._id;
			}

			// Callback with the data
			callback(null, data);
		});
	}

	// Save the note when closing the window
	window.addEventListener('beforeunload', function onWindowClose(e){
		// Window is no longer open
		open = false;

		saveNote();
	}, false);

	// Save the note on resize
	window.addEventListener('resize', Function.throttle(function onResize(e) {
		saveNote();
	}, 1000));
}

// Listen to tab focus change
document.addEventListener('visibilitychange', function onVisibilityChange(){
	//document.title = document.hidden;
});