import { BrowserWindow, Menu, shell, Session, app, clipboard, globalShortcut } from 'electron';
import { WINDOW_CONFIG, WEB_PREFERENCES } from '../config/windows';
import { MESSENGER_URL, APP_TITLE } from '../config/constants';
import { isFacebookMessagesUrl } from '../utils/url';
import { startLoadingAnimation, stopLoadingAnimation } from '../utils/animation';
import { updateTaskbarBadge } from '../utils/taskbar';
import { createExternalWindow } from './external';
import { log } from '../utils/logger';
import { getSettings } from '../managers/settings';
import { exec } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let lastMessageCount = 0;
let debugOutgoingListener: ((details: any) => void) | null = null;
let debugHeadersListener: ((details: any, callback: any) => void) | null = null;
let debugIncomingListener: ((details: any) => void) | null = null;
let screenshotMonitorInterval: NodeJS.Timeout | null = null;

export function createMainWindow(tray: Electron.Tray | null, isQuitting: () => boolean): BrowserWindow {
    mainWindow = new BrowserWindow({
        ...WINDOW_CONFIG.main,
        webPreferences: WEB_PREFERENCES,
    });

    const webContents = mainWindow.webContents;

    setupPermissionHandler(webContents.session);
    setupContextMenu(webContents);
    setupLoadingIndicators(webContents);
    setupMessageCountMonitor(webContents, tray);
    setupNavigationHandlers(webContents);
    setupErrorHandler(webContents);
    
    // Reset message count when window gains focus
    mainWindow.on('focus', () => {
        // log('Window focused - resetting message count');
        resetMessageCount(tray);
    });
    
    // Don't await - let ready-to-show event trigger
    mainWindow.loadURL(MESSENGER_URL);

    // Note: ready-to-show is handled in main.ts to close splash window
    mainWindow.on('close', (event) => {
        if (!isQuitting() && mainWindow) {
            event.preventDefault();
            
            // Get current settings at runtime
            const currentSettings = getSettings();
            if (currentSettings.minimizeToTray) {
                mainWindow.hide();
            } else {
                app.quit();
            }
        }
    });

    return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
    return mainWindow;
}

export function resetMessageCount(tray: Electron.Tray | null): void {
    lastMessageCount = 0;
    if (tray && !tray.isDestroyed()) {
        tray.setToolTip('Messenger');
    }
    if (process.platform === 'win32') {
        updateTaskbarBadge(mainWindow, 0);
    }
}

function setupPermissionHandler(session: Session): void {
    session.setPermissionRequestHandler((webContents, permission, callback) => {
        // Allow notifications, media (camera, microphone) for calls
        const allowedPermissions = ['notifications', 'media', 'microphone', 'camera'];
        callback(allowedPermissions.includes(permission));
    });
}

function setupContextMenu(webContents: Electron.WebContents): void {
    webContents.on('context-menu', () => {
        const menu = Menu.buildFromTemplate([
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectAll' },
            { type: 'separator' },
            { role: 'reload' },
        ]);
        menu.popup();
    });
}

function setupLoadingIndicators(webContents: Electron.WebContents): void {
    if (!mainWindow) return;

    webContents.on('did-start-loading', () => {
        if (mainWindow) {
            startLoadingAnimation(mainWindow);
            mainWindow.setProgressBar(2);
        }
    });

    webContents.on('did-stop-loading', () => {
        if (mainWindow) {
            stopLoadingAnimation(mainWindow);
            mainWindow.setProgressBar(-1);
        }
    });

    webContents.on('did-navigate-in-page', () => {
        if (mainWindow) startLoadingAnimation(mainWindow);
    });

    webContents.on('did-frame-finish-load', () => {
        if (mainWindow) stopLoadingAnimation(mainWindow);
    });
}

