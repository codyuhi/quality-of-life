import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import 'App.css';
import Navbar from 'components/Navbar';
import Sidebar from 'components/Sidebar';
import Content from 'components/Content';

function App() {
    const [searchTerm, setSearchTerm] = useState('')
    const [searchHistory, setSearchHistory] = useState([])
    const [searchHistoryOpen, toggleSearchHistory] = useState(false)
    const [cityList, setCityList] = useState(null)
    const [activeCity, setActiveCity] = useState(null)
    const [advancedCityData, setAdvancedCityData] = useState(null)
    const [urbanCityDetails, setUrbanCityDetails] = useState(null)
    const [cityImg, setCityImg] = useState(null)
    const [activeError, setActiveError] = useState('')
    const [suggestedCities, setSuggestedCities] = useState([])
    const [citiesPagination, setCitiesPagination] = useState(null)
    const [citiesLoading, setCitiesLoading] = useState(false)
    const [userLocation, setUserLocation] = useState(null)
    const [locationStatus, setLocationStatus] = useState('prompting')

    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const fetchSuggestedCities = (page = 1, coords = userLocation) => {
        setCitiesLoading(true);
        const API_BASE_URL = process.env.REACT_APP_API_URL !== undefined
            ? process.env.REACT_APP_API_URL
            : (process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : '');

        let url = `${API_BASE_URL}/api/cities?page=${page}&limit=12`;
        if (coords && coords.lat != null && coords.lon != null) {
            url += `&lat=${coords.lat}&lon=${coords.lon}`;
        }

        axios.get(url)
            .then((response) => {
                if (!isMountedRef.current) return;
                if (response.data && response.data.cities) {
                    setSuggestedCities(response.data.cities);
                    setCitiesPagination(response.data.pagination);
                }
                setCitiesLoading(false);
            })
            .catch((err) => {
                if (!isMountedRef.current) return;
                console.error('Error fetching suggested cities:', err);
                setCitiesLoading(false);
            });
    };

    useEffect(() => {
        if (localStorage.history) {
            setSearchHistory(() => JSON.parse(localStorage.history))
        }

        if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords = {
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude
                    };
                    setUserLocation(coords);
                    setLocationStatus('granted');
                    fetchSuggestedCities(1, coords);
                },
                (err) => {
                    console.warn('Geolocation denied or unavailable:', err.message);
                    setLocationStatus('denied');
                    fetchSuggestedCities(1, null);
                },
                { timeout: 6000, enableHighAccuracy: false }
            );
        } else {
            setLocationStatus('unavailable');
            fetchSuggestedCities(1, null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handlePageChange = (newPage) => {
        fetchSuggestedCities(newPage, userLocation);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Heartbeat to keep backend alive under Sablier when tab is open (every 10 minutes)
    useEffect(() => {
        const HEARTBEAT_INTERVAL_MS = 10 * 60 * 1000;
        let lastHeartbeat = Date.now();
        const API_BASE_URL = process.env.REACT_APP_API_URL !== undefined
            ? process.env.REACT_APP_API_URL
            : (process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : '');

        const sendHeartbeat = () => {
            fetch(`${API_BASE_URL}/healthz`, { method: 'GET', cache: 'no-store' })
                .then(() => {
                    lastHeartbeat = Date.now();
                })
                .catch(() => {});
        };

        const intervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && Date.now() - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
                sendHeartbeat();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const search = (term) => {
        const queryTerm = typeof term === 'string' ? term : searchTerm;
        if (!queryTerm) {
            return;
        }
        setActiveCity(null)
        const API_BASE_URL = process.env.REACT_APP_API_URL !== undefined
            ? process.env.REACT_APP_API_URL
            : (process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : '');
        axios.get(`${API_BASE_URL}/api/cities/?search=${encodeURIComponent(queryTerm)}`)
            .then((response) => {
                return response.data;
            })
            .then((data) => {
                if (data.count < 1) {
                    throw Error(`No cities found with the name "${queryTerm}"`)
                }
                const history = localStorage.history ? JSON.parse(localStorage.history) : [];
                if (history.includes(queryTerm)) {
                    history.splice(history.indexOf(queryTerm), 1);
                }
                history.push(queryTerm);
                localStorage.history = JSON.stringify(history);
                setSearchHistory(history);
                setCityList(data);
                setActiveError('');
            })
            .catch((err) => {
                const error = err;
                console.error(error);
                setActiveError(typeof (error) === 'string' ? error : error.toString());
            })
    }

    const getCityInfo = (cityUrl) => {
        axios.get(cityUrl)
            .then((response) => {
                return response.data;
            })
            .then((data) => {
                setActiveCity(data);
                if (data._links && data._links['city:urban_area']) {
                    const urbanAreaHref = data._links['city:urban_area'].href;
                    getCityImg(urbanAreaHref);
                    getAdvancedCityInfo(urbanAreaHref);
                    getUrbanCityDetails(urbanAreaHref);
                }
            })
            .catch((err) => {
                const error = err;
                console.error(error);
                setActiveError(typeof (error) === 'string' ? error : error.toString());
            })
    }

    const getAdvancedCityInfo = (urbanAreaUrl) => {
        const url = urbanAreaUrl.endsWith('/') ? `${urbanAreaUrl}scores` : `${urbanAreaUrl}/scores`;
        axios.get(url)
            .then((response) => {
                return response.data;
            })
            .then((data) => {
                setAdvancedCityData(data)
            })
            .catch((err) => {
                const error = err;
                console.error(error);
                setActiveError(typeof (error) === 'string' ? error : error.toString());
            })
    }

    const getUrbanCityDetails = (urbanAreaUrl) => {
        const url = urbanAreaUrl.endsWith('/') ? `${urbanAreaUrl}details` : `${urbanAreaUrl}/details`;
        axios.get(url)
            .then((response) => {
                return response.data;
            })
            .then((data) => {
                setUrbanCityDetails(data);
            })
            .catch((err) => {
                const error = err;
                console.error(error);
                setActiveError(typeof (error) === 'string' ? error : error.toString())
            })
    }

    const getCityImg = (urbanAreaUrl) => {
        const url = urbanAreaUrl.endsWith('/') ? `${urbanAreaUrl}images` : `${urbanAreaUrl}/images`;
        axios.get(url)
            .then((response) => {
                return response.data;
            })
            .then((data) => {
                setCityImg(data)
            })
            .catch((err) => {
                const error = err;
                console.error(error);
                setActiveError(typeof (error) === 'string' ? error : error.toString());
            })
    }

    return (
        <div className="App">
            <Navbar
                updateSearchTerm={setSearchTerm}
                searchHistoryOpen={searchHistoryOpen}
                updateSearchHistoryOpen={toggleSearchHistory}
                updateCityList={setCityList}
                updateActiveCity={setActiveCity}
                updateCityImg={setCityImg}
                updateAdvancedCityData={setAdvancedCityData}
                searchTerm={searchTerm}
                search={search}
            />
            <Sidebar
                searchHistory={searchHistory}
                clearSearchHistory={setSearchHistory}
                updateSearchHistoryOpen={toggleSearchHistory}
                searchHistoryOpen={searchHistoryOpen}
                search={search}
                updateSearchTerm={setSearchTerm}
            />
            <Content
                updateSearchTerm={setSearchTerm}
                searchTerm={searchTerm}
                search={search}
                cityList={cityList}
                getCityInfo={getCityInfo}
                activeCity={activeCity}
                updateActiveCity={setActiveCity}
                urbanCityDetails={urbanCityDetails}
                cityImg={cityImg}
                advancedCityData={advancedCityData}
                activeError={activeError}
                suggestedCities={suggestedCities}
                citiesPagination={citiesPagination}
                citiesLoading={citiesLoading}
                locationStatus={locationStatus}
                onPageChange={handlePageChange}
            />
        </div>
    );
}

export default App;