const axios = require('axios');

const geoApi = axios.create({
  baseURL: 'https://api.geoapify.com/v1',
  timeout: 10000,
  params: {
    apiKey: process.env.GEOAPIFY_KEY,
  },
});

const unsplashApi = axios.create({
  baseURL: 'https://api.unsplash.com',
  timeout: 10000,
  headers: {
    Authorization: `Client-ID ${process.env.UNSPLASH_KEY}`,
  },
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
  unsplashApi,
  wikiApi,
};
