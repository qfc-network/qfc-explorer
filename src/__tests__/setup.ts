import '@testing-library/jest-dom';
import React from 'react';

// Mock next/image to render a plain <img> so tests can assert on src directly
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // next/image uses 'fill' instead of width/height; convert to plain img attrs
    const { fill, ...rest } = props;
    return React.createElement('img', rest);
  },
}));
