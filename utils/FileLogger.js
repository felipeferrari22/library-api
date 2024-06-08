const fs = require('fs');
const path = require('path');

class FileLogger {
    constructor() {
        this.logFile = path.join(__dirname, './app.log');
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

module.exports = new FileLogger();