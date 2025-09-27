require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const idosellRoutes = require('./routes/idosell.routes');
const orderRoutes = require('./routes/order.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/idosell', idosellRoutes);
app.use('/api', orderRoutes);

// error handler
app.use(errorHandler);

module.exports = app;

