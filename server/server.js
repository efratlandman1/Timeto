const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const app = express();
require('dotenv').config();
const PORT = 5050;
const MONGO_URI = process.env.MONGO_URI;

const usersRouter = require('./routes/usersRoutes');
const businessesRouter = require('./routes/businessesRoutes');
const authRouter = require('./routes/authRoutes');
const categoryRoutes = require("./routes/categoryRoutes");
const serviceRoutes = require('./routes/serviceRoutes');
const feedbackRoutes  = require('./routes/feedbacksRoutes');
const favoritesRoutes = require('./routes/favoritesRoutes');
const jwtAuthMiddleware = require("./middlewares/authMiddleware");
const suggestionRouter = require('./routes/suggestionRoutes');
const statsRoutes = require('./routes/stats');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const path = require('path');


// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'config', 'uploads')));

mongoose.connect(MONGO_URI)
   .then(() => console.log('MongoDB connected'))
   .catch(err => console.error(err));

// Apply JWT middleware before protected routes
app.use(jwtAuthMiddleware)

app.use('/api/v1/users', usersRouter);
app.use('/api/v1/businesses', businessesRouter);
app.use("/api/v1/categories", categoryRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/feedbacks', feedbackRoutes);
app.use('/api/v1/favorites', favoritesRoutes);
app.use('/api/v1/suggestions', suggestionRouter);
app.use('/api/v1', authRouter);
app.use('/api/v1/stats', statsRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
