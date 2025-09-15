const User = require('../models/user');
const Business = require('../models/business');
const Feedback = require('../models/feedback');
const { successResponse, errorResponse, getRequestMeta, serializeError } = require("../utils/errorUtils");
const logger = require("../logger");
const Sentry = require("@sentry/node");
const messages = require("../messages");

exports.getHomeStats = async (req, res) => {
    const logSource = 'statsController.getHomeStats';
    const meta = getRequestMeta(req, logSource);
    
    logger.info({ ...meta }, `${logSource} enter`);
    
    try {
        const [userCount, businessCount, feedbackCount] = await Promise.all([
            User.countDocuments(),
            Business.countDocuments({ active: true }),
            Feedback.countDocuments()
        ]);

        const stats = {
            users: userCount,
            businesses: businessCount,
            reviews: feedbackCount
        };

        logger.info({ ...meta, stats }, `${logSource} complete`);
        
        return successResponse({
            res,
            req,
            data: stats,
            message: "הנתונים הסטטיסטיים נטענו בהצלחה",
            logSource
        });
    } catch (error) {
        logger.error({ ...meta, error: serializeError(error) }, `${logSource} error`);
        Sentry.captureException(error);
        return errorResponse({
            res,
            req,
            message: "שגיאה בטעינת הנתונים הסטטיסטיים",
            logSource
        });
    }
}; 