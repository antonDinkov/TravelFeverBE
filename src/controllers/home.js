const { Router } = require("express");
const { isUser } = require("../middlewares/guards");
const { parseError } = require("../utils/errorParser");
const { getFeaturedCountries, getSearchResult, isItFavorite, addToFavorites, favorites, removeFromFavorites } = require("../services/data");

const homeRouter = Router();

homeRouter.get('/featured', isUser(), async (req, res) => {
    try {
        const featuredCoutries = await getFeaturedCountries();
        res.json(featuredCoutries);
    } catch (err) {
        const parsed = parseError(err);
        res.status(500).json({
            message: parsed.message,
            errors: parsed.errors || null
        });
    }
});

homeRouter.get("/search", isUser(), async (req, res) => {
    try {
        const { text, type } = req.query;

        if (!text || !type) {
            return res.status(400).json({
                message: "Missing required query params: text and type"
            });
        }

        if (!["country", "city", "poi"].includes(type)) {
            return res.status(400).json({
                message: "Invalid type. Allowed: country, city, poi"
            });
        }

        const result = await getSearchResult(text, type);

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (err) {
        console.error("Search controller error:", err);
        const parsed = parseError(err);
        return res.status(500).json({
            success: false,
            message: parsed.message,
            errors: parsed.errors || null
        });
    }
});

homeRouter.get('/favorites', isUser(), async (req, res) => {
    try {
        const typeRequest = req.query.typeRequest
        const userId = req.query.userId;
        const itemId = req.query.itemId;

        let favoritesVar;

        if (typeRequest === 'getOne') {
            favoritesVar = await isItFavorite(userId, itemId);
        } else if (typeRequest === 'getAll') {
            favoritesVar = await favorites(userId);
        } else {
            throw new Error("Invalid typeRequest");
        }


        res.status(200).json(favoritesVar);
    } catch (err) {
        console.error('Error occurred: ', err);
        res.status(400).json({ success: false, error: err.message || 'Unknown error' });
    }
});


homeRouter.post('/favorites', isUser(), async (req, res) => {
    try {
        const userId = req.body.userId;
        const itemId = req.body.itemId;
        const itemModel = req.body.itemModel;
        console.log("This is the req body content: ", userId, itemId, itemModel);

        const favoritesVar = await addToFavorites(userId, itemId, itemModel);

        res.status(200).json(favoritesVar);
    } catch (err) {
        console.error('Error occurred: ', err);
        res.status(400).json({ success: false, error: err.message || 'Unknown error' });
    }
});

homeRouter.delete('/favorites', async (req, res) => {
    try {
        const userId = req.query.userId;
        const itemId = req.query.itemId;

        const favoritesVar = await removeFromFavorites(userId, itemId);
        res.status(200).json(favoritesVar);
    } catch (err) {
        console.error('Error occurred: ', err);
        res.status(400).json({ success: false, error: err.message || 'Unknown error' });
    }
})

module.exports = { homeRouter }