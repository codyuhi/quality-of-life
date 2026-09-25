import React, { useState } from 'react';
import '../App.css';
import ThemeToggle from 'components/ThemeToggle';

export default function Navbar({
    searchHistoryOpen,
    updateSearchHistoryOpen,
    updateSearchTerm,
    updateCityList,
    updateActiveCity,
    updateCityImg,
    updateAdvancedCityData,
    search,
    searchTerm
}) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const toggleMobileNav = () => {
        if (searchHistoryOpen) {
            updateSearchHistoryOpen(false);
        }
        setMobileNavOpen(!mobileNavOpen);
    };

    const setSearchTerm = (e) => {
        updateSearchTerm(e.target.value);
    };

    const checkEnterPressed = (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            search();
            setMobileNavOpen(false);
        }
    };

    const clearCurrentSearch = () => {
        updateSearchTerm('');
        updateCityList(null);
        updateActiveCity(null);
        updateCityImg(null);
        updateAdvancedCityData(null);
    };

    const updateSearchHistory = () => {
        updateSearchHistoryOpen(!searchHistoryOpen);
    };

    const mobileClearSearch = () => {
        clearCurrentSearch();
        setMobileNavOpen(false);
    };

    const mobileSearchHistory = () => {
        updateSearchHistory();
        setMobileNavOpen(false);
    };

    const mobileSearch = () => {
        search();
        setMobileNavOpen(false);
    };

    return (
        <div className="Navbar-Container">
            <div className="Navbar center">
                <div className="Navbar-Left-Aligned-Items">
                    <h1 onClick={clearCurrentSearch} className="Navbar-Title">
                        <i className="fa fa-heartbeat"></i> Quality Of Life
                    </h1>
                </div>
                <div className="Navbar-Right-Aligned-Items">
                    <div className="Navbar-Search">
                        <span onClick={clearCurrentSearch}>Clear Current Search</span>
                        <p>|</p>
                        <span onClick={updateSearchHistory}>Search History</span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={setSearchTerm}
                            onKeyDown={checkEnterPressed}
                            placeholder="Search"
                        />
                        <button onClick={search}>Search</button>
                    </div>
                    <ThemeToggle />
                    <div className="Navbar-Mobile-Search">
                        <button 
                            id="Mobile-Nav-Button" 
                            className={mobileNavOpen ? 'open' : 'closed'} 
                            onClick={toggleMobileNav}
                            aria-label="Toggle mobile menu"
                            type="button"
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                        <div id="Navbar-Mobile-Search-Dropdown" className={mobileNavOpen ? 'open' : 'closed'}>
                            <span onClick={mobileClearSearch}>Clear Current Search</span>
                            <hr />
                            <span onClick={mobileSearchHistory}>Search History</span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={setSearchTerm}
                                onKeyDown={checkEnterPressed}
                                placeholder="Search city..."
                            />
                            <button onClick={mobileSearch}>Search</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}