// app.mjs

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
import userRoutes from './routes/user.mjs';
import homeRoute from './routes/home.mjs';
import myCardsRoutes from './routes/myCards.mjs';
import { notFound, errorHandler } from './middleware/errors.mjs'

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

// Routes
app.use(homeRoute);
app.use('/user', userRoutes);
app.use('/my-cards', myCardsRoutes);

app.use(notFound);

app.use(errorHandler);

app.listen(process.env.PORT ?? 3000, () => {
  console.log("Started server");
});