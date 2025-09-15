const nodemailer = require('nodemailer');
const logger = require('../../logger');
const Sentry = require('../../sentry');

const sendEmail = async (options, req = null) => {
    const logSource = 'sendEmail.sendEmail';
    const meta = req ? {
        requestId: req.requestId,
        userId: req.user?._id,
        ip: req.ip,
        logSource
    } : { logSource };

    logger.info({ 
        ...meta,
        to: options.email,
        subject: options.subject,
        msg: 'Starting email send operation'
    });

    try {
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `Time-To <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            html: options.html,
        };

        const result = await transporter.sendMail(mailOptions);
        
        logger.info({ 
            ...meta,
            to: options.email,
            subject: options.subject,
            messageId: result.messageId,
            msg: 'Email sent successfully'
        });

        return result;
    } catch (error) {
        logger.error({ 
            ...meta,
            to: options.email,
            subject: options.subject,
            error: error.message,
            stack: error.stack,
            msg: 'Email send failed'
        });
        
        Sentry.captureException(error);
        throw error;
    }
};

module.exports = sendEmail; 