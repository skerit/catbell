// Create route with name "Home" that will execute the "home" method of the "Static" controller
Router.get('Home', '/', 'Static#home');

// Settings
Router.get('Setting#index', '/settings');
Router.post('Setting#importDir', '/settings/import');

// Notes
Router.get('Note#index', '/notes');
Router.get('Note#edit', '/edit/:id');
Router.get('Note#editWindow', '/edit_window/:id');
Router.get('Note#add', '/add');
Router.post('Note#save', '/save');