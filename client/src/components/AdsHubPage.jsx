import React, { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSaleAds, setSaleAdsFilters, clearSaleAds } from '../redux/saleAdsSlice';
import { fetchPromoAds, clearPromoAds } from '../redux/promoAdsSlice';
import { fetchSaleCategories } from '../redux/saleCategoriesSlice';
import SaleAdCard from './SaleAdCard';
import PromoAdCard from './PromoAdCard';
import { getToken } from '../utils/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AdsHubPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items: saleItems, pagination: salePage, loading: saleLoading } = useSelector(s => s.saleAds);
  const { items: promoItems, pagination: promoPage, loading: promoLoading } = useSelector(s => s.promoAds);
  const { items: categories } = useSelector(s => s.saleCategories);
  const { coords } = useSelector(s => s.location);

  const observerRef = useRef(null);
  const activeTab = (searchParams.get('tab') === 'promo' || searchParams.get('tab') === 'sale') ? searchParams.get('tab') : 'sale';

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/auth');
      return;
    }
    dispatch(fetchSaleCategories());
    if (activeTab === 'sale') {
      dispatch(clearSaleAds());
      dispatch(fetchSaleAds({ page: 1, limit: 20 }));
    } else {
      dispatch(clearPromoAds());
      dispatch(fetchPromoAds({ status: 'all', page: 1, limit: 20 }));
    }
    return () => {
      dispatch(clearSaleAds());
      dispatch(clearPromoAds());
    };
  }, [dispatch, activeTab]);

  const handleLoadMore = () => {
    if (activeTab === 'sale') {
      if (!saleLoading && salePage.hasMore) {
        dispatch(fetchSaleAds({ page: salePage.page + 1, limit: salePage.limit }));
      }
    } else {
      if (!promoLoading && promoPage.hasMore) {
        dispatch(fetchPromoAds({ status: 'all', page: promoPage.page + 1, limit: promoPage.limit }));
      }
    }
  };

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    const sentinel = document.getElementById('ads-infinite-sentinel');
    if (!sentinel) return;
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) handleLoadMore();
      });
    }, { rootMargin: '200px' });
    observerRef.current.observe(sentinel);
    return () => observerRef.current && observerRef.current.disconnect();
  }, [salePage, promoPage, activeTab]);

  const handleTabChange = (tab) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('tab', tab);
      return p;
    });
  };

  return (
    <div className="px-4 pt-24 pb-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <div role="tablist" aria-label="ads tabs" className="inline-flex rounded border overflow-hidden">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sale'}
            className={`px-4 py-2 ${activeTab === 'sale' ? 'bg-gray-200' : 'bg-white'}`}
            onClick={() => handleTabChange('sale')}
          >
            מודעות מכירה
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'promo'}
            className={`px-4 py-2 border-l ${activeTab === 'promo' ? 'bg-gray-200' : 'bg-white'}`}
            onClick={() => handleTabChange('promo')}
          >
            מודעות פרסום
          </button>
        </div>
      </div>

      {activeTab === 'sale' && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <input
              aria-label="Search sale ads"
              className="flex-1 border rounded px-3 py-2"
              placeholder="חיפוש חופשי"
              onChange={(e) => {
                dispatch(clearSaleAds());
                dispatch(fetchSaleAds({ q: e.target.value, page: 1, limit: 20 }));
              }}
            />
            <select
              aria-label="Filter by category"
              className="border rounded px-3 py-2"
              onChange={(e) => {
                dispatch(clearSaleAds());
                dispatch(fetchSaleAds({ categoryId: e.target.value || undefined, page: 1, limit: 20 }));
              }}
            >
              <option value="">כל הקטגוריות</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <select
              aria-label="Sort sale ads"
              className="border rounded px-3 py-2"
              onChange={(e) => {
                dispatch(clearSaleAds());
                const params = { sort: e.target.value, page: 1, limit: 20 };
                if (coords && (e.target.value === 'distance')) {
                  params.lat = coords.lat;
                  params.lng = coords.lng;
                }
                dispatch(fetchSaleAds(params));
              }}
            >
              <option value="newest">חדש קודם</option>
              <option value="price_asc">מחיר נמוך</option>
              <option value="price_desc">מחיר גבוה</option>
              <option value="distance">מרחק</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {saleItems.map(ad => (
              <SaleAdCard key={ad._id} ad={ad} />
            ))}
          </div>
        </>
      )}

      {activeTab === 'promo' && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <input
              aria-label="Search promo ads"
              className="flex-1 border rounded px-3 py-2"
              placeholder="חיפוש חופשי"
              onChange={(e) => {
                dispatch(clearPromoAds());
                dispatch(fetchPromoAds({ status: 'all', q: e.target.value, page: 1, limit: 20 }));
              }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {promoItems.map(ad => (
              <PromoAdCard key={ad._id} ad={ad} />
            ))}
          </div>
        </>
      )}

      <div id="ads-infinite-sentinel" className="h-10" />
    </div>
  );
};

export default AdsHubPage;


