const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { Writable } = require('stream');

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Daily file naming (local date)
const getDailyFileName = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  return `app-${yyyy}-${mm}-${dd}.log`;
};

let currentFileName = '';
let currentFileStream = null;

const ensureFileOpen = () => {
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const daily = getDailyFileName();
    const filePath = path.join(logDir, daily);
    const needNew = daily !== currentFileName || !fs.existsSync(filePath) || !currentFileStream;
    if (needNew) {
      if (currentFileStream) {
        try { currentFileStream.end(); } catch (_) {}
      }
      currentFileStream = fs.createWriteStream(filePath, { flags: 'a' });
      currentFileName = daily;
    }
  } catch (_) {
    // never throw from logging setup
  }
};

// Writable proxy that always writes to the current file stream
const rotatingFileSink = new Writable({
  write(chunk, enc, cb) {
    if (!currentFileStream) {
      try { ensureFileOpen(); } catch (_) {}
    }
    if (currentFileStream) {
      currentFileStream.write(chunk, enc, cb);
    } else {
      cb();
    }
  }
});

// Initial open and watchdog every 2s
ensureFileOpen();
setInterval(ensureFileOpen, 2000);

const streams = [
  { stream: rotatingFileSink }
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
    // Local ISO8601 timestamp with timezone offset
    timestamp: () => {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const HH = pad(d.getHours());
      const MM = pad(d.getMinutes());
      const SS = pad(d.getSeconds());
      const mmm = String(d.getMilliseconds()).padStart(3, '0');
      const tz = -d.getTimezoneOffset();
      const sign = tz >= 0 ? '+' : '-';
      const tzh = pad(Math.floor(Math.abs(tz) / 60));
      const tzm = pad(Math.abs(tz) % 60);
      const isoLocal = `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}.${mmm}${sign}${tzh}:${tzm}`;
      return `,"time":"${isoLocal}"`;
    },
    // Add human-readable level_name while keeping numeric level
    formatters: {
      level(label, number) {
        return { level: number, level_name: label.toUpperCase() };
      }
    }
  },
  pino.multistream(streams)
);

module.exports = logger; 