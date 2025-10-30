const OpenAI = require('openai');
const logger = require('../logger');

// Initialize once per process
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Generate an embedding vector for the provided text using OpenAI embeddings API
 * @param {string} text
 * @param {object} options
 * @param {string} [options.model]
 * @returns {Promise<number[]>}
 */
const generateEmbedding = async (text, options = {}) => {
  const model = options.model || DEFAULT_EMBEDDING_MODEL;
  const logSource = 'openaiEmbeddingService.generateEmbedding';

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Text is required to generate embedding');
  }

  logger.info({ msg: 'generateEmbedding enter', model, textLength: text.length, logSource });

  const input = text.replace(/\s+/g, ' ').trim();

  const response = await client.embeddings.create({ model, input });

  const vector = response?.data?.[0]?.embedding;
  if (!Array.isArray(vector) || vector.length === 0) {
    const error = new Error('Received invalid embedding vector from OpenAI');
    logger.error({ msg: 'generateEmbedding error', error: error.message, logSource });
    throw error;
  }

  logger.info({ msg: 'generateEmbedding complete', dimensions: vector.length, logSource });
  return vector;
};

module.exports = {
  generateEmbedding,
  DEFAULT_EMBEDDING_MODEL,
};


