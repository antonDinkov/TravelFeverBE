const mongoose = require('mongoose');


async function configDatabase() {
    const connectionsString = process.env.MONGODB_URI;

    console.log('Connecting to MongoDB at:', connectionsString);

    await mongoose.connect(connectionsString, {});

    console.log('Database connected');
};

module.exports = { configDatabase };