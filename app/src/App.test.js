import { render, screen } from '@testing-library/react';
import App from './App';

test('renders quality of life title', () => {
  render(<App />);
  const titleElements = screen.getAllByText(/Quality of Life/i);
  expect(titleElements.length).toBeGreaterThan(0);
});

test('renders search input and button', () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText(/Enter city name.../i);
  expect(inputElement).toBeInTheDocument();

  const buttonElement = screen.getByRole('button', { name: /Search Cities/i });
  expect(buttonElement).toBeInTheDocument();
});

test('renders search description text', () => {
  render(<App />);
  const descElement = screen.getByText(/Compare cost of living, safety, healthcare/i);
  expect(descElement).toBeInTheDocument();
});

test('toggles mobile navigation button and search history', () => {
  render(<App />);
  const mobileNavBtn = screen.getByRole('button', { name: /Toggle mobile menu/i });
  expect(mobileNavBtn).toBeInTheDocument();
  expect(mobileNavBtn).toHaveClass('closed');

  mobileNavBtn.click();
  expect(mobileNavBtn).toHaveClass('open');

  // Verify mobile search dropdown is open
  const dropdown = document.getElementById('Navbar-Mobile-Search-Dropdown');
  expect(dropdown).toHaveClass('open');
});
