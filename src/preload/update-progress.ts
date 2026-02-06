import { ipcRenderer } from 'electron';

// Make updateAPI available BEFORE any HTML execution
(window as any).updateAPI = {
    updateProgress: function(percent: number, transferred: number, total: number, speed: number) {
        // console.log('updateProgress called:', percent, '%');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        if (progressBar) {
            progressBar.style.width = percent + '%';
        }
        
        if (progressText) {
            progressText.textContent = percent + '%';
        }
        
        const status = document.getElementById('status');
        if (status) {
            const formatBytes = (bytes: number) => {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
            };
            status.textContent = 'Downloading: ' + formatBytes(transferred) + ' / ' + formatBytes(total);
        }
    },
    
    downloadComplete: function() {
        // console.log('downloadComplete called');
        const heading = document.querySelector('h2');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const status = document.getElementById('status');
        const buttons = document.getElementById('buttons');
        
        if (heading) heading.textContent = 'Update Ready!';
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = '100%';
        if (status) status.textContent = 'Update downloaded successfully!';
        if (buttons) buttons.classList.add('show');
    }
};

// console.log('Preload: updateAPI initialized');

(window as any).ipcRenderer = ipcRenderer;
