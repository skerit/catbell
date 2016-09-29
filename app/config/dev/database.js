var libpath = require('path'),
    electron,
    folder;

try {
	electron = require('electron');
	folder = electron.app.getPath('userData');
} catch (err) {
	folder = 'nedb';
}

console.log('NeDB collections will be stored in:', folder);

Datasource.create('nedb', 'default', {
	folder: folder
});