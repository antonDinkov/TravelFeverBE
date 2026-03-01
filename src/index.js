require('dotenv').config();
const express = require('express');
const { configDatabase } = require('./config/configDatabase');
const { configExpress } = require('./config/configExpress');
const { configRoutes } = require('./config/configRoutes');


start();

async function start() {
    const app = express();

    await configDatabase();
    configExpress(app);
    configRoutes(app);
    
    const PORT = process.env.PORT || 3004;
    app.listen(PORT, "0.0.0.0", () => console.log(`Server started on port ${PORT}`));

};
