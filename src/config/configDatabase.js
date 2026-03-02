const mongoose = require('mongoose');


async function configDatabase() {
    try {
        const connectionsString = process.env.MONGODB_URI;

        console.log('Connecting to MongoDB...');

        await mongoose.connect(connectionsString, {
            serverSelectionTimeoutMS: 5000
        });

        await mongoose.connection.db.admin().ping();

        console.log('Database connected and ping successful');

    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
}

module.exports = { configDatabase };