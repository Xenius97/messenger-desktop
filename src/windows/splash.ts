import { BrowserWindow } from 'electron';
import { WINDOW_CONFIG } from '../config/windows';

export function createSplashWindow(): BrowserWindow {
    const splashWindow = new BrowserWindow(WINDOW_CONFIG.splash);
    splashWindow.loadFile('assets/splash.html');
    return splashWindow;
}
