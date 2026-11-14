import React, { useState } from 'react';

export default function RadarChart({
    cityAName = 'City A',
    cityBName = 'City B',
    categories = [],
    colorA = 'var(--cdr-spruce-accent, #48a97c)',
    colorB = 'var(--cdr-rust, #e0532b)',
    fillA = 'rgba(72, 169, 124, 0.25)',
    fillB = 'rgba(224, 83, 43, 0.22)',
    size = 460
}) {
    const [hoveredIdx, setHoveredIdx] = useState(null);

    if (!categories || categories.length === 0) {
        return null;
    }

    const N = categories.length;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.35;
    const gridLevels = [2, 4, 6, 8, 10];

    const getCoordinates = (index, score, customRadius = radius) => {
        const angle = (2 * Math.PI * index) / N - Math.PI / 2;
        const r = (Math.max(0, Math.min(10, score)) / 10) * customRadius;
        return {
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle),
            angle
        };
    };

    // Calculate grid polygons
    const gridPolygons = gridLevels.map((level) => {
        const points = categories.map((_, i) => {
            const { x, y } = getCoordinates(i, level);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');
        return { level, points };
    });

    // Calculate spokes
    const spokes = categories.map((_, i) => {
        const outer = getCoordinates(i, 10);
        return { x1: cx, y1: cy, x2: outer.x, y2: outer.y };
    });

    // Calculate series polygons
    const pointsA = categories.map((cat, i) => {
        const { x, y } = getCoordinates(i, cat.scoreA);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const pointsB = categories.map((cat, i) => {
        const { x, y } = getCoordinates(i, cat.scoreB);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const hoveredCategory = hoveredIdx !== null ? categories[hoveredIdx] : null;

    return (
        <div className="Radar-Chart-Wrapper" data-testid="radar-chart-wrapper">
            <div className="Radar-Chart-Legend">
                <div className="Legend-Item city-a">
                    <span className="Legend-Swatch" style={{ backgroundColor: colorA }}></span>
                    <span className="Legend-Name">{cityAName}</span>
                </div>
                <div className="Legend-Item city-b">
                    <span className="Legend-Swatch" style={{ backgroundColor: colorB }}></span>
                    <span className="Legend-Name">{cityBName}</span>
                </div>
            </div>

            <div className="Radar-Chart-SVG-Container">
                <svg
                    viewBox={`0 0 ${size} ${size}`}
                    className="Radar-Chart-SVG"
                    role="img"
                    aria-label={`Radar chart comparing ${cityAName} and ${cityBName}`}
                >
                    {/* Concentric grid rings */}
                    {gridPolygons.map((grid) => (
                        <polygon
                            key={`grid-${grid.level}`}
                            points={grid.points}
                            className="Radar-Grid-Ring"
                        />
                    ))}

                    {/* Concentric level labels */}
                    {gridLevels.map((level) => {
                        const { y } = getCoordinates(0, level);
                        return (
                            <text
                                key={`level-${level}`}
                                x={cx + 4}
                                y={y - 2}
                                className="Radar-Level-Text"
                            >
                                {level}
                            </text>
                        );
                    })}

                    {/* Spokes */}
                    {spokes.map((spoke, i) => (
                        <line
                            key={`spoke-${i}`}
                            x1={spoke.x1}
                            y1={spoke.y1}
                            x2={spoke.x2}
                            y2={spoke.y2}
                            className="Radar-Spoke"
                        />
                    ))}

                    {/* Series Polygon B */}
                    <polygon
                        points={pointsB}
                        fill={fillB}
                        stroke={colorB}
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        className="Radar-Polygon-B"
                    />

                    {/* Series Polygon A */}
                    <polygon
                        points={pointsA}
                        fill={fillA}
                        stroke={colorA}
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        className="Radar-Polygon-A"
                    />

                    {/* Vertex Points & Touch/Click Targets */}
                    {categories.map((cat, i) => {
                        const ptA = getCoordinates(i, cat.scoreA);
                        const ptB = getCoordinates(i, cat.scoreB);
                        const isHovered = hoveredIdx === i;

                        return (
                            <g key={`points-${i}`}>
                                <circle
                                    cx={ptB.x}
                                    cy={ptB.y}
                                    r={isHovered ? 5 : 3.5}
                                    fill={colorB}
                                    className="Radar-Dot dot-b"
                                />
                                <circle
                                    cx={ptA.x}
                                    cy={ptA.y}
                                    r={isHovered ? 5 : 3.5}
                                    fill={colorA}
                                    className="Radar-Dot dot-a"
                                />
                            </g>
                        );
                    })}

                    {/* Perimeter Axis Labels */}
                    {categories.map((cat, i) => {
                        const labelCoord = getCoordinates(i, 10, radius + 22);
                        const cos = Math.cos(labelCoord.angle);
                        let anchor = 'middle';
                        if (cos > 0.25) anchor = 'start';
                        else if (cos < -0.25) anchor = 'end';

                        const isHovered = hoveredIdx === i;

                        return (
                            <g
                                key={`label-${i}`}
                                className={`Radar-Axis-Label-Group ${isHovered ? 'active' : ''}`}
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                tabIndex={0}
                                role="button"
                                aria-label={`${cat.name}: ${cityAName} ${cat.scoreA.toFixed(1)}, ${cityBName} ${cat.scoreB.toFixed(1)}`}
                                onFocus={() => setHoveredIdx(i)}
                                onBlur={() => setHoveredIdx(null)}
                            >
                                <text
                                    x={labelCoord.x}
                                    y={labelCoord.y + (labelCoord.y > cy ? 4 : -2)}
                                    textAnchor={anchor}
                                    className={`Radar-Axis-Label ${isHovered ? 'active' : ''}`}
                                >
                                    {cat.name}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Central / Floating Active Tooltip */}
                {hoveredCategory && (
                    <div className="Radar-Tooltip glass-panel">
                        <div className="Tooltip-Category-Name">{hoveredCategory.name}</div>
                        <div className="Tooltip-Scores">
                            <span className="Tooltip-Score-A" style={{ color: colorA }}>
                                {cityAName}: <strong>{hoveredCategory.scoreA.toFixed(1)}</strong>
                            </span>
                            <span className="Tooltip-Score-B" style={{ color: colorB }}>
                                {cityBName}: <strong>{hoveredCategory.scoreB.toFixed(1)}</strong>
                            </span>
                        </div>
                        <div className="Tooltip-Delta">
                            {hoveredCategory.delta > 0 ? (
                                <span className="delta-a">+{hoveredCategory.delta.toFixed(1)} {cityAName} advantage</span>
                            ) : hoveredCategory.delta < 0 ? (
                                <span className="delta-b">+{Math.abs(hoveredCategory.delta).toFixed(1)} {cityBName} advantage</span>
                            ) : (
                                <span className="delta-tied">Tied</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
