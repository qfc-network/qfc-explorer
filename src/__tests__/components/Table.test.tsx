import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Table from '@/components/Table';

type Row = { id: number; name: string; value: number };

const columns = [
  { key: 'name', header: 'Name', render: (row: Row) => row.name },
  { key: 'value', header: 'Value', render: (row: Row) => row.value },
];

const sampleRows: Row[] = [
  { id: 1, name: 'Alice', value: 100 },
  { id: 2, name: 'Bob', value: 200 },
  { id: 3, name: 'Charlie', value: 300 },
];

describe('Table', () => {
  it('shows empty message when no rows', () => {
    render(<Table columns={columns} rows={[]} />);
    expect(screen.getByText('No data yet.')).toBeInTheDocument();
  });

  it('shows custom empty message', () => {
    render(<Table columns={columns} rows={[]} emptyMessage="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<Table columns={columns} rows={sampleRows} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('renders all rows', () => {
    render(<Table columns={columns} rows={sampleRows} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('renders cell values from render functions', () => {
    render(<Table columns={columns} rows={sampleRows} />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('uses keyField for row keys', () => {
    const { container } = render(<Table columns={columns} rows={sampleRows} keyField="id" />);
    const tbody = container.querySelector('tbody');
    expect(tbody?.children).toHaveLength(3);
  });

  it('renders a table element with proper role', () => {
    render(<Table columns={columns} rows={sampleRows} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders column headers as th elements', () => {
    render(<Table columns={columns} rows={sampleRows} />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(2);
  });

  it('handles column with custom render returning JSX', () => {
    const customColumns = [
      {
        key: 'name',
        header: 'Name',
        render: (row: Row) => <strong data-testid="bold-name">{row.name}</strong>,
      },
    ];
    render(<Table columns={customColumns} rows={[sampleRows[0]]} />);
    expect(screen.getByTestId('bold-name')).toHaveTextContent('Alice');
  });

  it('applies column className', () => {
    const columnsWithClass = [
      { key: 'name', header: 'Name', render: (row: Row) => row.name, className: 'font-mono' },
    ];
    render(<Table columns={columnsWithClass} rows={sampleRows} />);
    const header = screen.getByRole('columnheader');
    expect(header.className).toContain('font-mono');
  });
});
