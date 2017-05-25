/**
 * plugin.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/*global tinymce:true */

tinymce.PluginManager.add('property', function(editor) {
	function createLinkList(callback) {
		return function() {
			var linkList = editor.settings.link_list;

			if (typeof linkList == "string") {
				tinymce.util.XHR.send({
					url: linkList,
					success: function(text) {
						callback(tinymce.util.JSON.parse(text));
					}
				});
			} else if (typeof linkList == "function") {
				linkList(callback);
			} else {
				callback(linkList);
			}
		};
	}

	function buildListItems(inputList, itemCallback, startItems) {
		function appendItems(values, output) {
			output = output || [];

			tinymce.each(values, function(item) {
				var menuItem = {text: item.text || item.title};

				if (item.menu) {
					menuItem.menu = appendItems(item.menu);
				} else {
					menuItem.value = item.value;

					if (itemCallback) {
						itemCallback(menuItem);
					}
				}

				output.push(menuItem);
			});

			return output;
		}

		return appendItems(inputList, startItems || []);
	}

	function showDialog(linkList) {

		var targetListCtrl,
		    classListCtrl,
		    linkTitleCtrl,
		    textListCtrl,
		    linkListCtrl,
		    relListCtrl,
		    initialText,
		    propertyElm,
		    selectedElm,
		    selection,
		    onlyText,
		    value,
		    data,
		    dom,
		    win;

		selection = editor.selection;
		data = {};
		dom = editor.dom;

		function linkListChangeHandler(e) {
			var textCtrl = win.find('#text');

			if (!textCtrl.value() || (e.lastControl && textCtrl.value() == e.lastControl.text())) {
				textCtrl.value(e.control.text());
			}

			win.find('#href').value(e.control.value());
		}

		function buildAnchorListControl(url) {
			var anchorList = [];

			tinymce.each(editor.dom.select('a:not([href])'), function(anchor) {
				var id = anchor.name || anchor.id;

				if (id) {
					anchorList.push({
						text: id,
						value: '#' + id,
						selected: url.indexOf('#' + id) != -1
					});
				}
			});

			if (anchorList.length) {
				anchorList.unshift({text: 'None', value: ''});

				return {
					name: 'anchor',
					type: 'listbox',
					label: 'Anchors',
					values: anchorList,
					onselect: linkListChangeHandler
				};
			}
		}

		function updateText() {
			if (!initialText && data.text.length === 0 && onlyText) {
				this.parent().parent().find('#text')[0].value(this.value());
			}
		}

		function urlChange(e) {
			var meta = e.meta || {};

			if (linkListCtrl) {
				linkListCtrl.value(editor.convertURL(this.value(), 'href'));
			}

			tinymce.each(e.meta, function(value, key) {
				win.find('#' + key).value(value);
			});

			if (!meta.text) {
				updateText.call(this);
			}
		}

		function isOnlyTextSelected(propertyElm) {
			var html = selection.getContent();

			// Partial html and not a fully selected anchor element
			if (/</.test(html) && (!/^<a [^>]+>[^<]+<\/a>$/.test(html) || html.indexOf('href=') == -1)) {
				return false;
			}

			if (propertyElm) {
				var nodes = propertyElm.childNodes, i;

				if (nodes.length === 0) {
					return false;
				}

				for (i = nodes.length - 1; i >= 0; i--) {
					if (nodes[i].nodeType != 3) {
						return false;
					}
				}
			}

			return true;
		}

		selectedElm = selection.getNode();
		propertyElm = dom.getParent(selectedElm, 'span[data-property]');
		onlyText = isOnlyTextSelected();

		data.text = initialText = propertyElm ? (propertyElm.innerText || propertyElm.textContent) : selection.getContent({format: 'text'});
		data.property = propertyElm ? dom.getAttrib(propertyElm, 'data-property') : '';
		data.value = propertyElm ? dom.getAttrib(propertyElm, 'data-value') : '';

		if ((value = dom.getAttrib(propertyElm, 'class'))) {
			data['class'] = value;
		}

		if ((value = dom.getAttrib(propertyElm, 'title'))) {
			data.title = value;
		}

		if (onlyText) {
			textListCtrl = {
				name: 'text',
				type: 'textbox',
				size: 40,
				label: 'Text to display',
				onchange: function() {
					data.text = this.value();
				}
			};
		}

		if (linkList) {
			linkListCtrl = {
				type: 'listbox',
				label: 'Link list',
				values: buildListItems(
					linkList,
					function(item) {
						item.value = editor.convertURL(item.value || item.url, 'href');
					},
					[{text: 'None', value: ''}]
				),
				onselect: linkListChangeHandler,
				value: editor.convertURL(data.href, 'href'),
				onPostRender: function() {
					/*eslint consistent-this:0*/
					linkListCtrl = this;
				}
			};
		}

		if (editor.settings.target_list !== false) {
			if (!editor.settings.target_list) {
				editor.settings.target_list = [
					{text: 'None', value: ''},
					{text: 'New window', value: '_blank'}
				];
			}

			targetListCtrl = {
				name: 'target',
				type: 'listbox',
				label: 'Target',
				values: buildListItems(editor.settings.target_list)
			};
		}

		if (editor.settings.rel_list) {
			relListCtrl = {
				name: 'rel',
				type: 'listbox',
				label: 'Rel',
				values: buildListItems(editor.settings.rel_list)
			};
		}

		if (editor.settings.link_class_list) {
			classListCtrl = {
				name: 'class',
				type: 'listbox',
				label: 'Class',
				values: buildListItems(
					editor.settings.link_class_list,
					function(item) {
						if (item.value) {
							item.textStyle = function() {
								return editor.formatter.getCssText({inline: 'a', classes: [item.value]});
							};
						}
					}
				)
			};
		}

		if (editor.settings.link_title !== false) {
			linkTitleCtrl = {
				name: 'title',
				type: 'textbox',
				label: 'Title',
				value: data.title
			};
		}

		win = editor.windowManager.open({
			title: 'Manage property value',
			data: data,
			body: [
				{
					name: 'href',
					type: 'filepicker',
					filetype: 'file',
					size: 40,
					autofocus: true,
					label: 'Url',
					onchange: urlChange,
					onkeyup: updateText
				},
				textListCtrl,
				linkTitleCtrl,
				buildAnchorListControl(data.href),
				linkListCtrl,
				relListCtrl,
				targetListCtrl,
				classListCtrl
			],
			onSubmit: function onSubmit(e) {
				/*eslint dot-notation: 0*/
				var href;

				data = tinymce.extend(data, e.data);

				console.log('Submit:', data);

				href = data.href;

				// Delay confirm since onSubmit will move focus
				function delayedConfirm(message, callback) {
					var rng = editor.selection.getRng();

					tinymce.util.Delay.setEditorTimeout(editor, function() {
						editor.windowManager.confirm(message, function(state) {
							editor.selection.setRng(rng);
							callback(state);
						});
					});
				}

				/**
				 * Function that actually inserts the element into the editor
				 */
				function insertElement() {

					var attr;

					if (data.property == null) {
						data.property = '';
					}

					if (data.value == null) {
						data.value = '';
					}

					attr = {
						"class"   : data["class"] ? data["class"] : null,
						title     : data.title ? data.title : null,
						'data-property'  : data.property,
						'data-value'     : data.value
					};

					if (propertyElm) {
						editor.focus();

						if (onlyText && data.text != initialText) {
							if ("innerText" in propertyElm) {
								propertyElm.innerText = data.text;
							} else {
								propertyElm.textContent = data.text;
							}
						}

						console.log('Setting proeprties', propertyElm);

						dom.setAttribs(propertyElm, attr);

						propertyElm.setAttribute('data-property', data.property);
						propertyElm.setAttribute('data-value', data.value);

						selection.select(propertyElm);
						editor.undoManager.add();
					} else {
						editor.insertContent(dom.createHTML('span', attr, dom.encode(data.text)));
					}
				}

				insertElement();
			}
		});
	}

	editor.addButton('property', {
		icon: 'pluscircle',
		tooltip: 'Manage property value',
		shortcut: 'Meta+K',
		onclick: createLinkList(showDialog),
		stateSelector: 'span[data-property]'
	});

	// editor.addButton('unlink', {
	// 	icon: 'unlink',
	// 	tooltip: 'Remove link',
	// 	cmd: 'unlink',
	// 	stateSelector: 'a[href]'
	// });

	// editor.addShortcut('Meta+K', '', createLinkList(showDialog));
	// editor.addCommand('mceLink', createLinkList(showDialog));

	this.showDialog = showDialog;

	editor.addMenuItem('property', {
		icon: 'pluscircle',
		text: 'Manage property value',
		shortcut: 'Meta+K',
		onclick: createLinkList(showDialog),
		stateSelector: 'span[data-property]',
		context: 'insert',
		prependToContext: true
	});
});