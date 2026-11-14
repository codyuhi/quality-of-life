import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const POPULAR_CITIES = [
    { name: 'Seattle', full_name: 'Seattle, Washington, United States', query: 'Seattle' },
    { name: 'Salt Lake City', full_name: 'Salt Lake City, Utah, United States', query: 'Salt Lake City' },
    { name: 'Denver', full_name: 'Denver, Colorado, United States', query: 'Denver' },
    { name: 'Austin', full_name: 'Austin, Texas, United States', query: 'Austin' },
    { name: 'San Francisco', full_name: 'San Francisco, California, United States', query: 'San Francisco' },
    { name: 'New York', full_name: 'New York, New York, United States', query: 'New York' },
    { name: 'Tokyo', full_name: 'Tokyo, Japan', query: 'Tokyo' },
    { name: 'London', full_name: 'London, United Kingdom', query: 'London' }
];

export default function CityPickerModal({
    isOpen,
    onClose,
    onCompare,
    initialCityA = null,
    initialCityB = null,
    getApiBaseUrl
}) {
    const [cityA, setCityA] = useState(initialCityA);
    const [cityB, setCityB] = useState(initialCityB);

    const [searchA, setSearchA] = useState('');
    const [searchB, setSearchB] = useState('');

    const [resultsA, setResultsA] = useState([]);
    const [resultsB, setResultsB] = useState([]);

    const [loadingA, setLoadingA] = useState(false);
    const [loadingB, setLoadingB] = useState(false);

    const modalRef = useRef(null);

    // Sync with initial props when modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialCityA) setCityA(initialCityA);
            if (initialCityB) setCityB(initialCityB);
        }
    }, [isOpen, initialCityA, initialCityB]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Debounced search for City A
    useEffect(() => {
        if (!searchA.trim() || cityA) {
            setResultsA([]);
            return;
        }

        const timer = setTimeout(() => {
            setLoadingA(true);
            const baseUrl = getApiBaseUrl ? getApiBaseUrl() : '';
            axios.get(`${baseUrl}/api/cities/?search=${encodeURIComponent(searchA.trim())}`)
                .then((res) => {
                    const items = res.data?._embedded?.['city:search-results'] || [];
                    setResultsA(items);
                    setLoadingA(false);
                })
                .catch((err) => {
                    console.error('Error searching cities for A:', err);
                    setResultsA([]);
                    setLoadingA(false);
                });
        }, 250);

        return () => clearTimeout(timer);
    }, [searchA, cityA, getApiBaseUrl]);

    // Debounced search for City B
    useEffect(() => {
        if (!searchB.trim() || cityB) {
            setResultsB([]);
            return;
        }

        const timer = setTimeout(() => {
            setLoadingB(true);
            const baseUrl = getApiBaseUrl ? getApiBaseUrl() : '';
            axios.get(`${baseUrl}/api/cities/?search=${encodeURIComponent(searchB.trim())}`)
                .then((res) => {
                    const items = res.data?._embedded?.['city:search-results'] || [];
                    setResultsB(items);
                    setLoadingB(false);
                })
                .catch((err) => {
                    console.error('Error searching cities for B:', err);
                    setResultsB([]);
                    setLoadingB(false);
                });
        }, 250);

        return () => clearTimeout(timer);
    }, [searchB, cityB, getApiBaseUrl]);

    if (!isOpen) return null;

    const handleSelectCity = (slot, item) => {
        // item has { matching_full_name, _links: { 'city:item': { href } } }
        // or a direct city object
        const cityData = {
            name: item.matching_full_name ? item.matching_full_name.split(',')[0].trim() : (item.name || 'City'),
            full_name: item.matching_full_name || item.full_name || item.name,
            href: item._links?.['city:item']?.href || item.href,
            rawItem: item
        };

        if (slot === 'A') {
            setCityA(cityData);
            setSearchA('');
            setResultsA([]);
        } else {
            setCityB(cityData);
            setSearchB('');
            setResultsB([]);
        }
    };

    const handlePopularClick = (slot, pop) => {
        const baseUrl = getApiBaseUrl ? getApiBaseUrl() : '';
        axios.get(`${baseUrl}/api/cities/?search=${encodeURIComponent(pop.query)}`)
            .then((res) => {
                const items = res.data?._embedded?.['city:search-results'] || [];
                if (items.length > 0) {
                    handleSelectCity(slot, items[0]);
                }
            })
            .catch((err) => {
                console.error('Failed to select popular city:', err);
            });
    };

    const handleSwap = () => {
        const temp = cityA;
        setCityA(cityB);
        setCityB(temp);
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (cityA && cityB) {
            onCompare(cityA, cityB);
            onClose();
        }
    };

    const canCompare = Boolean(cityA && cityB);

    return (
        <div className="Modal-Overlay" onClick={onClose} role="presentation">
            <div
                className="Modal-Content City-Picker-Modal glass-panel"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="city-picker-title"
                ref={modalRef}
            >
                <div className="Modal-Header">
                    <div className="Modal-Title-Group">
                        <h2 id="city-picker-title">
                            <i className="fa fa-balance-scale"></i> Compare Cities Side-by-Side
                        </h2>
                        <p className="Modal-Subtitle">
                            Select two cities to contrast cost of living, housing, taxation, and quality-of-life metrics.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="Modal-Close-Btn"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <i className="fa fa-times"></i>
                    </button>
                </div>

                <div className="Modal-Body">
                    <div className="City-Picker-Slots">
                        {/* Slot A */}
                        <div className="City-Slot-Card slot-a">
                            <div className="Slot-Header">
                                <span className="Slot-Badge badge-a">City A (Primary)</span>
                                {cityA && (
                                    <button
                                        type="button"
                                        className="Slot-Clear-Btn"
                                        onClick={() => setCityA(null)}
                                        aria-label="Change City A"
                                    >
                                        Change
                                    </button>
                                )}
                            </div>

                            {cityA ? (
                                <div className="Selected-City-Card">
                                    <i className="fa fa-map-marker slot-icon-a"></i>
                                    <div className="Selected-City-Info">
                                        <div className="Selected-City-Name">{cityA.name}</div>
                                        <div className="Selected-City-Sub">{cityA.full_name}</div>
                                    </div>
                                    <i className="fa fa-check-circle Selected-Checkmark"></i>
                                </div>
                            ) : (
                                <div className="Slot-Input-Group">
                                    <div className="Input-With-Icon">
                                        <i className="fa fa-search"></i>
                                        <input
                                            type="text"
                                            placeholder="Search primary city (e.g. Seattle)..."
                                            value={searchA}
                                            onChange={(e) => setSearchA(e.target.value)}
                                            aria-label="Primary city name"
                                            autoFocus
                                        />
                                        {loadingA && <i className="fa fa-spinner fa-spin Input-Spinner"></i>}
                                    </div>

                                    {resultsA.length > 0 && (
                                        <div className="Slot-Results-Dropdown" role="listbox">
                                            {resultsA.map((item, idx) => (
                                                <div
                                                    key={`res-a-${idx}`}
                                                    className="Slot-Result-Item"
                                                    onClick={() => handleSelectCity('A', item)}
                                                    role="option"
                                                    tabIndex={0}
                                                >
                                                    <span className="Result-Name">{item.matching_full_name}</span>
                                                    <i className="fa fa-plus-circle"></i>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="Quick-Pick-Section">
                                        <span className="Quick-Pick-Label">Popular:</span>
                                        <div className="Quick-Pick-Pills">
                                            {POPULAR_CITIES.slice(0, 4).map((pop) => (
                                                <button
                                                    key={`pop-a-${pop.name}`}
                                                    type="button"
                                                    className="Quick-Pick-Pill"
                                                    onClick={() => handlePopularClick('A', pop)}
                                                >
                                                    {pop.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Swap Divider */}
                        <div className="City-Slot-Divider">
                            <button
                                type="button"
                                className="Swap-Cities-Btn"
                                onClick={handleSwap}
                                title="Swap City A and City B"
                                aria-label="Swap City A and City B"
                            >
                                <i className="fa fa-exchange"></i>
                                <span>Swap</span>
                            </button>
                        </div>

                        {/* Slot B */}
                        <div className="City-Slot-Card slot-b">
                            <div className="Slot-Header">
                                <span className="Slot-Badge badge-b">City B (Secondary)</span>
                                {cityB && (
                                    <button
                                        type="button"
                                        className="Slot-Clear-Btn"
                                        onClick={() => setCityB(null)}
                                        aria-label="Change City B"
                                    >
                                        Change
                                    </button>
                                )}
                            </div>

                            {cityB ? (
                                <div className="Selected-City-Card">
                                    <i className="fa fa-map-marker slot-icon-b"></i>
                                    <div className="Selected-City-Info">
                                        <div className="Selected-City-Name">{cityB.name}</div>
                                        <div className="Selected-City-Sub">{cityB.full_name}</div>
                                    </div>
                                    <i className="fa fa-check-circle Selected-Checkmark"></i>
                                </div>
                            ) : (
                                <div className="Slot-Input-Group">
                                    <div className="Input-With-Icon">
                                        <i className="fa fa-search"></i>
                                        <input
                                            type="text"
                                            placeholder="Search secondary city (e.g. Salt Lake City)..."
                                            value={searchB}
                                            onChange={(e) => setSearchB(e.target.value)}
                                            aria-label="Secondary city name"
                                        />
                                        {loadingB && <i className="fa fa-spinner fa-spin Input-Spinner"></i>}
                                    </div>

                                    {resultsB.length > 0 && (
                                        <div className="Slot-Results-Dropdown" role="listbox">
                                            {resultsB.map((item, idx) => (
                                                <div
                                                    key={`res-b-${idx}`}
                                                    className="Slot-Result-Item"
                                                    onClick={() => handleSelectCity('B', item)}
                                                    role="option"
                                                    tabIndex={0}
                                                >
                                                    <span className="Result-Name">{item.matching_full_name}</span>
                                                    <i className="fa fa-plus-circle"></i>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="Quick-Pick-Section">
                                        <span className="Quick-Pick-Label">Popular:</span>
                                        <div className="Quick-Pick-Pills">
                                            {POPULAR_CITIES.slice(1, 5).map((pop) => (
                                                <button
                                                    key={`pop-b-${pop.name}`}
                                                    type="button"
                                                    className="Quick-Pick-Pill"
                                                    onClick={() => handlePopularClick('B', pop)}
                                                >
                                                    {pop.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="Modal-Footer">
                    <button
                        type="button"
                        className="Modal-Cancel-Btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={`Modal-Submit-Btn ${canCompare ? 'active' : 'disabled'}`}
                        disabled={!canCompare}
                        onClick={handleSubmit}
                        aria-label="Compare selected cities"
                    >
                        <i className="fa fa-columns"></i> Compare Cities
                    </button>
                </div>
            </div>
        </div>
    );
}
