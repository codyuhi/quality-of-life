import React, { useRef } from 'react';
import '../App.css';

export default function Content({
    updateSearchTerm,
    searchTerm,
    search,
    cityList,
    getCityInfo,
    activeCity,
    updateActiveCity,
    urbanCityDetails,
    cityImg,
    advancedCityData,
    activeError
}) {
    const cityIndexRef = useRef(-1);

    const setSearchTerm = (e) => {
        updateSearchTerm(e.target.value);
    };

    const checkEnterPressed = (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            search();
        }
    };

    const handleCityClick = (index) => {
        cityIndexRef.current = index;
        const href = cityList._embedded['city:search-results'][index]._links['city:item'].href;
        getCityInfo(href);
    };

    const generateRating = (number) => {
        const percentage = Math.min(100, Math.max(0, number * 10));
        let color = 'var(--accent-pink)';
        if (number >= 7.5) {
            color = 'var(--accent-cyan)';
        } else if (number >= 5.0) {
            color = 'var(--accent-blue)';
        }
        return (
            <div className="Score-Bar-Container">
                <div className="Score-Bar-Header">
                    <span className="Score-Bar-Value">{number.toFixed(1)} / 10</span>
                </div>
                <div className="Score-Bar-Track">
                    <div className="Score-Bar-Fill" style={{ width: `${percentage}%`, background: color }}></div>
                </div>
            </div>
        );
    };

    const hero = (
        <div className="Hero-Container glass-panel">
            <h1><i className="fa fa-heartbeat"> </i> Quality of Life</h1>
            <p>Compare cost of living, safety, healthcare, and quality of life metrics across 260+ major cities globally.</p>
            <div className="Hero-Search-Form">
                <input
                    autoFocus
                    type="text"
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Enter city name..."
                    onKeyDown={checkEnterPressed}
                    aria-label="City name"
                />
                <button type="button" onClick={() => search()}>Search Cities</button>
            </div>
        </div>
    );

    const cityListDivs = [];
    if (cityList && cityList._embedded && cityList._embedded['city:search-results']) {
        cityList._embedded['city:search-results'].forEach((item, i) => {
            cityListDivs.push(
                <div key={'city-list-' + i} className="City-List-Item" onClick={() => handleCityClick(i)} role="button" tabIndex={0}>
                    <span className="City-Item-Name">{item.matching_full_name}</span>
                    <i className="fa fa-chevron-right" style={{ color: 'var(--accent-cyan)', fontSize: '14px', flexShrink: 0, marginLeft: '8px' }}></i>
                </div>
            );
        });
    }

    const cityListLayout = (
        <div className="City-List-Container">
            <div className="City-List-Header">
                <h1>Select City</h1>
                <span className="City-Results-Badge">{cityListDivs.length} results</span>
            </div>
            <div className="List-Container">
                {cityListDivs}
            </div>
        </div>
    );

    let countryString = '';
    let alternateNames = '';
    if (activeCity) {
        let counter = 1;
        while (activeCity._links[`city:admin${counter}_division`]) {
            countryString += activeCity._links[`city:admin${counter}_division`].name + ', ';
            counter++;
        }
        countryString += activeCity._links['city:country'] ? activeCity._links['city:country'].name : '';

        if (cityIndexRef.current !== -1 && cityList && cityList._embedded && cityList._embedded['city:search-results'][cityIndexRef.current]) {
            const matchingAlts = cityList._embedded['city:search-results'][cityIndexRef.current].matching_alternate_names || [];
            alternateNames = matchingAlts.map(alt => alt.name).join(', ');
        }
    }

    const cityImgLayout = (
        <div className="City-Image-Container">
            {cityImg && cityImg.photos && cityImg.photos[0] ? (
                <img
                    className="City-Image"
                    src={cityImg.photos[0].image.mobile}
                    alt={`City by ${cityImg.photos[0].attribution ? cityImg.photos[0].attribution.photographer : 'photographer'}`}
                />
            ) : (
                <div className="City-Image-Placeholder">
                    <p className="Red">No Advanced Data or Images on File for {activeCity ? activeCity.name : 'This City'} <i className="fa fa-frown-o"></i></p>
                </div>
            )}
        </div>
    );

    const categoriesList = [
        { label: 'Housing', index: 0 },
        { label: 'Cost of Living', index: 1 },
        { label: 'Startups', index: 2 },
        { label: 'Venture Capital', index: 3 },
        { label: 'Travel Connectivity', index: 4 },
        { label: 'Commute', index: 5 },
        { label: 'Business Freedom', index: 6 },
        { label: 'Safety', index: 7 },
        { label: 'Healthcare', index: 8 },
        { label: 'Education', index: 9 },
        { label: 'Environmental Quality', index: 10 },
        { label: 'Economy', index: 11 },
        { label: 'Taxation', index: 12 },
        { label: 'Internet Access', index: 13 }
    ];

    const advancedCityDetails = [];
    if (urbanCityDetails && urbanCityDetails.categories) {
        urbanCityDetails.categories.forEach((category, catIdx) => {
            advancedCityDetails.push(<hr key={'hr-' + catIdx} />);
            advancedCityDetails.push(<h3 key={'h3-' + catIdx}>{category.label}</h3>);
            category.data.forEach((item, itemIdx) => {
                let valueStr = '';
                if (item.type === 'currency_dollar') {
                    valueStr = `$${item.currency_dollar_value}`;
                } else if (item.type === 'percent') {
                    valueStr = `${(item.percent_value * 100).toFixed(2)}%`;
                } else if (item.type === 'float') {
                    valueStr = typeof item.float_value === 'number' ? item.float_value.toFixed(2) : item.float_value;
                } else if (item.type === 'string') {
                    valueStr = item.string_value;
                } else if (item.type === 'int') {
                    valueStr = item.int_value;
                }
                advancedCityDetails.push(
                    <p key={'p-' + catIdx + '-' + itemIdx} className="Statistic-Row">
                        <span className="Stat-Label">{item.label}:</span>
                        <span className="Stat-Value">{valueStr}</span>
                    </p>
                );
            });
        });
    }

    const advancedCityDataLayout = advancedCityData && advancedCityData.categories ? (
        <div className="Advanced-City-Container">
            <h2 className="Section-Title">Quality of Life Ratings</h2>
            <div className="Advanced-City-Column-Container">
                <div className="Advanced-City-Column">
                    {categoriesList.filter((_, idx) => idx % 2 === 0).map((cat) => (
                        <div key={cat.label} className="Rating-Item">
                            <span className="Rating-Label">{cat.label}</span>
                            {generateRating(advancedCityData.categories[cat.index] ? advancedCityData.categories[cat.index].score_out_of_10 : 0)}
                        </div>
                    ))}
                </div>
                <div className="Advanced-City-Column">
                    {categoriesList.filter((_, idx) => idx % 2 !== 0).map((cat) => (
                        <div key={cat.label} className="Rating-Item">
                            <span className="Rating-Label">{cat.label}</span>
                            {generateRating(advancedCityData.categories[cat.index] ? advancedCityData.categories[cat.index].score_out_of_10 : 0)}
                        </div>
                    ))}
                </div>
            </div>
            {advancedCityDetails.length > 0 && (
                <div className="Advanced-City-Details">
                    <h2 className="Section-Title" style={{ marginTop: '32px' }}>Local Statistics & Details</h2>
                    {advancedCityDetails}
                </div>
            )}
        </div>
    ) : null;

    const activeCityLayout = activeCity ? (
        <div className="Active-City-Container">
            {cityList && (
                <button 
                    className="Back-To-List-Button" 
                    onClick={() => updateActiveCity ? updateActiveCity(null) : null}
                    type="button"
                    aria-label="Back to search results"
                >
                    <i className="fa fa-arrow-left"></i> Back to Cities List
                </button>
            )}
            {cityImgLayout}
            <h1>{activeCity.name}</h1>
            <div className="Active-City-Column-Container">
                <div className="Active-City-Column">
                    <p>
                        <i className="fa fa-globe"></i> <span><strong>Region:</strong> {countryString || 'No data on file'}</span>
                    </p>
                    <p>
                        <i className="fa fa-clock-o"></i> <span><strong>Timezone:</strong> {activeCity._links && activeCity._links['city:timezone'] ? activeCity._links['city:timezone'].name : 'No Data on File'}</span>
                    </p>
                    <p>
                        <i className="fa fa-building-o"></i> <span><strong>Urban Area:</strong> {activeCity._links && activeCity._links['city:urban_area'] ? activeCity._links['city:urban_area'].name : 'No Urban Area Data on File'}</span>
                    </p>
                </div>
                <div className="Active-City-Column">
                    <p>
                        <i className="fa fa-id-badge"></i> <span><strong>Alternate Names:</strong> {alternateNames || 'No Alternate Names on File'}</span>
                    </p>
                    <p>
                        <i className="fa fa-map-marker"></i> <span><strong>Coordinates:</strong> {activeCity.location && activeCity.location.latlon ? `${activeCity.location.latlon.latitude.toFixed(4)}° N, ${activeCity.location.latlon.longitude.toFixed(4)}° E` : 'No Location Data'}</span>
                    </p>
                    <p>
                        <i className="fa fa-users"></i> <span><strong>Population:</strong> {activeCity.population ? new Intl.NumberFormat('en-US').format(activeCity.population) : 'Unknown'}</span>
                    </p>
                </div>
            </div>
            {advancedCityDataLayout}
        </div>
    ) : null;

    return (
        <div className="Content-Container">
            <div className="Content center">
                {
                    cityList ?
                        activeCity ?
                            activeCityLayout :
                            cityListLayout :
                        hero
                }
                <p className={activeError ? "Error-Display-Active" : "Error-Display-Inactive"}>{activeError}</p>
                <p className="Footer">&copy; Copyright Cody Uhi {new Date().getFullYear()}</p>
            </div>
        </div>
    );
}