import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaStore, FaTags, FaBullhorn, FaTimes } from 'react-icons/fa';
import '../styles/FloatingCreateButton.css';

const FloatingCreateButton = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="fab-root" ref={menuRef}>
      {open && (
        <div className="fab-menu" role="menu" aria-label="Create options">
          <button className="fab-menu-item" onClick={() => { setOpen(false); navigate('/business', { state: { reset: Date.now() } }); }} role="menuitem">
            <FaStore className="fab-icon store" />
            <span>הוספת עסק</span>
          </button>
          <button className="fab-menu-item" onClick={() => { setOpen(false); navigate('/ads/sale/new'); }} role="menuitem">
            <FaTags className="fab-icon sale" />
            <span>הוספת מודעת מכירה</span>
          </button>
          <button className="fab-menu-item" onClick={() => { setOpen(false); navigate('/ads/promo/new'); }} role="menuitem">
            <FaBullhorn className="fab-icon promo" />
            <span>הוספת מודעת פרסום</span>
          </button>
        </div>
      )}
      <button
        aria-label={open ? 'סגור אפשרויות הוספה' : 'פתח אפשרויות הוספה'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`fab-button ${open ? 'open' : ''}`}
      >
        {open ? <FaTimes /> : <FaPlus />}
      </button>
    </div>
  );
};

export default FloatingCreateButton;


