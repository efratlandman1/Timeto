const Business = require('../models/business');
const Category = require('../models/category');
const Service = require('../models/service');
const SaleAd = require('../models/SaleAd');
const PromoAd = require('../models/PromoAd');
const SaleCategory = require('../models/SaleCategory');
const SaleSubcategory = require('../models/SaleSubcategory');
const mongoose = require('mongoose');
const logger = require('../logger');
const Sentry = require('../sentry');
const { successResponse, errorResponse, getRequestMeta, serializeError } = require('../utils/errorUtils');

// Escape user input for safe usage in RegExp
function escapeRegExp(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Lightweight in-memory caches to avoid repeated lookups per name
const categoryNameCache = new Map(); // key: lower(name) -> { _id, ts }
const serviceNamesCache = new Map();  // key: JSON.stringify(sorted(names)) -> { ids[], ts }
const CACHE_TTL_MS = 60 * 1000; // 60s

async function getCategoryIdByNameCached(nameRaw) {
  const key = String(nameRaw || '').toLowerCase();
  const now = Date.now();
  const cached = categoryNameCache.get(key);
  if (cached && (now - cached.ts) < CACHE_TTL_MS) {
    return cached._id;
  }
  const safe = escapeRegExp(nameRaw || '');
  const cat = await Category.findOne({ name: new RegExp(`^${safe}$`, 'i') }).select('_id').lean();
  const id = cat ? cat._id : null;
  categoryNameCache.set(key, { _id: id, ts: now });
  return id;
}

async function getServiceIdsByNamesCached(namesInput) {
  const names = (Array.isArray(namesInput) ? namesInput : [namesInput]).filter(Boolean);
  const sorted = [...names].map(String);
  sorted.sort((a,b) => a.localeCompare(b));
  const key = JSON.stringify(sorted);
  const now = Date.now();
  const cached = serviceNamesCache.get(key);
  if (cached && (now - cached.ts) < CACHE_TTL_MS) {
    return cached.ids;
  }
  const serviceDocs = await Service.find({ name: { $in: sorted } }).select('_id').lean();
  const ids = serviceDocs.map(s => s._id);
  serviceNamesCache.set(key, { ids, ts: now });
  return ids;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Build Atlas Search stage: 'and' => all tokens must appear; 'phrase' => exact phrase
function buildAtlasSearchStage(queryString, paths, mode) {
  const q = (queryString || '').toString().trim();
  if (!q) return null;
  const safePaths = Array.isArray(paths) ? paths : [paths];
  const usePhrase = (mode || '').toString() === 'phrase';
  if (usePhrase) {
    return {
      $search: {
        index: 'default',
        compound: { must: [{ phrase: { query: q, path: safePaths } }] }
      }
    };
  }
  // Split on any non-letter/digit so tokens like "Keeling - Kirlin" won't include "-"
  const tokens = q.split(/[^0-9\p{L}]+/u).filter(Boolean);
  return {
    $search: {
      index: 'default',
      compound: {
        must: tokens.map(tok => ({
          text: { query: tok, path: safePaths }
        }))
      }
    }
  };
}

exports.getAllUnified = async (req, res) => {
  const logSource = 'searchController.getAllUnified';
  const meta = getRequestMeta(req, logSource);
  try {
    const {
      q,
      page = 1,
      limit = 24,
      sort,
      // business filters
      categoryId: businessCategoryId,
      categoryName,
      services,
      rating,
      // sale filters
      saleCategoryId,
      saleSubcategoryId,
      priceMin,
      priceMax,
      includeNoPrice,
      // common
      lat,
      lng,
      maxDistance,
      openNow
    } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 24, 60);

    // Helpers
    const toArray = (v) => (Array.isArray(v) ? v : (v !== undefined && v !== null ? [v] : []));
    const toObjectId = (id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null);
    const toObjectIdArray = (arr) => toArray(arr)
      .map(toObjectId)
      .filter(Boolean);

    // Build Business query
    let businessQuery = { active: true };
    const searchMode = (req.query.searchMode || '').toString();
    const usePhrase = searchMode === 'phrase';
    if (q && (lat && lng)) {
      // With geo we keep $text (Atlas $search + geo is handled in non-geo branch)
      businessQuery.$text = { $search: q, $language: 'none' };
    }
    let resolvedBusinessCategoryId = null;
    if (businessCategoryId && toObjectId(businessCategoryId)) {
      resolvedBusinessCategoryId = toObjectId(businessCategoryId);
    } else if (categoryName) {
      resolvedBusinessCategoryId = await getCategoryIdByNameCached(categoryName);
    }
    if (resolvedBusinessCategoryId) businessQuery.categoryId = resolvedBusinessCategoryId;
    let serviceIds = toObjectIdArray(services);
    if (!serviceIds.length && toArray(services).length) {
      // Resolve by service names (cached)
      serviceIds = await getServiceIdsByNamesCached(toArray(services));
    }
    if (serviceIds.length) businessQuery.services = { $in: serviceIds };
    if (rating) businessQuery.rating = { $gte: Number(rating) };
    const city = req.query.city;
    if (city) {
      // Exact city match via normalizedCity (no regex)
      businessQuery.normalizedCity = String(city).toLowerCase().trim();
    }

    // Build Sale query
    let saleQuery = { active: true };
    if (q && (lat && lng)) {
      saleQuery.$text = { $search: q, $language: 'none' };
    }
    if (saleCategoryId && toObjectId(saleCategoryId)) saleQuery.categoryId = toObjectId(saleCategoryId);
    const saleSubIds = toObjectIdArray(req.query.saleSubcategoryId);
    if (saleSubIds.length) {
      saleQuery.subcategoryId = { $in: saleSubIds };
    } else if (saleSubcategoryId && toObjectId(saleSubcategoryId)) {
      saleQuery.subcategoryId = toObjectId(saleSubcategoryId);
    }
    if (city) saleQuery.city = String(city);
    const min = priceMin !== undefined && priceMin !== '' ? Number(priceMin) : null;
    const max = priceMax !== undefined && priceMax !== '' ? Number(priceMax) : null;
    const allowNoPrice = includeNoPrice === 'true' || includeNoPrice === true;
    // Default: exclude ads without price unless includeNoPrice=true
    if (!allowNoPrice) saleQuery.price = { ...saleQuery.price, $exists: true };
    if (min !== null || max !== null) {
      saleQuery.price = saleQuery.price || {};
      if (min !== null) saleQuery.price.$gte = min;
      if (max !== null) saleQuery.price.$lte = max;
      // Ensure we only get items with price when price filter is applied
      saleQuery.price.$exists = true;
    }

    // Build Promo query - only valid and active promos should appear in unified search
    const now = new Date();
    let promoQuery = { active: true, validFrom: { $lte: now }, validTo: { $gte: now } };
    if (q && (lat && lng)) {
      promoQuery.$text = { $search: q, $language: 'none' };
    }
    if (city) promoQuery.city = String(city);

    // Determine openNow requirement before fetching
    const requireOpenNow = String(openNow) === 'true';

    // Fetch extra to allow merging then slicing.
    // When openNow=true we need a larger prefetch, otherwise many closed businesses inside
    // the batch will drop and lead to too few results and inconsistent totals across sort modes.
    const batchMultiplier = requireOpenNow ? 10 : 3;
    const batchSize = Math.min(200, limitNum * batchMultiplier);
    let bizRaw = [];
    let salesRaw = [];
    let promosRaw = [];
    const hasLatLng = lat && lng;
    if (hasLatLng) {
      const latN = parseFloat(lat);
      const lngN = parseFloat(lng);
      const nearPoint = { type: 'Point', coordinates: [lngN, latN] };
      // Distance-first prefetch to avoid missing nearby items due to createdAt ordering
      const [bizAgg, saleAgg, promoAgg] = await Promise.all([
        // Businesses (aggregation)
        Business.aggregate([
          { $geoNear: { near: nearPoint, distanceField: 'distance', spherical: true, query: businessQuery } },
          { $project: { 
            name: 1, address: 1, location: 1, logo: 1, rating: 1, categoryId: 1,
            services: 1, userId: 1, active: 1, openingHours: 1, createdAt: 1, updatedAt: 1, distance: 1
          }},
          { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
          { $addFields: { userId: { $let: { vars: { u: { $arrayElemAt: ['$user', 0] } }, in: { _id: '$$u._id', firstName: '$$u.firstName', lastName: '$$u.lastName' } } } } },
          { $unset: 'user' },
          { $limit: batchSize }
        ]),
        // Sale (aggregation)
        SaleAd.aggregate([
          { $geoNear: { near: nearPoint, distanceField: 'distance', spherical: true, query: saleQuery } },
          { $project: { 
            title: 1, description: 1, city: 1, price: 1, currency: 1, images: 1,
            location: 1, categoryId: 1, subcategoryId: 1, active: 1, createdAt: 1, updatedAt: 1, distance: 1
          }},
          { $limit: batchSize }
        ]),
        // Promo (aggregation)
        PromoAd.aggregate([
          { $geoNear: { near: nearPoint, distanceField: 'distance', spherical: true, query: promoQuery } },
          { $limit: batchSize },
          // join category to expose name consistently
          { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
          { $addFields: { categoryId: { $arrayElemAt: ['$category', 0] } } },
          { $unset: 'category' },
          { $project: { title: 1, city: 1, image: 1, location: 1, categoryId: 1, validFrom: 1, validTo: 1, active: 1, createdAt: 1, updatedAt: 1, distance: 1 } }
        ])
      ]);
      bizRaw = bizAgg;
      salesRaw = saleAgg;
      promosRaw = promoAgg;
    } else {
      // Atlas Search for non-geo when q exists; otherwise sort by defaults
      if (q) {
        const mode = (req.query.searchMode || 'and').toString();
        const [bizAgg, saleAgg, promoAgg] = await Promise.all([
          Business.aggregate([
            buildAtlasSearchStage(q, ['name', 'description', 'address', 'city', 'categoryName', 'serviceNames'], mode),
            { $match: businessQuery },
            { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
            { $addFields: { userId: { $let: { vars: { u: { $arrayElemAt: ['$user', 0] } }, in: { _id: '$$u._id', firstName: '$$u.firstName', lastName: '$$u.lastName' } } } } },
            { $unset: 'user' },
            { $limit: batchSize },
            { $project: { name: 1, address: 1, location: 1, logo: 1, rating: 1, categoryId: 1, services: 1, userId: 1, active: 1, openingHours: 1, createdAt: 1, updatedAt: 1 } }
          ]),
          SaleAd.aggregate([
            buildAtlasSearchStage(q, ['title', 'description', 'city', 'categoryName', 'subcategoryNames'], mode),
            { $match: saleQuery },
            { $limit: batchSize },
            { $project: { title: 1, description: 1, city: 1, price: 1, currency: 1, images: 1, location: 1, categoryId: 1, subcategoryId: 1, active: 1, createdAt: 1, updatedAt: 1 } }
          ]),
          PromoAd.aggregate([
            buildAtlasSearchStage(q, ['title', 'city', 'categoryName'], mode),
            { $match: promoQuery },
            { $limit: batchSize },
            { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
            { $addFields: { categoryId: { $arrayElemAt: ['$category', 0] } } },
            { $unset: 'category' },
            { $project: { title: 1, city: 1, image: 1, location: 1, categoryId: 1, validFrom: 1, validTo: 1, active: 1, createdAt: 1, updatedAt: 1 } }
        ])
      ]);
      bizRaw = bizAgg;
      salesRaw = saleAgg;
      promosRaw = promoAgg;
    } else {
        // Choose prefetch sort according to requested sort when no geo is present and no q
      let businessPrefetchSort = { updatedAt: -1, createdAt: -1 };
      if (sort === 'rating') businessPrefetchSort = { rating: -1, updatedAt: -1 };
      if (sort === 'name') businessPrefetchSort = { name: 1 };

      [bizRaw, salesRaw, promosRaw] = await Promise.all([
          // Use Atlas Search for non-geo when q provided; else fallback to .find
          q
            ? Business.aggregate([
                buildAtlasSearchStage(q, ['name', 'description', 'address', 'city', 'categoryName', 'serviceNames'], usePhrase ? 'phrase' : 'and'),
                { $match: businessQuery }, // includes active true and optional filters
                { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
                { $addFields: { userId: { $let: { vars: { u: { $arrayElemAt: ['$user', 0] } }, in: { _id: '$$u._id', firstName: '$$u.firstName', lastName: '$$u.lastName' } } } } },
                { $unset: 'user' },
                { $limit: batchSize },
                { $project: { name: 1, address: 1, location: 1, logo: 1, rating: 1, categoryId: 1, services: 1, userId: 1, active: 1, openingHours: 1, createdAt: 1, updatedAt: 1 } }
              ])
            : Business.find(businessQuery).select('name address location logo rating categoryId services userId active openingHours createdAt updatedAt').populate('userId', 'firstName lastName').sort(businessPrefetchSort).limit(batchSize).lean(),
          q
            ? SaleAd.aggregate([
                buildAtlasSearchStage(q, ['title', 'description', 'city', 'categoryName', 'subcategoryNames'], usePhrase ? 'phrase' : 'and'),
              { $match: saleQuery },
              { $limit: batchSize },
              { $project: { title: 1, description: 1, city: 1, price: 1, currency: 1, images: 1, location: 1, categoryId: 1, subcategoryId: 1, active: 1, createdAt: 1, updatedAt: 1 } }
            ])
            : SaleAd.find(singleFilterCleanup(saleQuery)).select('title description city price currency images location categoryId subcategoryId active createdAt updatedAt').sort({ createdAt: -1 }).limit(batchSize).lean(),
          q
            ? PromoAd.aggregate([
                buildAtlasSearchStage(q, ['title', 'city', 'categoryName'], usePhrase ? 'phrase' : 'and'),
              { $match: promoQuery },
              { $limit: batchSize },
              { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
              { $addFields: { categoryId: { $arrayElemAt: ['$category', 0] } } },
              { $unset: 'category' },
              { $project: { title: 1, city: 1, image: 1, location: 1, categoryId: 1, validFrom: 1, validTo: 1, active: 1, createdAt: 1, updatedAt: 1 } }
            ])
            : PromoAd.find(promoQuery).select('title city image location categoryId validFrom validTo active createdAt updatedAt').populate('categoryId', 'name').sort({ updatedAt: -1, createdAt: -1 }).limit(batchSize).lean()
        ]);
      }
// Helper to drop $text from filters when using $search
function singleFilterCleanup(q) {
  if (!q) return q;
  const nq = { ...q };
  if ('$text' in nq) delete nq['$text'];
  return nq;
}

// Global search suggestions across collections using Atlas Search (text or phrase)
exports.globalSearch = async (req, res) => {
  const logSource = 'searchController.globalSearch';
  const meta = getRequestMeta(req, logSource);
  try {
    const q = (req.query.q || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
    const mode = (req.query.mode || 'text').toString(); // 'text' | 'phrase'
    const usePhrase = mode === 'phrase';
    if (!q) return successResponse({ res, req, data: { suggestions: [] }, message: 'GLOBAL_SEARCH_EMPTY', logSource });

    const per = Math.max(1, Math.floor(Math.max(1, limit) / 3));

    const [bList, sList, pList] = await Promise.all([
      Business.aggregate([
        {
          $search: usePhrase
            ? { index: 'default', compound: { must: [{ phrase: { query: q, path: ['name', 'description', 'address', 'city', 'categoryName', 'serviceNames'] } }] } }
            : { index: 'default', text: { query: q, path: ['name', 'description', 'address', 'city', 'categoryName', 'serviceNames'] } }
        },
        { $match: { active: true } },
        { $limit: per },
        { $project: { _id: 1, title: '$name', subtitle: '$address', type: { $literal: 'business' } } }
      ]),
      SaleAd.aggregate([
        {
          $search: usePhrase
            ? { index: 'default', compound: { must: [{ phrase: { query: q, path: ['title', 'description', 'city'] } }] } }
            : { index: 'default', text: { query: q, path: ['title', 'description', 'city'] } }
        },
        { $match: { active: true } },
        { $limit: per },
        { $project: { _id: 1, title: '$title', subtitle: '$city', type: { $literal: 'sale' } } }
      ]),
      PromoAd.aggregate([
        {
          $search: usePhrase
            ? { index: 'default', compound: { must: [{ phrase: { query: q, path: ['title', 'city'] } }] } }
            : { index: 'default', text: { query: q, path: ['title', 'city'] } }
        },
        { $match: { active: true } },
        { $limit: per },
        { $project: { _id: 1, title: '$title', subtitle: '$city', type: { $literal: 'promo' } } }
      ])
    ]);

    const merged = [...bList, ...sList, ...pList].slice(0, limit).map(doc => ({
      id: doc._id,
      type: doc.type,
      title: doc.title,
      subtitle: doc.subtitle || ''
    }));

    return successResponse({ res, req, data: { suggestions: merged }, message: 'GLOBAL_SEARCH_OK', logSource });
  } catch (err) {
    logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
    Sentry.captureException(err);
    return errorResponse({ res, req, status: 500, message: 'GLOBAL_SEARCH_ERROR', logSource });
  }
};
    }

    // Apply openNow filtering
    const isBusinessOpenNow = (b) => {
      try {
        if (!Array.isArray(b.openingHours) || !b.openingHours.length) return true;
        const now = new Date();
        const day = now.getDay(); // 0-6, Sunday=0
        const todays = b.openingHours.find(h => Number(h.day) === day);
        if (!todays || todays.closed) return false;
        const toMinutes = (str) => {
          if (!str || typeof str !== 'string') return null;
          const [hh, mm] = str.split(':').map(Number);
          return (hh * 60) + (mm || 0);
        };
        const minutesNow = now.getHours() * 60 + now.getMinutes();
        return (todays.ranges || []).some(r => {
          const o = toMinutes(r.open);
          const c = toMinutes(r.close);
          if (o === null || c === null) return false;
          return minutesNow >= o && minutesNow <= c;
        });
      } catch (_) { return false; }
    };

    const isPromoCurrentlyActive = (p) => {
      if (!p || p.active === false) return false;
      const now = new Date();
      const from = p.validFrom ? new Date(p.validFrom) : null;
      const to = p.validTo ? new Date(p.validTo) : null;
      if (!from || !to) return true;
      return now >= from && now <= to;
    };

    // already computed above
      // Attach server-side openNow flag for deterministic UI, then apply filter if requested
      bizRaw = Array.isArray(bizRaw) ? bizRaw.map(b => ({ ...b, isOpenNow: isBusinessOpenNow(b) })) : [];
      let biz = requireOpenNow ? bizRaw.filter(isBusinessOpenNow) : bizRaw;
      // Enforce rating as hard constraint
      if (rating) {
        const minR = Number(rating);
        biz = biz.filter(b => ((b?.rating || 0) >= minR));
      }
    const promos = requireOpenNow ? promosRaw.filter(isPromoCurrentlyActive) : promosRaw;
    const sales = salesRaw; // openNow not applicable for sale ads

    // Merge items
    const makeItem = (type, data) => ({ type, data });
    let items = [
      ...biz.map(b => makeItem('business', b)),
      ...sales.map(s => makeItem('sale', s)),
      ...promos.map(p => makeItem('promo', p))
    ];

    // Normalize key fields for consumers (non-breaking: keep data + add top-level props)
    items = items.map(it => ({
      ...it,
      id: it.data?._id,
      title: it.data?.title || it.data?.name || '',
      price: it.type === 'sale' ? it.data?.price ?? null : null,
      categoryId: it.type === 'sale'
        ? it.data?.categoryId ?? null
        : (it.type === 'business'
            ? it.data?.categoryId ?? null
            : (it.type === 'promo'
                ? (it.data?.categoryId?._id || it.data?.categoryId || null)
                : null)),
      subcategoryId: it.type === 'sale' ? it.data?.subcategoryId ?? null : null,
      serviceIds: it.type === 'business' ? (Array.isArray(it.data?.services) ? it.data.services : []) : [],
      rating: it.type === 'business' ? (it.data?.rating ?? null) : null,
      location: it.data?.location || null,
      active: typeof it.data?.active === 'boolean' ? it.data.active : true,
      createdAt: it.data?.createdAt,
      updatedAt: it.data?.updatedAt
    }));

    // If openNow is requested, restrict to businesses only
    if (requireOpenNow) {
      items = items.filter(it => it.type === 'business');
    }

    // Enforce rating threshold for businesses at merge-level as well
    if (rating) {
      const minRating = Number(rating);
      items = items.filter(it => it.type !== 'business' || ((it.data?.rating || 0) >= minRating));
    }

    // Cross-type enforcement: when a filter is applied that a type cannot satisfy, exclude that type
    const hasBizFilter = !!(resolvedBusinessCategoryId || serviceIds.length || rating);
    const hasSaleFilter = !!(toObjectId(saleCategoryId) || toObjectId(saleSubcategoryId));
    const hasPriceFilter = (min !== null || max !== null);

    // If price filter present: keep only items that have a numeric price within range
    if (hasPriceFilter) {
      items = items.filter(it => {
        if (typeof it.price !== 'number') return false;
        if (min !== null && it.price < min) return false;
        if (max !== null && it.price > max) return false;
        return true;
      });
    }

    // If sale-specific filters exist: restrict to sale items
    if (hasSaleFilter) {
      items = items.filter(it => it.type === 'sale');
    }

    // If business-specific filters exist (and not sale/price filters): restrict to businesses
    if (hasBizFilter && !hasSaleFilter && !hasPriceFilter) {
      items = items.filter(it => it.type === 'business');
    }

    // Distance compute/filter/sort
    const hasGeo = lat && lng && (sort === 'distance' || (maxDistance !== undefined && maxDistance !== ''));
    if (hasGeo) {
      const latN = parseFloat(lat);
      const lngN = parseFloat(lng);
      items = items.map(it => {
        const coords = it?.data?.location?.coordinates; // [lng, lat]
        if (Array.isArray(coords) && coords.length === 2) {
          const d = haversineKm(latN, lngN, coords[1], coords[0]);
          return { ...it, distanceKm: d };
        }
        return { ...it, distanceKm: Infinity };
      });
      const maxD = maxDistance !== undefined && maxDistance !== '' ? Number(maxDistance) : null;
      if (maxD !== null) items = items.filter(it => it.distanceKm <= maxD);
      if (sort === 'distance') {
        items.sort((a, b) => {
          const da = (typeof a.distanceKm === 'number') ? a.distanceKm : Infinity;
          const db = (typeof b.distanceKm === 'number') ? b.distanceKm : Infinity;
          if (da !== db) return da - db;
          // Stable, deterministic tiebreakers to avoid apparent "ערבוב"
          const ta = new Date(a?.data?.updatedAt || a?.data?.createdAt || 0).getTime();
          const tb = new Date(b?.data?.updatedAt || b?.data?.createdAt || 0).getTime();
          if (ta !== tb) return tb - ta; // newer first
          const na = (a?.data?.name || a?.data?.title || '').toString();
          const nb = (b?.data?.name || b?.data?.title || '').toString();
          return na.localeCompare(nb);
        });
      }
    } else {
      // Default newest
      const getTs = (o) => new Date(o?.data?.updatedAt || o?.data?.createdAt || 0).getTime();
      if (sort === 'newest') items.sort((a,b)=> getTs(b) - getTs(a));
      if (sort === 'name') items.sort((a,b)=> ((a.data?.name || a.data?.title || '').localeCompare(b.data?.name || b.data?.title || '')));
      if (sort === 'rating') items.sort((a,b)=> ((b.data?.rating || 0) - (a.data?.rating || 0)));
    }

    const start = (pageNum - 1) * limitNum;
    const pageItems = items.slice(start, start + limitNum);
    const total = items.length;
    const totalPages = Math.ceil(total / limitNum) || 1;

    // Fallback only when NO precise filters are applied (to preserve “AND” semantics).
    const hasBizPrecise =
      !!(resolvedBusinessCategoryId || (serviceIds && serviceIds.length) || rating || city || requireOpenNow);
    const hasSalePrecise =
      !!(toObjectId(saleCategoryId) || toObjectId(saleSubcategoryId) || priceMin !== undefined || priceMax !== undefined);
    const allowFallback = q && total === 0 && !hasBizPrecise && !hasSalePrecise;
    if (allowFallback) {
      const safe = escapeRegExp(q);
      // Businesses fallback
      const [catDocs, svcDocs] = await Promise.all([
        Category.find({ name: new RegExp(safe, 'i') }).select('_id'),
        Service.find({ name: new RegExp(safe, 'i') }).select('_id')
      ]);
      const catIds = catDocs.map(c => c._id);
      const svcIds = svcDocs.map(s => s._id);
      const bizFbQuery = {
        active: true,
        $or: [
          { city: new RegExp(safe, 'i') },
          { address: new RegExp(safe, 'i') },
          { name: new RegExp(safe, 'i') },
          ...(catIds.length ? [{ categoryId: { $in: catIds } }] : []),
          ...(svcIds.length ? [{ services: { $in: svcIds } }] : []),
        ]
      };
      const bizFb = await Business.find(bizFbQuery)
        .select('name address location logo rating categoryId services userId active openingHours createdAt updatedAt')
        .limit(limitNum * 3)
        .lean();

      // Sale fallback
      const [saleCatDocs, saleSubDocs] = await Promise.all([
        SaleCategory.find({ name: new RegExp(safe, 'i') }).select('_id'),
        SaleSubcategory.find({ name: new RegExp(safe, 'i') }).select('_id'),
      ]);
      const saleCatIds = saleCatDocs.map(d => d._id);
      const saleSubIds = saleSubDocs.map(d => d._id);
      const saleFbQuery = {
        active: true,
        $or: [
          { title: new RegExp(safe, 'i') },
          { description: new RegExp(safe, 'i') },
          { city: new RegExp(safe, 'i') },
          ...(saleCatIds.length ? [{ categoryId: { $in: saleCatIds } }] : []),
          ...(saleSubIds.length ? [{ subcategoryId: { $in: saleSubIds } }] : []),
        ]
      };
      const saleFb = await SaleAd.find(saleFbQuery)
        .select('title description price currency images city address phone prefix hasWhatsapp categoryId userId active createdAt updatedAt location')
        .limit(limitNum * 3)
        .lean();

      // Promo fallback
      const promoCatDocs = await Category.find({ name: new RegExp(safe, 'i') }).select('_id');
      const promoCatIds = promoCatDocs.map(d => d._id);
      const promoFbQuery = {
        active: true,
        $or: [
          { title: new RegExp(safe, 'i') },
          { city: new RegExp(safe, 'i') },
          ...(promoCatIds.length ? [{ categoryId: { $in: promoCatIds } }] : []),
        ]
      };
      const promoFb = await PromoAd.find(promoFbQuery)
        .select('title city address categoryId image validFrom validTo active userId createdAt updatedAt location')
        .limit(limitNum * 3)
        .lean();

      let fbItems = [
        ...bizFb.map(b => ({ type: 'business', data: b })),
        ...saleFb.map(s => ({ type: 'sale', data: s })),
        ...promoFb.map(p => ({ type: 'promo', data: p })),
      ];

      // Apply the same default sorting logic
      const getTs = (o) => new Date(o?.data?.updatedAt || o?.data?.createdAt || 0).getTime();
      if (sort === 'newest') fbItems.sort((a,b)=> getTs(b) - getTs(a));
      if (sort === 'name') fbItems.sort((a,b)=> ((a.data?.name || a.data?.title || '').localeCompare(b.data?.name || b.data?.title || '')));
      if (sort === 'rating') fbItems.sort((a,b)=> ((b.data?.rating || 0) - (a.data?.rating || 0)));

      const fbStart = (pageNum - 1) * limitNum;
      const fbPageItems = fbItems.slice(fbStart, fbStart + limitNum);
      const fbTotal = fbItems.length;
      const fbTotalPages = Math.ceil(fbTotal / limitNum) || 1;

      logger.info({ ...meta, returned: fbPageItems.length, total: fbTotal, fallback: true }, `${logSource} complete (fallback)`);
      return successResponse({ res, req, data: { items: fbPageItems, pagination: { total: fbTotal, page: pageNum, limit: limitNum, totalPages: fbTotalPages, hasMore: pageNum < fbTotalPages } }, message: 'GET_ALL_UNIFIED_SUCCESS', logSource });
    }

    // Short cache for unauthenticated, public search results
    if (!req.user) {
      res.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');
    }

    logger.info({ ...meta, returned: pageItems.length, total }, `${logSource} complete`);
    return successResponse({ res, req, data: { items: pageItems, pagination: { total, page: pageNum, limit: limitNum, totalPages, hasMore: pageNum < totalPages } }, message: 'GET_ALL_UNIFIED_SUCCESS', logSource });
  } catch (err) {
    logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
    Sentry.captureException(err);
    return errorResponse({ res, req, status: 500, message: 'GET_ALL_UNIFIED_ERROR', logSource });
  }
};

// Global search suggestions across collections using Atlas Search (text or phrase)
exports.globalSearch = async (req, res) => {
  const logSource = 'searchController.globalSearch';
  const meta = getRequestMeta(req, logSource);
  try {
    const q = (req.query.q || '').toString().trim();
    const limit = Math.min(parseInt(req.requestLimit || req.query.limit || '10', 10), 50);
    const mode = (req.query.mode || 'text').toString(); // 'text' | 'phrase'
    const usePhrase = mode === 'phrase';
    if (!q) return successResponse({ res, req, data: { suggestions: [] }, message: 'GLOBAL_SEARCH_EMPTY', logSource });

    const per = Math.max(1, Math.floor(Math.max(1, limit) / 3));

    const [bList, sList, pList] = await Promise.all([
      Business.aggregate([
        {
          $search: usePhrase
            ? { index: 'default', compound: { must: [{ phrase: { query: q, path: ['name', 'description', 'address', 'city', 'categoryName', 'serviceNames'] } }] } }
            : { index: 'default', text: { query: q, path: ['name', 'description', 'address', 'city', 'categoryName', 'serviceNames'] } }
        },
        { $match: { active: true } },
        { $limit: per },
        { $project: { _id: 1, title: '$name', subtitle: '$address', type: { $literal: 'business' } } }
      ]),
      SaleAd.aggregate([
        {
          $search: usePhrase
            ? { index: 'default', compound: { must: [{ phrase: { query: q, path: ['title', 'description', 'city'] } }] } }
            : { index: 'default', text: { query: q, path: ['title', 'description', 'city'] } }
        },
        { $match: { active: true } },
        { $limit: per },
        { $project: { _id: 1, title: '$title', subtitle: '$city', type: { $literal: 'sale' } } }
      ]),
      PromoAd.aggregate([
        {
          $search: usePhrase
            ? { index: 'default', compound: { must: [{ phrase: { query: q, path: ['title', 'city'] } }] } }
            : { index: 'default', text: { query: q, path: ['title', 'city'] } }
        },
        { $match: { active: true } },
        { $limit: per },
        { $project: { _id: 1, title: '$title', subtitle: '$city', type: { $literal: 'promo' } } }
      ])
    ]);

    const merged = [...bList, ...sList, ...pList].slice(0, limit).map(doc => ({
      id: doc._id,
      type: doc.type,
      title: doc.title,
      subtitle: doc.subtitle || ''
    }));

    return successResponse({ res, req, data: { suggestions: merged }, message: 'GLOBAL_SEARCH_OK', logSource });
  } catch (err) {
    logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
    Sentry.captureException(err);
    return errorResponse({ res, req, status: 500, message: 'GLOBAL_SEARCH_ERROR', logSource });
  }
};

