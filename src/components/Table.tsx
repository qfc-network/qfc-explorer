type Column<T> = {
  key: string;
  header: string;
  render: (row: T, index?: number) => React.ReactNode;
  className?: string;
};

type TableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
  keyField?: string;
};

export default function Table<T extends Record<string, unknown>>({ columns, rows, emptyMessage, keyField }: TableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-6 text-sm text-slate-500 dark:text-slate-400">
        {emptyMessage ?? 'No data yet.'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
      <table role="table" className="w-full min-w-[600px] text-left text-sm">
        <thead role="rowgroup" className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400">
          <tr role="row">
            {columns.map((column) => (
              <th key={column.key} role="columnheader" scope="col" className={`px-4 py-3 ${column.className ?? ''}`.trim()}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((row, index) => (
            <tr role="row" key={keyField ? String(row[keyField]) : index} className="border-b border-slate-100 dark:border-slate-800/60 last:border-b-0">
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-3 ${column.className ?? ''}`.trim()}>
                  {column.render(row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
