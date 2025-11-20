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
import { FaFilter, FaTimes, FaChevronDown, FaSort, FaArrowRight, FaThLarge, FaStore, FaTag, FaBullhorn, FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { useSelector } from 'react-redux';
import { buildQueryUrl } from '../utils/buildQueryUrl';
import { getToken } from '../utils/auth';
import { useTranslation } from 'react-i18next';
import PromoBanner from './PromoBanner';
const GOOGLE_LIBRARIES = ['places'];

const ITEMS_PER_PAGE = 40;

const SearchResultPage = () => {
    const { t, i18n, ready } = useTranslation();
    // Active tab: all | business | sale | promo
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid | carousel
  const [currentPromoSlide, setCurrentPromoSlide] = useState(0);

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

  // Lock body scroll when filters drawer is open (must not be after early returns)
  useEffect(() => {
      if (showFiltersDrawer) {
          document.body.classList.add('no-scroll');
      } else {
          document.body.classList.remove('no-scroll');
      }
      return () => document.body.classList.remove('no-scroll');
  }, [showFiltersDrawer]);

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
        cityLat: undefined,
        cityLng: undefined,
        priceMin: '',
        priceMax: '',
        priceMinN: 0,
        priceMaxN: 10000,
        maxDistance: 0,
        rating: 0,
        saleCategoryId: '',
        saleCategoryName: '',
        saleSubcategoryId: '',
        saleSubcategoryIds: [],
    });
    const MAX_PRICE = 10000;
    const { isLoaded: mapsLoaded } = useJsApiLoader({ 
        id: 'google-maps-script', 
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '', 
        libraries: GOOGLE_LIBRARIES,
        language: 'he',
        region: 'IL'
    });
    const cityAutoRef = useRef(null);
    const [activeFilters, setActiveFilters] = useState({});
    const [sortOption, setSortOption] = useState('');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const sortDropdownRef = useRef(null);
    const [tempSort, setTempSort] = useState('rating');
    const advancedSearchRef = useRef(null);
    const prevFiltersRef = useRef('');
    const prevLocationErrorRef = useRef(null);
    const [isLoadingBiz, setIsLoadingBiz] = useState(false);
    const [isLoadingSale, setIsLoadingSale] = useState(false);
    const [isLoadingPromo, setIsLoadingPromo] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    // Unified 'all' state
    const [unifiedItems, setUnifiedItems] = useState([]);
    const [unifiedPage, setUnifiedPage] = useState(1);
    const [unifiedTotalPages, setUnifiedTotalPages] = useState(1);
    const [isLoadingUnifiedActual, setIsLoadingUnified] = useState(false);
    const isLoadingAny = isLoadingBiz || isLoadingSale || isLoadingPromo || isLoadingUnifiedActual;
    const isLoadingCurrent = useMemo(() => {
      if (activeTab === 'all') return isLoadingUnifiedActual;
      if (activeTab === 'business') return isLoadingBiz;
      if (activeTab === 'sale') return isLoadingSale;
      if (activeTab === 'promo') return isLoadingPromo;
      return false;
    }, [activeTab, isLoadingUnifiedActual, isLoadingBiz, isLoadingSale, isLoadingPromo]);
  // Cache of sale subcategory id->name for chips
  const [saleSubMap, setSaleSubMap] = useState({});

    const navigate = useNavigate();
    const location = useLocation();
    // Local text filter (client-side) from SearchBar
    const [searchText, setSearchText] = useState('');
    // Grid density: number of columns between 1..5 (affects card size)
    const [gridCols, setGridCols] = useState(3);
    const handleIncreaseDensity = () => setGridCols(c => Math.max(1, Math.min(5, c - 1)));
    const handleDecreaseDensity = () => setGridCols(c => Math.max(1, Math.min(5, c + 1)));

    useEffect(() => {
        const q = new URLSearchParams(location.search).get('q') || '';
        setSearchText(q);
    }, [location.search]);

    const userLocation = useSelector(state => state.location.coords);
    const locationLoading = useSelector(state => state.location.loading);
    const locationError = useSelector(state => state.location.error);

    const observer = useRef();
    const lastItemRef = useCallback(node => {
        if (isLoadingAny || (activeTab === 'all' && isLoadingUnifiedActual)) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (!entries[0].isIntersecting || !hasMore) return;
            if (activeTab === 'business') setBizPage(prev => prev + 1);
            else if (activeTab === 'sale') setSalePage(prev => prev + 1);
            else if (activeTab === 'promo') setPromoPage(prev => prev + 1);
            else setUnifiedPage(prev => prev + 1);
        });
        if (node) observer.current.observe(node);
    }, [isLoadingAny, isLoadingUnifiedActual, hasMore, activeTab]);

    // Centralize hasMore computation to avoid race conditions
    useEffect(() => {
        let more;
        if (activeTab === 'all') {
            more = unifiedPage < unifiedTotalPages;
        } else if (activeTab === 'business') {
            more = bizPage < bizTotalPages;
        } else if (activeTab === 'sale') {
            more = salePage < saleTotalPages;
        } else if (activeTab === 'promo') {
            more = promoPage < promoTotalPages;
        } else {
            more = false;
        }
        setHasMore(more);
    }, [activeTab, unifiedPage, unifiedTotalPages, bizPage, bizTotalPages, salePage, saleTotalPages, promoPage, promoTotalPages]);

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
    }, [isLoadingBiz, isLoadingSale, isLoadingPromo, isLoadingUnifiedActual, hasMore, activeTab, unifiedPage, unifiedTotalPages, bizPage, salePage, promoPage, bizTotalPages, saleTotalPages, promoTotalPages]);

    // On tab change: clear de-dup keys so next fetch will run; reset lists/pages for target tab
    useEffect(() => {
        // clear all lastKey refs to force refresh after switching tabs
        if (SearchResultPage.__unifiedLastKeyRef) SearchResultPage.__unifiedLastKeyRef.current = '';
        if (SearchResultPage.__bizLastKeyRef) SearchResultPage.__bizLastKeyRef.current = '';
        if (SearchResultPage.__saleLastKeyRef) SearchResultPage.__saleLastKeyRef.current = '';
        if (SearchResultPage.__promoLastKeyRef) SearchResultPage.__promoLastKeyRef.current = '';
        // Reset state for the destination tab to avoid stale items when the new fetch returns 0
        if (activeTab === 'all') {
            setUnifiedItems([]); setUnifiedPage(1); setUnifiedTotalPages(1);
        } else if (activeTab === 'business') {
            setBusinesses([]); setBizPage(1); setBizTotalPages(1);
        } else if (activeTab === 'sale') {
            setSaleAds([]); setSalePage(1); setSaleTotalPages(1);
        } else if (activeTab === 'promo') {
            setPromoAds([]); setPromoPage(1); setPromoTotalPages(1);
        }
    }, [activeTab, location.search]);

    // Fetch unified items
    useEffect(() => {
        if (activeTab !== 'all') return;
        setIsLoadingUnified(true);
        const lastKeyRef = (SearchResultPage.__unifiedLastKeyRef ||= { current: '' });
        const headers = {};
        const token = getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
        const params = new URLSearchParams(location.search);
        // אל תעביר tab לשירות המאוחד
        params.delete('tab');
        const sort = params.get('sort') || '';
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
        const requestKey = `all|${params.toString()}`;
        if (lastKeyRef.current === requestKey) { setIsLoadingUnified(false); return; }
        axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/search/all?${params.toString()}`, { headers })
          .then(res => {
            const newItems = res.data?.data?.items || [];
            const totalPages = res.data?.data?.pagination?.totalPages || 1;
            setUnifiedItems(prev => unifiedPage === 1 ? newItems : [...prev, ...newItems]);
            // Clamp total pages if server returned an empty page for current filters
            setUnifiedTotalPages(newItems.length === 0 ? unifiedPage : totalPages);
          })
          .catch(() => {})
          .finally(() => { lastKeyRef.current = requestKey; setIsLoadingUnified(false); });
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

    // Auto-advance promo banner when viewing promo in carousel mode
    useEffect(() => {
        if (activeTab !== 'promo' || viewMode !== 'carousel') return;
        const timer = setInterval(() => {
            setCurrentPromoSlide((s) => s + 1);
        }, 5000);
        return () => clearInterval(timer);
    }, [activeTab, viewMode]);

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
        const sort = params.get('sort') || '';
        for (const [key, value] of params.entries()) {
            if (key !== 'sort' && key !== 'q' && key !== 'page' && key !== 'limit') {
                if (filters[key] === undefined) {
                    filters[key] = value;
                } else {
                    const prev = filters[key];
                    filters[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
                }
            }
        }
        setActiveFilters(filters);
        setSortOption(sort);
        setTempSort(sort || 'rating');
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
            saleCategoryName: filters.saleCategoryName || '',
            saleSubcategoryId: (Array.isArray(filters.saleSubcategoryId) ? filters.saleSubcategoryId[0] : (filters.saleSubcategoryId || '')),
            saleSubcategoryIds: params.getAll('saleSubcategoryId') || [],
        }));
        // Select correct tab according to selected category type
        if (filters.saleCategoryId) {
            setCategoryTab('sale');
        } else if (filters.categoryName) {
            setCategoryTab('business');
        }
        const cat = (filters.categoryName || '').toString();
        const found = categories.find(c => c.name === cat);
        const catId = found?._id || '';
        setSelectedCategoryId(catId);
        if (catId) { fetchServicesByCategoryId(catId); }
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
    }, [location.search, categories]);

    useEffect(() => {
        if (activeTab === 'all') return;
        const params = new URLSearchParams(location.search);
        const sort = params.get('sort') || '';
        const filtersString = JSON.stringify(activeFilters);
        const q = params.get('q') || '';
        const combinedKey = `${sort}|${filtersString}|${q}`;
        if (prevFiltersRef.current !== combinedKey) {
            // always reset pages and clear lists on any search/sort/filter change
            setBizPage(1);
            setSalePage(1);
            setPromoPage(1);
            setBusinesses([]);
            setSaleAds([]);
            setPromoAds([]);
            setBizTotalPages(1);
            setSaleTotalPages(1);
            setPromoTotalPages(1);
        }
        prevFiltersRef.current = combinedKey;
    }, [activeFilters, sortOption, location.search]);

    useEffect(() => {
        if (activeTab !== 'business') return;
        const lastKeyRef = (SearchResultPage.__bizLastKeyRef ||= { current: '' });
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
        const allowedKeys = new Set(['q','categoryName','sort','maxDistance','services','rating','city','openNow','addedWithin','includeNoPrice','lat','lng','priceMin','priceMax']);
        for (const [key, value] of params.entries()) {
            if (!allowedKeys.has(key)) continue; // אל תעביר tab או פרמטרי UI אחרים ל-API
            if (key === 'services') {
                if (!paramsObj.services) paramsObj.services = [];
                paramsObj.services.push(value);
            } else {
                paramsObj[key] = value;
            }
        }
        // apply global sort/filters to other categories too
        const requestedBizPage = bizPage;
        paramsObj.page = requestedBizPage;
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
        
        const requestKey = `biz|${url}`;
        if (lastKeyRef.current === requestKey) { setIsLoadingBiz(false); return; }
        axios.get(url, { headers })
            .then(res => {
                const newBusinesses = res.data?.data?.businesses || [];
                setBusinesses(prevBusinesses => 
                    requestedBizPage === 1 ? newBusinesses : [...prevBusinesses, ...newBusinesses]
                );
                let total = res.data?.data?.pagination?.totalPages;
                // Stop auto-advancing when server returned empty page for the current filters
                if (newBusinesses.length === 0) {
                    total = requestedBizPage;
                    setHasMore(false);
                } else if (!total) {
                    total = 1;
                }
                setBizTotalPages(total);
                setIsLoadingBiz(false);
            })
            .catch(error => {
                console.error('Error fetching businesses:', error);
                setIsLoadingBiz(false);
            })
            .finally(() => { lastKeyRef.current = requestKey; });
    }, [location.search, bizPage, userLocation, locationLoading, locationError, activeTab]);

    // Fetch Sale Ads
    useEffect(() => {
        if (activeTab !== 'sale') return;
        const lastKeyRef = (SearchResultPage.__saleLastKeyRef ||= { current: '' });
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const params = new URLSearchParams(location.search);
        const paramsObj = {};
        for (const [key, value] of params.entries()) {
            if (['q','categoryId','saleCategoryId','saleSubcategoryId','categoryName','priceMin','priceMax','sort','maxDistance','services','rating','city','openNow','addedWithin','includeNoPrice'].includes(key)) {
                if (key === 'saleSubcategoryId') {
                    if (!Array.isArray(paramsObj.saleSubcategoryId)) paramsObj.saleSubcategoryId = [];
                    paramsObj.saleSubcategoryId.push(value);
                } else if (key === 'services') {
                    if (!Array.isArray(paramsObj.services)) paramsObj.services = [];
                    paramsObj.services.push(value);
                } else {
                    paramsObj[key] = value;
                }
            }
        }
        // Map saleCategoryId / saleSubcategoryId to sale endpoint filters (support multi)
        const subIds = Array.isArray(paramsObj.saleSubcategoryId) ? paramsObj.saleSubcategoryId : (paramsObj.saleSubcategoryId ? [paramsObj.saleSubcategoryId] : []);
        if (paramsObj.saleCategoryId) paramsObj.categoryId = paramsObj.saleCategoryId;
        delete paramsObj.saleCategoryId;
        delete paramsObj.saleSubcategoryId;
        // Map price keys to API expected names
        if (paramsObj.priceMin) { paramsObj.minPrice = paramsObj.priceMin; delete paramsObj.priceMin; }
        if (paramsObj.priceMax) { paramsObj.maxPrice = paramsObj.priceMax; delete paramsObj.priceMax; }
        const requestedSalePage = salePage;
        paramsObj.page = requestedSalePage;
        paramsObj.limit = ITEMS_PER_PAGE;

        const qsParams = new URLSearchParams();
        Object.entries(paramsObj).forEach(([k,v]) => {
            if (Array.isArray(v)) v.forEach(val => qsParams.append(k, val));
            else if (v !== undefined && v !== null && v !== '') qsParams.append(k, v);
        });
        subIds.forEach(id => qsParams.append('subcategoryId', id));
        const qs = qsParams.toString();
        setIsLoadingSale(true);
        const url = `${process.env.REACT_APP_API_DOMAIN}/api/v1/sale-ads?${qs}`;
        const requestKey = `sale|${url}`;
        if (lastKeyRef.current === requestKey) { setIsLoadingSale(false); return; }
        axios.get(url, { headers })
            .then(res => {
                const newAds = res.data?.data?.ads || [];
                setSaleAds(prev => requestedSalePage === 1 ? newAds : [...prev, ...newAds]);
                let total = res.data?.data?.pagination?.totalPages;
                if (newAds.length === 0) {
                    total = requestedSalePage;
                    setHasMore(false);
                } else if (!total) {
                    total = 1;
                }
                setSaleTotalPages(total);
                setIsLoadingSale(false);
            })
            .catch(err => {
                console.error('Error fetching sale ads:', err);
                setIsLoadingSale(false);
            })
            .finally(() => { lastKeyRef.current = requestKey; });
    }, [location.search, salePage, activeTab]);

    // Fetch Promo Ads
    useEffect(() => {
        if (activeTab !== 'promo') return;
        const lastKeyRef = (SearchResultPage.__promoLastKeyRef ||= { current: '' });
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const params = new URLSearchParams(location.search);
        const paramsObj = {};
        for (const [key, value] of params.entries()) {
            if (['q','categoryId','categoryName','sort','status','maxDistance','services','rating','priceMin','priceMax','city','openNow','addedWithin','includeNoPrice'].includes(key)) {
                paramsObj[key] = value;
            }
        }
        const requestedPromoPage = promoPage;
        paramsObj.page = requestedPromoPage;
        paramsObj.limit = ITEMS_PER_PAGE;

        const qs = new URLSearchParams({ status: 'active', ...paramsObj }).toString();
        setIsLoadingPromo(true);
        const url = `${process.env.REACT_APP_API_DOMAIN}/api/v1/promo-ads?${qs}`;
        const requestKey = `promo|${url}`;
        if (lastKeyRef.current === requestKey) { setIsLoadingPromo(false); return; }
        axios.get(url, { headers })
            .then(res => {
                const newAds = res.data?.data?.ads || [];
                setPromoAds(prev => requestedPromoPage === 1 ? newAds : [...prev, ...newAds]);
                let total = res.data?.data?.pagination?.totalPages;
                if (newAds.length === 0) {
                    total = requestedPromoPage;
                    setHasMore(false);
                } else if (!total) {
                    total = 1;
                }
                setPromoTotalPages(total);
                setIsLoadingPromo(false);
            })
            .catch(err => {
                console.error('Error fetching promo ads:', err);
                setIsLoadingPromo(false);
            })
            .finally(() => { lastKeyRef.current = requestKey; });
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
    // Ignore price filters for businesses (no price field); only apply optional category fallback
    let list = businesses;
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
    return list;
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

  // Rely on backend search relevance; do not re-filter by q on client
  const queryFilteredBusinesses = filteredBusinesses;
  const queryFilteredSaleAds = filteredSaleAds;
  const queryFilteredPromoAds = filteredPromoAds;

  // (dev clock removed)

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
                        <div className="search-controls__actions" style={{ display: 'flex', gap: 8 }}>
                          {/* Card size controls: magnifying glass to enlarge/shrink */}
                          <button
                            type="button"
                            className="chip-button"
                            onClick={handleIncreaseDensity}
                            aria-label="הגדל כרטיסים"
                            title="הגדל כרטיסים"
                          >
                            🔍+
                          </button>
                          <button
                            type="button"
                            className="chip-button"
                            onClick={handleDecreaseDensity}
                            aria-label="הקטן כרטיסים"
                            title="הקטן כרטיסים"
                          >
                            🔍-
                          </button>
                        </div>
                    </div>

                    {/* Filters row - standalone buttons + drawer trigger */}
                    {(() => { const p = new URLSearchParams(location.search);
                      const hasCategory = !!(p.get('categoryName') || p.get('saleCategoryId'));
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
                            <FaSort aria-hidden="true" /> {sortOption ? `מיון לפי: ${SORT_OPTIONS[sortOption]}` : (t('searchResults.sort.title') || 'מיון')}
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
                            {(() => {
                              const isSale = Boolean(tempValues.saleCategoryId);
                              const saleName = isSale ? (tempValues.saleCategoryName || (saleCategoriesSmall.find(sc => sc._id === tempValues.saleCategoryId)?.name || '')) : '';
                              const label = isSale ? saleName : (tempValues.categoryName || '');
                              return `${t('advancedSearch.category.title')}${label ? `: ${label}` : ''}`;
                            })()}
                        </button>

                        {/* Services (business only) */}
                        {tempValues.categoryName && !tempValues.saleCategoryId && (
                          <button className={`chip-button${hasServices ? ' active' : ''}`} onClick={() => { if (!selectedCategoryId) { const found = categories.find(c=>c.name===tempValues.categoryName); setSelectedCategoryId(found?._id||''); } fetchServicesByCategoryId(selectedCategoryId || (categories.find(c=>c.name===tempValues.categoryName)?._id||'')); setDrawerMode('services'); setShowFiltersDrawer(true); setShowFilters(true); }} aria-expanded={showFiltersDrawer && drawerMode==='services'}>
                              {t('advancedSearch.services.title')}{tempValues.services?.length?` (${tempValues.services.length})`:''}
                           </button>
                        )}

                        {/* Sale subcategories chip (sale only) */}
                        {tempValues.saleCategoryId && (
                          <button className={`chip-button${(tempValues.saleSubcategoryIds && tempValues.saleSubcategoryIds.length>0) ? ' active' : ''}`} onClick={async () => { 
                              if (saleSubcategoriesSmall.length===0 && tempValues.saleCategoryId) {
                                try { const res = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/sale-subcategories/category/${tempValues.saleCategoryId}`); setSaleSubcategoriesSmall(res.data?.data?.subcategories || []);} catch {}
                              }
                              setDrawerMode('saleSubs'); setCategoryTab('sale'); setShowFiltersDrawer(true); setShowFilters(true); }} aria-expanded={showFiltersDrawer && drawerMode==='saleSubs'}>
                              {(t('advancedSearch.subcategories')==='advancedSearch.subcategories' ? 'תת קטגוריות' : t('advancedSearch.subcategories'))}{(tempValues.saleSubcategoryIds && tempValues.saleSubcategoryIds.length>0)?` (${tempValues.saleSubcategoryIds.length})`:''}
                           </button>
                        )}

                        {/* City */}
                        <button className={`chip-button${hasCity ? ' active' : ''}`} onClick={() => { setDrawerMode('city'); setShowFiltersDrawer(true); setShowFilters(true); }} aria-expanded={showFiltersDrawer && drawerMode==='city'}>
                            {t('advancedSearch.city')}{tempValues.city?`: ${tempValues.city}`:''}
                        </button>

                        {/* Price */}
                        <button className={`chip-button${hasPrice ? ' active' : ''}`} onClick={() => { setDrawerMode('price'); setShowFiltersDrawer(true); setShowFilters(true); }} aria-expanded={showFiltersDrawer && drawerMode==='price'}>
                            {t('advancedSearch.priceRange')}{(tempValues.priceMin||tempValues.priceMax)?`: ${tempValues.priceMin||0}-${tempValues.priceMax||MAX_PRICE}`:''}
                        </button>

                        {/* Distance */}
                        <button className={`chip-button${hasDistance ? ' active' : ''}`} onClick={() => { setDrawerMode('distance'); setShowFiltersDrawer(true); setShowFilters(true); }} aria-expanded={showFiltersDrawer && drawerMode==='distance'}>
                            {t('advancedSearch.distance.title')}{tempValues.maxDistance?`: ${tempValues.maxDistance} ${t('advancedSearch.distance.km')}`:''}
                        </button>

                        {/* Open Now quick toggle */}
                        <button className={`chip-button${hasOpenNow ? ' active' : ''}`} onClick={toggleOpenNow} aria-pressed={hasOpenNow}>
                            {t('advancedSearch.openNow')}
                        </button>

                        {/* Rating */}
                        <button className={`chip-button${hasRating ? ' active' : ''}`} onClick={() => { setDrawerMode('rating'); setShowFiltersDrawer(true); setShowFilters(true); }} aria-expanded={showFiltersDrawer && drawerMode==='rating'}>
                            {t('advancedSearch.rating.title')}{tempValues.rating?`: ${tempValues.rating}`:''}
                        </button>

                        {/* Clear all (global) */}
                        <button
                          className="chip-button danger"
                          onClick={() => {
                            setTempValues(v=>({ ...v, categoryName:'', services:[], city:'', cityLat: undefined, cityLng: undefined, priceMin:'', priceMax:'', priceMinN:0, priceMaxN:MAX_PRICE, maxDistance:0, rating:0, saleCategoryId:'', saleSubcategoryId:'', saleSubcategoryIds:[] }));
                            handleClearFilters();
                          }}
                          aria-label="clear all filters"
                        >
                          נקה הכל
                        </button>
                    </div>
                    ); })()}

                    {/* Drawer overlay */}
                    {showFiltersDrawer && (
                        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => { setShowFiltersDrawer(false); setShowFilters(false); }}>
                            {(() => { const compact = !['all','category','services','saleSubs'].includes(drawerMode); return (
                            <div
                                className={`modal-container suggest-modal ${!!compact ? 'compact' : ''}`}
                                style={{
                                    width: `${(() => {
                                        const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
                                        const isMobile = vw <= 640;
                                        const base = Math.min(containerRect.width, 720);
                                        const w = isMobile ? base : Math.max(480, Math.floor(base * 0.75));
                                        return w;
                                    })()}px`,
                                }}
                                onClick={(e)=>e.stopPropagation()}
                            >
                                <div className="modal-header">
                                    <button className="modal-close" aria-label={t('common.close')} onClick={() => { setShowFiltersDrawer(false); setShowFilters(false); }}>
                                        <FaTimes />
                                    </button>
                                    <h1 className="login-title suggest-modal-title">{
                                        drawerMode==='all' ? t('advancedSearch.title') :
                                        drawerMode==='category' ? t('advancedSearch.category.title') :
                                        drawerMode==='services' ? t('advancedSearch.services.title') :
                                        drawerMode==='city' ? (t('advancedSearch.city')||'City') :
                                        drawerMode==='price' ? (t('advancedSearch.priceRange')||'Price') :
                                        drawerMode==='distance' ? t('advancedSearch.distance.title') :
                                        drawerMode==='saleSubs' ? ((t('advancedSearch.subcategories')==='advancedSearch.subcategories' ? 'תת קטגוריות' : t('advancedSearch.subcategories'))) :
                                        t('advancedSearch.rating.title')
                                    }</h1>
                                    <button
                                      className="fd-clear"
                                      onClick={() => {
                                        // Clear current drawer values ONLY (לא סוגר חלון ולא שולח בקשה)
                                        if (drawerMode==='category') { setTempValues(v=>({ ...v, categoryName:'', services:[], saleCategoryId:'', saleCategoryName:'', saleSubcategoryId:'', saleSubcategoryIds:[] })); setSelectedCategoryId(''); return; }
                                        if (drawerMode==='services') { setTempValues(v=>({ ...v, services:[] })); return; }
                                        if (drawerMode==='city') { setTempValues(v=>({ ...v, city:'', cityLat: undefined, cityLng: undefined })); return; }
                                        if (drawerMode==='price') { setTempValues(v=>({ ...v, priceMin:'', priceMax:'', priceMinN:0, priceMaxN:MAX_PRICE })); return; }
                                        if (drawerMode==='distance') { setTempValues(v=>({ ...v, maxDistance:0 })); return; }
                                        if (drawerMode==='rating') { setTempValues(v=>({ ...v, rating:0 })); return; }
                                        if (drawerMode==='saleSubs') { setTempValues(v=>({ ...v, saleSubcategoryId:'', saleSubcategoryIds:[] })); return; }
                                        // all
                                        setTempValues(v=>({ ...v, categoryName:'', services:[], city:'', cityLat: undefined, cityLng: undefined, priceMin:'', priceMax:'', priceMinN:0, priceMaxN:MAX_PRICE, maxDistance:0, rating:0, saleCategoryId:'', saleCategoryName:'', saleSubcategoryId:'', saleSubcategoryIds:[] })); setSelectedCategoryId('');
                                      }}
                                    >{t('advancedSearch.buttons.clear')}</button>
                                </div>
                                <div className="fd-content" style={{ paddingBottom: compact ? 24 : 88 }}>
                                    {/* Category - tabs + lists */}
                                    {(drawerMode==='all' || drawerMode==='category') && (
                                      <div className="fd-card"><div className="fd-row">
                                        {drawerMode==='all' ? <label>{t('advancedSearch.category.title')}</label> : null}
                                        <div className="segmented-control" role="tablist" aria-label="category source selector" style={{ marginBottom: 8 }}>
                                          <button type="button" role="tab" aria-selected={categoryTab==='business'} className={`segment ${categoryTab==='business'?'active':''}`} onClick={()=>{ setCategoryTab('business'); }}>
                                            {t('advancedSearch.categories.business')||'עסקים'}
                                          </button>
                                          <button type="button" role="tab" aria-selected={categoryTab==='sale'} className={`segment ${categoryTab==='sale'?'active':''}`} onClick={()=>{ setCategoryTab('sale'); }}>
                                            {t('advancedSearch.categories.sale')||'מכירה'}
                                          </button>
                                        </div>
                                        {categoryTab==='business' ? (
                                          <>
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
                                                    setTempValues(v=>({ ...v, categoryName: nextName, services: [], saleCategoryId: '', saleCategoryName:'', saleSubcategoryId:'', saleSubcategoryIds:[] }));
                                                    setSelectedCategoryId(nextId);
                                                    await fetchServicesByCategoryId(nextId);
                                                  }}
                                                >{c.name}</button>
                                              ))}
                                            </div>
                                          </>
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
                                                    setTempValues(v=>({ ...v, saleCategoryName: nextName, saleCategoryId: nextId, saleSubcategoryId:'', saleSubcategoryIds:[] }));
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
                                          </>
                                        )}
                                      </div></div>
                                    )}
                                    {categoryTab==='sale' && Boolean(tempValues.saleCategoryId) && saleSubcategoriesSmall.length>0 && (
                                      <div className="fd-card"><div className="fd-row">
                                        <label>{t('advancedSearch.subcategories') || 'תת קטגוריות'}</label>
                                        <div className="tags-scroll">
                                          {saleSubcategoriesSmall.map(ssc => (
                                            <button
                                              key={`sale-sub-${ssc._id}`}
                                              type="button"
                                              className={`tag-chip ${Array.isArray(tempValues.saleSubcategoryIds) && tempValues.saleSubcategoryIds.includes(ssc._id)?'selected':''}`}
                                              onClick={() => {
                                                setTempValues(v=>{
                                                  const list = Array.isArray(v.saleSubcategoryIds) ? [...v.saleSubcategoryIds] : [];
                                                  const idx = list.indexOf(ssc._id);
                                                  if (idx>=0) { list.splice(idx,1); } else { list.push(ssc._id); }
                                                  return { ...v, saleSubcategoryIds: list };
                                                });
                                              }}
                                            >{ssc.name}</button>
                                          ))}
                                        </div>
                                      </div></div>
                                    )}
                                    {/* Services */}
                                    {(drawerMode==='all' || drawerMode==='services') && services.length>0 && categoryTab==='business' && (
                                        <div className="fd-card"><div className="fd-row">
                                            {drawerMode==='all' ? <label>{t('advancedSearch.services.title')}</label> : null}
                                            <div className="tags-scroll">
                                                {services.map(s => (
                                                    <button
                                                      key={s._id}
                                                      type="button"
                                                      className={`tag-chip ${tempValues.services.includes(s.name)?'selected':''}`}
                                                      onClick={() => {
                                                        setTempValues(v => {
                                                          const exists = v.services.includes(s.name);
                                                          const next = exists ? v.services.filter(x=>x!==s.name) : [...v.services, s.name];
                                                          return { ...v, services: next };
                                                        });
                                                      }}
                                                    >{s.name}</button>
                                                ))}
                                            </div>
                                        </div></div>
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
                                    <div className="fd-card"><div className="fd-row">
                                        {drawerMode==='all' ? <label>{t('advancedSearch.city')}</label> : null}
                                        {mapsLoaded ? (
                                            <Autocomplete
                                                onLoad={(ac)=>{ cityAutoRef.current = ac; }}
                                                onPlaceChanged={()=>{
                                                    const place = cityAutoRef.current?.getPlace();
                                                    if (!place) return;
                                                    // Prefer structured city from address_components to avoid ", ישראל"
                                                    const comps = Array.isArray(place.address_components) ? place.address_components : [];
                                                    const findByType = (types) => {
                                                        for (const c of comps) {
                                                            const t = c.types || [];
                                                            if (types.some(tt => t.includes(tt))) {
                                                                return c.long_name || c.short_name || '';
                                                            }
                                                        }
                                                        return '';
                                                    };
                                                    let cityOnly = findByType(['locality']) || findByType(['postal_town']) || '';
                                                    if (!cityOnly) {
                                                        cityOnly = place.name || '';
                                                    }
                                                    const inputVal = cityOnly;
                                                    const geom = place.geometry && place.geometry.location ? place.geometry.location : null;
                                                    const lat = geom && typeof geom.lat === 'function' ? geom.lat() : undefined;
                                                    const lng = geom && typeof geom.lng === 'function' ? geom.lng() : undefined;
                                                    setTempValues(v=>({ ...v, city: inputVal, cityLat: lat, cityLng: lng }));
                                                }}
                                                options={{ types: ['(cities)'], componentRestrictions: { country: 'il' } }}
                                            >
                                                <input className="mini-input full" type="text" value={tempValues.city} onChange={(e)=>setTempValues(v=>({...v, city:e.target.value}))} placeholder={t('advancedSearch.cityPlaceholder')||''} />
                                            </Autocomplete>
                                        ) : (
                                            <input className="mini-input full" type="text" value={tempValues.city} onChange={(e)=>setTempValues(v=>({...v, city:e.target.value}))} />
                                        )}
                                    </div></div>
                                    )}

                                    {(drawerMode==='all' || drawerMode==='price') && (
                                      <div className="fd-card">
                                        <div className="fd-row"><label>{t('advancedSearch.priceRange') || 'מחיר'}</label></div>
                                        <div className="fd-row two">
                                          <div>
                                            <label>{t('advancedSearch.min')}</label>
                                            <input className="mini-input full" type="number" min="0" placeholder={t('advancedSearch.min')} value={tempValues.priceMin} onChange={(e)=>setTempValues(v=>({...v, priceMin:e.target.value}))} />
                                          </div>
                                          <div>
                                            <label>{t('advancedSearch.max')}</label>
                                            <input className="mini-input full" type="number" min="0" placeholder={t('advancedSearch.max')} value={tempValues.priceMax} onChange={(e)=>setTempValues(v=>({...v, priceMax:e.target.value}))} />
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Distance */}
                                    {(drawerMode==='all' || drawerMode==='distance') && (
                                    <div className="fd-card"><div className="fd-row">
                                        {drawerMode==='all' ? <label>{t('advancedSearch.distance.title')}</label> : null}
                                        <input className="mini-range full" type="range" min="0" max="1000" step="1" value={tempValues.maxDistance} onChange={(e)=>setTempValues(v=>({...v, maxDistance:Number(e.target.value)}))} />
                                        <div className="range-value">{tempValues.maxDistance} {t('advancedSearch.distance.km')}</div>
                                    </div></div>
                                    )}

                                    {/* Open now - show only in all mode to avoid confusion; quick toggle chip handles single */}
                                    {drawerMode==='all' && (
                                    <div className="fd-card"><div className="fd-row">
                                        <label className="inline">
                                            <input type="checkbox" checked={new URLSearchParams(location.search).has('openNow')} onChange={toggleOpenNow} /> {t('advancedSearch.openNow')}
                                        </label>
                                    </div></div>
                                    )}

                                    {/* Rating */}
                                    {(drawerMode==='all' || drawerMode==='rating') && (
                                    <div className="fd-card"><div className="fd-row">
                                        {drawerMode==='all' ? <label>{t('advancedSearch.rating.title')}</label> : null}
                                        <div className="stars-inline">
                                            {[1,2,3,4,5].map(st => (
                                                <FaStar key={st} className={`rating-star ${tempValues.rating>=st?'active':''}`} onClick={()=>setTempValues(v=>({...v, rating: v.rating===st?0:st}))} />
                                            ))}
                                        </div>
                                    </div></div>
                                    )}
                                </div>
                                <div className="fd-footer">
                                    <button className="submit-button" onClick={() => {
                                        if (drawerMode==='category') { 
                                          const isBiz = (categoryTab==='business');
                                          const payload = {
                                            categoryName: isBiz ? (tempValues.categoryName || '') : '',
                                            services: isBiz ? (tempValues.services||[]) : [],
                                            saleCategoryId: !isBiz ? (tempValues.saleCategoryId || '') : '',
                                            saleSubcategoryId: !isBiz ? (Array.isArray(tempValues.saleSubcategoryIds)? tempValues.saleSubcategoryIds : (tempValues.saleSubcategoryId? [tempValues.saleSubcategoryId] : [])) : ''
                                          };
                                          handleApplyMulti(payload); 
                                          return; 
                                        }
                                        if (drawerMode==='services') { handleApplyMulti({ services: tempValues.services }); return; }
                                        if (drawerMode==='saleSubs') { handleApplyMulti({ saleSubcategoryId: Array.isArray(tempValues.saleSubcategoryIds)? tempValues.saleSubcategoryIds : (tempValues.saleSubcategoryId? [tempValues.saleSubcategoryId] : []) }); return; }
                                        // city handling below (no default 10km)
                                        if (drawerMode==='city') {
                                          const updates = { city: tempValues.city };
                                          // הוסף lat/lng רק אם המשתמש הגדיר מרחק או מיון לפי מרחק
                                          const params = new URLSearchParams(location.search);
                                          const sort = params.get('sort') || 'rating';
                                          const wantsDistance = (Number(tempValues.maxDistance) > 0) || (sort === 'distance' || sort === 'popular_nearby');
                                          if (wantsDistance && tempValues.cityLat !== undefined && tempValues.cityLng !== undefined) {
                                            updates.lat = tempValues.cityLat;
                                            updates.lng = tempValues.cityLng;
                                            if (Number(tempValues.maxDistance) > 0) {
                                              updates.maxDistance = String(tempValues.maxDistance);
                                            } else {
                                              // אל תגדיר ברירת מחדל 10 ק״מ; המשתמש יבחר אם צריך
                                              params.delete('maxDistance');
                                            }
                                          } else {
                                            // הסר פרמטרי מרחק אם היו קיימים
                                            params.delete('lat'); params.delete('lng'); params.delete('maxDistance');
                                          }
                                          handleApplyMulti(updates);
                                          return;
                                        }
                                        if (drawerMode==='price') { handleApplyMulti({ priceMin: tempValues.priceMin || '', priceMax: tempValues.priceMax || '' }); return; }
                                        if (drawerMode==='distance') { handleApplyMulti({ maxDistance: tempValues.maxDistance || '' }); return; }
                                        if (drawerMode==='rating') { handleApplyMulti({ rating: tempValues.rating || '' }); return; }
                                        if (drawerMode==='sort') { handleApplyMulti({ sort: tempSort==='rating' ? 'rating' : tempSort }); return; }
                                        handleApplyMulti({ categoryName: tempValues.categoryName, services: tempValues.services, city: tempValues.city, priceMin: tempValues.priceMinN>0 ? String(tempValues.priceMinN) : '', priceMax: tempValues.priceMaxN<MAX_PRICE ? String(tempValues.priceMaxN) : '', maxDistance: tempValues.maxDistance || '', rating: tempValues.rating || '', lat: (tempValues.cityLat !== undefined ? tempValues.cityLat : undefined), lng: (tempValues.cityLng !== undefined ? tempValues.cityLng : undefined) });
                                    }}>{t('advancedSearch.buttons.apply')}</button>
                                </div>
                            </div>
                            ); })()}
                        </div>
                    )}
                </div>

                {(sortOption === 'distance' || sortOption === 'popular_nearby') && !userLocation && !locationError && (
                    <div style={{ color: 'gray', margin: '1rem 0', textAlign: 'center' }}>{t('searchResults.loadingLocation')}</div>
                )}
                {locationError && (sortOption === 'distance' || sortOption === 'popular_nearby') && (
                    <div style={{ color: 'red', margin: '1rem 0', textAlign: 'center' }}>{locationError}</div>
                )}

                {/* Active filters chips removed in favor of showing values inside filter buttons */}

                {/* View mode switcher - always visible under filters */}
                {activeTab==='promo' && (
                  <div className="promo-view-switch" aria-label={t('searchResults.filters.toolbar') || 'סרגל תצוגה'}>
                    <div className="results-view-switch" role="group" aria-label="view switcher">
                      <button type="button" className={`rvs-btn ${viewMode==='grid'?'active':''}`} onClick={()=>setViewMode('grid')} aria-pressed={viewMode==='grid'} title="Grid">▦</button>
                      <button type="button" className={`rvs-btn ${viewMode==='carousel'?'active':''}`} onClick={()=>setViewMode('carousel')} aria-pressed={viewMode==='carousel'} title="Carousel">❚►</button>
                    </div>
                  </div>
                )}

                {/* Tabs removed in favor of type pills above */}

                {/* Results */}
                <div className={`search-results-layout ${viewMode==='carousel' ? 'as-carousel' : ''}`}>
                    {viewMode==='carousel' && activeTab==='promo' ? (
                      (() => {
                        const images = queryFilteredPromoAds
                          .filter(a => !!a?.image)
                          .map(a => `${process.env.REACT_APP_API_DOMAIN}/uploads/${String(a.image).split('/').pop()}`);
                        if (images.length === 0) return <div className="no-results" style={{textAlign:'center'}}>{t('search.noResults')||'לא נמצאו תוצאות'}</div>;
                        return <PromoBanner images={images} autoPlayInterval={5000} />;
                      })()
                    ) : viewMode==='carousel' && activeTab==='sale' ? (
                      <div className="carousel-track">
                        {queryFilteredSaleAds.filter(ad => Array.isArray(ad?.images) && ad.images.length > 0).map((ad, index)=> (
                          <div key={ad._id} className="carousel-item" ref={index === (queryFilteredSaleAds.length - 1) ? lastItemRef : undefined}>
                            <SaleAdCard ad={ad} />
                          </div>
                        ))}
                      </div>
                    ) : (
                    <div className="business-cards-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`, gap: 16 }}>
                        {activeTab === 'business' && !isLoadingCurrent && queryFilteredBusinesses.length === 0 && (
                          <div className="no-results" style={{textAlign:'center', gridColumn: '1 / -1'}}>{t('search.noResults')||'לא נמצאו תוצאות'}</div>
                        )}
                        {activeTab === 'business' && queryFilteredBusinesses.map((business, index) => (
                            <div key={business._id} ref={index === queryFilteredBusinesses.length - 1 ? lastItemRef : undefined}>
                                <BusinessCard business={business} />
                            </div>
                        ))}

                        {activeTab === 'sale' && !isLoadingCurrent && queryFilteredSaleAds.length === 0 && (
                          <div className="no-results" style={{textAlign:'center', gridColumn: '1 / -1'}}>{t('search.noResults')||'לא נמצאו תוצאות'}</div>
                        )}
                        {activeTab === 'sale' && queryFilteredSaleAds.map((ad, index) => (
                            <div key={ad._id} ref={index === queryFilteredSaleAds.length - 1 ? lastItemRef : undefined}>
                                <SaleAdCard ad={ad} />
                            </div>
                        ))}

                        {activeTab === 'promo' && !isLoadingCurrent && queryFilteredPromoAds.length === 0 && (
                          <div className="no-results" style={{textAlign:'center', gridColumn: '1 / -1'}}>{t('search.noResults')||'לא נמצאו תוצאות'}</div>
                        )}
                        {activeTab === 'promo' && queryFilteredPromoAds.map((ad, index) => (
                            <div key={ad._id} ref={index === queryFilteredPromoAds.length - 1 ? lastItemRef : undefined}>
                                <PromoAdCard ad={ad} />
                            </div>
                        ))}

                        {activeTab === 'all' && (
                          (isLoadingUnifiedActual && unifiedPage === 1)
                            ? Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
                                <div key={`skeleton-${idx}`} className="animate-pulse rounded-lg bg-gray-200 h-40" />
                              ))
                            : (unifiedItems.length === 0
                                ? <div className="no-results" style={{textAlign:'center', gridColumn: '1 / -1'}}>{t('search.noResults')||'לא נמצאו תוצאות'}</div>
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
                              )
                        )}
                    </div>
                    )}
                </div>

                {/* Loader */}
                {isLoadingCurrent && (
                    <div className="loader-container">
                        <div className="loader"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResultPage;