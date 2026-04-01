/**
 * URL utility functions
 */

export function isFacebookMessagesUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        const isFacebookDomain = parsedUrl.hostname === 'facebook.com' || 
                                parsedUrl.hostname === 'www.facebook.com';
        
        if (!isFacebookDomain) {
            // Allow special protocols used by messenger (about, blob, etc)
            if (url.startsWith('about:') || url.startsWith('blob:') || url.startsWith('data:')) {
                return true;
            }
            return false;
        }
        
        // Allow ONLY messages-related paths and authentication pages
        const isMessagesPath = parsedUrl.pathname.startsWith('/messages') ||
                              parsedUrl.pathname.startsWith('/t/') || // Direct message threads
                              parsedUrl.pathname.startsWith('/login') || // Login page
                              parsedUrl.pathname.startsWith('/checkpoint') || // Security checkpoint
                              parsedUrl.pathname.startsWith('/two_factor') || // Two-factor authentication
                              parsedUrl.pathname.startsWith('/two_step_verification'); // Two-step verification
        
        return isMessagesPath && !parsedUrl.pathname.includes('/share/');
    } catch (error) {
        // If URL parsing fails, check for special protocols
        if (typeof url === 'string' && (url.startsWith('about:') || url.startsWith('blob:') || url.startsWith('data:'))) {
            return true;
        }
        return false;
    }
}