import { BrowserWindow } from 'electron';
import { APP_TITLE, LOADING_ANIMATION_INTERVAL, LOADING_DOT_COUNT } from '../config/constants';

let loadingAnimationInterval: NodeJS.Timeout | null = null;
let loadingDotCounter = 0;

export function startLoadingAnimation(window: BrowserWindow): void {
    if (loadingAnimationInterval || !window || window.isDestroyed()) return;

    loadingDotCounter = 0;
    loadingAnimationInterval = setInterval(() => {
        if (!window || window.isDestroyed()) {
            stopLoadingAnimation(window);
            return;
        }
        loadingDotCounter = (loadingDotCounter + 1) % LOADING_DOT_COUNT;
        const dots = '.'.repeat(loadingDotCounter);
        window.setTitle(`${APP_TITLE} - Loading${dots}`);
    }, LOADING_ANIMATION_INTERVAL);
}

export function stopLoadingAnimation(window: BrowserWindow): void {
    if (loadingAnimationInterval) {
        clearInterval(loadingAnimationInterval);
        loadingAnimationInterval = null;
    }
    if (window && !window.isDestroyed()) {
        window.setTitle(APP_TITLE);
    }
}
