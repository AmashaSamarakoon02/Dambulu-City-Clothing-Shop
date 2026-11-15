import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const Table = ({ caption, head, rows }) => (
  <div className="overflow-x-auto my-3">
    <table className="w-full text-sm border border-gray-200">
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead className="bg-gray-50">
        <tr>{head.map((h) => <th key={h} scope="col" className="px-3 py-2 text-left font-semibold border-b border-gray-200">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row[0]} className="border-b border-gray-100">{row.map((cell, i) => <td key={i} className="px-3 py-2 tabular-nums">{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Shared size tables (Size Guide page and the product page pop-up).
export const SizeChartTables = () => (
  <>
    <p>Measurements are body measurements in inches. If you are between sizes, we recommend the larger size.</p>
    <h3>Clothing</h3>
    <Table
      caption="Clothing sizes"
      head={['Size', 'Chest', 'Waist', 'Hip']}
      rows={[['XS', '32–33', '25–26', '34–35'], ['S', '34–35', '27–28', '36–37'], ['M', '36–38', '29–31', '38–40'], ['L', '39–41', '32–34', '41–43'], ['XL', '42–44', '35–37', '44–46'], ['XXL', '45–47', '38–40', '47–49']]}
    />
    <h3>Kids</h3>
    <Table caption="Kids sizes" head={['Size', 'Height (cm)']} rows={[['2-3Y', '92–98'], ['4-5Y', '104–110'], ['6-7Y', '116–122'], ['8-9Y', '128–134'], ['10-11Y', '140–146'], ['12-13Y', '152–158']]} />
    <h3>Shoes</h3>
    <Table caption="Shoe sizes" head={['EU', 'UK', 'Foot length (cm)']} rows={[['19', '3 (infant)', '11.5'], ['22', '5.5 (infant)', '13.5'], ['36', '3.5', '23.0'], ['38', '5', '24.0'], ['40', '6.5', '25.5'], ['42', '8', '26.5'], ['44', '9.5', '28.0']]} />
  </>
);

// Accessible modal: focuses the close button, closes on Esc or backdrop click.
export const SizeChartModal = ({ open, onClose }) => {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-chart-title"
        className="relative bg-white w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-lg shadow-2xl"
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 id="size-chart-title" className="text-sm font-semibold uppercase tracking-[0.2em]">Size Chart</h2>
          <button ref={closeRef} onClick={onClose} aria-label="Close size chart" className="p-1 text-gray-500 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 text-sm text-gray-700 leading-relaxed [&_h3]:font-semibold [&_h3]:text-black [&_h3]:mt-5">
          <SizeChartTables />
        </div>
      </div>
    </div>
  );
};
