const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String },               // Human-readable city as entered/derived
    normalizedCity: { type: String },     // Lowercased/trimmed city for exact matching
    // Denormalized names for Atlas Search (no $lookup on $search)
    categoryName: { type: String, trim: true },
    serviceNames: [{ type: String, trim: true }],
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],  // [longitude, latitude]
            required: true
        }
    },
    prefix: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    hasWhatsapp: { type: Boolean, default: true },
    logo: { type: String },
    rating: { type: Number },
    // heroImage: { type: String, required: true },
    description: String,
    // categoryId: String,
    // subCategoryIds: [String],
    // // active: { type: Boolean, required: true },
    // userId: String
    active: {  type: Boolean,  default: true},
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'categories', required: true },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'services' }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    openingHours: [
    {
      day: { type: Number, required: true },
      closed: { type: Boolean, default: false },
      ranges: [
        {
          open: String,
          close: String,
        }
      ]
    }
  ]
}, {
    timestamps: true // This will add and manage createdAt and updatedAt fields
});

// אינדקסים לשיפור ביצועים
businessSchema.index({ name: 1 }); // אינדקס לחיפוש לפי שם
businessSchema.index({ categoryId: 1 }); // אינדקס לסינון לפי קטגוריה
businessSchema.index({ services: 1 }); // אינדקס לסינון לפי שירותים
businessSchema.index({ rating: -1 }); // אינדקס למיון לפי דירוג
businessSchema.index({ createdAt: -1 }); // אינדקס למיון לפי תאריך יצירה
businessSchema.index({ active: 1 }); // אינדקס לסינון לפי סטטוס פעיל
businessSchema.index({ normalizedCity: 1, active: 1 }); // סינון מהיר לפי עיר

// אינדקס גיאו-מרחבי למיון לפי מרחק
businessSchema.index({ location: '2dsphere' });

// אינדקס טקסטואלי משולב לחיפוש חופשי
businessSchema.index(
    { 
        name: 'text',
        address: 'text',
        description: 'text',
        city: 'text',
        categoryName: 'text',
        serviceNames: 'text'
    },
    {
        weights: {
            name: 10,        // חשיבות גבוהה לשם העסק
            address: 5,      // חשיבות בינונית לכתובת
            description: 3,  // חשיבות נמוכה לתיאור
            city: 7,         // חשיבות לעיר
            categoryName: 6,
            serviceNames: 5
        },
        name: "BusinessTextIndexV2"
    }
);

// אינדקסים לחיפוש מדויק
businessSchema.index({ email: 1 });
businessSchema.index({ phone: 1 });

// אינדקסים מורכבים לשיפור ביצועי חיפוש
businessSchema.index({ active: 1, categoryId: 1, rating: -1 }); // אינדקס מורכב לסינון נפוץ
businessSchema.index({ active: 1, services: 1, rating: -1 }); // אינדקס מורכב לסינון נפוץ

const Business = mongoose.model('businesses', businessSchema);

module.exports = Business; 
