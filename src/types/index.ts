import { BrowserWindowConstructorOptions } from 'electron';

export interface WindowConfig extends BrowserWindowConstructorOptions {}

export interface UpdateProgress {
    percent: number;
    transferred: number;
    total: number;
    bytesPerSecond: number;
}

export interface AppState {
    mainWindow: Electron.BrowserWindow | null;
    splashWindow: Electron.BrowserWindow | null;
    updateProgressWindow: Electron.BrowserWindow | null;
    tray: Electron.Tray | null;
    isQuitting: boolean;
    lastMessageCount: number;
}
