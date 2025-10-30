/*
 Backfill embeddings for all entities (business, promo, sale).
 Usage:
   NODE_ENV=dev node server/scripts/backfillEmbeddings.js
 or via npm script (see package.json):
   npm run backfill:embeddings
*/

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const logger = require('../logger');
const { indexEntityById } = require('../services/indexingService');

// Load models to ensure their schemas are registered
const Business = require('../models/business');
const PromoAd = require('../models/PromoAd');
const SaleAd = require('../models/SaleAd');
// Ensure referenced models are registered for populate()
require('../models/category');
require('../models/service');
require('../models/SaleCategory');

const MONGO_URI = process.env.MONGO_URI;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withConcurrency(items, concurrency, handler) {
  const queue = [...items];
  const workers = new Array(Math.min(concurrency, items.length)).fill(0).map(async () => {
    while (queue.length) {
      const item = queue.shift();
      try {
        await handler(item);
      } catch (err) {
        logger.error({ err: err?.message, stack: err?.stack, item }, 'backfill handler error');
      }
    }
  });
  await Promise.all(workers);
}

async function fetchIds(Model, baseFilter = {}) {
  const docs = await Model.find(baseFilter).select('_id').lean();
  return docs.map(d => String(d._id));
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    logger.error({ msg: 'OPENAI_API_KEY is missing' }, 'env validation');
    process.exit(1);
  }
  if (!MONGO_URI) {
    logger.error({ msg: 'MONGO_URI is missing' }, 'env validation');
    process.exit(1);
  }

  logger.info({ MONGO_URI: MONGO_URI.replace(/\/\/.*@/, '//***:***@') }, 'connecting to MongoDB');
  await mongoose.connect(MONGO_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
  });
  logger.info({}, 'MongoDB connected');

  try {
    const concurrency = Number(process.env.BACKFILL_CONCURRENCY || 3);
    const pauseMs = Number(process.env.BACKFILL_PAUSE_MS || 150);

    // Collect IDs per entity (active only)
    const [businessIds, promoIds, saleIds] = await Promise.all([
      fetchIds(Business, { active: true }),
      fetchIds(PromoAd, { active: true }),
      fetchIds(SaleAd, { active: true }),
    ]);

    logger.info({ business: businessIds.length, promo: promoIds.length, sale: saleIds.length, concurrency, pauseMs }, 'starting backfill');

    let createdOrUpdated = 0;
    let failures = 0;

    const runBatch = async (entityType, ids) => {
      await withConcurrency(ids, concurrency, async (id) => {
        try {
          await indexEntityById(entityType, id);
          createdOrUpdated += 1;
        } catch (err) {
          failures += 1;
        }
        if (pauseMs > 0) await sleep(pauseMs);
      });
    };

    await runBatch('business', businessIds);
    await runBatch('promo', promoIds);
    await runBatch('sale', saleIds);

    logger.info({ createdOrUpdated, failures }, 'backfill complete');
  } catch (err) {
    logger.error({ err: err?.message, stack: err?.stack }, 'backfill fatal error');
  } finally {
    await mongoose.disconnect();
    logger.info({}, 'MongoDB disconnected');
  }
}

main();


