const { invalidPathRouter } = require("../controllers/404");
const { homeRouter } = require("../controllers/home");
const { tripsRouter } = require("../controllers/trips");
const { userRouter } = require("../controllers/user");
//TODO import routers

function configRoutes(app) {
    try {
        app.use(homeRouter);
        app.use(userRouter);
        app.use(tripsRouter);
        
        app.get('/health', (req, res) => {
            res.status(200).send('OK');
        });
        
        app.use(invalidPathRouter);
    } catch (err) {
        console.log("Route config error:", err);
        throw err;
    }

};

module.exports = { configRoutes };