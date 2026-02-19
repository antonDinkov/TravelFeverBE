const { Country } = require('../models/Country');
const { City } = require('../models/City');
const { POI } = require('../models/POI');


function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}


async function handleCountry(data) {
    const slug = slugify(data.name);

    let existing = await Country.findOne({ slug });

    if (existing) return existing;

    const country = await Country.create({
        name: data.name,
        slug,
        code: data.code || data.name.slice(0, 2).toUpperCase(),
        short_description: data.description || "No description available.",
        image_url: data.image || "https://via.placeholder.com/400",
        featured_rank: 0
    });

    return country;
}


async function handleCity(data) {
    const slug = slugify(data.name + '-' + data.country);

    let existing = await City.findOne({ slug });
    if (existing) return existing;

    // намираме или създаваме държавата
    const country = await handleCountry({
        name: data.country,
        description: "",
        image: ""
    });

    const city = await City.create({
        name: data.name,
        slug,
        country: country._id,
        short_description: data.description || "",
        image_url: data.image || "",
        location: {
            type: "Point",
            coordinates: [data.lon, data.lat]
        }
    });

    return city;
}


async function handlePOI(data) {

    const city = await handleCity({
        name: data.city,
        country: data.country,
        description: "",
        image: ""
    });

    let existing = await POI.findOne({
        name: data.name,
        city: city._id
    });

    if (existing) return existing;

    const poi = await POI.create({
        name: data.name,
        city: city._id,
        short_description: data.description || "",
        image_url: data.image || ""
    });

    return poi;
}

module.exports = {
    handleCountry,
    handleCity,
    handlePOI
}