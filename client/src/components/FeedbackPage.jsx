import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/FeedbackPage.css';
import { FaStar } from 'react-icons/fa';

const FeedbackPage = () => {
    const navigate = useNavigate();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    // תגובות לדוגמה – בעתיד ניתן לשלוף מהשרת
    const previousFeedbacks = [
        { name: 'אפרת', rating: 5, comment: 'שירות מעולה, אחזור שוב!', date: '2025-04-29' },
        { name: 'יוסי', rating: 4, comment: 'חוויה טובה, אבל יש מקום לשיפור.', date: '2025-04-25' },
        { name: 'שירה', rating: 3, comment: 'בסדר, אבל לא מה שציפיתי.', date: '2025-04-20' }
    ];

    const handleStarClick = (value) => {
        setRating(value);
    };

    const handleSubmit = () => {
        const feedback = {
            rating,
            comment
        };
        console.log("Feedback submitted:", feedback);
        navigate(-1);
    };

    const handleCancel = () => {
        navigate(-1);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content feedback-modal">
                <button className="close-button" onClick={handleCancel}>×</button>
                <h2>פידבק</h2>

                {/* דירוג */}
                <div className="form-group rating-group">
                    <label>דירוג</label>
                    <div className="star-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                                key={star}
                                size={30}
                                onClick={() => handleStarClick(star)}
                                className={rating >= star ? "star filled" : "star empty"}
                            />
                        ))}
                    </div>
                </div>

                {/* חוות דעת */}
                <div className="form-group">
                    <label>חוות דעת</label>
                    <textarea
                        placeholder="כתוב כאן את דעתך..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={5}
                        className="textarea-input"
                    />
                </div>

                
                {/* תגובות קודמות */}
                <div className="feedback-list">
                    <h3>חוות דעת קודמות</h3>
                    {previousFeedbacks.map((fb, index) => (
                        <div key={index} className="feedback-item">
                            <div className="feedback-header">
                                <span className="feedback-name">{fb.name}</span>
                                <span className="feedback-date">{fb.date}</span>
                            </div>
                            <div className="feedback-stars">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <FaStar
                                        key={i}
                                        size={16}
                                        className={fb.rating >= i ? "star filled" : "star empty"}
                                    />
                                ))}
                            </div>
                            <p className="feedback-comment">{fb.comment}</p>
                        </div>
                    ))}
                </div>

                {/* כפתורים */}
                <div className="buttons-container">
                    <button className="cancel-button" onClick={handleCancel}>ביטול</button>
                    <button className="confirm-button" onClick={handleSubmit}>שליחה</button>
                </div>
                
            </div>
        </div>
    );
};

export default FeedbackPage;
