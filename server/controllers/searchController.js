const Business = require('../models/business');
const Category = require('../models/category');
const Service = require('../models/service');
const SaleAd = require('../models/SaleAd');
const PromoAd = require('../models/PromoAd');
const mongoose = require('mongoose');
const logger = require('../logger');
const Sentry = require('../sentry');
const { successResponse, errorResponse, getRequestMeta, serializeError } = require('../utils/errorUtils');

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

exports.getAllUnified = async (req, res) => {
  const logSource = 'searchController.getAllUnified';
  const meta = getRequestMeta(req, logSource);
  try {
    const {
      q,
      page = 1,
      limit = 24,
      sort = 'newest',
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
    if (q) businessQuery.$text = { $search: q };
    let resolvedBusinessCategoryId = null;
    if (businessCategoryId && toObjectId(businessCategoryId)) {
      resolvedBusinessCategoryId = toObjectId(businessCategoryId);
    } else if (categoryName) {
      const cat = await Category.findOne({ name: new RegExp(`^${categoryName}$`, 'i') }).select('_id');
      if (cat) resolvedBusinessCategoryId = cat._id;
    }
    if (resolvedBusinessCategoryId) businessQuery.categoryId = resolvedBusinessCategoryId;
    let serviceIds = toObjectIdArray(services);
    if (!serviceIds.length && toArray(services).length) {
      // Resolve by service names
      const serviceDocs = await Service.find({ name: { $in: toArray(services) } }).select('_id');
      serviceIds = serviceDocs.map(s => s._id);
    }
    if (serviceIds.length) businessQuery.services = { $in: serviceIds };
    if (rating) businessQuery.rating = { $gte: Number(rating) };
    const city = req.query.city;
    if (city) {
      // Businesses: filter by address containing the city text
      businessQuery.address = { $regex: new RegExp(city, 'i') };
    }

    // Build Sale query
    let saleQuery = { active: true };
    if (q) saleQuery.$text = { $search: q };
    if (saleCategoryId && toObjectId(saleCategoryId)) saleQuery.categoryId = toObjectId(saleCategoryId);
    const saleSubIds = toObjectIdArray(req.query.saleSubcategoryId);
    if (saleSubIds.length) {
      saleQuery.subcategoryId = { $in: saleSubIds };
    } else if (saleSubcategoryId && toObjectId(saleSubcategoryId)) {
      saleQuery.subcategoryId = toObjectId(saleSubcategoryId);
    }
    if (city) saleQuery.city = { $regex: new RegExp(city, 'i') };
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
    if (q) promoQuery.$text = { $search: q };
    if (city) promoQuery.city = { $regex: new RegExp(city, 'i') };

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
        Business.aggregate([
          { $geoNear: { near: nearPoint, distanceField: 'distance', spherical: true, query: businessQuery } },
          { $limit: batchSize }
        ]),
        SaleAd.aggregate([
          { $geoNear: { near: nearPoint, distanceField: 'distance', spherical: true, query: saleQuery } },
          { $limit: batchSize }
        ]),
        PromoAd.aggregate([
          { $geoNear: { near: nearPoint, distanceField: 'distance', spherical: true, query: promoQuery } },
          { $limit: batchSize },
          // join category to expose name consistently
          { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
          { $addFields: { categoryId: { $arrayElemAt: ['$category', 0] } } },
          { $project: { category: 0 } }
        ])
      ]);
      bizRaw = bizAgg;
      salesRaw = saleAgg;
      promosRaw = promoAgg;
    } else {
      // Choose prefetch sort according to requested sort when no geo is present
      let businessPrefetchSort = { updatedAt: -1, createdAt: -1 };
      if (sort === 'rating') businessPrefetchSort = { rating: -1, updatedAt: -1 };
      if (sort === 'name') businessPrefetchSort = { name: 1 };

      [bizRaw, salesRaw, promosRaw] = await Promise.all([
        Business.find(businessQuery).sort(businessPrefetchSort).limit(batchSize).lean(),
        SaleAd.find(saleQuery).sort({ createdAt: -1 }).limit(batchSize).lean(),
        PromoAd.find(promoQuery).populate('categoryId', 'name').sort({ updatedAt: -1, createdAt: -1 }).limit(batchSize).lean()
      ]);
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
    const biz = requireOpenNow ? bizRaw.filter(isBusinessOpenNow) : bizRaw;
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

    logger.info({ ...meta, returned: pageItems.length, total }, `${logSource} complete`);
    return successResponse({ res, req, data: { items: pageItems, pagination: { total, page: pageNum, limit: limitNum, totalPages, hasMore: pageNum < totalPages } }, message: 'GET_ALL_UNIFIED_SUCCESS', logSource });
  } catch (err) {
    logger.error({ ...meta, error: serializeError(err) }, `${logSource} error`);
    Sentry.captureException(err);
    return errorResponse({ res, req, status: 500, message: 'GET_ALL_UNIFIED_ERROR', logSource });
  }
};


