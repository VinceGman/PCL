require('dotenv').config();

// initialize firestore singleton
const { firestore } = require('./database/firestore');

// initialize redis singleton
const redis = require('./cache/redis');
// (async () => {
//     // await redis.clear();
//     console.log(await redis.keys());
// })();

// Load required modules
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

// Load route handlers
const deckBuilderRoutes = require('./src/routes/deckBuilderRoutes');

// Initialize Express app
const app = express();

// Use environment variable for port or default to 5500
const port = process.env.PORT || 5500;

// Configure view engine and views directory for server-side templating
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'ejs');

// Use bodyParser middleware to parse request bodies to JSON
app.use(bodyParser.json());

// Define routes for specific paths
app.use('/deckbuilder', deckBuilderRoutes);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Start server on specified port when not in test environment
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => console.log(`Server running on port: ${port}`));
}

module.exports = app;