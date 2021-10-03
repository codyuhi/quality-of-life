import { useState, useEffect } from 'react'
import axios from 'axios'
import 'App.css';
import Navbar from 'components/Navbar';
import Sidebar from 'components/Sidebar';
import Content from 'components/Content';
import Footer from 'components/Footer';

function App() {
    const [searchTerm, setSearchTerm] = useState('')
    const [searchHistory, setSearchHistory] = useState([])
    const [searchHistoryOpen, toggleSearchHistory] = useState(false)
    const [cityList, setCityList] = useState(null)
    const [activeCity, setActiveCity] = useState(null)
    const [advancedCityData, setAdvancedCityData] = useState(null)
    const [cityImg, setCityImg] = useState(null)

    useEffect(() => {
        if (localStorage.history) {
            setSearchHistory(() => JSON.parse(localStorage.history))
        }
    }, [])

    const search = () => {
        if (!searchTerm) {
            return;
        }
        axios.get(`https://api.teleport.org/api/cities/?search=${searchTerm}`)
            .then((response) => {
                return response.data;
            })
            .then((data) => {
                if (data.count < 1) {
                    throw Error(`No cities found with the name "${searchTerm}"`)
                }
                const history = localStorage.history ? JSON.parse(localStorage.history) : [];
                if (history.includes(searchTerm)) {
                    history.splice(history.indexOf(searchTerm), 1);
                }
                history.push(searchTerm);
                localStorage.history = JSON.stringify(history);
                setSearchHistory(history);
                setCityList(data);
            })
            .catch((err) => {
                console.error(err);
            })
    }

    const getCityInfo = (cityUrl) => {
        axios.get(cityUrl)
            .then((response) => {
                return response.data;
            })
            .then((data) => {
                setActiveCity(data);
                if (data._links['city:urban_area']) {
                    getCityImg(data._links['city:urban_area'].href)
                    getAdvancedCityInfo(data._links['city:urban_area'].href)
                }
            })
            .catch((err) => {
                console.error(err);
            })
    }

    const getAdvancedCityInfo = (urbanAreaUrl) => {
        axios.get(urbanAreaUrl + 'scores')
            .then((response) => {
                return response.data;
            })
            .then((data) => {
                setAdvancedCityData(data)
            })
            .catch((err) => {
                console.error(err);
            })
    }

    const getCityImg = (urbanAreaUrl) => {
        axios.get(urbanAreaUrl + 'images')
            .then((response) => {
                return response.data;
            })
            .then((data) => {
                setCityImg(data)
            })
            .catch((err) => {
                console.error(err);
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
                cityImg={cityImg}
                advancedCityData={advancedCityData}
            />
            <Footer />
        </div>
    );
}

export default App;