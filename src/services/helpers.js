const { Country } = require('../models/Countries');
const { City } = require('../models/Cities');
const { Poi } = require('../models/Pois');
const { pixabayApi, wikiApi } = require('./api');


async function handleCountry(data) {
    const slug = slugify(data.name);

    let existing = await Country.findOne({ slug });
    if (existing) return existing;
    try {
        const country = await Country.create({
            name: data.name,
            slug,
            code: data.code || data.name.slice(0, 2).toUpperCase(),
            short_description: data.description || "No description available.",
            image_url: data.image || "https://via.placeholder.com/400",
            featured_rank: 0,
        });

        return country;
    } catch (err) {
        console.log("Error cashing the country");
    }
}

async function handleCity(data) {
    let country;
    if (typeof data.country == 'string') {
        country = data.country;
    } else {
        let countryObj = await Country.findById(data.country);
        country = countryObj.name;
    }
    let existingCountry = await Country.findOne({ name: country });
    if (!existingCountry) {
        const countryWiki = await getWikiData(data.country, data.country);
        const countryPixabay = await pixabayApi.get('', { params: { q: data.country } });
        let countrySlug = slugify(data.country)
        existingCountry = await handleCountry({
            name: data.country,
            slug: countrySlug,
            code: data.name.slice(0, 2).toUpperCase(),
            short_description: countryWiki?.extract || "No description for this country",
            image_url: countryPixabay.data.hits[0]?.webformatURL || "https://via.placeholder.com/600x400",
            featured_rank: 0,
        });
    }

    const slug = slugify(data.name + '-' + country);

    let existing = await City.findOne({ slug });
    if (existing) return existing;

    try {
        const city = await City.create({
            name: data.name || "Unknown",
            slug,
            country: existingCountry._id,
            short_description: data.description || "No description available.",
            image_url: data.image || "https://via.placeholder.com/600x400",
            location: {
                type: "Point",
                coordinates: [data.lon, data.lat]
            }
        });
        return city;
    } catch (err) {
        console.log("This is inside handleCiti is create err: ", err);
    }
}

async function handlePOI(data) {
    const country = await Country.findOne({ name: data.country });
    let existingCity = await City.findOne({ name: data.city, country: country._id });

    if (!existingCity) {
        const cityWiki = await getWikiData(data.city, data.country);
        const cityPixabay = await pixabayApi.get('', { params: { q: data.city } });

        existingCity = await handleCity({
            name: data.city,
            country: country._id,
            description: cityWiki?.extract || "No description for this city",
            image: cityPixabay.data.hits[0]?.webformatURL || "https://via.placeholder.com/400",
            lon: data.lon,
            lat: data.lat,
        });
    }

    let existing = await Poi.find({
        name: data.name,
    });
    if (existing.length > 0) return existing;

    try {
        const poi = await Poi.create({
            name: data.name,
            city: existingCity._id,
            short_description: data.description,
            image_url: data.image || "https://via.placeholder.com/400",
        });
        return poi;
    } catch (err) {
        console.error("Error creating POI:", err);
        throw err;
    }
}

async function getWikiData(name, country) {
    const queries = [
        `${name}, ${country}`,
        name
    ];

    for (const q of queries) {
        try {
            console.log(`/page/summary/${encodeURIComponent(q)}`);
            const res = await wikiApi.get(
                `/page/summary/${encodeURIComponent(q)}`
            );

            if (res.data && res.data.type !== "disambiguation") {
                return res.data;
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                console.error("Wiki API error:", err.message);
            }
            continue;
        }

    }

    return null;
}

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function normalizeCityName(rawName) {
    if (!rawName) return null;

    let name = rawName.trim();

    const patternsToRemove = [
        /^capital city of\s+/i,
        /^district of\s+/i,
        /^city of\s+/i,
        /^town of\s+/i
    ];

    for (const pattern of patternsToRemove) {
        name = name.replace(pattern, "");
    }

    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    return name;
}


module.exports = {
    handleCountry,
    handleCity,
    handlePOI,
    normalizeCityName,
    getWikiData,
}