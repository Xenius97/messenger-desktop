import { ipcMain, clipboard, dialog, shell, app, BrowserWindow, Menu, MenuItem } from 'electron';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { log } from '../utils/logger';

export function setupImageHandlers(): void {
    ipcMain.handle('show-image-context-menu', async (event, imageData: { src: string; alt: string }) => {
        const menu = new Menu();
        
        menu.append(new MenuItem({
            label: 'Copy Image',
            click: async () => {
                try {
                    const canvas = await downloadImageAsBlob(imageData.src);
                    if (canvas) {
                        clipboard.writeImage(canvas);
                        log('Image copied to clipboard');
                    }
                } catch (err: any) {
                    log('Failed to copy image: ' + err.message);
                }
            }
        }));
        
        menu.append(new MenuItem({
            label: 'Save Image As...',
            click: async () => {
                try {
                    const result = await saveImage(imageData.src);
                    if (result.success) {
                        log('Image saved to: ' + result.path);
                    }
                } catch (err: any) {
                    log('Failed to save image: ' + err.message);
                }
            }
        }));
        
        menu.append(new MenuItem({
            label: 'Open Image in Browser',
            click: async () => {
                try {
                    await shell.openExternal(imageData.src);
                    log('Opened image in browser: ' + imageData.src);
                } catch (err: any) {
                    log('Failed to open image: ' + err.message);
                }
            }
        }));
        
        menu.popup({ window: BrowserWindow.getFocusedWindow() || undefined });
        return { success: true };
    });

    ipcMain.handle('copy-image', async (event, blob: Blob) => {
        try {
            const buffer = Buffer.from(await blob.arrayBuffer());
            clipboard.writeImage(buffer as any);
            log('Image copied to clipboard');
            return { success: true };
        } catch (err: any) {
            log('Failed to copy image: ' + err.message);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('save-image', async (event, url: string) => {
        return await saveImage(url);
    });

    ipcMain.handle('open-image-external', async (event, url: string) => {
        try {
            await shell.openExternal(url);
            log('Opened image in browser: ' + url);
            return { success: true };
        } catch (err: any) {
            log('Failed to open image: ' + err.message);
            return { success: false, error: err.message };
        }
    });
}

async function saveImage(url: string): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (!mainWindow) return { success: false, error: 'No window' };

        const fileName = url.split('/').pop() || 'image.jpg';
        const result = await dialog.showSaveDialog(mainWindow, {
            defaultPath: path.join(app.getPath('downloads'), fileName),
            filters: [
                { name: 'JPEG', extensions: ['jpg', 'jpeg'] },
                { name: 'PNG', extensions: ['png'] },
                { name: 'GIF', extensions: ['gif'] },
                { name: 'WebP', extensions: ['webp'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (result.canceled) {
            return { success: false, error: 'Save cancelled' };
        }

        // Download image
        await new Promise<void>((resolve, reject) => {
            https.get(url, (response) => {
                const file = fs.createWriteStream(result.filePath);
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    log('Image saved to: ' + result.filePath);
                    resolve();
                });
                file.on('error', reject);
            }).on('error', reject);
        });

        return { success: true, path: result.filePath };
    } catch (err: any) {
        log('Failed to save image: ' + err.message);
        return { success: false, error: err.message };
    }
}

async function downloadImageAsBlob(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            const chunks: Buffer[] = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
            });
            response.on('error', reject);
        }).on('error', reject);
    });
}
