import { BrowserWindow } from 'electron';
import { WINDOW_CONFIG } from '../config/windows';
import { PROGRESS_WINDOW_DELAY } from '../config/constants';

export async function createUpdateProgressWindow(): Promise<BrowserWindow> {
    const updateProgressWindow = new BrowserWindow({
        ...WINDOW_CONFIG.update,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
        },
    });

    updateProgressWindow.setMenu(null);
    await updateProgressWindow.loadFile('assets/update-progress.html');

    return new Promise((resolve) => {
        updateProgressWindow.once('ready-to-show', () => {
            updateProgressWindow.show();
        });

        updateProgressWindow.webContents.once('did-finish-load', () => {
            // Wait for IPC system to initialize
            setTimeout(() => {
                resolve(updateProgressWindow);
            }, PROGRESS_WINDOW_DELAY);
        });
    });
}
