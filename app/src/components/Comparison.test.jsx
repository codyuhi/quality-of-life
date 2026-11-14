import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import CityPickerModal from './CityPickerModal';
import RadarChart from './RadarChart';
import ComparisonView from './ComparisonView';

vi.mock('axios');

const mockCityA = {
    name: 'Seattle',
    full_name: 'Seattle, Washington, United States',
    geoname_id: 21513,
    population: 737015,
    location: { latlon: { latitude: 47.605, longitude: -122.33 } },
    _links: {
        'city:country': { name: 'United States' },
        'city:urban_area': { href: 'http://localhost:5001/api/urban_areas/slug:seattle-washington/', name: 'Seattle' },
        'city:item': { href: 'http://localhost:5001/api/cities/geonameid:21513/' }
    }
};

const mockCityB = {
    name: 'Salt Lake City',
    full_name: 'Salt Lake City, Utah, United States',
    geoname_id: 5780993,
    population: 200567,
    location: { latlon: { latitude: 40.76078, longitude: -111.89105 } },
    _links: {
        'city:country': { name: 'United States' },
        'city:urban_area': { href: 'http://localhost:5001/api/urban_areas/slug:salt-lake-city/', name: 'Salt Lake City' },
        'city:item': { href: 'http://localhost:5001/api/cities/geonameid:5780993/' }
    }
};

const mockScoresA = {
    teleport_city_score: 60.55,
    categories: [
        { name: 'Housing', score_out_of_10: 2.29 },
        { name: 'Cost of Living', score_out_of_10: 3.79 },
        { name: 'Startups', score_out_of_10: 8.37 },
        { name: 'Venture Capital', score_out_of_10: 7.55 },
        { name: 'Travel Connectivity', score_out_of_10: 2.88 },
        { name: 'Commute', score_out_of_10: 4.52 },
        { name: 'Business Freedom', score_out_of_10: 8.67 },
        { name: 'Safety', score_out_of_10: 5.64 },
        { name: 'Healthcare', score_out_of_10: 6.31 },
        { name: 'Education', score_out_of_10: 5.71 },
        { name: 'Environmental Quality', score_out_of_10: 7.56 },
        { name: 'Economy', score_out_of_10: 6.51 },
        { name: 'Taxation', score_out_of_10: 4.77 },
        { name: 'Internet Access', score_out_of_10: 4.94 }
    ]
};

const mockScoresB = {
    teleport_city_score: 62.10,
    categories: [
        { name: 'Housing', score_out_of_10: 4.85 },
        { name: 'Cost of Living', score_out_of_10: 5.50 },
        { name: 'Startups', score_out_of_10: 7.10 },
        { name: 'Venture Capital', score_out_of_10: 6.20 },
        { name: 'Travel Connectivity', score_out_of_10: 3.40 },
        { name: 'Commute', score_out_of_10: 5.80 },
        { name: 'Business Freedom', score_out_of_10: 8.40 },
        { name: 'Safety', score_out_of_10: 6.90 },
        { name: 'Healthcare', score_out_of_10: 6.10 },
        { name: 'Education', score_out_of_10: 5.90 },
        { name: 'Environmental Quality', score_out_of_10: 6.20 },
        { name: 'Economy', score_out_of_10: 6.80 },
        { name: 'Taxation', score_out_of_10: 5.10 },
        { name: 'Internet Access', score_out_of_10: 5.20 }
    ]
};

const mockImages = {
    photos: [
        {
            image: {
                mobile: 'https://images.unsplash.com/test-city.jpg',
                web: 'https://images.unsplash.com/test-city.jpg'
            }
        }
    ]
};

