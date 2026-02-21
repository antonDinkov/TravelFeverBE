const axios = require('axios');

const geoApi = axios.create({
  baseURL: 'https://api.geoapify.com/v1',
  timeout: 10000,
  params: {
    apiKey: process.env.GEOAPIFY_KEY,
  },
});

const pixabayApi = axios.create({
    baseURL: "https://pixabay.com/api/",
    timeout: 10000,
    params: {
        key: process.env.PIXABAY_API_KEY,
        image_type: "phpto",
        per_page: 3,
    }
});

const wikiApi = axios.create({
  baseURL: 'https://en.wikipedia.org/api/rest_v1',
  timeout: 10000,
  headers: {
    'User-Agent': process.env.WIKI_USER_AGENT
  }
});

module.exports = {
  geoApi,
  pixabayApi,
  wikiApi,
};