function setupMessageCountMonitor(webContents: Electron.WebContents, tray: Electron.Tray | null): void {
    webContents.on('page-title-updated', (event, title) => {
        const match = title.match(/\((\d+)\)/);

        if (match) {
            const messageCount = parseInt(match[1], 10);
            log('Message count detected:' + messageCount + ', Last count:' + lastMessageCount);

            if (messageCount > lastMessageCount && lastMessageCount >= 0) {
                const newMessages = messageCount - lastMessageCount;
                log('Sending notification for ' + newMessages + ' new messages');

                if (process.platform === 'win32' && tray && !tray.isDestroyed()) {
                    tray.displayBalloon({
                        title: 'Messenger',
                        content: `${newMessages} new message${newMessages > 1 ? 's' : ''} received`,
                        icon: WINDOW_CONFIG.main.icon as string
                    });
                }
            }

            lastMessageCount = messageCount;

            if (tray && !tray.isDestroyed()) {
                tray.setToolTip(messageCount > 0 ? `Messenger (${messageCount} unread)` : 'Messenger');
            }

            if (process.platform === 'win32') {
                updateTaskbarBadge(mainWindow, messageCount);
            }
        } else if (title === APP_TITLE) {
            lastMessageCount = 0;
            if (tray && !tray.isDestroyed()) {
                tray.setToolTip('Messenger');
            }

            if (process.platform === 'win32') {
                updateTaskbarBadge(mainWindow, 0);
            }
        }
    });
}

function setupNavigationHandlers(webContents: Electron.WebContents): void {
    // Check if user is logged in by looking for Facebook session cookies
    const checkIfLoggedIn = async (): Promise<boolean> => {
        try {
            const cookies = await webContents.session.cookies.get({ domain: '.facebook.com' });
            // Check for c_user cookie which indicates logged in user
            const cUserCookie = cookies.find(cookie => cookie.name === 'c_user');
            return !!cUserCookie;
        } catch (error) {
            return false;
        }
    };
    
    webContents.setWindowOpenHandler(({ url }) => {
        log('Window open request:', url);
        
        if (isFacebookMessagesUrl(url)) {
            log('Allowing URL in app:', url);
            return { 
                action: 'allow',
                overrideBrowserWindowOptions: {
                    icon: WINDOW_CONFIG.main.icon as string,
                    title: 'Messenger Call'
                }
            };
        }
        // Open non-messages links externally
        log('Opening URL externally:', url);
        shell.openExternal(url);
        return { action: 'deny' };
    });
    
    // Set icon for newly created windows (calls)
    webContents.on('did-create-window', (window) => {
        window.setIcon(WINDOW_CONFIG.main.icon as string);
    });
    
    // Handle SPA navigation - only restrict if logged in
    webContents.on('did-navigate-in-page', async (event, url) => {
        const isLoggedIn = await checkIfLoggedIn();
        
        if (isLoggedIn && !isFacebookMessagesUrl(url)) {
            // Logged in and navigating away from messages -> block and open externally
            if (webContents.canGoBack()) {
                webContents.goBack();
            }
            shell.openExternal(url);
            log('Blocked in-page navigation (logged in):', url);
        }
        // If not logged in, allow all navigation for login flow
    });
}

function setupErrorHandler(webContents: Electron.WebContents): void {
    webContents.on('did-fail-load', async (event, errorCode, errorDescription, validatedURL) => {
        // ERR_TOO_MANY_REDIRECTS = -310
        if (errorCode === -310) {
            log('ERR_TOO_MANY_REDIRECTS detected - clearing cache and cookies...');
            
            try {
                // Clear cache and storage data
                await webContents.session.clearCache();
                await webContents.session.clearStorageData({
                    storages: ['cookies', 'localstorage', 'indexdb', 'serviceworkers', 'cachestorage']
                });
                
                log('Cache and cookies cleared - restarting...');
                
                // Wait a bit then reload
                setTimeout(() => {
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.loadURL(MESSENGER_URL);
                    }
                }, 1000);
            } catch (error) {
                log('Failed to clear cache:', error);
            }
        }
    });
}

