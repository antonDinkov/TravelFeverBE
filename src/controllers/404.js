const { Router } = require('express');
const invalidPathRouter = Router();

invalidPathRouter.all('/*splat', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        status: 404
    });
});

module.exports = { invalidPathRouter };