import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders the scraper workspace', () => {
  const { getByText } = render(<App />);
  expect(getByText(/Spidey/i)).toBeInTheDocument();
  expect(getByText(/Scrapear web/i)).toBeInTheDocument();
});
