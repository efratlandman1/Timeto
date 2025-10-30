const logger = require('../logger');
const Sentry = require('../sentry');
const EmbeddingDocument = require('../models/embeddingDocument');
const { generateEmbedding } = require('../services/openaiEmbeddingService');
const { rankByCosineSimilarity, cosineSimilarity } = require('../utils/vectorUtils');
const { buildEntityEmbeddingPayload } = require('../services/entityEmbeddingTextBuilder');

/**
 * POST /api/v1/embeddings/documents
 * Body: { content: string, title?: string, metadata?: object }
 * Creates a document (with embedding) for later vector search
 */
const createDocument = async (req, res) => {
  const logSource = 'embeddingsController.createDocument';
  const meta = { requestId: req.requestId, userId: req.user?._id, logSource };

  try {
    const { content, title, metadata } = req.body || {};
    logger.info({ ...meta, contentLength: content?.length || 0 }, `${logSource} enter`);

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'content is required' });
    }

    const embedding = await generateEmbedding(content);

    const doc = await EmbeddingDocument.create({ content, title, metadata, embedding });

    logger.info({ ...meta, id: doc._id, msg: `${logSource} complete` });
    return res.status(201).json({ success: true, data: { id: doc._id } });
  } catch (error) {
    logger.error({ ...meta, error: error.message }, `${logSource} error`);
    Sentry.captureException(error);
    return res.status(500).json({ success: false, error: 'Failed to create document' });
  }
};

/**
 * POST /api/v1/embeddings/search
 * Body: { query: string, topK?: number, includeContent?: boolean }
 * Returns topK most similar documents using cosine similarity
 */
const searchDocuments = async (req, res) => {
  const logSource = 'embeddingsController.searchDocuments';
  const meta = { requestId: req.requestId, userId: req.user?._id, logSource };

  try {
    const { query, topK = 5, includeContent = true, minScore = 0.2 } = req.body || {};
    logger.info({ ...meta, topK, minScore, queryLength: query?.length || 0 }, `${logSource} enter`);

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'query is required' });
    }

    const queryEmbedding = await generateEmbedding(query);

    // Naive scan: for MVP we scan active documents; for scale, consider MongoDB Atlas Vector Search
    // Always select content for lexical boosting (we'll omit from response if includeContent=false)
    const candidates = await EmbeddingDocument.find({ active: true })
      .select('embedding title content metadata')
      .lean();

    if (candidates.length === 0) {
      logger.info({ ...meta, msg: `${logSource} complete (no docs)` });
      return res.json({ success: true, data: [], count: 0 });
    }

    // Hybrid scoring: cosine + lexical boost
    const alpha = typeof req.body?.alpha === 'number' ? Math.min(1, Math.max(0, req.body.alpha)) : 0.7;
    const normalize = (s) => (s || '').toString().toLowerCase();
    const normQuery = normalize(query);
    const tokens = normQuery.split(/\s+/).filter(Boolean);

    const scored = candidates.map((doc) => {
      const cos = cosineSimilarity(queryEmbedding, doc.embedding || []);
      const title = normalize(doc.title);
      const content = normalize(doc.content);

      let exactTitle = title && title === normQuery ? 1 : 0;
      let titleHits = 0;
      let contentHits = 0;
      if (tokens.length > 0) {
        for (const t of tokens) {
          if (t && title.includes(t)) titleHits += 1;
          if (t && content.includes(t)) contentHits += 1;
        }
      }
      // Normalize lexical score to [0,1]
      const denom = tokens.length * 1.5 || 1; // title weight 1, content weight 0.5
      const lexical = exactTitle === 1 ? 1 : Math.min(1, (titleHits * 1 + contentHits * 0.5) / denom);
      const hybrid = alpha * cos + (1 - alpha) * lexical;

      return { doc, cos, lexical, score: hybrid };
    });

    const filtered = scored.filter((s) => typeof s.score === 'number' && s.score >= Number(minScore));
    filtered.sort((a, b) => b.score - a.score);
    const top = filtered.slice(0, Math.max(1, Number(topK) || 5));

    const results = top.map(({ doc, score }) => ({
      id: String(doc._id),
      title: doc.title,
      content: includeContent ? doc.content : undefined,
      metadata: doc.metadata || {},
      score,
    }));

    logger.info({ ...meta, returned: results.length, msg: `${logSource} complete` });
    return res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    logger.error({ ...meta, error: error.message }, `${logSource} error`);
    Sentry.captureException(error);
    return res.status(500).json({ success: false, error: 'Search failed' });
  }
};

module.exports = {
  createDocument,
  searchDocuments,
  // new exports below
  indexEntity: async (req, res) => {
    const logSource = 'embeddingsController.indexEntity';
    const meta = { requestId: req.requestId, userId: req.user?._id, logSource };

    try {
      const { entityType, entityId } = req.body || {};
      logger.info({ ...meta, entityType, entityId }, `${logSource} enter`);

      if (!entityType || !entityId) {
        return res.status(400).json({ success: false, error: 'entityType and entityId are required' });
      }

      const { title, text, metadata } = await buildEntityEmbeddingPayload(entityType, entityId);
      const embedding = await generateEmbedding(text);

      // Upsert by entityType+entityId
      const existing = await EmbeddingDocument.findOne({ 'metadata.entityType': metadata.entityType, 'metadata.entityId': metadata.entityId });
      if (existing) {
        existing.title = title;
        existing.content = text;
        existing.embedding = embedding;
        existing.metadata = { ...existing.metadata, ...metadata };
        await existing.save();
        logger.info({ ...meta, id: existing._id }, `${logSource} complete (updated)`);
        return res.json({ success: true, data: { id: existing._id, updated: true } });
      }

      const created = await EmbeddingDocument.create({ title, content: text, embedding, metadata });
      logger.info({ ...meta, id: created._id }, `${logSource} complete (created)`);
      return res.status(201).json({ success: true, data: { id: created._id, created: true } });
    } catch (error) {
      logger.error({ ...meta, error: error.message }, `${logSource} error`);
      Sentry.captureException(error);
      return res.status(500).json({ success: false, error: 'Indexing failed' });
    }
  },
};


