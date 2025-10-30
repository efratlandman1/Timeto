const Business = require('../models/business');
const PromoAd = require('../models/PromoAd');
const SaleAd = require('../models/SaleAd');

/**
 * Load an entity and build a descriptive text suited for embedding
 * @param {'business'|'promo'|'sale'} entityType
 * @param {string} entityId
 * @returns {Promise<{ title: string, text: string, metadata: object }>}
 */
const buildEntityEmbeddingPayload = async (entityType, entityId) => {
  if (!entityType || !entityId) {
    throw new Error('entityType and entityId are required');
  }

  const et = String(entityType).toLowerCase();

  if (et === 'business') {
    const doc = await Business.findById(entityId)
      .populate('categoryId', 'name')
      .populate('services', 'name')
      .lean();
    if (!doc) throw new Error('Business not found');
    const categoryName = doc.categoryId?.name || '';
    const serviceNames = Array.isArray(doc.services) ? doc.services.map(s => s?.name).filter(Boolean) : [];
    const title = doc.name || 'Business';
    const parts = [
      doc.name,
      doc.description,
      categoryName,
      serviceNames.join(', '),
    ].filter(Boolean);
    const text = parts.join(' | ');
    return {
      title,
      text,
      metadata: {
        entityType: 'business',
        entityId: String(doc._id),
        category: categoryName || undefined,
        services: serviceNames,
      },
    };
  }

  if (et === 'promo') {
    const doc = await PromoAd.findById(entityId).lean();
    if (!doc) throw new Error('PromoAd not found');
    const title = doc.title || 'Promo';
    const parts = [
      doc.title,
      doc.city,
    ].filter(Boolean);
    const text = parts.join(' | ');
    return {
      title,
      text,
      metadata: {
        entityType: 'promo',
        entityId: String(doc._id),
        city: doc.city || undefined,
        validFrom: doc.validFrom,
        validTo: doc.validTo,
      },
    };
  }

  if (et === 'sale') {
    const doc = await SaleAd.findById(entityId).populate('categoryId', 'name').lean();
    if (!doc) throw new Error('SaleAd not found');
    const categoryName = doc.categoryId?.name || '';
    const title = doc.title || 'Sale';
    const priceText = (doc.price !== undefined && doc.currency) ? `${doc.price} ${doc.currency}` : (doc.price !== undefined ? String(doc.price) : '');
    const parts = [
      doc.title,
      doc.description,
      categoryName,
      priceText,
      doc.city,
    ].filter(Boolean);
    const text = parts.join(' | ');
    return {
      title,
      text,
      metadata: {
        entityType: 'sale',
        entityId: String(doc._id),
        category: categoryName || undefined,
        city: doc.city || undefined,
        price: doc.price,
        currency: doc.currency,
      },
    };
  }

  throw new Error('Unsupported entityType');
};

module.exports = {
  buildEntityEmbeddingPayload,
};


