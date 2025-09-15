const pino = require('pino');
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const streams = [
  // תמיד כותב לקובץ
  { stream: fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' }) }
];

if (process.env.NODE_ENV === 'dev') {
  // בפיתוח – גם למסך, בפורמט יפה
  streams.push({
    stream: pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      }
    })
  });
}

const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
  },
  pino.multistream(streams)
);

module.exports = logger; 