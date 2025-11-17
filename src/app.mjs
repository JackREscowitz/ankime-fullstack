// src/app.mjs

// Note: side effects of importing envConfig.mjs and passportConfig.mjs mean
// they only need to be imported in app.mjs
import './envConfig.mjs'; // Must be first import
import './models/db.mjs';
import './passportConfig.mjs';
import express from 'express';
import session from 'express-session';
import path from 'path';
import passport from 'passport';
import { fileURLToPath } from 'url';

// Page routes
import userPageRoutes from './routes/pages/userPages.mjs';
import rootRoutes from './routes/pages/rootPages.mjs';
import myCardsRoutes from './routes/pages/myCardsPages.mjs';

// API routes
import userApiRoutes from './routes/api/usersApi.mjs';
import screenshotRoutes from './routes/api/screenshotsApi.mjs';
import vocabRoutes from './routes/api/vocabApi.mjs';
import searchRoutes from './routes/api/search.mjs';

import { notFound, errorHandler } from './middleware/errors.mjs';
import { connectDB } from './models/db.mjs';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add session support (req.session)
const sessionOptions = {
  secret: process.env.SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false
}
app.use(session(sessionOptions));

app.use(passport.initialize());
app.use(passport.session());

// Make user data available to all templates
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
})

app.use(express.static(path.resolve(__dirname, 'public')));

// Body parsers
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Handlebars
app.set('view engine', 'hbs');
app.set('views', path.resolve(__dirname, 'views'));

// Page Routes
app.use(rootRoutes);
app.use('/user', userPageRoutes);
app.use('/my-cards', myCardsRoutes);

// API routes
app.use('/api/users', userApiRoutes);
app.use('/api/screenshots', screenshotRoutes);
app.use('/api/vocab', vocabRoutes);
app.use('/api/search', searchRoutes);

// Errors
app.use(notFound);
app.use(errorHandler);

await connectDB();

app.listen(process.env.PORT ?? 3000, () => {
  console.log("Started server");
});