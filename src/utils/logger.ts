import { app } from 'electron';
import fs from 'fs';
import path from 'path';

let logPath: string = '';
let isDev = false;

export function initializeLogger(): void {
    isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    
    if (!isDev) {
        // Create logs directory
        const logsDir = path.join(app.getPath('userData'), 'UserLogs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        // Create log file with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        logPath = path.join(logsDir, `messenger-${timestamp}.log`);
        
        // Delete files older than 1 week
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        fs.readdirSync(logsDir).forEach(file => {
            const filePath = path.join(logsDir, file);
            const stats = fs.statSync(filePath);
            if (stats.mtimeMs < oneWeekAgo) {
                fs.unlinkSync(filePath);
            }
        });
    }
}

export function log(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = data 
        ? `[${timestamp}] ${message} ${JSON.stringify(data, null, 2)}`
        : `[${timestamp}] ${message}`;
    
    // Log to console
    console.log(logMessage);
    
    // Log to file if not in dev mode
    if (!isDev && logPath) {
        try {
            fs.appendFileSync(logPath, logMessage + '\n');
        } catch (err) {
            console.error('Failed to write to log file:', err);
        }
    }
}

export function error(message: string, err?: any): void {
    const timestamp = new Date().toISOString();
    const errorData = err instanceof Error 
        ? { message: err.message, stack: err.stack }
        : err;
    
    const logMessage = errorData
        ? `[${timestamp}] ERROR: ${message} ${JSON.stringify(errorData, null, 2)}`
        : `[${timestamp}] ERROR: ${message}`;
    
    // Log to console
    console.error(logMessage);
    
    // Log to file if not in dev mode
    if (!isDev && logPath) {
        try {
            fs.appendFileSync(logPath, logMessage + '\n');
        } catch (err2) {
            console.error('Failed to write error to log file:', err2);
        }
    }
}

export function getLogPath(): string {
    return logPath;
}
