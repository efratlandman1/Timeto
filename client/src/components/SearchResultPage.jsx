import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import BusinessCard from './BusinessCard';
import SaleAdCard from './SaleAdCard';
import PromoAdCard from './PromoAdCard';
import AdvancedSearchModal from './AdvancedSearchModal';
import axios from 'axios';
import '../styles/SearchResultPage.css';
import '../styles/userBusinesses.css';
import '../styles/AdvancedSearchPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';
import { FaFilter, FaTimes, FaChevronDown, FaSort, FaArrowRight } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { buildQueryUrl } from '../utils/buildQueryUrl';
import { getToken } from '../utils/auth';
import { useTranslation } from 'react-i18next';

const ITEMS_PER_PAGE = 8;

const SearchResultPage = () => {
    const { t, i18n, ready } = useTranslation();
    // Active tab: all | business | sale | promo
    const [activeTab, setActiveTab] = useState('all');

    // Businesses state
    const [businesses, setBusinesses] = useState([]);
    const [bizPage, setBizPage] = useState(1);
    const [bizTotalPages, setBizTotalPages] = useState(1);

    // Sale Ads state
    const [saleAds, setSaleAds] = useState([]);
    const [salePage, setSalePage] = useState(1);
    const [saleTotalPages, setSaleTotalPages] = useState(1);

    // Promo Ads state
    const [promoAds, setPromoAds] = useState([]);
    const [promoPage, setPromoPage] = useState(1);
    const [promoTotalPages, setPromoTotalPages] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});
    const [sortOption, setSortOption] = useState('rating');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const sortDropdownRef = useRef(null);
    const advancedSearchRef = useRef(null);
    const prevSortRef = useRef('rating');
    const prevFiltersRef = useRef('');
    const prevLocationErrorRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const navigate = useNavigate();
    const location = useLocation();
    const userLocation = useSelector(state => state.location.coords);
    const locationLoading = useSelector(state => state.location.loading);
    const locationError = useSelector(state => state.location.error);

    const observer = useRef();
    const lastItemRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (!entries[0].isIntersecting || !hasMore) return;
            if (activeTab === 'business') setBizPage(prev => prev + 1);
            else if (activeTab === 'sale') setSalePage(prev => prev + 1);
            else if (activeTab === 'promo') setPromoPage(prev => prev + 1);
            else {
                // all: advance all categories to keep combined stream fresh
                setBizPage(prev => prev + 1);
                setSalePage(prev => prev + 1);
                setPromoPage(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore, activeTab]);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
                setShowSortDropdown(false);
            }
            // advanced search now manages its own overlay and outside click
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlTab = params.get('tab');
        const filters = {};
        const sort = params.get('sort') || 'rating';
        for (const [key, value] of params.entries()) {
            if (key !== 'sort' && key !== 'q' && key !== 'page' && key !== 'limit') {
                if (key in filters) {
                    if (Array.isArray(filters[key])) {
                        filters[key].push(value);
                    } else {
                        filters[key] = value;
                    }
                } else {
                    filters[key] = value;
                }
            }
        }
        setActiveFilters(filters);
        setSortOption(sort);
        if (urlTab && ['all','business','sale','promo'].includes(urlTab)) {
            setActiveTab(urlTab);
        }
    }, [location.search]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sort = params.get('sort') || 'rating';
        const filtersString = JSON.stringify(activeFilters);
        if (
            (bizPage !== 1 || salePage !== 1 || promoPage !== 1) &&
            (prevSortRef.current !== sort || prevFiltersRef.current !== filtersString)
        ) {
            setBizPage(1);
            setSalePage(1);
            setPromoPage(1);
        }
        prevSortRef.current = sort;
        prevFiltersRef.current = filtersString;
    }, [activeFilters, sortOption, location.search]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sort = params.get('sort') || 'rating';
        const maxDistance = params.get('maxDistance');
        
        const needsLocationSorting = sort === 'distance' || sort === 'popular_nearby';
        const needsLocationFiltering = maxDistance;
        const needsLocation = needsLocationSorting || needsLocationFiltering;

        console.log('SearchResultPage - Location logic:', {
            sort,
            maxDistance,
            needsLocationSorting,
            needsLocationFiltering,
            needsLocation,
            userLocation,
            locationLoading,
            locationError
        });

        if (needsLocation) {
            if (locationLoading) return;
            if (!userLocation && !locationError) return;
            if (locationError && prevLocationErrorRef.current === locationError && bizPage !== 1) return;
            prevLocationErrorRef.current = locationError;
        }

        const paramsObj = {};
        for (const [key, value] of params.entries()) {
            if (key === 'services') {
                if (!paramsObj.services) paramsObj.services = [];
                paramsObj.services.push(value);
            } else {
                paramsObj[key] = value;
            }
        }
        // apply global sort/filters to other categories too
        paramsObj.page = bizPage;
        paramsObj.limit = ITEMS_PER_PAGE;
        if (needsLocation && locationError) {
            paramsObj.sort = 'rating';
        }
        
        console.log('SearchResultPage - Final params:', paramsObj);
        
        setIsLoading(true);
        const url = buildQueryUrl(
            `${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`,
            paramsObj,
            needsLocation && userLocation ? userLocation : undefined
        );
        
        console.log('SearchResultPage - Final URL:', url);
        
        // הוספת headers עם טוקן אם המשתמש מחובר
        const headers = {};
        const token = getToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        
        axios.get(url, { headers })
            .then(res => {
                const newBusinesses = res.data.data.businesses || [];
                setBusinesses(prevBusinesses => 
                    bizPage === 1 ? newBusinesses : [...prevBusinesses, ...newBusinesses]
                );
                const total = res.data.pagination?.totalPages || 1;
                setBizTotalPages(total);
                setHasMore((bizPage < total) || (salePage < saleTotalPages) || (promoPage < promoTotalPages));
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error fetching businesses:', error);
                setIsLoading(false);
            });
    }, [location.search, bizPage, userLocation, locationLoading, locationError]);

    // Fetch Sale Ads
    useEffect(() => {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const params = new URLSearchParams(location.search);
        const paramsObj = {};
        for (const [key, value] of params.entries()) {
            if (['q','categoryId','categoryName','priceMin','priceMax','sort','maxDistance','services','rating','city','openNow','addedWithin','includeNoPrice'].includes(key)) {
                paramsObj[key] = value;
            }
        }
        paramsObj.page = salePage;
        paramsObj.limit = ITEMS_PER_PAGE;

        const qs = new URLSearchParams(paramsObj).toString();
        setIsLoading(true);
        axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/sale-ads?${qs}`, { headers })
            .then(res => {
                const newAds = res.data.data.ads || [];
                setSaleAds(prev => salePage === 1 ? newAds : [...prev, ...newAds]);
                const total = res.data.pagination?.totalPages || 1;
                setSaleTotalPages(total);
                setHasMore((bizPage < bizTotalPages) || (salePage < total) || (promoPage < promoTotalPages));
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Error fetching sale ads:', err);
                setIsLoading(false);
            });
    }, [location.search, salePage]);

    // Fetch Promo Ads
    useEffect(() => {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const params = new URLSearchParams(location.search);
        const paramsObj = {};
        for (const [key, value] of params.entries()) {
            if (['q','categoryId','categoryName','sort','status','maxDistance','services','rating','priceMin','priceMax','city','openNow','addedWithin','includeNoPrice'].includes(key)) {
                paramsObj[key] = value;
            }
        }
        paramsObj.page = promoPage;
        paramsObj.limit = ITEMS_PER_PAGE;

        const qs = new URLSearchParams({ status: 'active', ...paramsObj }).toString();
        setIsLoading(true);
        axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/promo-ads?${qs}`, { headers })
            .then(res => {
                const newAds = res.data.data.ads || [];
                setPromoAds(prev => promoPage === 1 ? newAds : [...prev, ...newAds]);
                const total = res.data.pagination?.totalPages || 1;
                setPromoTotalPages(total);
                setHasMore((bizPage < bizTotalPages) || (salePage < saleTotalPages) || (promoPage < total));
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Error fetching promo ads:', err);
                setIsLoading(false);
            });
    }, [location.search, promoPage]);

    const SORT_OPTIONS = {
        rating: t('searchResults.sort.rating'),
        name: t('searchResults.sort.name'),
        distance: t('searchResults.sort.distance'),
        newest: t('searchResults.sort.newest'),
        popular_nearby: t('searchResults.sort.popular_nearby')
    };
    
  // Price-based client filtering to enforce rules for items without price
  const priceParams = useMemo(() => {
    const p = new URLSearchParams(location.search);
    const min = p.get('priceMin');
    const max = p.get('priceMax');
    const include = p.get('includeNoPrice') === 'true';
    const categoryName = (p.get('categoryName') || '').toLowerCase().trim();
    return {
      has: !!(min || max),
      min: min ? Number(min) : null,
      max: max ? Number(max) : null,
      includeNoPrice: include,
      categoryName,
    };
  }, [location.search]);

  const checkPriceInRange = (value) => {
    if (value === null || value === undefined || value === '') return false;
    const num = Number(value);
    if (Number.isNaN(num)) return false;
    if (priceParams.min !== null && num < priceParams.min) return false;
    if (priceParams.max !== null && num > priceParams.max) return false;
    return true;
  };

  const filteredBusinesses = useMemo(() => {
    let list = businesses;
    // Apply category filter on client as a fallback (in case server didn't)
    if (priceParams.categoryName) {
      const matchCategory = (b) => {
        const candidates = [
          b?.categoryName,
          b?.category,
          b?.category?.name,
          b?.categoryId?.name,
        ]
          .filter(Boolean)
          .map((s) => String(s).toLowerCase());
        return candidates.includes(priceParams.categoryName);
      };
      list = list.filter(matchCategory);
    }
    if (!priceParams.has) return list;
    return priceParams.includeNoPrice ? list : [];
  }, [businesses, priceParams]);

  const filteredSaleAds = useMemo(() => {
    let list = saleAds;
    // Category filter for sale ads - try several common fields
    if (priceParams.categoryName) {
      const matchCategory = (ad) => {
        const candidates = [
          ad?.categoryName,
          ad?.category,
          ad?.category?.name,
          ad?.categoryId?.name,
          ad?.saleCategory?.name,
          ad?.saleCategoryName,
        ]
          .filter(Boolean)
          .map((s) => String(s).toLowerCase());
        return candidates.includes(priceParams.categoryName);
      };
      list = list.filter(matchCategory);
    }
    if (!priceParams.has) return list;
    return list.filter(ad => {
      const hasPrice = ad && ad.price !== undefined && ad.price !== null && ad.price !== '';
      if (!hasPrice) return priceParams.includeNoPrice;
      return checkPriceInRange(ad.price);
    });
  }, [saleAds, priceParams]);

  const filteredPromoAds = useMemo(() => {
    // If a category filter is set, skip promo ads (no category field)
    if (priceParams.categoryName) return [];
    if (!priceParams.has) return promoAds;
    // Promo ads usually ללא מחיר; נכליל רק אם includeNoPrice=true
    return priceParams.includeNoPrice ? promoAds : [];
  }, [promoAds, priceParams]);

    // Wait for translations to load
    if (!ready) {
        return (
            <div className='wide-page-container'>
                <div className='wide-page-content'>
                    <div className="loading-container">
                        <div className="loader"></div>
                        <span>Loading translations...</span>
                    </div>
                </div>
            </div>
        );
    }

    const handleFilterChange = (key, value) => {
        const newParams = new URLSearchParams(location.search);
        if (Array.isArray(value)) {
            newParams.delete(key);
            value.forEach(v => newParams.append(key, v));
        } else {
            newParams.set(key, value);
        }
        newParams.set('page', 1);
        navigate({ pathname: location.pathname, search: newParams.toString() });
    };

    const handleRemoveFilter = (key, value = null) => {
        const newParams = new URLSearchParams(location.search);
        if (value !== null && Array.isArray(activeFilters[key])) {
            const values = activeFilters[key].filter(v => v !== value);
            newParams.delete(key);
            values.forEach(v => newParams.append(key, v));
        } else {
            newParams.delete(key);
        }
        newParams.set('page', 1);
        navigate({ pathname: location.pathname, search: newParams.toString() });
    };

    const handleClearFilters = () => {
        navigate({ pathname: location.pathname });
        setBizPage(1);
        setSalePage(1);
        setPromoPage(1);
    };

    const handleSortChange = (newSort) => {
        const newParams = new URLSearchParams(location.search);
        if (newSort === 'rating') {
            newParams.delete('sort');
        } else {
            newParams.set('sort', newSort);
        }
        newParams.set('page', 1);
        navigate({ pathname: location.pathname, search: newParams.toString() });
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        const params = new URLSearchParams(location.search);
        params.set('tab', tab);
        navigate({ pathname: location.pathname, search: params.toString() });
    };

    return (
        <div className='wide-page-container'>
            <div className='wide-page-content search-results-page'>
                <button className="nav-button above-header" onClick={() => navigate('/')}> 
                    <FaArrowRight className="icon" />
                    {t('common.backToHome')}
                </button>
                <div className="page-header">
                    <div className="page-header__content">
                        <h1 className="login-title">{t('searchResults.pageTitle')}</h1>
                    </div>
                </div>
                
                <div className="search-controls">
                    <div className="search-controls__main">
                        <div className="search-bar-container">
                            <SearchBar isMainPage={false} />
                        </div>
                        <div className="search-controls__actions">
                            <button 
                                className="filter-button"
                                onClick={() => setShowFilters(!showFilters)}
                                aria-expanded={showFilters}
                            >
                                <FaFilter />
                                <span>{t('searchResults.advancedFilter')}</span>
                            </button>
                            <div className="sort-control" ref={sortDropdownRef}>
                                <button 
                                    className="sort-button"
                                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                                    aria-expanded={showSortDropdown}
                                >
                                    <span className="sort-text">{SORT_OPTIONS[sortOption]}</span>
                                    <FaSort className="sort-icon" />
                                </button>
                                {showSortDropdown && (
                                    <div className="sort-dropdown">
                                        {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                                            <button
                                                key={value}
                                                className={`sort-option ${sortOption === value ? 'selected' : ''}`}
                                                onClick={() => {
                                                    handleSortChange(value);
                                                    setShowSortDropdown(false);
                                                }}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {showFilters && (
                        <AdvancedSearchModal
                            isOpen={showFilters}
                            onClose={() => setShowFilters(false)}
                            filters={activeFilters}
                            onFilterChange={(key, value) => {
                                handleFilterChange(key, value);
                            }}
                        />
                    )}
                </div>

                {(sortOption === 'distance' || sortOption === 'popular_nearby') && !userLocation && !locationError && (
                    <div style={{ color: 'gray', margin: '1rem 0', textAlign: 'center' }}>{t('searchResults.loadingLocation')}</div>
                )}
                {locationError && (sortOption === 'distance' || sortOption === 'popular_nearby') && (
                    <div style={{ color: 'red', margin: '1rem 0', textAlign: 'center' }}>{locationError}</div>
                )}

                {/* Active filters block - show only when there are filters */}
                {(() => {
                    const params = new URLSearchParams(location.search);
                    const hasAny = ['categoryName','services','rating','maxDistance','priceMin','priceMax','city','openNow','verifiedOnly','reviewsOnly','addedWithin']
                      .some(k => params.has(k));
                    if (!hasAny) return null;
                    const chips = [];
                    const withColon = (txt) => (txt && /:\s*$/.test(txt) ? txt : `${txt}:`);
                    if (params.get('categoryName')) chips.push({ key: 'categoryName', value: params.get('categoryName'), label: withColon(t('searchResults.filterTags.category')) });
                    (params.getAll('services')||[]).forEach(v=>chips.push({ key: 'services', value: v, label: withColon(t('searchResults.filterTags.service')) }));
                    if (params.get('rating')) chips.push({ key: 'rating', value: params.get('rating'), label: withColon(t('searchResults.filterTags.rating')) });
                    if (params.get('maxDistance')) chips.push({ key: 'maxDistance', value: `${params.get('maxDistance')} ${t('searchResults.filterTags.km')}`, rawValue: params.get('maxDistance'), label: withColon(t('searchResults.filterTags.maxDistance')) });
                    if (params.get('priceMin')) chips.push({ key: 'priceMin', value: params.get('priceMin'), label: withColon(t('advancedSearch.min')||'Min') });
                    if (params.get('priceMax')) chips.push({ key: 'priceMax', value: params.get('priceMax'), label: withColon(t('advancedSearch.max')||'Max') });
                    if (params.get('city')) chips.push({ key: 'city', value: params.get('city'), label: withColon(t('advancedSearch.city')||'City') });
                    if (params.get('openNow')) chips.push({ key: 'openNow', value: '', label: `${t('advancedSearch.openNow')||'Open Now'}` });
                    if (params.get('addedWithin')) chips.push({ key: 'addedWithin', value: params.get('addedWithin'), label: withColon(t('advancedSearch.addedWithin')||'Added') });
                    return (
                      <div className="filters-area">
                        <div className="filters-header">
                          <div className="filters-title">{t('searchResults.filters.active')}</div>
                          <button className="clear-all-filters" onClick={handleClearFilters}>{t('searchResults.filters.clearAll')}</button>
                        </div>
                        <div className="active-filters-container">
                          {chips.map((chip, idx)=> (
                            <div key={`${chip.key}-${idx}`} className="filter-tag">
                              <span>{chip.label} {chip.value}</span>
                              <button onClick={() => handleRemoveFilter(chip.key, chip.key==='services' ? chip.value : undefined)} aria-label="remove filter">×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                })()}

                {/* Tabs for result types - render only when lists are ready (not loading after first fetch) */}
                {!isLoading && (
                <div className="favorites-tabs" role="tablist" aria-label={t('userBusinesses.tabs.aria')}>
                    <button className={`favorites-tab ${activeTab==='all'?'active':''}`} role="tab" aria-selected={activeTab==='all'} onClick={() => handleTabChange('all')}>
                        {t('favorites.tabs.all')} <span className="count">({filteredBusinesses.length + filteredSaleAds.length + filteredPromoAds.length})</span>
                    </button>
                    <button className={`favorites-tab ${activeTab==='business'?'active':''}`} role="tab" aria-selected={activeTab==='business'} onClick={() => handleTabChange('business')}>
                        {t('favorites.tabs.business')} <span className="count">({filteredBusinesses.length})</span>
                    </button>
                    <button className={`favorites-tab ${activeTab==='sale'?'active':''}`} role="tab" aria-selected={activeTab==='sale'} onClick={() => handleTabChange('sale')}>
                        {t('favorites.tabs.sale')} <span className="count">({filteredSaleAds.length})</span>
                    </button>
                    <button className={`favorites-tab ${activeTab==='promo'?'active':''}`} role="tab" aria-selected={activeTab==='promo'} onClick={() => handleTabChange('promo')}>
                        {t('favorites.tabs.promo')} <span className="count">({filteredPromoAds.length})</span>
                    </button>
                </div>
                )}

                {/* Results */}
                <div className="search-results-layout">
                    <div className="business-cards-grid">
                        {activeTab === 'business' && filteredBusinesses.map((business, index) => (
                            <div key={business._id} ref={index === businesses.length - 1 ? lastItemRef : undefined}>
                                <BusinessCard business={business} />
                            </div>
                        ))}

                        {activeTab === 'sale' && filteredSaleAds.map((ad, index) => (
                            <div key={ad._id} ref={index === filteredSaleAds.length - 1 ? lastItemRef : undefined}>
                                <SaleAdCard ad={ad} />
                            </div>
                        ))}

                        {activeTab === 'promo' && filteredPromoAds.map((ad, index) => (
                            <div key={ad._id} ref={index === filteredPromoAds.length - 1 ? lastItemRef : undefined}>
                                <PromoAdCard ad={ad} />
                            </div>
                        ))}

                        {activeTab === 'all' && (() => {
                            const items = [
                                ...filteredBusinesses.map(b => ({ type: 'business', data: b })),
                                ...filteredSaleAds.map(s => ({ type: 'sale', data: s })),
                                ...filteredPromoAds.map(p => ({ type: 'promo', data: p }))
                            ];
                            const getTs = (o) => new Date(o?.updatedAt || o?.createdAt || o?.created_at || 0).getTime();
                            const getName = (o) => String(o?.name || o?.title || o?.nameEn || o?.titleEn || '');
                            const collator = new Intl.Collator(i18n?.language || undefined, { sensitivity: 'base', numeric: true });
                            const getRating = (o) => typeof o?.rating === 'number' ? o.rating : -Infinity;
                            if (sortOption === 'newest') items.sort((a,b)=> getTs(b.data) - getTs(a.data));
                            else if (sortOption === 'name') items.sort((a,b)=> collator.compare(getName(a.data), getName(b.data)));
                            else if (sortOption === 'rating') items.sort((a,b)=> getRating(b.data) - getRating(a.data));

                            return items.map((item, index) => (
                                <div key={`${item.type}-${item.data._id || index}`} ref={index === items.length - 1 ? lastItemRef : undefined}>
                                    {item.type === 'business' ? (
                                        <BusinessCard business={item.data} />
                                    ) : item.type === 'sale' ? (
                                        <SaleAdCard ad={item.data} />
                                    ) : (
                                        <PromoAdCard ad={item.data} />
                                    )}
                                </div>
                            ));
                        })()}
                    </div>
                </div>

                {/* לוודר */}
                {isLoading && (
                    <div className="loader-container">
                        <div className="loader"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResultPage;