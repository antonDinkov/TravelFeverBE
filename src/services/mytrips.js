const { Trip } = require('../models/MyTrips');



async function createTripService(data) {
    return Trip.create(data);
}

async function getMyTripsService(userId) {
    return Trip
        .find({ user: userId })
        .sort({ createdAt: -1 });
}

async function getTripByIdService(tripId, userId) {
    return Trip.findOne({ _id: tripId, user: userId });
}

async function deleteTripService(tripId, userId) {
    return Trip.findOneAndDelete({ _id: tripId, user: userId });
}


module.exports = {
    createTripService,
    getMyTripsService,
    getTripByIdService,
    deleteTripService,
};