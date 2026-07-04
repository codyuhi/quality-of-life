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
