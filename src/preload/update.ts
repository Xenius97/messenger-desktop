import { ipcRenderer } from 'electron';

declare global {
    interface Window {
        api: typeof api;
    }
}

// Expose safe IPC API to renderer process
const api = {
    onDownloadProgress: (callback: (progress: any) => void) => {
        ipcRenderer.on('download-progress', (event, progress) => {
            callback(progress);
        });
    },
    onUpdateDownloaded: (callback: () => void) => {
        ipcRenderer.on('update-downloaded', () => {
            callback();
        });
    },
    restartApp: () => {
        ipcRenderer.send('restart-app');
    },
    closeUpdateWindow: () => {
        ipcRenderer.send('close-update-window');
    }
};

// Expose to window object
window.api = api;
