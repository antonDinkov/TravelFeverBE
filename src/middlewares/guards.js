const { getById, getByIdKey } = require("../services/data");

function isUser() {
    return function (req, res, next) {
        if (!req.user) {
            return res.json({ message: "Unauthorized" });
        } else {
            next();
        }
    }
};
let something;

function isGuest() {
    return function (req, res, next) {

        if (req.user) {
            return res.status(400).json({
                message: 'You are already logged in'
            });
        }

        next();
    }
}


function isOwner() {
    return async function (req, res, next) {
        
        try {
            if (!req.user) {
                return res.redirect('/login');
            }

            const post = await getById(req.params.id);
            if (!post) {
                return res.redirect('/404');
            }

            const ownerId = post.owner.toString();

            if (req.user._id == ownerId) {
                return next();
            } else {
                return res.redirect(`/catalog/${req.params.id}`);
            }
        } catch (err) {
            console.error('Middleware error:', err);
            return res.redirect('/500');
        }
    }
};


module.exports = {
    isUser,
    isGuest,
    isOwner,
}
