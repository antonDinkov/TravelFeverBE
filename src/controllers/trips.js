const { Router } = require("express");
const { isUser } = require("../middlewares/guards");
const { createTripService, getMyTripsService, getTripByIdService, deleteTripService, updateTripService } = require('../services/mytrips');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryApi');
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

        console.log("Right Bevore the createtripservice");
        const createdTrip = await createTripService(tripData);
        console.log("Right after the createtripservice: ", createdTrip);


        res.status(201).json(createdTrip);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || 'Unknown error' });
    }
}

tripsRouter.post('/mytrips/create', isUser(), upload.single('image'), createTrip);


async function updateTrip(req, res) {
    try {
        const { tripId } = req.params;
        const userId = req.user._id

        const {
            type,
            name,
            short_description,
            location_name,
            location
        } = req.body;

        const existingTrip = await getTripByIdService(tripId, userId);

        if (!existingTrip) {
            return res.status(404).json({ message: "Trip not found" });
        }

        if (existingTrip.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        let image_url = existingTrip.image_url;
        let image_public_id = existingTrip.image_public_id;

        if (req.file) {
            const imagePath = req.file.path;

            await deleteFromCloudinary(existingTrip.image_public_id);

            const uploadedImage = await uploadToCloudinary(imagePath);

            image_url = uploadedImage.url;
            image_public_id = uploadedImage.public_id;
        }

        const updatedData = {
            type,
            name,
            short_description,
            location_name,
            location,
            image_url,
            image_public_id
        };

        const updatedTrip = await updateTripService(tripId, updatedData);

        res.status(200).json(updatedTrip);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || "Unknown error" });
    }
}

tripsRouter.put('/mytrips/:tripId', isUser(), upload.single('image'), updateTrip);


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


async function deleteTrip(req, res) {
    try {
        const userId = req.user._id;
        const tripId = req.params.id;

        const trip = await getTripByIdService(tripId, userId);

        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }

        if (trip.image_public_id) {
            await deleteFromCloudinary(trip.image_public_id);
        }

        await deleteTripService(tripId, userId);

        res.status(200).json({ message: "Trip deleted successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || "Unknown error" });
    }
}

tripsRouter.delete('/mytrips/:id', isUser(), deleteTrip);

tripsRouter.put('/mytrips/edit/:id', isUser(), async (req, res) => {

})



module.exports = { tripsRouter };