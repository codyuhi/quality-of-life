import React from 'react';
import 'App.css';

export default class Navbar extends React.Component {
    toggleMobileNav = () => {
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
    clearCurrentSearch = () => {
        this.props.updateSearchTerm((searchTerm) => '');
        this.props.updateCityList((cityList) => null);
        this.props.updateActiveCity((activeCity) => null);
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
                            <span onClick={this.clearCurrentSearch}>Clear Current Search</span>
                            <hr />
                            <span>Search History</span>
                            <input type='text' value={this.props.searchTerm} onChange={this.setSearchTerm} placeholder="Search"></input>
                            <button onClick={this.setSearchTerm}>Search</button>
                        </div>
                    </div>
                    <div className="Navbar-Search">
                        <span onClick={this.clearCurrentSearch}>Clear Current Search</span>
                        <p>|</p>
                        <span>Search History</span>
                        <input type='text' value={this.props.searchTerm} onChange={this.setSearchTerm} placeholder="Search"></input>
                        <button onClick={this.props.search}>Search</button>
                    </div>
                </div>
            </div>
        )
    }
}