describe('CityPickerModal Component', () => {
    it('does not render when isOpen is false', () => {
        render(
            <CityPickerModal
                isOpen={false}
                onClose={() => {}}
                onCompare={() => {}}
                getApiBaseUrl={() => ''}
            />
        );
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('renders modal with slots when isOpen is true', () => {
        render(
            <CityPickerModal
                isOpen={true}
                onClose={() => {}}
                onCompare={() => {}}
                getApiBaseUrl={() => ''}
            />
        );
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Compare Cities Side-by-Side/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Search primary city/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Search secondary city/i)).toBeInTheDocument();
    });

    it('swaps City A and City B when swap button is clicked', () => {
        const cityA = { name: 'Denver', full_name: 'Denver, Colorado' };
        const cityB = { name: 'Austin', full_name: 'Austin, Texas' };

        render(
            <CityPickerModal
                isOpen={true}
                onClose={() => {}}
                onCompare={() => {}}
                initialCityA={cityA}
                initialCityB={cityB}
                getApiBaseUrl={() => ''}
            />
        );

        expect(screen.getByText('Denver')).toBeInTheDocument();
        expect(screen.getByText('Austin')).toBeInTheDocument();

        const swapBtn = screen.getByRole('button', { name: /Swap City A and City B/i });
        fireEvent.click(swapBtn);

        // After swap, Austin is in Slot A and Denver is in Slot B
        const slotACard = document.querySelector('.slot-a');
        expect(slotACard).toHaveTextContent('Austin');
        const slotBCard = document.querySelector('.slot-b');
        expect(slotBCard).toHaveTextContent('Denver');
    });

    it('enables Compare Cities button when both cities are selected and calls onCompare', () => {
        const onCompareMock = vi.fn();
        const onCloseMock = vi.fn();

        const cityA = { name: 'Seattle', full_name: 'Seattle, WA', href: 'http://test/a' };
        const cityB = { name: 'Salt Lake City', full_name: 'Salt Lake City, UT', href: 'http://test/b' };

        render(
            <CityPickerModal
                isOpen={true}
                onClose={onCloseMock}
                onCompare={onCompareMock}
                initialCityA={cityA}
                initialCityB={cityB}
                getApiBaseUrl={() => ''}
            />
        );

        const submitBtn = screen.getByRole('button', { name: /Compare selected cities/i });
        expect(submitBtn).toBeEnabled();

        fireEvent.click(submitBtn);
        expect(onCompareMock).toHaveBeenCalledWith(cityA, cityB);
        expect(onCloseMock).toHaveBeenCalled();
    });

    it('calls onClose when Escape key is pressed', () => {
        const onCloseMock = vi.fn();
        render(
            <CityPickerModal
                isOpen={true}
                onClose={onCloseMock}
                onCompare={() => {}}
                getApiBaseUrl={() => ''}
            />
        );

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onCloseMock).toHaveBeenCalled();
    });
});

describe('RadarChart Component', () => {
    const mockCategories = [
        { name: 'Housing', scoreA: 2.3, scoreB: 4.8, delta: -2.5, winner: 'B' },
        { name: 'Cost of Living', scoreA: 3.8, scoreB: 5.5, delta: -1.7, winner: 'B' },
        { name: 'Startups', scoreA: 8.4, scoreB: 7.1, delta: 1.3, winner: 'A' },
        { name: 'Safety', scoreA: 5.6, scoreB: 6.9, delta: -1.3, winner: 'B' },
        { name: 'Healthcare', scoreA: 6.3, scoreB: 6.1, delta: 0.2, winner: 'A' }
    ];

    it('renders SVG with legend and axis labels', () => {
        render(
            <RadarChart
                cityAName="Seattle"
                cityBName="Salt Lake City"
                categories={mockCategories}
            />
        );

        expect(screen.getByTestId('radar-chart-wrapper')).toBeInTheDocument();
        expect(screen.getByText('Seattle')).toBeInTheDocument();
        expect(screen.getByText('Salt Lake City')).toBeInTheDocument();

        // Perimeter axis labels
        expect(screen.getByText('Housing')).toBeInTheDocument();
        expect(screen.getByText('Cost of Living')).toBeInTheDocument();
        expect(screen.getByText('Startups')).toBeInTheDocument();
    });

    it('shows interactive tooltip on hovering an axis label', () => {
        render(
            <RadarChart
                cityAName="Seattle"
                cityBName="Salt Lake City"
                categories={mockCategories}
            />
        );

        const startupsLabel = screen.getByRole('button', { name: /Startups: Seattle 8.4, Salt Lake City 7.1/i });
        fireEvent.mouseEnter(startupsLabel);

        expect(screen.getByText(/\+1.3 Seattle advantage/i)).toBeInTheDocument();
    });
});

