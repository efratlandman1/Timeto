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
import { FaFilter, FaTimes, FaChevronDown, FaSort, FaArrowRight, FaThLarge, FaStore, FaTag, FaBullhorn, FaStar } from 'react-icons/fa';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
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
    const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
    const [drawerMode, setDrawerMode] = useState('all'); // 'all' | 'category' | 'services' | 'city' | 'price' | 'distance' | 'rating'
    const contentRef = useRef(null);
    const [containerRect, setContainerRect] = useState({ left: 0, width: 0 });

    // Data for standalone popovers/drawer
    const [categories, setCategories] = useState([]);
    const [saleCategoriesSmall, setSaleCategoriesSmall] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [categoryTab, setCategoryTab] = useState('business'); // 'business' | 'sale'
    const [saleSubcategoriesSmall, setSaleSubcategoriesSmall] = useState([]);
    const [tempValues, setTempValues] = useState({
        categoryName: '',
        services: [],
        city: '',
        priceMin: '',
        priceMax: '',
        priceMinN: 0,
        priceMaxN: 10000,
        maxDistance: 0,
        rating: 0,
        saleCategoryId: '',
        saleSubcategoryId: '',
    });
    const MAX_PRICE = 10000;
    const { isLoaded: mapsLoaded } = useJsApiLoader({ id: 'google-maps-script', googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '', libraries: ['places'] });
    const cityAutoRef = useRef(null);
    const [activeFilters, setActiveFilters] = useState({});
    const [sortOption, setSortOption] = useState('rating');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const sortDropdownRef = useRef(null);
    const [tempSort, setTempSort] = useState('rating');
    const advancedSearchRef = useRef(null);
    const prevSortRef = useRef('rating');
    const prevFiltersRef = useRef('');
    const prevLocationErrorRef = useRef(null);
    const [isLoadingBiz, setIsLoadingBiz] = useState(false);
    const [isLoadingSale, setIsLoadingSale] = useState(false);
    const [isLoadingPromo, setIsLoadingPromo] = useState(false);
    const isLoadingAny = isLoadingBiz || isLoadingSale || isLoadingPromo;
    const [hasMore, setHasMore] = useState(true);
    // Unified 'all' state
    const [unifiedItems, setUnifiedItems] = useState([]);
    const [unifiedPage, setUnifiedPage] = useState(1);
    const [unifiedTotalPages, setUnifiedTotalPages] = useState(1);
    const [isLoadingUnified, setIsLoadingUnified] = useState(false);
  // Cache of sale subcategory id->name for chips
  const [saleSubMap, setSaleSubMap] = useState({});

    const navigate = useNavigate();
    const location = useLocation();
    // Local text filter (client-side) from SearchBar
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        const q = new URLSearchParams(location.search).get('q') || '';
        setSearchText(q);
    }, [location.search]);

    const userLocation = useSelector(state => state.location.coords);
    const locationLoading = useSelector(state => state.location.loading);
    const locationError = useSelector(state => state.location.error);

    const observer = useRef();
    const lastItemRef = useCallback(node => {
        if (isLoadingAny || (activeTab === 'all' && isLoadingUnified)) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (!entries[0].isIntersecting || !hasMore) return;
            if (activeTab === 'business') setBizPage(prev => prev + 1);
            else if (activeTab === 'sale') setSalePage(prev => prev + 1);
            else if (activeTab === 'promo') setPromoPage(prev => prev + 1);
            else setUnifiedPage(prev => prev + 1);
        });
        if (node) observer.current.observe(node);
    }, [isLoadingAny, isLoadingUnified, hasMore, activeTab]);

    // Centralize hasMore computation to avoid race conditions
    useEffect(() => {
        const more = activeTab === 'all'
          ? (unifiedPage < unifiedTotalPages)
          : (bizPage < bizTotalPages) || (salePage < saleTotalPages) || (promoPage < promoTotalPages);
        setHasMore(more);
    }, [activeTab, unifiedPage, unifiedTotalPages, bizPage, salePage, promoPage, bizTotalPages, saleTotalPages, promoTotalPages]);

    // Auto-fill viewport: if still not enough content and hasMore, advance next page sequentially
    useEffect(() => {
        if (!hasMore || isLoadingAny) return;
        const contentEl = contentRef.current;
        if (!contentEl) return;
        const pageHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        if (pageHeight <= winHeight + 100) {
            if (activeTab === 'all') {
                if (unifiedPage < unifiedTotalPages) setUnifiedPage(p => p + 1);
            } else if (activeTab === 'business' && bizPage < bizTotalPages) {
                setBizPage(p => p + 1);
            } else if (activeTab === 'sale' && salePage < saleTotalPages) {
                setSalePage(p => p + 1);
            } else if (activeTab === 'promo' && promoPage < promoTotalPages) {
                setPromoPage(p => p + 1);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoadingBiz, isLoadingSale, isLoadingPromo, isLoadingUnified, hasMore, activeTab, unifiedPage, unifiedTotalPages, bizPage, salePage, promoPage, bizTotalPages, saleTotalPages, promoTotalPages]);

    // Reset unified on tab change
    useEffect(() => {
        if (activeTab !== 'all') return;
        setUnifiedItems([]);
        setUnifiedPage(1);
        setUnifiedTotalPages(1);
    }, [activeTab, location.search]);

    // Fetch unified items
    useEffect(() => {
        if (activeTab !== 'all') return;
        setIsLoadingUnified(true);
        const headers = {};
        const token = getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
        const params = new URLSearchParams(location.search);
        const sort = params.get('sort') || 'rating';
        const maxDistance = params.get('maxDistance');
        const needsLocationSorting = sort === 'distance' || sort === 'popular_nearby';
        const needsLocationFiltering = !!maxDistance;
        const needsLocation = needsLocationSorting || needsLocationFiltering;

        // Handle location requirements similar to other tabs
        if (needsLocation) {
            if (locationLoading) { setIsLoadingUnified(false); return; }
            if (!userLocation && !locationError) { setIsLoadingUnified(false); return; }
            if (locationError) {
                // Fallback to rating sort when location unavailable
                params.set('sort', 'rating');
            } else if (userLocation && userLocation.lat !== undefined && userLocation.lng !== undefined) {
                params.set('lat', userLocation.lat);
                params.set('lng', userLocation.lng);
            }
        }

        params.set('page', unifiedPage.toString());
        params.set('limit', ITEMS_PER_PAGE.toString());
        axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/search/all?${params.toString()}`, { headers })
          .then(res => {
            const newItems = res.data?.data?.items || [];
            const totalPages = res.data?.data?.pagination?.totalPages || 1;
            setUnifiedItems(prev => unifiedPage === 1 ? newItems : [...prev, ...newItems]);
            setUnifiedTotalPages(totalPages);
          })
          .catch(() => {})
          .finally(() => setIsLoadingUnified(false));
    }, [activeTab, unifiedPage, location.search, userLocation, locationLoading, locationError]);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
                setShowSortDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Measure container rect for drawer width/position
    useEffect(() => {
        const updateRect = () => {
            const el = contentRef.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            setContainerRect({ left: r.left, width: r.width });
        };
        updateRect();
        window.addEventListener('resize', updateRect);
        return () => window.removeEventListener('resize', updateRect);
    }, []);

    // Fetch categories once for popovers/drawer
    useEffect(() => {
        const load = async () => {
            try {
                const [biz, sale] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories`),
                    axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/sale-categories`)
                ]);
                setCategories(biz?.data?.data?.categories || []);
                setSaleCategoriesSmall(sale?.data?.data?.categories || []);
            } catch {}
        };
        load();
    }, []);

  // Load all sale subcategories once to resolve names in active chips
  useEffect(() => {
      const loadSubs = async () => {
          try {
              const res = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/sale-subcategories`);
              const list = res?.data?.data?.subcategories || [];
              const map = {};
              list.forEach(s => { if (s && s._id) map[s._id] = s.name; });
              setSaleSubMap(map);
          } catch {}
      };
      loadSubs();
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
        setTempSort(sort);
        // Sync temp values from URL on navigation
        setTempValues(v => ({
            ...v,
            categoryName: filters.categoryName || '',
            services: filters.services ? (Array.isArray(filters.services) ? filters.services : [filters.services]) : [],
            city: filters.city || '',
            priceMin: filters.priceMin || '',
            priceMax: filters.priceMax || '',
            priceMinN: filters.priceMin ? Number(filters.priceMin) : 0,
            priceMaxN: filters.priceMax ? Number(filters.priceMax) : MAX_PRICE,
            maxDistance: filters.maxDistance ? Number(filters.maxDistance) : 0,
            rating: filters.rating ? Number(filters.rating) : 0,
            saleCategoryId: filters.saleCategoryId || '',
            saleSubcategoryId: filters.saleSubcategoryId || '',
        }));
        // Select correct tab according to selected category type
        if (filters.saleCategoryId) {
            setCategoryTab('sale');
        } else if (filters.categoryName) {
            setCategoryTab('business');
        }
        const cat = (filters.categoryName || '').toString();
        const found = categories.find(c => c.name === cat);
        setSelectedCategoryId(found?._id || '');
        // Infer sale category when user selected a category name outside advanced filter
        if (!filters.saleCategoryId && cat) {
            const saleFound = saleCategoriesSmall.find(sc => sc.name === cat);
            if (saleFound) {
                setCategoryTab('sale');
                setSelectedCategoryId('');
                setServices([]);
                setTempValues(v => ({ ...v, saleCategoryId: saleFound._id, saleSubcategoryId: '' }));
                (async () => {
                    try {
                        const res = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/sale-subcategories/category/${saleFound._id}`);
                        setSaleSubcategoriesSmall(res.data?.data?.subcategories || []);
                    } catch {}
                })();
            }
        }
        // Ensure sale subcategories are loaded if saleCategoryId exists
        if (filters.saleCategoryId && (!saleSubcategoriesSmall.length || saleSubcategoriesSmall[0]?.saleCategoryId !== filters.saleCategoryId)) {
            (async () => {
                try {
                    const res = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/sale-subcategories/category/${filters.saleCategoryId}`);
                    setSaleSubcategoriesSmall(res.data?.data?.subcategories || []);
                } catch {}
            })();
        }
        if (urlTab && ['all','business','sale','promo'].includes(urlTab)) {
            setActiveTab(urlTab);
        }
    }, [location.search, categories, saleSubcategoriesSmall.length]);

    useEffect(() => {
        if (activeTab === 'all') return;
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
        if (activeTab === 'all') return;
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
        
        setIsLoadingBiz(true);
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
                setIsLoadingBiz(false);
            })
            .catch(error => {
                console.error('Error fetching businesses:', error);
                setIsLoadingBiz(false);
            });
    }, [location.search, bizPage, userLocation, locationLoading, locationError, activeTab]);

    // Fetch Sale Ads
    useEffect(() => {
        if (activeTab === 'all') return;
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const params = new URLSearchParams(location.search);
        const paramsObj = {};
        for (const [key, value] of params.entries()) {
            if (['q','categoryId','saleCategoryId','saleSubcategoryId','categoryName','priceMin','priceMax','sort','maxDistance','services','rating','city','openNow','addedWithin','includeNoPrice'].includes(key)) {
                paramsObj[key] = value;
            }
        }
        // Map saleCategoryId / saleSubcategoryId to sale endpoint filters
        if (paramsObj.saleCategoryId) paramsObj.categoryId = paramsObj.saleCategoryId;
        if (paramsObj.saleSubcategoryId) paramsObj.subcategoryId = paramsObj.saleSubcategoryId;
        delete paramsObj.saleCategoryId;
        delete paramsObj.saleSubcategoryId;
        // Map price keys to API expected names
        if (paramsObj.priceMin) { paramsObj.minPrice = paramsObj.priceMin; delete paramsObj.priceMin; }
        if (paramsObj.priceMax) { paramsObj.maxPrice = paramsObj.priceMax; delete paramsObj.priceMax; }
        paramsObj.page = salePage;
        paramsObj.limit = ITEMS_PER_PAGE;

        const qs = new URLSearchParams(paramsObj).toString();
        setIsLoadingSale(true);
        axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/sale-ads?${qs}`, { headers })
            .then(res => {
                const newAds = res.data.data.ads || [];
                setSaleAds(prev => salePage === 1 ? newAds : [...prev, ...newAds]);
                const total = res.data.pagination?.totalPages || 1;
                setSaleTotalPages(total);
                setIsLoadingSale(false);
            })
            .catch(err => {
                console.error('Error fetching sale ads:', err);
                setIsLoadingSale(false);
            });
    }, [location.search, salePage, activeTab]);

    // Fetch Promo Ads
    useEffect(() => {
        if (activeTab === 'all') return;
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
        setIsLoadingPromo(true);
        axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/promo-ads?${qs}`, { headers })
            .then(res => {
                const newAds = res.data.data.ads || [];
                setPromoAds(prev => promoPage === 1 ? newAds : [...prev, ...newAds]);
                const total = res.data.pagination?.totalPages || 1;
                setPromoTotalPages(total);
                setIsLoadingPromo(false);
            })
            .catch(err => {
                console.error('Error fetching promo ads:', err);
                setIsLoadingPromo(false);
            });
    }, [location.search, promoPage, activeTab]);

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

  // Apply client-side text filter
  const normalize = (v) => (v ? String(v).toLowerCase() : '');
  const ql = normalize(searchText);

  const queryFilteredBusinesses = useMemo(() => {
    if (!ql) return filteredBusinesses;
    return filteredBusinesses.filter(b => {
      return [
        b?.name,
        b?.description,
        b?.address,
        b?.city,
        b?.categoryName,
      ].some(f => normalize(f).includes(ql));
    });
  }, [filteredBusinesses, ql]);

  const queryFilteredSaleAds = useMemo(() => {
    if (!ql) return filteredSaleAds;
    return filteredSaleAds.filter(a => {
      return [
        a?.title || a?.name,
        a?.description,
        a?.city,
        a?.categoryName,
      ].some(f => normalize(f).includes(ql));
    });
  }, [filteredSaleAds, ql]);

  const queryFilteredPromoAds = useMemo(() => {
    if (!ql) return filteredPromoAds;
    return filteredPromoAds.filter(a => {
      return [
        a?.title || a?.name,
        a?.description,
      ].some(f => normalize(f).includes(ql));
    });
  }, [filteredPromoAds, ql]);

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

    const handleApplyMulti = (updates) => {
        const newParams = new URLSearchParams(location.search);
        Object.entries(updates).forEach(([k, v]) => {
            if (Array.isArray(v)) {
                newParams.delete(k);
                v.forEach(val => val !== '' && newParams.append(k, val));
            } else if (v === undefined || v === null || v === '' || (typeof v === 'number' && Number.isNaN(v))) {
                newParams.delete(k);
            } else {
                newParams.set(k, String(v));
            }
        });
        newParams.set('page', 1);
        navigate({ pathname: location.pathname, search: newParams.toString() });
        setShowFiltersDrawer(false);
        setShowFilters(false);
    };

    const toggleOpenNow = () => {
        const params = new URLSearchParams(location.search);
        if (params.has('openNow')) params.delete('openNow'); else params.set('openNow', 'true');
        params.set('page', 1);
        navigate({ pathname: location.pathname, search: params.toString() });
    };

    const fetchServicesByCategoryId = async (catId) => {
        if (!catId) { setServices([]); return; }
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/services/byCategory/${catId}`);
            setServices(res?.data?.data?.services || []);
        } catch (_) {
            setServices([]);
        }
    };

    return (
        <div className='wide-page-container'>
            <div ref={contentRef} className='wide-page-content search-results-page'>
                <button className="nav-button above-header" onClick={() => navigate('/')}> 
                    <FaArrowRight className="icon" />
                    {t('common.backToHome')}
                </button>
                <div className="page-header">
                    <div className="page-header__content">
                        <h1 className="login-title">{t('searchResults.pageTitle')}</h1>
                    </div>
                </div>
                
                {/* Type pills row above search bar */}
                <div className="type-pills" role="tablist" aria-label={t('userBusinesses.tabs.aria')}>
                    <div className="type-pills-grid">
                        {[
                          { key: 'all', label: t('favorites.tabs.all'), icon: FaThLarge },
                          { key: 'business', label: t('favorites.tabs.business'), icon: FaStore },
                          { key: 'sale', label: t('favorites.tabs.sale'), icon: FaTag },
                          { key: 'promo', label: t('favorites.tabs.promo'), icon: FaBullhorn },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            className={`type-pill ${activeTab===tab.key ? 'active' : ''}`}
                            role="tab"
                            aria-selected={activeTab===tab.key}
                            onClick={() => handleTabChange(tab.key)}
                          >
                            {tab.icon ? <tab.icon className="tp-icon" aria-hidden="true" /> : null}
                            <span className="tp-label">{tab.label}</span>
                          </button>
                        ))}
                    </div>
                </div>

                <div className="search-controls">
                    <div className="search-controls__main">
                        <div className="search-bar-container">
                            <SearchBar isMainPage={false} onSearch={setSearchText} />
                        </div>
                        <div className="search-controls__actions"></div>
                    </div>

                    {/* Filters row - standalone buttons + drawer trigger */}
                    {(() => { const p = new URLSearchParams(location.search);
                      const hasCategory = !!p.get('categoryName');
                      const hasServices = p.getAll('services').length>0;
                      const hasCity = !!p.get('city');
                      const hasPrice = !!(p.get('priceMin')||p.get('priceMax'));
                      const hasDistance = !!p.get('maxDistance');
                      const hasOpenNow = p.has('openNow');
                      const hasRating = !!p.get('rating');
                      const hasSort = !!(p.get('sort') && p.get('sort') !== 'rating');
                    return (
                    <div className="filters-row" role="toolbar" aria-label={t('searchResults.filters.toolbar')}>
                        <button
                            className={`chip-button${hasSort ? ' active' : ''}`}
                            onClick={() => { setDrawerMode('sort'); setShowFiltersDrawer(true); setShowFilters(true); setTempSort(sortOption || 'rating'); }}
                            aria-expanded={showFiltersDrawer && drawerMode==='sort'}
                        >
                            <FaSort aria-hidden="true" /> {SORT_OPTIONS[sortOption]}
                        </button>

                        <button
                            className="chip-button"
                            onClick={() => { setDrawerMode('all'); setShowFiltersDrawer(true); setShowFilters(true); }}
                            aria-expanded={showFiltersDrawer && drawerMode==='all'}
                        >
                            <FaFilter aria-hidden="true" /> {t('searchResults.advancedFilter')}
                        </button>
                        {/* Category */}
                        <button className={`chip-button${hasCategory ? ' active' : ''}`} onClick={() => { setDrawerMode('category'); setShowFiltersDrawer(true); setShowFilters(true); }} aria-expanded={showFiltersDrawer && drawerMode==='category'}>
                            {t('advancedSearch.category.title')}{tempValues.categoryName?`: ${tempValues.categoryName}`:''}
                        </button>

                        {/* Services (business only) */}
                        {tempValues.categoryName && !tempValues.saleCategoryId && services.length>0 && (
                          <button className={`chip-button${hasServices ? ' active' : ''}`} onClick={() => { if (!selectedCategoryId) { const found = categories.find(c=>c.name===tempValues.categoryName); setSelectedCategoryId(found?._id||''); } fetchServicesByCategoryId(selectedCategoryId || (categories.find(c=>c.name===tempValues.categoryName)?._id||'')); setDrawerMode('services'); setShowFiltersDrawer(true); setShowFilters(true); }} aria-expanded={showFiltersDrawer && drawerMode==='services'}>
                              {t('advancedSearch.services.title')}{tempValues.services?.length?` (${tempValues.services.length})`:''}
                          </button>
                        )}

                        {/* Sale subcategories chip (sale only) */}
                        {tempValues.saleCategoryId && (
                          <button className={`chip-button${tempValues.saleSubcategoryId ? ' active' : ''}`} onClick={async () => { 
                              if (saleSubcategoriesSmall.length===0 && tempValues.saleCategoryId) {
                                try { const res = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/sale-subcategories/category/${tempValues.saleCategoryId}`); setSaleSubcategoriesSmall(res.data?.data?.subcategories || []);} catch {}
                              }
                              setDrawerMode('saleSubs'); setCategoryTab('sale'); setShowFiltersDrawer(true); setShowFilters(true); }} aria-expanded={showFiltersDrawer && drawerMode==='saleSubs'}>
                              {(t('advancedSearch.subcategories')==='advancedSearch.subcategories' ? 'תת קטגוריות' : t('advancedSearch.subcategories'))}
                           </button>
                        )}

                        {/* City */}
                        <button className={`chip-button${hasCity ? ' active' : ''}`} onClick={() => { setDrawerMode('city'); setShowFiltersDrawer(true); setShowFilters(true); }} aria-expanded={showFiltersDrawer && drawerMode==='city'}>
                            {t('advancedSearch.city')}
                        </button>

                        {/* Price */}
                        <button className={`chip-button${hasPrice ? ' active' : ''}`} onClick={() => { setDrawerMode('price'); setShowFiltersDrawer(true); setShowFilters(true); }} aria-expanded={showFiltersDrawer && drawerMode==='price'}>
                            {t('advancedSearch.priceRange')}
                        </button>

                        {/* Distance */}
                        <button className={`chip-button${hasDistance ? ' active' : ''}`} onClick={() => { setDrawerMode('distance'); setShowFiltersDrawer(true); setShowFilters(true); }} aria-expanded={showFiltersDrawer && drawerMode==='distance'}>
                            {t('advancedSearch.distance.title')}
                        </button>

                        {/* Open Now quick toggle */}
                        <button className={`chip-button${hasOpenNow ? ' active' : ''}`} onClick={toggleOpenNow} aria-pressed={hasOpenNow}>
                            {t('advancedSearch.openNow')}
                        </button>

                        {/* Rating */}
                        <button className={`chip-button${hasRating ? ' active' : ''}`} onClick={() => { setDrawerMode('rating'); setShowFiltersDrawer(true); setShowFilters(true); }} aria-expanded={showFiltersDrawer && drawerMode==='rating'}>
                            {t('advancedSearch.rating.title')}
                        </button>
                    </div>
                    ); })()}

                    {/* Drawer overlay */}
                    {showFiltersDrawer && (
                        <div className="filters-drawer-overlay" role="dialog" aria-modal="true" onClick={() => { setShowFiltersDrawer(false); setShowFilters(false); }}>
                            <div
                                className="filters-drawer"
                                style={{
                                    width: `${(() => {
                                        const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
                                        const isMobile = vw <= 640;
                                        const base = Math.min(containerRect.width, 720);
                                        const w = isMobile ? base : Math.max(480, Math.floor(base * 0.75));
                                        return w;
                                    })()}px`,
                                    left: (() => {
                                        const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
                                        const isMobile = vw <= 640;
                                        const base = Math.min(containerRect.width, 720);
                                        const width = isMobile ? base : Math.max(480, Math.floor(base * 0.75));
                                        return `calc(50% - ${width / 2}px)`;
                                    })()
                                }}
                                onClick={(e)=>e.stopPropagation()}
                            >
                                <div className="fd-header">
                                    <button className="fd-close" aria-label={t('common.close')} onClick={() => { setShowFiltersDrawer(false); setShowFilters(false); }}>
                                        <FaTimes />
                                    </button>
                                    <h2 className="fd-title">{
                                        drawerMode==='all' ? t('advancedSearch.title') :
                                        drawerMode==='category' ? t('advancedSearch.category.title') :
                                        drawerMode==='services' ? t('advancedSearch.services.title') :
                                        drawerMode==='city' ? (t('advancedSearch.city')||'City') :
                                        drawerMode==='price' ? (t('advancedSearch.priceRange')||'Price') :
                                        drawerMode==='distance' ? t('advancedSearch.distance.title') :
                                        drawerMode==='saleSubs' ? ((t('advancedSearch.subcategories')==='advancedSearch.subcategories' ? 'תת קטגוריות' : t('advancedSearch.subcategories'))) :
                                        t('advancedSearch.rating.title')
                                    }</h2>
                                    <button
                                      className="fd-clear"
                                      onClick={() => {
                                        if (drawerMode==='category') { setTempValues(v=>({ ...v, categoryName:'', services:[], saleCategoryId:'', saleSubcategoryId:'' })); setSelectedCategoryId(''); handleApplyMulti({ categoryName:'', services:[], saleCategoryId:'', saleSubcategoryId:'' }); return; }
                                        if (drawerMode==='services') { setTempValues(v=>({ ...v, services:[] })); handleApplyMulti({ services:[] }); return; }
                                        if (drawerMode==='city') { setTempValues(v=>({ ...v, city:'' })); handleApplyMulti({ city:'' }); return; }
                                        if (drawerMode==='price') { setTempValues(v=>({ ...v, priceMin:'', priceMax:'', priceMinN:0, priceMaxN:MAX_PRICE })); handleApplyMulti({ priceMin:'', priceMax:'' }); return; }
                                        if (drawerMode==='distance') { setTempValues(v=>({ ...v, maxDistance:0 })); handleApplyMulti({ maxDistance:'' }); return; }
                                        if (drawerMode==='rating') { setTempValues(v=>({ ...v, rating:0 })); handleApplyMulti({ rating:'' }); return; }
                                        if (drawerMode==='saleSubs') { setTempValues(v=>({ ...v, saleSubcategoryId:'' })); handleApplyMulti({ saleSubcategoryId:'' }); return; }
                                        // all
                                        setTempValues(v=>({ ...v, categoryName:'', services:[], city:'', priceMin:'', priceMax:'', priceMinN:0, priceMaxN:MAX_PRICE, maxDistance:0, rating:0, saleCategoryId:'', saleSubcategoryId:'' })); setSelectedCategoryId(''); handleApplyMulti({ categoryName:'', services:[], city:'', priceMin:'', priceMax:'', maxDistance:'', rating:'', saleCategoryId:'', saleSubcategoryId:'', openNow:'' });
                                      }}
                                    >{t('advancedSearch.buttons.clear')}</button>
                                </div>
                                <div className="fd-content" style={{ paddingBottom: 88 }}>
                                    {/* Category - tabs + lists */}
                                    {(drawerMode==='all' || drawerMode==='category') && (
                                      <div className="fd-row">
                                        {drawerMode==='all' ? <label>{t('advancedSearch.category.title')}</label> : null}
                                        <div className="segmented-control" role="tablist" aria-label="category source selector" style={{ marginBottom: 8 }}>
                                          <button type="button" role="tab" aria-selected={categoryTab==='business'} className={`segment ${categoryTab==='business'?'active':''}`} onClick={()=>{ setCategoryTab('business'); setTempValues(v=>({ ...v, saleCategoryId:'', saleSubcategoryId:'' })); setSaleSubcategoriesSmall([]); }}>
                                            {t('advancedSearch.categories.business')||'עסקים'}
                                          </button>
                                          <button type="button" role="tab" aria-selected={categoryTab==='sale'} className={`segment ${categoryTab==='sale'?'active':''}`} onClick={()=>{ setCategoryTab('sale'); setTempValues(v=>({ ...v, categoryName:'', services:[], })); setSelectedCategoryId(''); setServices([]); }}>
                                            {t('advancedSearch.categories.sale')||'מכירה'}
                                          </button>
                                        </div>
                                        {categoryTab==='business' ? (
                                          <div className="tags-scroll">
                                            {categories.map(c => (
                                              <button
                                                key={`biz-${c._id}`}
                                                type="button"
                                                className={`tag-chip ${tempValues.categoryName===c.name ? 'selected' : ''}`}
                                                onClick={async () => {
                                                  const isSame = tempValues.categoryName===c.name;
                                                  const nextName = isSame ? '' : c.name;
                                                  const nextId = isSame ? '' : c._id;
                                                  setTempValues(v=>({ ...v, categoryName: nextName, services: [], saleCategoryId: '', saleSubcategoryId:'' }));
                                                  setSelectedCategoryId(nextId);
                                                  await fetchServicesByCategoryId(nextId);
                                                }}
                                              >{c.name}</button>
                                            ))}
                                          </div>
                                        ) : (
                                          <>
                                            <div className="tags-scroll">
                                              {saleCategoriesSmall.map(sc => (
                                                <button
                                                  key={`sale-${sc._id}`}
                                                  type="button"
                                                  className={`tag-chip ${tempValues.saleCategoryId===sc._id ? 'selected' : ''}`}
                                                  onClick={async () => {
                                                    const isSame = tempValues.saleCategoryId===sc._id;
                                                    const nextId = isSame ? '' : sc._id;
                                                    const nextName = isSame ? '' : sc.name;
                                                    setTempValues(v=>({ ...v, categoryName: nextName, saleCategoryId: nextId, saleSubcategoryId:'' }));
                                                    setSelectedCategoryId('');
                                                    setServices([]);
                                                    if (nextId) {
                                                      try {
                                                        const res = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/sale-subcategories/category/${nextId}`);
                                                        setSaleSubcategoriesSmall(res.data?.data?.subcategories || []);
                                                      } catch { setSaleSubcategoriesSmall([]); }
                                                    } else {
                                                      setSaleSubcategoriesSmall([]);
                                                    }
                                                  }}
                                                >{sc.name}</button>
                                              ))}
                                            </div>
                                            {/* Inline subcategories inside advanced drawer only */}
                                            {tempValues.saleCategoryId && saleSubcategoriesSmall.length>0 && (
                                              <>
                                                <label style={{ display: 'block', marginTop: 8, marginBottom: 6 }}>{(t('advancedSearch.subcategories')==='advancedSearch.subcategories' ? 'תת קטגוריות' : t('advancedSearch.subcategories'))}</label>
                                                <div className="tags-scroll">
                                                  {saleSubcategoriesSmall.map(ssc => (
                                                    <button
                                                      key={`sale-sub-${ssc._id}`}
                                                      type="button"
                                                      className={`tag-chip ${tempValues.saleSubcategoryId===ssc._id ? 'selected' : ''}`}
                                                      onClick={() => {
                                                        const isSame = tempValues.saleSubcategoryId===ssc._id;
                                                        setTempValues(v=>({ ...v, saleSubcategoryId: isSame ? '' : ssc._id }));
                                                      }}
                                                    >{ssc.name}</button>
                                                  ))}
                                                </div>
                                              </>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    )}

                                    {/* Services */}
                                    {(drawerMode==='all' || drawerMode==='services') && services.length>0 && categoryTab==='business' && (
                                        <div className="fd-row">
                                            {drawerMode==='all' ? <label>{t('advancedSearch.services.title')}</label> : null}
                                            <div className="tags-scroll">
                                                {services.map(s => (
                                                    <label key={s._id} className={`tag-check ${tempValues.services.includes(s.name)?'selected':''}`}>
                                                        <input type="checkbox" checked={tempValues.services.includes(s.name)} onChange={(e)=>{
                                                            setTempValues(v=>{
                                                                const exists = v.services.includes(s.name);
                                                                const next = exists ? v.services.filter(x=>x!==s.name) : [...v.services, s.name];
                                                                return { ...v, services: next };
                                                            });
                                                        }} />
                                                        <span>{s.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Sale Subcategories - separate drawer */}
                                    {drawerMode==='saleSubs' && (
                                      <div className="fd-row">
                                        <label>{t('advancedSearch.subcategories') || 'תת קטגוריות'}</label>
                                        <div className="tags-scroll">
                                          {saleSubcategoriesSmall.map(ssc => (
                                            <button
                                              key={`sale-sub-${ssc._id}`}
                                              type="button"
                                              className={`tag-chip ${tempValues.saleSubcategoryId===ssc._id ? 'selected' : ''}`}
                                              onClick={() => {
                                                const isSame = tempValues.saleSubcategoryId===ssc._id;
                                                setTempValues(v=>({ ...v, saleSubcategoryId: isSame ? '' : ssc._id }));
                                              }}
                                            >{ssc.name}</button>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Sort */}
                                    {drawerMode==='sort' && (
                                      <div className="fd-row">
                                        <div className="tags-scroll">
                                          {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                                            <button
                                              key={value}
                                              type="button"
                                              className={`tag-chip ${tempSort===value ? 'selected' : ''}`}
                                              onClick={() => setTempSort(value)}
                                            >{label}</button>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* City */}
                                    {(drawerMode==='all' || drawerMode==='city') && (
                                    <div className="fd-row">
                                        {drawerMode==='all' ? <label>{t('advancedSearch.city')}</label> : null}
                                        {mapsLoaded ? (
                                            <Autocomplete
                                                onLoad={(ac)=>{ cityAutoRef.current = ac; }}
                                                onPlaceChanged={()=>{
                                                    const place = cityAutoRef.current?.getPlace();
                                                    if (!place) return;
                                                    const comp = place.address_components || [];
                                                    const cityComp = comp.find(c => c.types.includes('locality')) || comp.find(c => c.types.includes('administrative_area_level_2')) || comp.find(c => c.types.includes('administrative_area_level_1'));
                                                    setTempValues(v=>({ ...v, city: cityComp?.long_name || place.name || '' }));
                                                }}
                                                options={{ types: ['(cities)'], componentRestrictions: { country: 'il' } }}
                                            >
                                                <input className="mini-input full" type="text" value={tempValues.city} onChange={(e)=>setTempValues(v=>({...v, city:e.target.value}))} placeholder={t('advancedSearch.cityPlaceholder')||''} />
                                            </Autocomplete>
                                        ) : (
                                            <input className="mini-input full" type="text" value={tempValues.city} onChange={(e)=>setTempValues(v=>({...v, city:e.target.value}))} />
                                        )}
                                    </div>
                                    )}

                                    {/* Price */}
                                    {(drawerMode==='all' || drawerMode==='price') && (
                                      <div className="fd-row two">
                                        <div>
                                          {drawerMode==='all' ? <label>{t('advancedSearch.min')}</label> : null}
                                          <input className="mini-input full" type="number" min="0" placeholder={t('advancedSearch.min')} value={tempValues.priceMin} onChange={(e)=>setTempValues(v=>({...v, priceMin:e.target.value}))} />
                                        </div>
                                        <div>
                                          {drawerMode==='all' ? <label>{t('advancedSearch.max')}</label> : null}
                                          <input className="mini-input full" type="number" min="0" placeholder={t('advancedSearch.max')} value={tempValues.priceMax} onChange={(e)=>setTempValues(v=>({...v, priceMax:e.target.value}))} />
                                        </div>
                                      </div>
                                    )}

                                    {/* Distance */}
                                    {(drawerMode==='all' || drawerMode==='distance') && (
                                    <div className="fd-row">
                                        {drawerMode==='all' ? <label>{t('advancedSearch.distance.title')}</label> : null}
                                        <input className="mini-range full" type="range" min="0" max="100" step="1" value={tempValues.maxDistance} onChange={(e)=>setTempValues(v=>({...v, maxDistance:Number(e.target.value)}))} />
                                        <div className="range-value">{tempValues.maxDistance} {t('advancedSearch.distance.km')}</div>
                                    </div>
                                    )}

                                    {/* Open now - show only in all mode to avoid confusion; quick toggle chip handles single */}
                                    {drawerMode==='all' && (
                                    <div className="fd-row">
                                        <label className="inline">
                                            <input type="checkbox" checked={new URLSearchParams(location.search).has('openNow')} onChange={toggleOpenNow} /> {t('advancedSearch.openNow')}
                                        </label>
                                    </div>
                                    )}

                                    {/* Rating */}
                                    {(drawerMode==='all' || drawerMode==='rating') && (
                                    <div className="fd-row">
                                        {drawerMode==='all' ? <label>{t('advancedSearch.rating.title')}</label> : null}
                                        <div className="stars-inline">
                                            {[1,2,3,4,5].map(st => (
                                                <FaStar key={st} className={`rating-star ${tempValues.rating>=st?'active':''}`} onClick={()=>setTempValues(v=>({...v, rating: v.rating===st?0:st}))} />
                                            ))}
                                        </div>
                                    </div>
                                    )}
                                </div>
                                <div className="fd-footer">
                                    <button className="submit-button" onClick={() => {
                                        if (drawerMode==='category') { handleApplyMulti({ categoryName: tempValues.categoryName, services: [], saleCategoryId: tempValues.saleCategoryId || '', saleSubcategoryId: tempValues.saleSubcategoryId || '' }); return; }
                                        if (drawerMode==='services') { handleApplyMulti({ services: tempValues.services }); return; }
                                        if (drawerMode==='saleSubs') { handleApplyMulti({ saleSubcategoryId: tempValues.saleSubcategoryId || '' }); return; }
                                        if (drawerMode==='city') { handleApplyMulti({ city: tempValues.city }); return; }
                                        if (drawerMode==='price') { handleApplyMulti({ priceMin: tempValues.priceMin || '', priceMax: tempValues.priceMax || '' }); return; }
                                        if (drawerMode==='distance') { handleApplyMulti({ maxDistance: tempValues.maxDistance || '' }); return; }
                                        if (drawerMode==='rating') { handleApplyMulti({ rating: tempValues.rating || '' }); return; }
                                        if (drawerMode==='sort') { handleApplyMulti({ sort: tempSort==='rating' ? 'rating' : tempSort }); return; }
                                        handleApplyMulti({ categoryName: tempValues.categoryName, services: tempValues.services, city: tempValues.city, priceMin: tempValues.priceMinN>0 ? String(tempValues.priceMinN) : '', priceMax: tempValues.priceMaxN<MAX_PRICE ? String(tempValues.priceMaxN) : '', maxDistance: tempValues.maxDistance || '', rating: tempValues.rating || '' });
                                    }}>{t('advancedSearch.buttons.apply')}</button>
                                </div>
                            </div>
                        </div>
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
                    if (params.get('saleSubcategoryId')) {
                      const subId = params.get('saleSubcategoryId');
                      const byMap = saleSubMap[subId];
                      const bySmall = (saleSubcategoriesSmall.find(s => String(s._id) === String(subId)) || {}).name;
                      const name = byMap || bySmall || '';
                      chips.push({ key: 'saleSubcategoryId', value: name, label: withColon(t('advancedSearch.subcategory')||'תת קטגוריה') });
                    }
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

                {/* Tabs removed in favor of type pills above */}

                {/* Results */}
                <div className="search-results-layout">
                    <div className="business-cards-grid">
                        {activeTab === 'business' && queryFilteredBusinesses.map((business, index) => (
                            <div key={business._id} ref={index === businesses.length - 1 ? lastItemRef : undefined}>
                                <BusinessCard business={business} />
                            </div>
                        ))}

                        {activeTab === 'sale' && queryFilteredSaleAds.map((ad, index) => (
                            <div key={ad._id} ref={index === queryFilteredSaleAds.length - 1 ? lastItemRef : undefined}>
                                <SaleAdCard ad={ad} />
                            </div>
                        ))}

                        {activeTab === 'promo' && queryFilteredPromoAds.map((ad, index) => (
                            <div key={ad._id} ref={index === queryFilteredPromoAds.length - 1 ? lastItemRef : undefined}>
                                <PromoAdCard ad={ad} />
                            </div>
                        ))}

                        {activeTab === 'all' && (
                            (isLoadingUnified && unifiedPage === 1)
                              ? Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
                                  <div key={`skeleton-${idx}`} className="animate-pulse rounded-lg bg-gray-200 h-40" />
                                ))
                              : unifiedItems.map((item, index) => (
                                  <div key={`${item.type}-${item.data._id || index}`} ref={index === unifiedItems.length - 1 ? lastItemRef : undefined}>
                                      {item.type === 'business' ? (
                                          <BusinessCard business={item.data} />
                                      ) : item.type === 'sale' ? (
                                          <SaleAdCard ad={item.data} />
                                      ) : (
                                          <PromoAdCard ad={item.data} />
                                      )}
                                  </div>
                                ))
                        )}
                    </div>
                </div>

                {/* לוודר */}
                {isLoadingAny && (
                    <div className="loader-container">
                        <div className="loader"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResultPage;