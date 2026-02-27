const { Router } = require("express");
const { isUser } = require("../middlewares/guards");
const { createTripService } = require('../services/mytrips');
const { uploadToCloudinary } = require('../utils/cloudinaryApi');

const tripsRouter = Router();


async function createTrip(req, res) {
    try {
        const {
            type,
            name,
            short_description,
            location_name,
            location
        } = req.body;

        const imageFile = req.body.image;

        if (!imageFile) {
            return res.status(400).json({ message: "Image is required" });
        }

        const uploadedImage = await uploadToCloudinary(imageFile);

        const tripData = {
            type,
            name,
            short_description,
            location_name,
            location,
            image_url: uploadedImage.secure_url,
            user: req.user._id
        };

        const createdTrip = await createTripService(tripData);

        res.status(201).json(createdTrip);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || 'Unknown error' });
    }
}

tripsRouter.get('/mytrips', isUser(), createTrip);



tripsRouter.post('/mytrips/create', isUser(), async (req, res) => {

})

tripsRouter.put('/mytrips/edit/:id', isUser(), async (req, res) => {

})

tripsRouter.delete('/mytrips/:id', isUser(), async (req, res) => {

})


module.exports = { tripsRouter };