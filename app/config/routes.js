// Create route with name "Home" that will execute the "home" method of the "Static" controller
Router.get('Home', '/', 'Static#home');

// Search
Router.get('Note#index', '/notes');
Router.get('Note#edit', '/edit/:id');
Router.get('Note#add', '/add');
Router.post('Note#save', '/save');