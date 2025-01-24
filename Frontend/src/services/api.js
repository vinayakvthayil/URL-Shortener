import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';
const TINYURL_API_URL = 'https://api.tinyurl.com/create';
const TINYURL_API_KEY = process.env.REACT_APP_TINYURL_API_KEY;

export const shortenURL = async (originalUrl) => {
  try {
    // First, create short URL with TinyURL
    const tinyUrlResponse = await axios.post(TINYURL_API_URL, {
      url: originalUrl,
      domain: "tinyurl.com"
    }, {
      headers: {
        'Authorization': `Bearer ${TINYURL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Then save to your backend
    const response = await axios.post(`${API_BASE_URL}/shorten`, {
      originalUrl,
      shortUrl: tinyUrlResponse.data.data.tiny_url
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to shorten URL');
    }
    throw new Error('Network error occurred');
  }
};

export const updateURL = async (urlId, originalUrl, customAlias) => {
  try {
    // Create new TinyURL with custom alias
    const tinyUrlResponse = await axios.post(TINYURL_API_URL, {
      url: originalUrl,
      domain: "tinyurl.com",
      alias: customAlias
    }, {
      headers: {
        'Authorization': `Bearer ${TINYURL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Update in backend
    const response = await axios.put(`${API_BASE_URL}/url/update/${urlId}`, {
      customUrl: customAlias,
      shortUrl: tinyUrlResponse.data.data.tiny_url
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to update URL');
    }
    throw new Error('Network error occurred');
  }
};

export const getURLAnalytics = async (urlCode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/analytics/${urlCode}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch analytics');
  }
};

export const deleteURL = async (urlCode) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/url/${urlCode}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to delete URL');
  }
};
