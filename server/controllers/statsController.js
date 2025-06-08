const User = require('../models/user');
const Business = require('../models/business');
const Feedback = require('../models/feedback');

exports.getHomeStats = async (req, res) => {
    try {
        const [userCount, businessCount, feedbackCount] = await Promise.all([
            User.countDocuments(),
            Business.countDocuments({ active: true }),
            Feedback.countDocuments()
        ]);

        res.json({
            users: userCount,
            businesses: businessCount,
            reviews: feedbackCount
        });
    } catch (error) {
        console.error('Error fetching home stats:', error);
        res.status(500).json({ error: 'שגיאה בטעינת הנתונים הסטטיסטיים' });
    }
}; 