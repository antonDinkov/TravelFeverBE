const { Router } = require("express");
const { isUser } = require("../middlewares/guards");
const { createTripService, getMyTripsService } = require('../services/mytrips');
const { uploadToCloudinary } = require('../utils/cloudinaryApi');
const multer = require('multer');


const tripsRouter = Router();

const upload = multer({ dest: 'uploads/' });

async function createTrip(req, res) {
    try {
        const {
            type,
            name,
            short_description,
            location_name,
            location
        } = req.body;

        const imagePath = req.file.path;

        if (!imagePath) {
            return res.status(400).json({ message: "Image is required" });
        }

        const uploadedImage = await uploadToCloudinary(imagePath);

        const tripData = {
            type,
            name,
            short_description,
            location_name,
            location,
            image_url: uploadedImage.url,
            image_public_id: uploadedImage.public_id,
            user: req.user._id
        };

        const createdTrip = await createTripService(tripData);

        res.status(201).json(createdTrip);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || 'Unknown error' });
    }
}

tripsRouter.post('/mytrips/create', isUser(), upload.single('image'), createTrip);


async function getMyTrips(req, res) {
    try {
        const userId = req.user._id;

        const trips = await getMyTripsService(userId);

        res.status(200).json(trips);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || "Unknown error" });
    }
}

tripsRouter.get('/mytrips', isUser(), getMyTrips);


tripsRouter.put('/mytrips/edit/:id', isUser(), async (req, res) => {

})

tripsRouter.delete('/mytrips/:id', isUser(), async (req, res) => {

})


module.exports = { tripsRouter };