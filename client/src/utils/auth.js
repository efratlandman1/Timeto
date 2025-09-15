

export const getToken = () => {
    const tokenCookie = document.cookie.split('; ').find((row) => row.startsWith('token='));
    const token = tokenCookie ? tokenCookie.split('=')[1] : null;
    
    // Check if token is valid
    if (token && !isTokenValid(token)) {
        // Clear invalid token
        clearUserData();
        return null;
    }
    
    return token;
};

// Check if token is valid (not expired)
export const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
        // Decode JWT token to check expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        return payload.exp > currentTime;
    } catch (error) {
        return false;
    }
};

// Clear user data when token is invalid
export const clearUserData = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    try {
        localStorage.removeItem('user');
    } catch (error) {
        console.error('Error removing user from localStorage:', error);
    }
    return null;
};
