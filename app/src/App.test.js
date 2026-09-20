import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import App from './App';

jest.mock('axios');

const mockCitiesResponse = {
  data: {
    cities: [
      {
        geoname_id: 5391959,
        name: 'San Francisco',
        full_name: 'San Francisco, California, United States',
        country: 'United States',
        continent: 'North America',
        population: 884363,
        latitude: 37.77493,
        longitude: -122.41942,
        urban_area_slug: 'san-francisco-bay-area',
        distance_km: 12.4,
        _links: {
          'city:item': { href: 'http://localhost:5001/api/cities/geonameid:5391959/' }
        }
      },
      {
        geoname_id: 5780993,
        name: 'Salt Lake City',
        full_name: 'Salt Lake City, Utah, United States',
        country: 'United States',
        continent: 'North America',
        population: 200567,
        latitude: 40.76078,
        longitude: -111.89105,
        urban_area_slug: 'salt-lake-city',
        distance_km: 45.2,
        _links: {
          'city:item': { href: 'http://localhost:5001/api/cities/geonameid:5780993/' }
        }
      }
    ],
    pagination: {
      total_cities: 266,
      page: 1,
      limit: 12,
      total_pages: 133,
      has_next: true,
      has_prev: false,
      sort_by: 'distance'
    }
  }
};

beforeEach(() => {
  axios.get.mockResolvedValue(mockCitiesResponse);
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders quality of life title', async () => {
  render(<App />);
  const titleElements = await screen.findAllByText(/Quality of Life/i);
  expect(titleElements.length).toBeGreaterThan(0);
});

test('renders search input and button', async () => {
  render(<App />);
  const inputElement = await screen.findByPlaceholderText(/Enter city name.../i);
  expect(inputElement).toBeInTheDocument();

  const buttonElement = screen.getByRole('button', { name: /Search Cities/i });
  expect(buttonElement).toBeInTheDocument();
});

test('renders search description text', async () => {
  render(<App />);
  const descElement = await screen.findByText(/Compare cost of living, safety, healthcare/i);
  expect(descElement).toBeInTheDocument();
});

test('toggles mobile navigation button and search history', async () => {
  render(<App />);
  const mobileNavBtn = await screen.findByRole('button', { name: /Toggle mobile menu/i });
  expect(mobileNavBtn).toBeInTheDocument();
  expect(mobileNavBtn).toHaveClass('closed');

  mobileNavBtn.click();
  expect(mobileNavBtn).toHaveClass('open');

  // Verify mobile search dropdown is open
  const dropdown = document.getElementById('Navbar-Mobile-Search-Dropdown');
  expect(dropdown).toHaveClass('open');
});

test('renders database status badge with total cities count', async () => {
  render(<App />);
  const badgeElement = await screen.findByText(/266/i);
  expect(badgeElement).toBeInTheDocument();
  expect(screen.getByText(/cities available in database/i)).toBeInTheDocument();
});

test('renders suggested city cards from API', async () => {
  render(<App />);
  const sfCity = await screen.findByText('San Francisco');
  expect(sfCity).toBeInTheDocument();
  expect(screen.getByText('Salt Lake City')).toBeInTheDocument();
});
