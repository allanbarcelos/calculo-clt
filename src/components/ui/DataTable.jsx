// Generic table driven by a column definition: { key, label, rowHeader?, numeric? }.
export default function DataTable({ caption, columns, rows, footer, captionHidden = false, rowClassName }) {
  const cell = (column, row) => {
    const className = column.numeric ? 'num' : undefined;
    return column.rowHeader
      ? <th key={column.key} scope="row" className={className}>{row[column.key]}</th>
      : <td key={column.key} className={className}>{row[column.key]}</td>;
  };

  return (
    <div className="table-scroll">
      <table className="breakdown">
        {caption && <caption className={captionHidden ? 'visually-hidden' : undefined}>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => <th key={c.key} scope="col" className={c.numeric ? 'num' : undefined}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className={rowClassName?.(row)}>
              {columns.map((c) => cell(c, row))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr>{columns.map((c) => cell(c, footer))}</tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
