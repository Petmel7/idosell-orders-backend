const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const orderRoutes = require('./routes/order.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// routes
app.use('/api', orderRoutes);

// error handler
app.use(errorHandler);

module.exports = app;

