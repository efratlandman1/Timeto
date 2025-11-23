/* eslint-disable no-console */
const mongoose = require('mongoose');
require('dotenv').config();

const Business = require('../models/business');
const Category = require('../models/category');
const Service = require('../models/service');
const SaleAd = require('../models/SaleAd');
const SaleCategory = require('../models/SaleCategory');
const SaleSubcategory = require('../models/SaleSubcategory');
const PromoAd = require('../models/PromoAd');

async function backfillBusinesses() {
  const cursor = Business.find({}, { categoryId: 1, services: 1 }).cursor();
  for await (const doc of cursor) {
    const update = {};
    try {
      if (doc.categoryId) {
        const cat = await Category.findById(doc.categoryId).select('name').lean();
        update.categoryName = cat ? cat.name : undefined;
      } else {
        update.categoryName = undefined;
      }
      const svcIds = Array.isArray(doc.services) ? doc.services : [];
      if (svcIds.length) {
        const svcs = await Service.find({ _id: { $in: svcIds } }).select('name').lean();
        update.serviceNames = svcs.map(s => s.name).filter(Boolean);
      } else {
        update.serviceNames = [];
      }
      await Business.updateOne({ _id: doc._id }, { $set: update });
    } catch (e) {
      console.error('Business backfill error', doc._id, e.message);
    }
  }
  console.log('Businesses backfill done');
}

async function backfillSaleAds() {
  const cursor = SaleAd.find({}, { categoryId: 1, subcategoryId: 1, subcategoryIds: 1 }).cursor();
  for await (const ad of cursor) {
    const update = {};
    try {
      if (ad.categoryId) {
        const cat = await SaleCategory.findById(ad.categoryId).select('name').lean();
        update.categoryName = cat ? cat.name : undefined;
      } else {
        update.categoryName = undefined;
      }
      let subIds = [];
      if (Array.isArray(ad.subcategoryIds) && ad.subcategoryIds.length) {
        subIds = ad.subcategoryIds;
      } else if (ad.subcategoryId) {
        subIds = [ad.subcategoryId];
        update.subcategoryIds = subIds;
      }
      if (subIds.length) {
        const subs = await SaleSubcategory.find({ _id: { $in: subIds } }).select('name').lean();
        update.subcategoryNames = subs.map(s => s.name).filter(Boolean);
      } else {
        update.subcategoryNames = [];
      }
      await SaleAd.updateOne({ _id: ad._id }, { $set: update });
    } catch (e) {
      console.error('SaleAd backfill error', ad._id, e.message);
    }
  }
  console.log('Sale ads backfill done');
}

async function backfillPromoAds() {
  const cursor = PromoAd.find({}, { categoryId: 1 }).cursor();
  for await (const ad of cursor) {
    try {
      let categoryName;
      if (ad.categoryId) {
        const cat = await Category.findById(ad.categoryId).select('name').lean();
        categoryName = cat ? cat.name : undefined;
      }
      await PromoAd.updateOne({ _id: ad._id }, { $set: { categoryName } });
    } catch (e) {
      console.error('PromoAd backfill error', ad._id, e.message);
    }
  }
  console.log('Promo ads backfill done');
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI in environment');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
  await backfillBusinesses();
  await backfillSaleAds();
  await backfillPromoAds();
  await mongoose.disconnect();
  console.log('Backfill completed');
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}


