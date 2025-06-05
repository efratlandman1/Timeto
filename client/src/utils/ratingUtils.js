/**
 * Rounds a rating to the nearest whole number
 * @param {number} rating - The rating to round
 * @returns {number} - The rounded rating
 */
export const roundRating = (rating) => {
    if (!rating && rating !== 0) return 0; 
    return Math.round(rating); 
};

/**
 * Renders star icons based on a rating
 * @param {number} rating - The rating to display
 * @param {React.Component} FilledStar - The filled star component
 * @param {React.Component} EmptyStar - The empty star component
 * @returns {Array} - Array of star components
 */
export const renderStars = (rating, FilledStar, EmptyStar) => {
    const roundedRating = roundRating(rating);
    return Array.from({ length: 5 }, (_, index) => (
        index < roundedRating ? 
            <span key={`star-${index}`} className="star filled">{FilledStar}</span> : 
            <span key={`star-${index}`} className="star">{EmptyStar}</span>
    ));
}; 