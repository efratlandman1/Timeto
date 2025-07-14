const { Client } = require('@googlemaps/google-maps-services-js');

const client = new Client({});

const mapsUtils = {
  async geocode(address) {
    try {
      const response = await client.geocode({
        params: {
          address,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });

      if (!response.data.results || response.data.results.length === 0) {
        throw new Error('No results found for this address');
      }

      return response.data.results[0].geometry.location;
    } catch (error) {
      // Sanitized error logging - don't expose API keys or sensitive data
      console.error('Error geocoding address:', error.message);
      if (error.response?.status) {
        console.error('Google Maps API status:', error.response.status);
      }
      throw error;
    }
  },

  async getDistance(origin, destination) {
    try {
      const response = await client.distancematrix({
        params: {
          origins: [origin],
          destinations: [destination],
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });

      return {
        distance: response.data.rows[0].elements[0].distance,
        duration: response.data.rows[0].elements[0].duration
      };
    } catch (error) {
      // Sanitized error logging - don't expose API keys or sensitive data
      console.error('Error getting distance:', error.message);
      if (error.response?.status) {
        console.error('Google Maps API status:', error.response.status);
      }
      throw error;
    }
  }
};

module.exports = mapsUtils; 