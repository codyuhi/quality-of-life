import React from 'react';
import 'App.css';

export default class Navbar extends React.Component {
    toggleMobileNav = () => {
        if (this.props.searchHistoryOpen) {
            this.props.updateSearchHistoryOpen((open) => false);
        }
        const mobileNavButton = document.getElementById('Mobile-Nav-Button');
        mobileNavButton.classList.toggle('open');
        mobileNavButton.classList.toggle('closed');
        const navbarMobileSearchDropdown = document.getElementById('Navbar-Mobile-Search-Dropdown');
        navbarMobileSearchDropdown.classList.toggle('open');
        navbarMobileSearchDropdown.classList.toggle('closed');
    }
    setSearchTerm = (e) => {
        this.props.updateSearchTerm((searchTerm) => e.target.value)
    }
    checkEnterPressed = (e) => {
        if (e.keyCode === 13) {
            this.props.search()
            this.toggleMobileNav()
        }
    }
    clearCurrentSearch = () => {
        this.props.updateSearchTerm((searchTerm) => '');
        this.props.updateCityList((cityList) => null);
        this.props.updateActiveCity((activeCity) => null);
        this.props.updateCityImg((cityImg) => null);
        this.props.updateAdvancedCityData((advancedCityData) => null);
    }
    updateSearchHistory = () => {
        this.props.updateSearchHistoryOpen((open) => !this.props.searchHistoryOpen)
    }
    mobileClearSearch = () => {
        this.clearCurrentSearch();
        this.toggleMobileNav();
    }
    mobileSearchHistory = () => {
        this.updateSearchHistory()
        this.toggleMobileNav()
    }
    mobileSearch = (e) => {
        this.setSearchTerm(e)
        this.props.search()
        this.toggleMobileNav()
    }
    render() {
        return (
            <div className="Navbar-Container">
                <div className="Navbar center">
                    <div className="Navbar-Left-Aligned-Items">
                        <h1 onClick={this.clearCurrentSearch} className="Navbar-Title"><i className="fa fa-heartbeat"></i> Quality Of Life</h1>
                    </div>
                    <div className="Navbar-Mobile-Search">
                        <div id="Mobile-Nav-Button" onClick={this.toggleMobileNav}>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <div id="Navbar-Mobile-Search-Dropdown" className="closed">
                            <span onClick={this.mobileClearSearch}>Clear Current Search</span>
                            <hr />
                            <span onClick={this.mobileSearchHistory}>Search History</span>
                            <input type='text' value={this.props.searchTerm} onChange={this.setSearchTerm} onKeyDown={this.checkEnterPressed} placeholder="Search"></input>
                            <button onClick={this.mobileSearch}>Search</button>
                        </div>
                    </div>
                    <div className="Navbar-Search">
                        <span onClick={this.clearCurrentSearch}>Clear Current Search</span>
                        <p>|</p>
                        <span onClick={this.updateSearchHistory}>Search History</span>
                        <input type='text' value={this.props.searchTerm} onChange={this.setSearchTerm} onKeyDown={this.checkEnterPressed} placeholder="Search"></input>
                        <button onClick={this.props.search}>Search</button>
                    </div>
                </div>
            </div>
        )
    }
}