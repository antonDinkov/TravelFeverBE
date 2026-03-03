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
            type: "country",
            name: data.name,
            slug,
            code: data.code || data.name.slice(0, 2).toUpperCase(),
            short_description: data.description || "No description available.",
            image_url: data.image || "https://via.placeholder.com/400",
            featured_rank: 0,
        });

        return country;
    } catch (err) {
        console.log("Error cashing the country: ", err);
        throw err
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

    let existing = await City.find({
        name: data.name,
        country: existingCountry._id
    });

    if (existing.length > 0) return existing;

    try {
        const city = await City.findOneAndUpdate(
            { slug },
            {
                type: "city",
                name: data.name || "Unknown",
                slug,
                country: existingCountry._id,
                short_description: data.description || "No description available.",
                image_url: data.image || "https://via.placeholder.com/600x400",
                location: {
                    type: "Point",
                    coordinates: [data.lon, data.lat]
                }
            },
            { new: true, upsert: true }
        );

        return [city];
    } catch (err) {
        console.log("This is inside handleCiti is create err: ", err);
        throw err
    }
}

async function handlePOI(data) {

    // 1️⃣ ДЪРЖАВА
    let country = await Country.findOne({ name: data.country });

    if (!country) {
        country = await handleCountry({
            name: data.country,
            code: data.country.slice(0, 2).toUpperCase(),
            description: "No description available.",
            image: "https://via.placeholder.com/400"
        });
    }

    // 2️⃣ ГРАД
    let existingCity = await City.findOne({
        name: data.city,
        country: country._id
    });

    if (!existingCity) {
        const cities = await handleCity({
            name: data.city,
            country: country._id,
            description: data.description,
            image: data.image,
            lon: data.lon,
            lat: data.lat,
        });

        // handleCity връща масив
        existingCity = cities[0];
    }

    if (!existingCity) {
        throw new Error("City could not be created");
    }

    // 3️⃣ POI
    let existing = await Poi.find({
        name: data.name.trim(),
        city: existingCity._id
    });

    if (existing.length > 0) {
        return existing;
    }

    const poi = await Poi.findOneAndUpdate(
        {
            name: data.name.trim(),
            city: existingCity._id
        },
        {
            $set: {
                type: "poi",
                short_description: data.description,
                image_url: data.image || "https://via.placeholder.com/400"
            }
        },
        {
            new: true,
            upsert: true
        }
    );

    return [poi];
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

function attachFavorites(results, favorites, type) {

    const favoriteIds = favorites
        ?.filter(f => f.itemModel === type)
        .map(f => f.item.toString()) || [];

    const favoriteSet = new Set(favoriteIds);

    return results.map(item => ({
        ...item._doc || item,
        isFavorite: favoriteSet.has(item._id.toString())
    }));
}


module.exports = {
    handleCountry,
    handleCity,
    handlePOI,
    normalizeCityName,
    getWikiData,
    attachFavorites,
}