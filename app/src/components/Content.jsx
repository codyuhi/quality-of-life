import React, { useRef, useState, useEffect } from 'react';
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
    cityImgLoading = false,
    advancedCityData,
    activeError,
    suggestedCities = [],
    citiesPagination,
    citiesLoading,
    locationStatus,
    onPageChange
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
        let color = 'var(--cdr-score-low)';
        if (number >= 7.5) {
            color = 'var(--cdr-score-high)';
        } else if (number >= 5.0) {
            color = 'var(--cdr-score-mid)';
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
                    <i className="fa fa-chevron-right City-Item-Chevron"></i>
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

    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);

    const activeCityId = activeCity ? activeCity.geoname_id : null;
    useEffect(() => {
        setImageLoaded(false);
        setImageFailed(false);
    }, [activeCityId, cityImg]);

    const hasPhoto = Boolean(cityImg && cityImg.photos && cityImg.photos[0] && cityImg.photos[0].image && cityImg.photos[0].image.mobile);
    const isImgLoading = cityImgLoading || (hasPhoto && !imageLoaded && !imageFailed);
    const isImgMissing = !cityImgLoading && (!hasPhoto || imageFailed);

    const cityImgLayout = (
        <div className="City-Image-Container">
            {isImgLoading && (
                <div className="City-Image-Loading">
                    <i className="fa fa-spinner fa-spin"></i>
                    <span>Loading image for {activeCity ? activeCity.name : 'city'}...</span>
                </div>
            )}

            {hasPhoto && !imageFailed && (
                <img
                    className={`City-Image ${imageLoaded ? 'visible' : 'hidden'}`}
                    src={cityImg.photos[0].image.mobile}
                    alt={`City by ${cityImg.photos[0].attribution ? cityImg.photos[0].attribution.photographer : 'photographer'}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => {
                        setImageFailed(true);
                        setImageLoaded(false);
                    }}
                    style={{ display: imageLoaded ? 'block' : 'none' }}
                />
            )}

            {isImgMissing && (
                <div className="City-Image-Placeholder">
                    <p className="Red">
                        No Advanced Data or Images on File for {activeCity ? activeCity.name : 'This City'}{' '}
                        <i className="fa fa-frown-o"></i>
                    </p>
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

    const formatNumber = (num) => {
        if (!num && num !== 0) return 'Unknown';
        return new Intl.NumberFormat('en-US').format(num);
    };

    const formatDistance = (km) => {
        if (km == null) return null;
        if (km < 1) return '< 1 km away';
        return `${Math.round(km)} km away`;
    };

    const totalCities = (citiesPagination && citiesPagination.total_cities) || 266;
    const dbStatusBadge = (
        <div className="Db-Status-Badge glass-panel" title="Database Seed Status">
            <div className="Db-Status-Left">
                <i className="fa fa-database"></i>
                <span className="Db-Status-Count"><strong>{totalCities}</strong> cities available in database</span>
            </div>
            <div className="Db-Status-Right">
                <span className="Db-Status-Pill"><i className="fa fa-check-circle"></i> Seeded &amp; Ready</span>
            </div>
        </div>
    );

    const isLocationSorted = citiesPagination && citiesPagination.sort_by === 'distance';
    const suggestedSection = (
        <div className="Suggested-Cities-Section">
            <div className="Suggested-Header">
                <div className="Suggested-Title-Group">
                    <h2>
                        <i className={isLocationSorted ? "fa fa-location-arrow" : "fa fa-globe"}></i>{' '}
                        {isLocationSorted ? "Cities Near You" : "Major World Cities"}
                    </h2>
                    <p className="Suggested-Subtitle">
                        {isLocationSorted
                            ? "Ordered by proximity to your detected location"
                            : (locationStatus === 'denied' || locationStatus === 'unavailable'
                                ? "Ordered by population (location access disabled)"
                                : "Ordered by population")}
                    </p>
                </div>
                {locationStatus === 'granted' && (
                    <span className="Location-Active-Badge">
                        <i className="fa fa-crosshairs"></i> Location Active
                    </span>
                )}
            </div>

            {citiesLoading ? (
                <div className="Cities-Loading-State glass-panel">
                    <i className="fa fa-spinner fa-spin"></i>
                    <span>Loading cities...</span>
                </div>
            ) : (
                <>
                    <div className="City-Card-Grid">
                        {suggestedCities.map((city) => (
                            <div
                                key={'city-card-' + city.geoname_id}
                                className="City-Card glass-panel"
                                onClick={() => {
                                    if (city._links && city._links['city:item']) {
                                        getCityInfo(city._links['city:item'].href);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.keyCode === 13) {
                                        if (city._links && city._links['city:item']) {
                                            getCityInfo(city._links['city:item'].href);
                                        }
                                    }
                                }}
                            >
                                <div className="City-Card-Top">
                                    <h3 className="City-Card-Name">{city.name}</h3>
                                    <span className="City-Card-Country">{city.country}</span>
                                </div>
                                <div className="City-Card-Meta">
                                    <span className="City-Card-Tag">{city.continent}</span>
                                    {city.distance_km != null && (
                                        <span className="City-Card-Distance">
                                            <i className="fa fa-map-marker"></i> {formatDistance(city.distance_km)}
                                        </span>
                                    )}
                                </div>
                                <div className="City-Card-Bottom">
                                    <span className="City-Card-Population">
                                        <i className="fa fa-users"></i> {formatNumber(city.population)}
                                    </span>
                                    <span className="City-Card-Action">
                                        View <i className="fa fa-chevron-right"></i>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {citiesPagination && citiesPagination.total_pages > 1 && (
                        <div className="Pagination-Container glass-panel">
                            <button
                                type="button"
                                className="Pagination-Button"
                                disabled={!citiesPagination.has_prev}
                                onClick={() => onPageChange(citiesPagination.page - 1)}
                                aria-label="Previous page"
                            >
                                <i className="fa fa-chevron-left"></i> Prev
                            </button>
                            <span className="Pagination-Info">
                                Page <strong>{citiesPagination.page}</strong> of <strong>{citiesPagination.total_pages}</strong>
                            </span>
                            <button
                                type="button"
                                className="Pagination-Button"
                                disabled={!citiesPagination.has_next}
                                onClick={() => onPageChange(citiesPagination.page + 1)}
                                aria-label="Next page"
                            >
                                Next <i className="fa fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    const activeCityLayout = activeCity ? (
        <div className="Active-City-Container">
            <button 
                className="Back-To-List-Button" 
                onClick={() => updateActiveCity ? updateActiveCity(null) : null}
                type="button"
                aria-label="Back to cities"
            >
                <i className="fa fa-arrow-left"></i> {cityList ? 'Back to Search Results' : 'Back to Cities'}
            </button>
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
                    activeCity ? (
                        activeCityLayout
                    ) : cityList ? (
                        cityListLayout
                    ) : (
                        <div className="Home-View">
                            {hero}
                            {dbStatusBadge}
                            {suggestedSection}
                        </div>
                    )
                }
                <p className={activeError ? "Error-Display-Active" : "Error-Display-Inactive"}>{activeError}</p>
                <p className="Footer">&copy; Copyright Cody Uhi {new Date().getFullYear()}</p>
            </div>
        </div>
    );
}