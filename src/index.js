
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const orderRoutes = require('./routes/order.routes');

const testRoutes = require('./routes/test.routes');

const { errorHandler } = require('./middleware/error.middleware');
const { startJobs } = require('./jobs/fetchOrders.job');

async function bootstrap() {
    try {
        // Connect DB
        if (!config.mongoUri) {
            console.error('❌ Missing MONGODB_URI in .env');
            process.exit(1);
        }

        await mongoose.connect(config.mongoUri, {
            dbName: 'idosellDB', // Atlas DB name
        });
        console.log('✅ Connected to MongoDB:', config.mongoUri);

        // Create app
        const app = express();
        app.use(helmet());
        app.use(cors());
        app.use(express.json());
        app.use(morgan('dev'));

        // Routes
        app.use('/api/test', testRoutes);
        app.use('/api', orderRoutes);

        // Error handler
        app.use(errorHandler);

        // Start server
        app.listen(config.port, () => {
            console.log(`🚀 Server running at http://localhost:${config.port}`);
        });

        // Start background jobs
        startJobs();
    } catch (err) {
        console.error('❌ Failed to start application', err);
        process.exit(1);
    }
}

bootstrap();

