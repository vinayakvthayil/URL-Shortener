// hooks/useURLShortener.js
import { useState } from 'react';

const useURLShortener = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shortUrl, setShortUrl] = useState('');

  const TINYURL_API_ENDPOINT = 'https://api.tinyurl.com/create';
  const API_KEY = process.env.REACT_APP_TINYURL_API_KEY;

  const shortenLink = async (originalUrl, customAlias = '') => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create TinyURL
      const tinyUrlResponse = await fetch(TINYURL_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: originalUrl,
          domain: "tinyurl.com",
          ...(customAlias && { alias: customAlias })
        })
      });

      const tinyUrlData = await tinyUrlResponse.json();
      
      if (!tinyUrlData.data || !tinyUrlData.data.tiny_url) {
        throw new Error(tinyUrlData.errors?.[0]?.message || 'Failed to create short URL');
      }

      // Save to backend
      const backendResponse = await fetch('http://localhost:5000/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl,
          shortUrl: tinyUrlData.data.tiny_url,
          customAlias
        })
      });

      if (!backendResponse.ok) {
        throw new Error('Failed to save URL to database');
      }

      const result = await backendResponse.json();
      setShortUrl(result.shortUrl);
      return result;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateShortUrl = async (urlId, customAlias) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get original URL first
      const urlResponse = await fetch(`http://localhost:5000/api/url/${urlId}`);
      const urlData = await urlResponse.json();
      
      // Create new TinyURL with custom alias
      const tinyUrlResponse = await fetch(TINYURL_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: urlData.originalUrl,
          domain: "tinyurl.com",
          alias: customAlias
        })
      });

      const tinyUrlData = await tinyUrlResponse.json();
      
      if (!tinyUrlData.data || !tinyUrlData.data.tiny_url) {
        throw new Error(tinyUrlData.errors?.[0]?.message || 'Failed to update short URL');
      }

      // Update in backend
      const updateResponse = await fetch(`http://localhost:5000/api/url/update/${urlId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shortUrl: tinyUrlData.data.tiny_url,
          customAlias
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update URL in database');
      }

      const result = await updateResponse.json();
      setShortUrl(result.shortUrl);
      return result;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getUrlAnalytics = async (urlId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/analytics/${urlId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    isLoading,
    error,
    shortUrl,
    shortenLink,
    updateShortUrl,
    getUrlAnalytics
  };
};

export default useURLShortener;
