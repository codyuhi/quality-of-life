import React from 'react';
import '../App.css';

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
    const toggleMobileNav = () => {
        if (searchHistoryOpen) {
            updateSearchHistoryOpen(false);
        }
        const mobileNavButton = document.getElementById('Mobile-Nav-Button');
        if (mobileNavButton) {
            mobileNavButton.classList.toggle('open');
        }
        const navbarMobileSearchDropdown = document.getElementById('Navbar-Mobile-Search-Dropdown');
        if (navbarMobileSearchDropdown) {
            navbarMobileSearchDropdown.classList.toggle('open');
        }
    };

    const setSearchTerm = (e) => {
        updateSearchTerm(e.target.value);
    };

    const checkEnterPressed = (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            search();
            toggleMobileNav();
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
        toggleMobileNav();
    };

    const mobileSearchHistory = () => {
        updateSearchHistory();
        toggleMobileNav();
    };

    const mobileSearch = () => {
        search();
        toggleMobileNav();
    };

    return (
        <div className="Navbar-Container">
            <div className="Navbar center">
                <div className="Navbar-Left-Aligned-Items">
                    <h1 onClick={clearCurrentSearch} className="Navbar-Title">
                        <i className="fa fa-heartbeat"></i> Quality Of Life
                    </h1>
                </div>
                <div className="Navbar-Mobile-Search">
                    <div id="Mobile-Nav-Button" className="closed" onClick={toggleMobileNav}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <div id="Navbar-Mobile-Search-Dropdown" className="closed">
                        <span onClick={mobileClearSearch}>Clear Current Search</span>
                        <hr />
                        <span onClick={mobileSearchHistory}>Search History</span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={setSearchTerm}
                            onKeyDown={checkEnterPressed}
                            placeholder="Search"
                        />
                        <button onClick={mobileSearch}>Search</button>
                    </div>
                </div>
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
            </div>
        </div>
    );
}