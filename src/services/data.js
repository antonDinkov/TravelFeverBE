const { Data } = require('../models/Data');
const { User } = require('../models/User');
const { Country } = require('../models/Countries');
const { City } = require('../models/Cities');
const { Poi } = require('../models/Pois');
const { geoApi, wikiApi, pixabayApi } = require('./api');
const { handleCountry, handleCity, handlePOI } = require('./helpers');


async function getAll() {
    return Data.find().lean();
};

async function getFeaturedCountries() {
    console.log("Inside featured ");
    
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
        /* console.log("This is response data from geo:", responseGeo.data); */
        

        if (!responseGeo.data.features.length) return [];

        const topThree = responseGeo.data.features
            .sort((a, b) =>
                (b.properties.population || 0) -
                (a.properties.population || 0)
            )
            .slice(0, 3);

        const enrichedResults = await Promise.all(
            topThree.map(async (item) => {

                const props = item.properties;
                /* console.log("This is the item", item);
                console.log("And this is the item properties",props); */
                
                

                const cityName = props.name || props.city;
                /* console.log("this is the city property: ", cityName); */
                
                const wikiData = await getWikiData(cityName, props.country);
                console.log(wikiData);
                

                return {
                    name: props.name || props.city || props.formatted,
                    country: props.country,
                    city: props.city || props.name,
                    lat: props.lat,
                    lon: props.lon,
                    image: wikiData?.originalimage?.source || null,
                    description: wikiData?.extract || null
                };

            })
        );

        let savedResults;

        if (type === "country") {
            savedResults = await Promise.all(
                enrichedResults.map(handleCountry)
            );
        }

        if (type === "city") {
            savedResults = await Promise.all(
                enrichedResults.map(handleCity)
            );

            return await City.find({
                _id: { $in: savedResults.map(r => r._id) }
            }).populate("country");
        }

        if (type === "poi") {
            savedResults = await Promise.all(
                enrichedResults.map(handlePOI)
            );

            return await Poi.find({
                _id: { $in: savedResults.map(r => r._id) }
            }).populate({
                path: "city",
                populate: { path: "country" }
            });
        }

        return savedResults;

    } catch (err) {
        console.log("Search error:", err);
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
            const res = await wikiApi.get(
                `/page/summary/${encodeURIComponent(q)}`
            );

            if (
                res.data &&
                res.data.type !== "disambiguation"
            ) {
                return res.data;
            }
        } catch (err) {
            continue;
        }

    }

    return null;
}




async function getTopFivePlayed() {
    return Data.find()
        .sort({ played: -1 })
        .limit(5)
        .lean();
}

async function getById(id) {
    return Data.findById(id).lean();
};

async function getByIdKey(id, key) {
    const result = await Data.findById(id).select(key).lean();
    return result?.[key];
};

async function create(data, authorId) {
    const record = new Data({
        name: data.name,
        manufacturer: data.manufacturer,
        genre: data.genre,
        image: data.image,
        iframeUrl: data.iframeUrl,
        instructions: data.instructions,
        description: data.description,
        likes: [],
        views: 0,
        played: 0,
        owner: authorId
    });

    await record.save();

    return record;
};

async function update(id, userId, newData) {
    const record = await Data.findById(id);

    if (!record) {
        throw new Error("Record not found " + id);
    };

    if (record.owner.toString() != userId) {
        throw new Error("Access denied");
    }

    //TODO replace with real properties
    record.name = newData.name,
        record.manufacturer = newData.manufacturer,
        record.genre = newData.genre,
        record.image = newData.image,
        record.iframeUrl = newData.iframeUrl,
        record.instructions = newData.instructions,
        record.description = newData.description,

        await record.save();

    return record;
};


async function interact(id, userId, interaction) {
    const record = await Data.findById(id);
    if (!record) {
        throw new Error("Game not found " + id);
    }

    const userRecord = await User.findById(userId);
    if (!userRecord) {
        throw new Error("User not found " + userId);
    }

    if (interaction === 'likes') {
        // Добавяне в лайкове
        if (!record.likes.includes(userId)) {
            record.likes.push(userId);
        }

        // Добавяне в моите игри
        if (!userRecord.myGames.includes(id)) {
            userRecord.myGames.push(id);
        }
    }
    else if (interaction === 'played') {
        // Увеличаване на броя игри
        record.played = (record.played || 0) + 1;

        // Записване на последно играна
        userRecord.lastPlayed = id;
    }
    else {
        // Ако имаш други типове взаимодействия
        record[interaction] = (record[interaction] || 0) + 1;
    }

    await record.save();
    await userRecord.save();

    return record;
}

async function deleteById(id, userId) {
    const record = await Data.findById(id);
    if (!record) {
        throw new Error("Record not found " + id);
    };

    if (record.owner.toString() != userId) {
        throw new Error("Access denied");
    };

    await Data.findByIdAndDelete(id);
};

async function searchByKeyword(keyword, field = 'name') {
    const regex = new RegExp(keyword, 'i');
    const filter = {};
    filter[field] = { $regex: regex };

    return Data.find(filter);
}

async function getMostViewed() {
    try {
        const results = await Data.find().sort({ views: -1 });
        return results;
    } catch (err) {
        console.error('Error getting most viewed:', err);
        throw err;
    }
}

async function getMostPlayed() {
    try {
        const results = await Data.find().sort({ played: -1 });
        return results;
    } catch (err) {
        console.error('Error getting most played:', err);
        throw err;
    }
}

async function getMostLiked() {
    try {
        const results = await Data.aggregate([
            {
                $addFields: {
                    likesCount: { $size: '$likes' }
                }
            },
            {
                $sort: { likesCount: -1 }
            }
        ]);
        return results;
    } catch (err) {
        console.error('Error getting most liked:', err);
        throw err;
    }
}

module.exports = {
    getAll,
    getFeaturedCountries,
    getSearchResult,
    getTopFivePlayed,
    getById,
    getByIdKey,
    create,
    update,
    interact,
    deleteById,
    searchByKeyword,
    getMostViewed,
    getMostPlayed,
    getMostLiked
}