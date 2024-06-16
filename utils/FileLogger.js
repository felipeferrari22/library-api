const fs = require('fs');
const path = require('path');

class FileLogger {
    static instance = null;

    constructor() {
        if (FileLogger.instance) {
            throw new Error('Use FileLogger.getInstance() to get the single instance of this class.');
        }
        this.logFile = path.join(__dirname, './app.log');
    }

    static getInstance() {
        if (!FileLogger.instance) {
            FileLogger.instance = new FileLogger();
        }
        return FileLogger.instance;
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - ${message}\n`;
        fs.appendFile(this.logFile, logMessage, (err) => {
            if (err) {
                console.error('Failed to write log to file:', err);
            }
        });
    }
}

module.exports = FileLogger.getInstance();