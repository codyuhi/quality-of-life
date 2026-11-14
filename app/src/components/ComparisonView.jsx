import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import RadarChart from './RadarChart';

const CORE_14_CATEGORIES = [
    'Housing',
    'Cost of Living',
    'Startups',
    'Venture Capital',
    'Travel Connectivity',
    'Commute',
    'Business Freedom',
    'Safety',
    'Healthcare',
    'Education',
    'Environmental Quality',
    'Economy',
    'Taxation',
    'Internet Access'
];

export default function ComparisonView({
    cityA,
    cityB,
    onExit,
    onChangeCities,
    onSwapCities
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [dataA, setDataA] = useState(null);
    const [dataB, setDataB] = useState(null);

    const [scoresA, setScoresA] = useState(null);
    const [scoresB, setScoresB] = useState(null);

    const [imgA, setImgA] = useState(null);
    const [imgB, setImgB] = useState(null);

    const [chartMode, setChartMode] = useState('radar'); // 'radar' or 'bar'
    const [filterCategory, setFilterCategory] = useState('all'); // 'all', '14core', etc.

    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Load data for both cities
    useEffect(() => {
        if (!cityA || !cityB) return;

        setLoading(true);
        setError('');

        const fetchCity = (cityObj) => {
            const url = cityObj.href || (cityObj._links?.['city:item']?.href);
            if (!url) return Promise.reject(new Error(`Missing URL for city ${cityObj.name}`));
            return axios.get(url).then(r => r.data);
        };

        Promise.all([fetchCity(cityA), fetchCity(cityB)])
            .then(([resCityA, resCityB]) => {
                if (!isMounted.current) return;
                setDataA(resCityA);
                setDataB(resCityB);

                const uaA = resCityA._links?.['city:urban_area']?.href;
                const uaB = resCityB._links?.['city:urban_area']?.href;

                if (!uaA || !uaB) {
                    const missing = [];
                    if (!uaA) missing.push(resCityA.name);
                    if (!uaB) missing.push(resCityB.name);
                    setError(`Urban area scores are not available for ${missing.join(' and ')}. Comparison mode requires cities associated with an urban area.`);
                    setLoading(false);
                    return;
                }

                const cleanUaUrl = (u, endpoint) => u.endsWith('/') ? `${u}${endpoint}` : `${u}/${endpoint}`;

                return Promise.all([
                    axios.get(cleanUaUrl(uaA, 'scores')).then(r => r.data).catch(() => null),
                    axios.get(cleanUaUrl(uaB, 'scores')).then(r => r.data).catch(() => null),
                    axios.get(cleanUaUrl(uaA, 'images')).then(r => r.data).catch(() => null),
                    axios.get(cleanUaUrl(uaB, 'images')).then(r => r.data).catch(() => null)
                ]).then(([scA, scB, imA, imB]) => {
                    if (!isMounted.current) return;
                    setScoresA(scA);
                    setScoresB(scB);
                    setImgA(imA);
                    setImgB(imB);
                    setLoading(false);
                });
            })
            .catch((err) => {
                if (!isMounted.current) return;
                console.error('Error fetching comparison data:', err);
                setError('Failed to load city comparison data. Please check network connection.');
                setLoading(false);
            });
    }, [cityA, cityB]);

    // Format population
    const formatNumber = (num) => {
        if (!num && num !== 0) return 'Unknown';
        return new Intl.NumberFormat('en-US').format(num);
    };

    // Calculate matched categories
    const categoriesMapA = {};
    if (scoresA && scoresA.categories) {
        scoresA.categories.forEach(cat => {
            categoriesMapA[cat.name] = cat.score_out_of_10;
        });
    }

    const categoriesMapB = {};
    if (scoresB && scoresB.categories) {
        scoresB.categories.forEach(cat => {
            categoriesMapB[cat.name] = cat.score_out_of_10;
        });
    }

    // Determine list of categories to compare
    const allCategoryNames = Array.from(new Set([
        ...Object.keys(categoriesMapA),
        ...Object.keys(categoriesMapB)
    ]));

    // Sort to prioritize core 14 categories first
    allCategoryNames.sort((a, b) => {
        const idxA = CORE_14_CATEGORIES.indexOf(a);
        const idxB = CORE_14_CATEGORIES.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    const matchedCategories = allCategoryNames.map(name => {
        const scoreA = categoriesMapA[name] != null ? categoriesMapA[name] : 0;
        const scoreB = categoriesMapB[name] != null ? categoriesMapB[name] : 0;
        const delta = scoreA - scoreB;
        let winner = 'TIE';
        if (delta > 0.05) winner = 'A';
        else if (delta < -0.05) winner = 'B';

        const isCore14 = CORE_14_CATEGORIES.includes(name);

        return {
            name,
            scoreA,
            scoreB,
            delta,
            winner,
            isCore14
        };
    });

    const filteredCategories = filterCategory === '14core'
        ? matchedCategories.filter(c => c.isCore14)
        : matchedCategories;

    // Tallies
    let leadsA = 0;
    let leadsB = 0;
    let ties = 0;
    filteredCategories.forEach(cat => {
        if (cat.winner === 'A') leadsA++;
        else if (cat.winner === 'B') leadsB++;
        else ties++;
    });

    const cityScoreA = scoresA?.teleport_city_score;
    const cityScoreB = scoresB?.teleport_city_score;
    const overallDelta = (cityScoreA != null && cityScoreB != null) ? (cityScoreA - cityScoreB) : null;

    const photoUrlA = imgA?.photos?.[0]?.image?.mobile || imgA?.photos?.[0]?.image?.web;
    const photoUrlB = imgB?.photos?.[0]?.image?.mobile || imgB?.photos?.[0]?.image?.web;

    const cityDisplayNameA = dataA?.name || cityA?.name || 'City A';
    const cityDisplayNameB = dataB?.name || cityB?.name || 'City B';

    if (loading) {
        return (
            <div className="Comparison-Loading-Container glass-panel" data-testid="comparison-loading">
                <i className="fa fa-spinner fa-spin Loading-Spinner"></i>
                <h2>Contrasting Metrics...</h2>
                <p>Comparing {cityDisplayNameA} and {cityDisplayNameB} across quality of life indicators.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="Comparison-Error-Container glass-panel">
                <i className="fa fa-exclamation-triangle Error-Icon"></i>
                <h2>Unable to Complete Comparison</h2>
                <p className="Error-Text">{error}</p>
                <div className="Error-Actions">
                    <button type="button" className="Secondary-Btn" onClick={onChangeCities}>
                        <i className="fa fa-pencil"></i> Select Different Cities
                    </button>
                    <button type="button" className="Primary-Btn" onClick={onExit}>
                        <i className="fa fa-arrow-left"></i> Exit Comparison
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="Comparison-View-Container" data-testid="comparison-view">
            {/* Top Navigation & Controls */}
            <div className="Comparison-Top-Nav">
                <button
                    type="button"
                    className="Back-To-List-Button"
                    onClick={onExit}
                    aria-label="Exit comparison mode"
                >
                    <i className="fa fa-arrow-left"></i> Exit Comparison
                </button>
                <div className="Comparison-Top-Actions">
                    <button
                        type="button"
                        className="Swap-Top-Btn"
                        onClick={onSwapCities}
                        title="Swap City A and City B"
                        aria-label="Swap cities"
                    >
                        <i className="fa fa-exchange"></i> Swap Order
                    </button>
                    <button
                        type="button"
                        className="Change-Cities-Top-Btn"
                        onClick={onChangeCities}
                        aria-label="Change compared cities"
                    >
                        <i className="fa fa-pencil"></i> Change Cities
                    </button>
                </div>
            </div>

            {/* City Header Cards */}
            <div className="Comparison-Header-Cards">
                {/* City A Card */}
                <div className="Comparison-City-Card card-city-a glass-panel">
                    <div className="Card-City-Image-Wrapper">
                        {photoUrlA ? (
                            <img
                                src={photoUrlA}
                                alt={cityDisplayNameA}
                                className="Card-City-Image"
                            />
                        ) : (
                            <div className="Card-City-Image-Placeholder">
                                <i className="fa fa-building-o"></i>
                            </div>
                        )}
                        <span className="Card-City-Badge badge-a">City A</span>
                    </div>
                    <div className="Card-City-Content">
                        <h2 className="Card-City-Name">{cityDisplayNameA}</h2>
                        <span className="Card-City-Country">
                            {dataA?._links?.['city:country']?.name || dataA?.full_name}
                        </span>
                        <div className="Card-City-Meta">
                            <span className="Meta-Item">
                                <i className="fa fa-users"></i> {formatNumber(dataA?.population)} pop.
                            </span>
                            {dataA?.location?.latlon && (
                                <span className="Meta-Item">
                                    <i className="fa fa-map-marker"></i> {dataA.location.latlon.latitude.toFixed(1)}°, {dataA.location.latlon.longitude.toFixed(1)}°
                                </span>
                            )}
                        </div>
                        {cityScoreA != null && (
                            <div className="Card-City-Score-Box score-box-a">
                                <span className="Score-Label">Composite Score</span>
                                <span className="Score-Value">{cityScoreA.toFixed(1)} <small>/ 100</small></span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Center Comparison Tally & VS Indicator */}
                <div className="Comparison-Center-Tally glass-panel">
                    <div className="VS-Circle">VS</div>
                    <div className="Tally-Title">Category Advantage</div>
                    <div className="Tally-Scores">
                        <div className="Tally-Side a">
                            <span className="Tally-Num">{leadsA}</span>
                            <span className="Tally-Label">{cityDisplayNameA}</span>
                        </div>
                        <div className="Tally-Divider">:</div>
                        <div className="Tally-Side b">
                            <span className="Tally-Num">{leadsB}</span>
                            <span className="Tally-Label">{cityDisplayNameB}</span>
                        </div>
                    </div>
                    {ties > 0 && <span className="Tally-Ties">({ties} tied)</span>}

                    {overallDelta != null && (
                        <div className={`Overall-Delta-Pill ${overallDelta > 0 ? 'delta-a' : overallDelta < 0 ? 'delta-b' : 'delta-tied'}`}>
                            {overallDelta > 0 ? (
                                <>
                                    <i className="fa fa-arrow-up"></i> {cityDisplayNameA} +{overallDelta.toFixed(1)} overall
                                </>
                            ) : overallDelta < 0 ? (
                                <>
                                    <i className="fa fa-arrow-up"></i> {cityDisplayNameB} +{Math.abs(overallDelta).toFixed(1)} overall
                                </>
                            ) : (
                                <>Composite scores tied</>
                            )}
                        </div>
                    )}
                </div>

                {/* City B Card */}
                <div className="Comparison-City-Card card-city-b glass-panel">
                    <div className="Card-City-Image-Wrapper">
                        {photoUrlB ? (
                            <img
                                src={photoUrlB}
                                alt={cityDisplayNameB}
                                className="Card-City-Image"
                            />
                        ) : (
                            <div className="Card-City-Image-Placeholder">
                                <i className="fa fa-building-o"></i>
                            </div>
                        )}
                        <span className="Card-City-Badge badge-b">City B</span>
                    </div>
                    <div className="Card-City-Content">
                        <h2 className="Card-City-Name">{cityDisplayNameB}</h2>
                        <span className="Card-City-Country">
                            {dataB?._links?.['city:country']?.name || dataB?.full_name}
                        </span>
                        <div className="Card-City-Meta">
                            <span className="Meta-Item">
                                <i className="fa fa-users"></i> {formatNumber(dataB?.population)} pop.
                            </span>
                            {dataB?.location?.latlon && (
                                <span className="Meta-Item">
                                    <i className="fa fa-map-marker"></i> {dataB.location.latlon.latitude.toFixed(1)}°, {dataB.location.latlon.longitude.toFixed(1)}°
                                </span>
                            )}
                        </div>
                        {cityScoreB != null && (
                            <div className="Card-City-Score-Box score-box-b">
                                <span className="Score-Label">Composite Score</span>
                                <span className="Score-Value">{cityScoreB.toFixed(1)} <small>/ 100</small></span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Visual Chart Section */}
            <div className="Comparison-Chart-Section glass-panel">
                <div className="Chart-Section-Header">
                    <div className="Chart-Title-Group">
                        <h3><i className="fa fa-area-chart"></i> Visual Trade-Offs</h3>
                        <p className="Chart-Subtitle">Explore strengths, trade-offs, and quality of life differences</p>
                    </div>
                    <div className="Chart-Toggle-Group" role="tablist" aria-label="Chart mode">
                        <button
                            type="button"
                            className={`Chart-Toggle-Btn ${chartMode === 'radar' ? 'active' : ''}`}
                            onClick={() => setChartMode('radar')}
                            role="tab"
                            aria-selected={chartMode === 'radar'}
                        >
                            <i className="fa fa-pie-chart"></i> Radar Chart
                        </button>
                        <button
                            type="button"
                            className={`Chart-Toggle-Btn ${chartMode === 'bar' ? 'active' : ''}`}
                            onClick={() => setChartMode('bar')}
                            role="tab"
                            aria-selected={chartMode === 'bar'}
                        >
                            <i className="fa fa-bar-chart"></i> Bar Comparison
                        </button>
                    </div>
                </div>

                <div className="Chart-Content-Area">
                    {chartMode === 'radar' ? (
                        <RadarChart
                            cityAName={cityDisplayNameA}
                            cityBName={cityDisplayNameB}
                            categories={filteredCategories}
                        />
                    ) : (
                        <div className="Comparative-Bar-Chart-Container" data-testid="bar-chart-container">
                            <div className="Bar-Chart-Legend">
                                <div className="Legend-Item city-a">
                                    <span className="Legend-Swatch bg-spruce"></span>
                                    <span className="Legend-Name">{cityDisplayNameA}</span>
                                </div>
                                <div className="Legend-Item city-b">
                                    <span className="Legend-Swatch bg-rust"></span>
                                    <span className="Legend-Name">{cityDisplayNameB}</span>
                                </div>
                            </div>
                            <div className="Bar-Chart-Rows">
                                {filteredCategories.map((cat) => (
                                    <div key={`bar-row-${cat.name}`} className="Bar-Chart-Row">
                                        <div className="Bar-Row-Header">
                                            <span className="Bar-Category-Name">{cat.name}</span>
                                            <span className={`Bar-Delta-Pill ${cat.winner === 'A' ? 'delta-a' : cat.winner === 'B' ? 'delta-b' : 'delta-tied'}`}>
                                                {cat.winner === 'A'
                                                    ? `+${cat.delta.toFixed(1)} ${cityDisplayNameA}`
                                                    : cat.winner === 'B'
                                                    ? `+${Math.abs(cat.delta).toFixed(1)} ${cityDisplayNameB}`
                                                    : 'Tied'}
                                            </span>
                                        </div>
                                        <div className="Bar-Track-Group">
                                            {/* City A Bar */}
                                            <div className="Bar-Item bar-a">
                                                <div className="Bar-Label-Inline">{cityDisplayNameA}</div>
                                                <div className="Bar-Track">
                                                    <div
                                                        className="Bar-Fill fill-a"
                                                        style={{ width: `${Math.min(100, Math.max(0, cat.scoreA * 10))}%` }}
                                                    ></div>
                                                </div>
                                                <div className="Bar-Score-Value">{cat.scoreA.toFixed(1)}</div>
                                            </div>

                                            {/* City B Bar */}
                                            <div className="Bar-Item bar-b">
                                                <div className="Bar-Label-Inline">{cityDisplayNameB}</div>
                                                <div className="Bar-Track">
                                                    <div
                                                        className="Bar-Fill fill-b"
                                                        style={{ width: `${Math.min(100, Math.max(0, cat.scoreB * 10))}%` }}
                                                    ></div>
                                                </div>
                                                <div className="Bar-Score-Value">{cat.scoreB.toFixed(1)}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Category Breakdown Table / Dual Columns */}
            <div className="Comparison-Breakdown-Section">
                <div className="Breakdown-Header">
                    <div className="Breakdown-Title-Group">
                        <h2>Category Score Breakdown</h2>
                        <p className="Breakdown-Subtitle">
                            Detailed side-by-side comparison across all 14 quality of life categories with color-coded difference pills.
                        </p>
                    </div>

                    <div className="Breakdown-Filters">
                        <button
                            type="button"
                            className={`Filter-Pill ${filterCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterCategory('all')}
                        >
                            All Categories ({matchedCategories.length})
                        </button>
                        <button
                            type="button"
                            className={`Filter-Pill ${filterCategory === '14core' ? 'active' : ''}`}
                            onClick={() => setFilterCategory('14core')}
                        >
                            Core 14 Categories
                        </button>
                    </div>
                </div>

                {/* Dual Column / Matched Rows List */}
                <div className="Category-Cards-List">
                    {filteredCategories.map((cat) => {
                        const scoreAPct = Math.min(100, Math.max(0, cat.scoreA * 10));
                        const scoreBPct = Math.min(100, Math.max(0, cat.scoreB * 10));

                        return (
                            <div
                                key={`cat-card-${cat.name}`}
                                className={`Category-Compare-Card glass-panel ${cat.winner === 'A' ? 'winner-a' : cat.winner === 'B' ? 'winner-b' : 'tied'}`}
                            >
                                {/* City A Side */}
                                <div className="Category-Column col-a">
                                    <div className="Col-Top">
                                        <span className="Col-City-Label">{cityDisplayNameA}</span>
                                        <span className="Col-Score-Num">{cat.scoreA.toFixed(1)}</span>
                                    </div>
                                    <div className="Col-Progress-Track">
                                        <div
                                            className="Col-Progress-Fill fill-a"
                                            style={{ width: `${scoreAPct}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Center Category & Delta Pill */}
                                <div className="Category-Center-Info">
                                    <span className="Category-Title-Text">{cat.name}</span>
                                    <span
                                        className={`Delta-Indicator-Pill ${cat.winner === 'A' ? 'delta-pill-a' : cat.winner === 'B' ? 'delta-pill-b' : 'delta-pill-tied'}`}
                                    >
                                        {cat.winner === 'A' ? (
                                            <>
                                                <i className="fa fa-arrow-left"></i> +{cat.delta.toFixed(1)} {cityDisplayNameA}
                                            </>
                                        ) : cat.winner === 'B' ? (
                                            <>
                                                +{Math.abs(cat.delta).toFixed(1)} {cityDisplayNameB} <i className="fa fa-arrow-right"></i>
                                            </>
                                        ) : (
                                            <>Tied (0.0)</>
                                        )}
                                    </span>
                                </div>

                                {/* City B Side */}
                                <div className="Category-Column col-b">
                                    <div className="Col-Top">
                                        <span className="Col-City-Label">{cityDisplayNameB}</span>
                                        <span className="Col-Score-Num">{cat.scoreB.toFixed(1)}</span>
                                    </div>
                                    <div className="Col-Progress-Track">
                                        <div
                                            className="Col-Progress-Fill fill-b"
                                            style={{ width: `${scoreBPct}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
