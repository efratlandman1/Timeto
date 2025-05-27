

export const getToken = () => {
    const tokenCookie = document.cookie.split('; ').find((row) => row.startsWith('token='));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
};
