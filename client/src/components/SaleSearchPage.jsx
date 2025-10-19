import React, { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchSaleAds, clearSaleAds } from '../redux/saleAdsSlice';
import { fetchSaleCategories } from '../redux/saleCategoriesSlice';
import SaleAdCard from './SaleAdCard';
import { useTranslation } from 'react-i18next';

const SaleSearchPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items: saleItems, pagination, loading } = useSelector(s => s.saleAds);
  const { items: categories } = useSelector(s => s.saleCategories);
  const { coords } = useSelector(s => s.location);

  const observerRef = useRef(null);

  const q = searchParams.get('q') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const sort = searchParams.get('sort') || 'newest';

  useEffect(() => {
    dispatch(fetchSaleCategories());
  }, [dispatch]);

  useEffect(() => {
    const params = { page: 1, limit: 20 };
    if (q) params.q = q;
    if (categoryId) params.categoryId = categoryId;
    if (sort) params.sort = sort;
    if (coords && sort === 'distance') {
      params.lat = coords.lat;
      params.lng = coords.lng;
    }
    dispatch(clearSaleAds());
    dispatch(fetchSaleAds(params));
  }, [dispatch, q, categoryId, sort, coords]);

  const handleLoadMore = () => {
    if (!loading && pagination?.hasMore) {
      const params = { page: pagination.page + 1, limit: pagination.limit };
      if (q) params.q = q;
      if (categoryId) params.categoryId = categoryId;
      if (sort) params.sort = sort;
      if (coords && sort === 'distance') {
        params.lat = coords.lat;
        params.lng = coords.lng;
      }
      dispatch(fetchSaleAds(params));
    }
  };

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    const sentinel = document.getElementById('sale-sentinel');
    if (!sentinel) return;
    observerRef.current = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) handleLoadMore();
      });
    }, { rootMargin: '200px' });
    observerRef.current.observe(sentinel);
    return () => observerRef.current && observerRef.current.disconnect();
  }, [pagination, loading, q, categoryId, sort, coords]);

  return (
    <div className='wide-page-container'>
      <div className='wide-page-content'>
        <div className="page-header">
          <div className="page-header__content">
            <h1>מודעות מכירה</h1>
            <p>חפש וסנן מודעות מכירה</p>
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
            <div className="search-controls__actions">
              <select
                className="sort-button"
                aria-label="מיון"
                value={sort}
                onChange={(e) => {
                  const p = new URLSearchParams(searchParams);
                  if (e.target.value && e.target.value !== 'newest') p.set('sort', e.target.value); else p.delete('sort');
                  setSearchParams(p);
                }}
              >
                <option value="newest">חדש קודם</option>
                <option value="price_asc">מחיר נמוך</option>
                <option value="price_desc">מחיר גבוה</option>
                <option value="distance">מרחק</option>
              </select>
            </div>
          </div>

          <div className="filters-area">
            <div className="active-filters-container">
              <select
                aria-label="קטגוריה"
                className="border rounded px-3 py-2"
                value={categoryId}
                onChange={(e) => {
                  const p = new URLSearchParams(searchParams);
                  if (e.target.value) p.set('categoryId', e.target.value); else p.delete('categoryId');
                  setSearchParams(p);
                }}
              >
                <option value="">כל הקטגוריות</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="search-results-layout">
          <div className="business-cards-grid">
            {saleItems.map(ad => (
              <SaleAdCard key={ad._id} ad={ad} />
            ))}
          </div>
        </div>

        <div id="sale-sentinel" className="h-10" />
      </div>
    </div>
  );
};

export default SaleSearchPage;





