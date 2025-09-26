require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./config');
const app = require('./app');
const { startJobs } = require('./jobs/fetchOrders.job');

async function bootstrap() {
    try {
        if (!config.mongoUri) {
            console.error('❌ Missing MONGODB_URI in .env');
            process.exit(1);
        }

        await mongoose.connect(config.mongoUri, {
            dbName: 'idosellDB',
        });
        console.log('✅ Connected to MongoDB:', config.mongoUri);

        app.listen(config.port, () => {
            console.log(`🚀 Server running at http://localhost:${config.port}`);
        });

        startJobs();
    } catch (err) {
        console.error('❌ Failed to start application', err);
        process.exit(1);
    }
}

bootstrap();
