const { verifyToken } = require("../services/jwt");

function session() {
    return function (req, res, next) {
        console.log("COOKIES:", req.headers['x-authorization']);
        const token = req.headers['x-authorization'];


        if (token) {
            try {
                const sessionData = verifyToken(token);
                req.user = {
                    firstName: sessionData.firstName,
                    lastName: sessionData.lastName,
                    email: sessionData.email,
                    _id: sessionData._id
                };
                res.locals.hasUser = true;
            } catch (err) {
                res.clearCookie('token');
            }
        }

        next();
    };
};

module.exports = { session };