// Screenshot Tool
export function takeQuickScreenshot(): void {
    if (!mainWindow) return;
    
    // log('Screenshot: Starting...');
    
    const initialClipboard = clipboard.readImage();
    const initialHash = initialClipboard.isEmpty() ? '' : initialClipboard.toDataURL();
    
    mainWindow.minimize();
    // log('Screenshot: Window minimized');
    
    setTimeout(() => {
        if (process.platform === 'win32') {
            exec('cmd /c start ms-screenclip:', (error) => {
                if (error) {
                    log('Screenshot: Failed to trigger screen clip: ' + error.message);
                // } else {
                    // log('Screenshot: Screen clip triggered');
                }
            });
        }
        
        let checkCount = 0;
        let maxChecks = 75;
        let clipStarted = false;

        const restoreWindow = (reason: string) => {
            if (screenshotMonitorInterval) {
                clearInterval(screenshotMonitorInterval);
                screenshotMonitorInterval = null;
            }
            if (globalShortcut.isRegistered('Escape')) {
                globalShortcut.unregister('Escape');
            }
            if (mainWindow) {
                mainWindow.removeListener('focus', onFocusRestore);
            }
            // log('Screenshot: ' + reason);
            if (mainWindow) {
                mainWindow.restore();
                mainWindow.focus();
            }
        };

        const onFocusRestore = () => {
            restoreWindow('Canceled by focus');
        };

        const pasteIntoInput = () => {
            if (!mainWindow) return;
            mainWindow.webContents.executeJavaScript(`
                (function() {
                    const input = document.querySelector('[contenteditable="true"][role="textbox"]');
                    if (input) {
                        input.focus();
                        setTimeout(() => {
                            document.execCommand('paste');
                        }, 100);
                    }
                })();
            `).then(() => {
                // log('Screenshot: Image pasted into chat input');
            }).catch((err) => {
                log('Screenshot: Failed to paste: ' + err.message);
            });
        };

        if (mainWindow)
            mainWindow.once('focus', onFocusRestore);

        if (globalShortcut.isRegistered('Escape'))
            globalShortcut.unregister('Escape');
        
        globalShortcut.register('Escape', () => {
            restoreWindow('Canceled by ESC');
        });

        screenshotMonitorInterval = setInterval(() => {
            checkCount++;

            if (clipStarted && checkCount > maxChecks) {
                restoreWindow('Timeout - no screenshot detected');
                return;
            }
            
            const currentClipboard = clipboard.readImage();
            if (!currentClipboard.isEmpty()) {
                const currentHash = currentClipboard.toDataURL();
                if (currentHash !== initialHash) {
                    restoreWindow('New image detected in clipboard');
                    setTimeout(pasteIntoInput, 400);
                    return;
                }
            }
        }, 200);
    }, 500);
}

