import { BrowserWindow, nativeImage } from 'electron';

export function updateTaskbarBadge(window: BrowserWindow | null, count: number): void {
    if (process.platform !== 'win32' || !window || window.isDestroyed()) {
        return;
    }

    if (count === 0) {
        window.setOverlayIcon(null, '');
        return;
    }

    try {
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(64, 64);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(32, 32, 32, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const displayCount = count > 99 ? '99+' : count.toString();
        const fontSize = displayCount.length > 2 ? 32 : 40;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillText(displayCount, 32, 32);

        const image = nativeImage.createFromDataURL(canvas.toDataURL());
        window.setOverlayIcon(image, `${count} unread messages`);
    } catch (error) {
        console.error('Failed to update taskbar badge:', error);
    }
}
