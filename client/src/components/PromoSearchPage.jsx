import React, { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchPromoAds, clearPromoAds } from '../redux/promoAdsSlice';
import PromoAdCard from './PromoAdCard';

const PromoSearchPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items: promoItems, pagination, loading } = useSelector(s => s.promoAds);

  const observerRef = useRef(null);

  const q = searchParams.get('q') || '';

  useEffect(() => {
    const params = { status: 'all', page: 1, limit: 20 };
    if (q) params.q = q;
    dispatch(clearPromoAds());
    dispatch(fetchPromoAds(params));
  }, [dispatch, q]);

  const handleLoadMore = () => {
    if (!loading && pagination?.hasMore) {
      const params = { status: 'all', page: pagination.page + 1, limit: pagination.limit };
      if (q) params.q = q;
      dispatch(fetchPromoAds(params));
    }
  };

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    const sentinel = document.getElementById('promo-sentinel');
    if (!sentinel) return;
    observerRef.current = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) handleLoadMore();
      });
    }, { rootMargin: '200px' });
    observerRef.current.observe(sentinel);
    return () => observerRef.current && observerRef.current.disconnect();
  }, [pagination, loading, q]);

  return (
    <div className='wide-page-container'>
      <div className='wide-page-content'>
        <div className="page-header">
          <div className="page-header__content">
            <h1>מודעות פרסום</h1>
            <p>חפש מודעות תדמית/קידום</p>
          </div>
        </div>

        <div className="search-controls">
          <div className="search-controls__main">
            <div className="search-bar-container">
              <input
                aria-label="חיפוש"
                className="search-input"
                placeholder="חיפוש חופשי"
                value={q}
                onChange={(e) => {
                  const p = new URLSearchParams(searchParams);
                  if (e.target.value) p.set('q', e.target.value); else p.delete('q');
                  setSearchParams(p);
                }}
              />
            </div>
          </div>
        </div>

        <div className="search-results-layout">
          <div className="business-cards-grid">
            {promoItems.map(ad => (
              <PromoAdCard key={ad._id} ad={ad} />
            ))}
          </div>
        </div>

        <div id="promo-sentinel" className="h-10" />
      </div>
    </div>
  );
};

export default PromoSearchPage;