// Debug Outgoing Requests
export function enableDebugOutgoing(): void {
    if (!mainWindow) return;
    
    log('\n' + '='.repeat(80));
    log('*** DEBUG OUTGOING: ENABLED ***');
    log('Monitoring OUTGOING requests...');
    log('='.repeat(80) + '\n');
    
    const session = mainWindow.webContents.session;
    
    // Remove existing listener if any
    if (debugOutgoingListener) {
        session.webRequest.onBeforeRequest(null);
    }
    if (debugHeadersListener) {
        session.webRequest.onBeforeSendHeaders(null);
    }
    
    // Monitor ALL outgoing requests
    debugOutgoingListener = (details) => {
        const url = details.url;
        
        // Skip non-Messenger/Facebook requests for cleaner log
        if (!url.includes('messenger.com') && !url.includes('facebook.com')) {
            return;
        }
        
        log('\n' + '-'.repeat(80));
        log('[OUTGOING REQUEST]');
        log('Method: ' + details.method);
        log('URL: ' + url);
        log('Type: ' + details.resourceType);
        
        // Log request body if present (for POST requests)
        if (details.uploadData) {
            log('[Request Body]:');
            details.uploadData.forEach((data: any) => {
                if (data.bytes) {
                    const bodyStr = Buffer.from(data.bytes).toString('utf-8');
                    log(bodyStr.substring(0, 1000)); // First 1000 chars
                    
                    // Highlight important keywords
                    if (bodyStr.match(/read|seen|delivery|receipt|typing|mark_read|change_read/i)) {
                        log('!!! IMPORTANT: Contains read/seen/typing keywords !!!');
                    }
                }
            });
        }
        
        log('-'.repeat(80) + '\n');
    };
    
    session.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, debugOutgoingListener);
    
    // Monitor request headers
    debugHeadersListener = (details, callback) => {
        const url = details.url;
        
        if (url.includes('messenger.com') || url.includes('facebook.com')) {
            if (details.requestHeaders && Object.keys(details.requestHeaders).length > 0) {
                log('[Request Headers] for: ' + url.split('?')[0]);
                // Only log interesting headers
                const interestingHeaders = ['content-type', 'authorization', 'x-fb-friendly-name'];
                interestingHeaders.forEach(key => {
                    if (details.requestHeaders[key]) {
                        log('  ' + key + ': ' + details.requestHeaders[key]);
                    }
                });
            }
        }
        
        callback({ requestHeaders: details.requestHeaders });
    };
    
    session.webRequest.onBeforeSendHeaders({ urls: ['<all_urls>'] }, debugHeadersListener);
}

export function disableDebugOutgoing(): void {
    if (!mainWindow) return;
    
    log('\n' + '='.repeat(80));
    log('*** DEBUG OUTGOING: DISABLED ***');
    log('='.repeat(80) + '\n');
    
    const session = mainWindow.webContents.session;
    
    // Remove listeners
    if (debugOutgoingListener) {
        session.webRequest.onBeforeRequest(null);
        debugOutgoingListener = null;
    }
    if (debugHeadersListener) {
        session.webRequest.onBeforeSendHeaders(null);
        debugHeadersListener = null;
    }
}

// Debug Incoming Responses
export function enableDebugIncoming(): void {
    if (!mainWindow) return;
    
    log('*** DEBUG INCOMING: ENABLED ***');
    
    const session = mainWindow.webContents.session;
    
    // Remove existing listener if any
    if (debugIncomingListener) {
        session.webRequest.onCompleted(null);
    }
    
    // Monitor responses
    debugIncomingListener = (details) => {
        const url = details.url;
        
        if (!url.includes('messenger.com') && !url.includes('facebook.com')) {
            return;
        }
        
        log('\n' + '-'.repeat(80));
        log('[INCOMING RESPONSE]');
        log('URL: ' + url);
        log('Status: ' + details.statusCode);
        log('Type: ' + details.resourceType);
        
        // Log response headers
        if (details.responseHeaders) {
            const contentType = details.responseHeaders['content-type']?.[0] || '';
            if (contentType) {
                log('Content-Type: ' + contentType);
            }
            
            // Log other interesting headers
            const interestingHeaders = ['x-fb-request-id', 'x-fb-trace-id'];
            interestingHeaders.forEach(key => {
                if (details.responseHeaders![key]) {
                    log(key + ': ' + details.responseHeaders![key][0]);
                }
            });
        }
        
        log('-'.repeat(80) + '\n');
    };
    
    session.webRequest.onCompleted({ urls: ['<all_urls>'] }, debugIncomingListener);
}

export function disableDebugIncoming(): void {
    if (!mainWindow) return;
    
    log('*** DEBUG INCOMING: DISABLED ***');
    
    const session = mainWindow.webContents.session;
    
    // Remove listener
    if (debugIncomingListener) {
        session.webRequest.onCompleted(null);
        debugIncomingListener = null;
    }
}
