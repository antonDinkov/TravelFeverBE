const { Trip } = require('../models/MyTrips');



async function createTripService(data) {
    return Trip.create(data);
}


async function updateTripService(id, data) {
    return Trip.findByIdAndUpdate(id, data, { new: true });
}


async function getMyTripsService(userId) {
    return Trip
        .find({ user: userId })
        .sort({ createdAt: -1 });
}

async function getTripByIdService(tripId) {
    console.log("Inside the service :", tripId);
    
    return Trip.findOne({ _id: tripId });
}

async function deleteTripService(tripId, userId) {
    return Trip.findOneAndDelete({ _id: tripId, user: userId });
}


module.exports = {
    createTripService,
    updateTripService,
    getMyTripsService,
    getTripByIdService,
    deleteTripService,
};