import { useState, useEffect } from 'react'
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

    useEffect(() => {
        if (localStorage.history) {
            setSearchHistory(() => JSON.parse(localStorage.history))
        }
    }, [])

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
                urbanCityDetails={urbanCityDetails}
                cityImg={cityImg}
                advancedCityData={advancedCityData}
                activeError={activeError}
            />
        </div>
    );
}

export default App;