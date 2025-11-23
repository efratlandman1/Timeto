const { Client } = require('@googlemaps/google-maps-services-js');
const logger = require('../logger');
const Sentry = require('../sentry');

const client = new Client({});

const mapsUtils = {
  async geocode(address, req = null) {
    const logSource = 'mapsUtils.geocode';
    const meta = req ? {
      requestId: req.requestId,
      userId: req.user?._id,
      ip: req.ip,
      logSource
    } : { logSource };

    logger.info({ 
      ...meta,
      address: address.substring(0, 50) + (address.length > 50 ? '...' : ''), // Truncate long addresses
      msg: 'Starting geocoding request'
    });

    try {
      const resolveLanguage = () => {
        // Prefer explicit header language; fallback to he
        const header = req?.headers?.['accept-language'];
        if (typeof header === 'string' && header.length) {
          const first = header.split(',')[0].trim();
          const code = first.split('-')[0].trim();
          if (code) return code;
        }
        return 'he';
      };
      const language = resolveLanguage();
      const response = await client.geocode({
        params: {
          address,
          key: process.env.GOOGLE_MAPS_API_KEY,
          language
        }
      });

      if (!response.data.results || response.data.results.length === 0) {
        logger.warn({ 
          ...meta,
          address: address.substring(0, 50) + (address.length > 50 ? '...' : ''),
          msg: 'No geocoding results found for address'
        });
        Sentry.captureException(new Error(`No geocoding results found for address: ${address.substring(0, 100)}`));
        throw new Error('No results found for this address');
      }

      const location = response.data.results[0].geometry.location;
      
      logger.info({ 
        ...meta,
        address: address.substring(0, 50) + (address.length > 50 ? '...' : ''),
        latitude: location.lat,
        longitude: location.lng,
        msg: 'Geocoding successful'
      });

      return location;
    } catch (error) {
      // Sanitized error logging - don't expose API keys or sensitive data
      logger.error({ 
        ...meta,
        address: address.substring(0, 50) + (address.length > 50 ? '...' : ''),
        error: error.message,
        stack: error.stack,
        apiStatus: error.response?.status,
        apiStatusText: error.response?.statusText,
        msg: 'Geocoding failed'
      });
      Sentry.captureException(error);
      throw error;
    }
  },

  // Returns location + a best-effort city extracted from address_components
  async geocodeWithComponents(address, req = null) {
    const logSource = 'mapsUtils.geocodeWithComponents';
    const meta = req ? {
      requestId: req.requestId,
      userId: req.user?._id,
      ip: req.ip,
      logSource
    } : { logSource };

    try {
      const language = 'he';
      const response = await client.geocode({
        params: {
          address,
          key: process.env.GOOGLE_MAPS_API_KEY,
          language
        }
      });

      if (!response.data.results || response.data.results.length === 0) {
        throw new Error('No results found for this address');
      }

      const first = response.data.results[0];
      const location = first.geometry.location;
      const comps = Array.isArray(first.address_components) ? first.address_components : [];
      const findByType = (types) => {
        for (const c of comps) {
          const t = c.types || [];
          if (types.some(tt => t.includes(tt))) {
            return c.long_name || c.short_name || '';
          }
        }
        return '';
      };
      // Common city-like components
      const candidatesOrder = [
        ['locality'],
        ['postal_town'],
        ['administrative_area_level_2'],
        ['administrative_area_level_1']
      ];
      let city = '';
      for (const types of candidatesOrder) {
        city = findByType(types);
        if (city) break;
      }
      return { 
        location, 
        city 
      };
    } catch (error) {
      logger.error({ 
        ...meta,
        address: address.substring(0, 50) + (address.length > 50 ? '...' : ''),
        error: error.message,
        stack: error.stack,
        msg: 'geocodeWithComponents failed'
      });
      Sentry.captureException(error);
      throw error;
    }
  },

  async getDistance(origin, destination, req = null) {
    const logSource = 'mapsUtils.getDistance';
    const meta = req ? {
      requestId: req.requestId,
      userId: req.user?._id,
      ip: req.ip,
      logSource
    } : { logSource };

    logger.info({ 
      ...meta,
      origin: origin.substring(0, 50) + (origin.length > 50 ? '...' : ''),
      destination: destination.substring(0, 50) + (destination.length > 50 ? '...' : ''),
      msg: 'Starting distance calculation request'
    });

    try {
      const response = await client.distancematrix({
        params: {
          origins: [origin],
          destinations: [destination],
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });

      const result = {
        distance: response.data.rows[0].elements[0].distance,
        duration: response.data.rows[0].elements[0].duration
      };

      logger.info({ 
        ...meta,
        origin: origin.substring(0, 50) + (origin.length > 50 ? '...' : ''),
        destination: destination.substring(0, 50) + (destination.length > 50 ? '...' : ''),
        distance: result.distance?.text,
        duration: result.duration?.text,
        msg: 'Distance calculation successful'
      });

      return result;
    } catch (error) {
      // Sanitized error logging - don't expose API keys or sensitive data
      logger.error({ 
        ...meta,
        origin: origin.substring(0, 50) + (origin.length > 50 ? '...' : ''),
        destination: destination.substring(0, 50) + (destination.length > 50 ? '...' : ''),
        error: error.message,
        stack: error.stack,
        apiStatus: error.response?.status,
        apiStatusText: error.response?.statusText,
        msg: 'Distance calculation failed'
      });
      Sentry.captureException(error);
      throw error;
    }
  }
};

module.exports = mapsUtils; 