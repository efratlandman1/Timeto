const logger = require('../logger');
const Sentry = require('../sentry');
const EmbeddingDocument = require('../models/embeddingDocument');
const { buildEntityEmbeddingPayload } = require('./entityEmbeddingTextBuilder');
const { generateEmbedding } = require('./openaiEmbeddingService');

/**
 * Upsert embedding document by entity type and id
 * @param {'business'|'promo'|'sale'} entityType
 * @param {string} entityId
 * @returns {Promise<string>} embedding document id
 */
const indexEntityById = async (entityType, entityId) => {
  const logSource = 'indexingService.indexEntityById';
  const et = String(entityType).toLowerCase();

  try {
    logger.info({ logSource, entityType: et, entityId }, 'enter');
    const { title, text, metadata } = await buildEntityEmbeddingPayload(et, entityId);
    const embedding = await generateEmbedding(text);

    const existing = await EmbeddingDocument.findOne({ 'metadata.entityType': et, 'metadata.entityId': String(entityId) });
    if (existing) {
      existing.title = title;
      existing.content = text;
      existing.embedding = embedding;
      existing.metadata = { ...existing.metadata, ...metadata };
      existing.active = true;
      await existing.save();
      logger.info({ logSource, id: existing._id }, 'complete (updated)');
      return String(existing._id);
    }

    const created = await EmbeddingDocument.create({ title, content: text, embedding, metadata, active: true });
    logger.info({ logSource, id: created._id }, 'complete (created)');
    return String(created._id);
  } catch (error) {
    logger.error({ logSource, entityType: et, entityId, error: error.message }, 'error');
    Sentry.captureException(error);
    throw error;
  }
};

/**
 * Set active flag on embedding doc by entity identity
 * @param {'business'|'promo'|'sale'} entityType
 * @param {string} entityId
 * @param {boolean} active
 */
const setEmbeddingActiveByEntity = async (entityType, entityId, active) => {
  const logSource = 'indexingService.setEmbeddingActiveByEntity';
  const et = String(entityType).toLowerCase();
  try {
    const res = await EmbeddingDocument.findOneAndUpdate(
      { 'metadata.entityType': et, 'metadata.entityId': String(entityId) },
      { $set: { active: !!active } },
      { new: true }
    );
    logger.info({ logSource, entityType: et, entityId, updated: !!res }, 'active toggled');
    return !!res;
  } catch (error) {
    logger.error({ logSource, entityType: et, entityId, error: error.message }, 'error');
    Sentry.captureException(error);
    return false;
  }
};

module.exports = {
  indexEntityById,
  setEmbeddingActiveByEntity,
};


