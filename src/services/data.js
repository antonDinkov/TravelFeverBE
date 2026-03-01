const { User } = require('../models/User');
const { Country } = require('../models/Countries');
const { City } = require('../models/Cities');
const { Poi } = require('../models/Pois');
const { geoApi, pixabayApi } = require('./api');
const { handleCountry, handleCity, handlePOI, normalizeCityName, getWikiData } = require('./helpers');


async function getAll() {
    return Data.find().lean();
};

async function getFeaturedCountries() {
    return Country
        .find({ featured_rank: { $exists: true, $gt: 0 } })
        .sort({ featured_rank: 1 })
        .lean();
}

async function getSearchResult(text, type) {
    try {
        if (!["country", "city", "poi"].includes(type)) {
            throw new Error("Invalid search type");
        }

        let existingResults = [];

        if (type === "country") {
            existingResults = await Country.find({
                name: { $regex: text, $options: "i" }
            });
        }

        if (type === "city") {
            existingResults = await City.find({
                name: { $regex: text, $options: "i" }
            }).populate("country");
        }

        if (type === "poi") {
            existingResults = await Poi.find({
                name: { $regex: text, $options: "i" }
            }).populate({
                path: "city",
                populate: { path: "country" }
            });
        }

        if (existingResults.length > 0) {
            return existingResults;
        }

        const params = { text, limit: 10 };
        if (type === "country") params.type = "country";
        if (type === "city") params.type = "city";

        const responseGeo = await geoApi.get("/geocode/search", { params });
        if (!responseGeo.data.features.length) return [];

        const topThree = responseGeo.data.features
            .sort((a, b) =>
                (b.properties.population || 0) -
                (a.properties.population || 0)
            )
            .slice(0, 3);

        const enrichedResultsSettled = await Promise.allSettled(
            topThree.map(async (item) => {
                const props = item.properties;

                let cityName
                if (type === 'poi') {
                    cityName = props.name || props.city;
                } else {
                    cityName = normalizeCityName(type == "country" ? props.country : props.name || props.city);
                }

                const wikiData = await getWikiData(cityName, props.country);

                const pixabayResponse = await pixabayApi.get('', { params: { q: cityName } });

                if (type === "poi") {
                    return {
                        name: cityName,
                        country: props.country,
                        city: normalizeCityName(props.city || props.state || props.region),
                        lat: props.lat || 0,
                        lon: props.lon || 0,
                        image: pixabayResponse.data.hits[0]?.webformatURL || null,
                        description: wikiData?.extract || null
                    };
                }

                return {
                    name: normalizeCityName(props.name || props.city || props.formatted),
                    country: props.country,
                    city: normalizeCityName(props.city || props.name),
                    lat: props.lat || 0,
                    lon: props.lon || 0,
                    image: pixabayResponse.data.hits[0]?.webformatURL || null,
                    description: wikiData?.extract || null
                };
            })
        );

        const enrichedResults = enrichedResultsSettled
            .filter(r => r.status === "fulfilled")
            .map(r => r.value);

        if (!enrichedResults.length) return [];

        let savedResults = [];

        if (type === "country") {
            savedResults = await Promise.allSettled(
                enrichedResults.map(handleCountry)
            );
            return savedResults.filter(r => r.status === "fulfilled").map(r => r.value);
        }

        if (type === "city") {
            savedResults = await Promise.allSettled(
                enrichedResults.map(handleCity)
            );
            const successful = savedResults.filter(r => r.status === "fulfilled").map(r => r.value);

            return await City.find({
                _id: { $in: successful.map(r => r._id) }
            }).populate("country");
        }

        if (type === "poi") {
            savedResults = await Promise.allSettled(
                enrichedResults.map(handlePOI)
            );
            const successful = savedResults.filter(r => r.status === "fulfilled").map(r => r.value);

            return await Poi.find({
                _id: { $in: successful.map(r => r._id) }
            }).populate({
                path: "city",
                populate: { path: "country" }
            });
        }

        return [];
    } catch (err) {
        console.error("Search error:", err);
        return [];
    }
}

async function addToFavorites(userId, itemId, itemModel) {

    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found " + userId);
    }

    user.myFavorites.push({ item: itemId, itemModel });
    await user.save();

    return user;
};

async function isItFavorite(userId, itemId) {

    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found " + userId);
    }

    return user?.myFavorites?.some(fav => fav.item.toString() === itemId.toString()) ?? false;
};

async function favorites(userId) {

    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found " + userId);
    }

    const favorites = user.myFavorites;
    if (favorites.length === 0) {
        return favorites;
    }
    const result = await Promise.all(
        favorites.map(async (item) => {
            if (item.itemModel === "country") {
                let country = await Country.findById(item.item);
                return country
            } else if (item.itemModel === "city") {
                let city = await City.findById(item.item);
                return city
            } else if (item.itemModel === "poi") {
                let poi = await Poi.findById(item.item);
                return poi
            }
        })
    )
    return result;
};

async function removeFromFavorites(userId, itemId) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found " + userId);
    }

    user.myFavorites = user.myFavorites.filter(fav => fav.item.toString() !== itemId.toString());
    await user.save();

    return user.myFavorites;
}

module.exports = {
    getAll,
    getFeaturedCountries,
    getSearchResult,
    addToFavorites,
    isItFavorite,
    favorites,
    removeFromFavorites,
}