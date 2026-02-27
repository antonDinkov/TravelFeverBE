const { Trip } = require('../models/MyTrips');



async function createTripService(data) {
  return Trip.create(data);
}

async function getMyTripsService(userId) {
    return Trip
        .find({ user: userId })
        .sort({ createdAt: -1 });
}


// just for commit
module.exports = {
    createTripService,
    getMyTripsService,
};