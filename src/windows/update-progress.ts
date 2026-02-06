import { BrowserWindow } from 'electron';
import path from 'path';
import { WINDOW_CONFIG } from '../config/windows';
import { PROGRESS_WINDOW_DELAY } from '../config/constants';
import { log } from '../utils/logger';

export async function createUpdateProgressWindow(): Promise<BrowserWindow> {
    log('Creating update progress window');
    
    const updateProgressWindow = new BrowserWindow({
        ...WINDOW_CONFIG.update,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            preload: path.join(__dirname, '../preload/update-progress.js'),
        },
    });

    updateProgressWindow.setMenu(null);
    log('Loading update-progress.html...');
    await updateProgressWindow.loadFile('assets/update-progress.html');
    log('HTML loaded, waiting for page to be ready...');

    return new Promise((resolve) => {
        updateProgressWindow.once('ready-to-show', () => {
            log('ready-to-show event fired');
            updateProgressWindow.show();
        });

        updateProgressWindow.webContents.once('did-finish-load', () => {
            log('did-finish-load event fired');
            
            setTimeout(() => {
                log('Resolving with update progress window');
                resolve(updateProgressWindow);
            }, PROGRESS_WINDOW_DELAY);
        });
        
        // Fallback in case events don't fire
        setTimeout(() => {
            log('Timeout reached, resolving anyway');
            resolve(updateProgressWindow);
        }, 3000);
    });
}
