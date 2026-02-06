import { app, dialog, ipcMain, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { UPDATE_CHECK_DELAY, DOWNLOAD_TIMEOUT, CACHED_DOWNLOAD_DELAY, CACHED_DOWNLOAD_UPDATE_DELAY } from '../config/constants';
import { UpdateProgress } from '../types';
import { createUpdateProgressWindow } from '../windows/update-progress';
import { getMainWindow } from '../windows/main';
import { log } from '../utils/logger';

let updateProgressWindow: BrowserWindow | null = null;
let downloadTimeout: NodeJS.Timeout | null = null;
let downloadStarted = false;

export function setupAutoUpdater(): void {
    // Auto updater only works in packaged app
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        log('Auto updater disabled in development mode');
        return;
    }

    autoUpdater.autoDownload = false;
    autoUpdater.logger = console;

    // Log cache path
    const updateCachePath = path.join(app.getPath('userData'), '..', 'messenger-desktop-updater');
    log('Update cache directory:' + updateCachePath);

    autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'Xenius97',
        repo: 'messenger-desktop',
        releaseType: 'release'
    });

    setTimeout(() => {
        log('Checking for updates...');
        autoUpdater.checkForUpdates().catch(err => {
            console.error('Failed to check for updates:', err);
        });
    }, UPDATE_CHECK_DELAY);

    setupUpdateEvents();
    setupIpcHandlers();
}

function setupUpdateEvents(): void {
    autoUpdater.on('checking-for-update', () => {
        log('Checking for updates...');
    });

    autoUpdater.on('update-not-available', (info) => {
        log('Update not available. Current version:' + info.version);
    });

    autoUpdater.on('update-available', async (info) => {
        log('Update available:' + info.version);
        const mainWindow = getMainWindow();
        if (!mainWindow) return;

        const result = await dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: `A new version (${info.version}) is available!`,
            detail: 'Do you want to download and install the update?',
            buttons: ['Not Now', 'OK']
        });

        if (result.response === 1) {
            await startDownload();
        }
    });

    autoUpdater.on('download-progress', (progressObj: UpdateProgress) => {
        log('Download progress event received: ' + Math.round(progressObj.percent) + '% - ' +
            Math.round(progressObj.bytesPerSecond / 1024) + ' KB/s');

        if (!downloadStarted) {
            downloadStarted = true;
            if (downloadTimeout) {
                clearTimeout(downloadTimeout);
                downloadTimeout = null;
            }
        }

        if (updateProgressWindow && !updateProgressWindow.isDestroyed()) {
            log('Sending progress to window...');
            updateProgressWindow.webContents.send('download-progress', progressObj);
        } else {
            console.warn('Update progress window not available!', {
                exists: !!updateProgressWindow,
                destroyed: updateProgressWindow?.isDestroyed()
            });
        }
    });

    autoUpdater.on('update-downloaded', (info) => {
        log('Update downloaded successfully:' + info.version);
        clearDownloadTimeout();

        // Handle cached download (no progress events)
        if (!downloadStarted && updateProgressWindow && !updateProgressWindow.isDestroyed()) {
            log('No progress events received - cached download');
            simulateCachedDownload();
        } else if (updateProgressWindow && !updateProgressWindow.isDestroyed()) {
            updateProgressWindow.webContents.send('update-downloaded');
        } else {
            showUpdateReadyDialog();
        }
    });

    autoUpdater.on('error', (error) => {
        log('Update error:' + error.message);
        clearDownloadTimeout();
        
        if (updateProgressWindow && !updateProgressWindow.isDestroyed()) {
            updateProgressWindow.close();
            updateProgressWindow = null;
        }
        
        dialog.showErrorBox('Update Error', 'An error occurred during update: ' + error.message);
    });
}

function setupIpcHandlers(): void {
    ipcMain.on('restart-app', () => {
        autoUpdater.quitAndInstall();
    });

    ipcMain.on('close-update-window', () => {
        clearDownloadTimeout();
        if (updateProgressWindow && !updateProgressWindow.isDestroyed()) {
            updateProgressWindow.close();
            updateProgressWindow = null;
        }
    });
}

async function startDownload(): Promise<void> {
    log('Starting update download...');
    downloadStarted = false;

    // Wait for progress window to be ready
    updateProgressWindow = await createUpdateProgressWindow();
    log('Progress window created and ready');
    log('Window ID: ' + updateProgressWindow?.id);

    // Setup timeout for stuck downloads
    downloadTimeout = setTimeout(() => {
        if (!downloadStarted) {
            log('Download timeout - no progress received');
            if (updateProgressWindow && !updateProgressWindow.isDestroyed()) {
                updateProgressWindow.close();
                updateProgressWindow = null;
            }
            dialog.showErrorBox('Update Error',
                'The download did not start. Please check your internet connection and try again later.');
        }
    }, DOWNLOAD_TIMEOUT);

    try {
        log('Calling autoUpdater.downloadUpdate()');
        await autoUpdater.downloadUpdate();
    } catch (err: any) {
        log('Download failed: ' + err.message);
        clearDownloadTimeout();
        if (updateProgressWindow && !updateProgressWindow.isDestroyed()) {
            updateProgressWindow.close();
            updateProgressWindow = null;
        }
        dialog.showErrorBox('Update Error', 'Failed to download update: ' + err.message);
    }
}

function simulateCachedDownload(): void {
    // Wait a bit so user sees the window
    setTimeout(() => {
        if (updateProgressWindow && !updateProgressWindow.isDestroyed()) {
            updateProgressWindow.webContents.send('download-progress', {
                percent: 100,
                transferred: 1,
                total: 1,
                bytesPerSecond: 0
            });
            setTimeout(() => {
                if (updateProgressWindow && !updateProgressWindow.isDestroyed()) {
                    updateProgressWindow.webContents.send('update-downloaded');
                }
            }, CACHED_DOWNLOAD_UPDATE_DELAY);
        }
    }, CACHED_DOWNLOAD_DELAY);
}

function showUpdateReadyDialog(): void {
    const mainWindow = getMainWindow();
    if (!mainWindow) return;

    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded successfully!',
        detail: 'The application will be updated when you close it.',
        buttons: ['OK', 'Restart Now']
    }).then((result) => {
        if (result.response === 1) {
            autoUpdater.quitAndInstall();
        }
    });
}

function clearDownloadTimeout(): void {
    if (downloadTimeout) {
        clearTimeout(downloadTimeout);
        downloadTimeout = null;
    }
}