describe('ComparisonView Component', () => {
    beforeEach(() => {
        axios.get.mockImplementation((url) => {
            if (url.includes('geonameid:21513')) return Promise.resolve({ data: mockCityA });
            if (url.includes('geonameid:5780993')) return Promise.resolve({ data: mockCityB });
            if (url.includes('seattle-washington/scores')) return Promise.resolve({ data: mockScoresA });
            if (url.includes('salt-lake-city/scores')) return Promise.resolve({ data: mockScoresB });
            if (url.includes('seattle-washington/images')) return Promise.resolve({ data: mockImages });
            if (url.includes('salt-lake-city/images')) return Promise.resolve({ data: mockImages });
            return Promise.reject(new Error(`Unhandled URL: ${url}`));
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('loads and renders side-by-side comparison cards and category metrics', async () => {
        const onExitMock = vi.fn();

        render(
            <ComparisonView
                cityA={mockCityA}
                cityB={mockCityB}
                onExit={onExitMock}
                onChangeCities={() => {}}
                onSwapCities={() => {}}
            />
        );

        // Loading state initially
        expect(screen.getByTestId('comparison-loading')).toBeInTheDocument();

        // Resolves data
        await waitFor(() => {
            expect(screen.getByTestId('comparison-view')).toBeInTheDocument();
        });

        // Check City A and City B headers
        expect(screen.getAllByText('Seattle').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Salt Lake City').length).toBeGreaterThan(0);

        // Check Composite Scores
        expect(screen.getByText(/60\.5/)).toBeInTheDocument();
        expect(screen.getByText(/62\.1/)).toBeInTheDocument();

        // Check Overall delta pill (Salt Lake City +1.6 overall)
        expect(screen.getByText(/Salt Lake City \+1.6 overall/i)).toBeInTheDocument();

        // Check matched categories are rendered in radar chart and breakdown cards
        expect(screen.getAllByText('Housing').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('Cost of Living').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('Startups').length).toBeGreaterThanOrEqual(2);

        // Delta indicator pills:
        // Housing: Salt Lake City is 4.85 vs Seattle 2.29 => Salt Lake City +2.6
        expect(screen.getByText(/\+2.6 Salt Lake City/i)).toBeInTheDocument();
        // Startups / leads for Seattle
        expect(screen.getAllByText(/\+1.3 Seattle/i).length).toBeGreaterThanOrEqual(1);

        // Test Exit Comparison button
        const exitBtn = screen.getByRole('button', { name: /Exit comparison mode/i });
        fireEvent.click(exitBtn);
        expect(onExitMock).toHaveBeenCalled();
    });

    it('toggles between Radar Chart and Bar Comparison modes', async () => {
        render(
            <ComparisonView
                cityA={mockCityA}
                cityB={mockCityB}
                onExit={() => {}}
                onChangeCities={() => {}}
                onSwapCities={() => {}}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('comparison-view')).toBeInTheDocument();
        });

        // Default is radar chart
        expect(screen.getByTestId('radar-chart-wrapper')).toBeInTheDocument();

        // Toggle to Bar Comparison
        const barToggleBtn = screen.getByRole('tab', { name: /Bar Comparison/i });
        fireEvent.click(barToggleBtn);

        expect(screen.getByTestId('bar-chart-container')).toBeInTheDocument();
    });

    it('filters categories by Core 14 and All Categories', async () => {
        render(
            <ComparisonView
                cityA={mockCityA}
                cityB={mockCityB}
                onExit={() => {}}
                onChangeCities={() => {}}
                onSwapCities={() => {}}
            />
        );

        await waitFor(() => {
            expect(screen.getByTestId('comparison-view')).toBeInTheDocument();
        });

        const coreBtn = screen.getByRole('button', { name: /Core 14 Categories/i });
        fireEvent.click(coreBtn);
        expect(coreBtn).toHaveClass('active');
    });
});
