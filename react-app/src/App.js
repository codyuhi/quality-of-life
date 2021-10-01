import { useState } from 'react'
import axios from 'axios'
import 'App.css';
import Navbar from 'components/Navbar';
import Sidebar from 'components/Sidebar';
import Content from 'components/Content';
import Footer from 'components/Footer';

function App() {
    const [searchTerm, setSearchTerm] = useState('')
    const [cityList, setCityList] = useState(null)
    const [activeCity, setActiveCity] = useState(null)

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
            })
            .catch((err) => {
                console.error(err);
            })
    }

    return (
        <div className="App">
            <Navbar
                updateSearchTerm={setSearchTerm}
                updateCityList={setCityList}
                updateActiveCity={setActiveCity}
                searchTerm={searchTerm}
                search={search}
            />
            <Sidebar />
            <Content
                updateSearchTerm={setSearchTerm}
                searchTerm={searchTerm}
                search={search}
                cityList={cityList}
                getCityInfo={getCityInfo}
                activeCity={activeCity}
            />
            <Footer />
        </div>
    );
}

export default App;