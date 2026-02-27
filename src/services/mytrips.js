const { Trip } = require('../models/MyTrips');



async function createTripService(data) {
  return Trip.create(data);
}




module.exports = { createTripService };