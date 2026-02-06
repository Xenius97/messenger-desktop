import { ipcRenderer, contextBridge } from 'electron';

// Expose ipcRenderer to the window (safe sandboxed API)
contextBridge.exposeInMainWorld('api', {
    showImageMenu: (imageData: { src: string; alt: string }) => 
        ipcRenderer.invoke('show-image-context-menu', imageData),
});

// Setup image context menu
window.addEventListener('contextmenu', (event) => {
    const target = event.target as HTMLElement;
    
    if (target.tagName === 'IMG') {
        event.preventDefault();
        
        const img = target as HTMLImageElement;
        const imageData = {
            src: img.src,
            alt: img.alt,
            width: img.width,
            height: img.height,
        };
        
        // Call main process via exposed API
        (window as any).api.showImageMenu(imageData).catch((err: any) => {
            console.error('Failed to show image menu:', err);
        });
    }
});

