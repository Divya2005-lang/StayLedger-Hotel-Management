import { useEffect, useRef, useState } from 'react';

const PRESETS = [
  { label: 'Under ₹5,000', min: '', max: '5000' },
  { label: '₹5,000 – ₹10,000', min: '5000', max: '10000' },
  { label: 'Over ₹10,000', min: '10000', max: '' },
];

/**
 * Title search (debounced) and price-range filter.
 * Local inputs are initialised from the store once; the parent is told about changes via onChange.
 */
export default function FilterBar({ values, onChange, onReset, layout = 'row' }) {
  const [search, setSearch] = useState(values.search);
  const [minPrice, setMinPrice] = useState(values.minPrice);
  const [maxPrice, setMaxPrice] = useState(values.maxPrice);
  const [priceError, setPriceError] = useState('');

  // Keep the latest props in a ref so the debounce effect only reacts to typing.
  const latest = useRef({ values, onChange });
  latest.current = { values, onChange };

  useEffect(() => {
    const next = search.trim();
    if (next === latest.current.values.search) return undefined;
    const timer = setTimeout(() => latest.current.onChange({ search: next }), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const applyPrice = (e) => {
    e.preventDefault();
    const min = minPrice.trim();
    const max = maxPrice.trim();
    const invalid = [min, max].some((v) => v !== '' && (!Number.isFinite(Number(v)) || Number(v) < 0));
    if (invalid) return setPriceError('Enter prices as positive numbers.');
    if (min !== '' && max !== '' && Number(min) > Number(max))
      return setPriceError('The minimum can’t be higher than the maximum.');
    setPriceError('');
    onChange({ minPrice: min, maxPrice: max });
  };

  const usePreset = (preset) => {
    setMinPrice(preset.min);
    setMaxPrice(preset.max);
    setPriceError('');
    onChange({ minPrice: preset.min, maxPrice: preset.max });
  };

  const reset = () => {
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setPriceError('');
    onReset();
  };

  const dirty = search || minPrice || maxPrice || values.search || values.minPrice || values.maxPrice;

  return (
    <form className={`filters filters--${layout}`} onSubmit={applyPrice} role="search" aria-label="Filter hotels">
      <div className="field filters__search">
        <label htmlFor="filter-search">Search by title</label>
        <input
          id="filter-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="e.g. Lakeview"
          autoComplete="off"
        />
      </div>

      <div className="filters__presets" role="group" aria-label="Quick price ranges">
        {PRESETS.map((preset) => {
          const active = values.minPrice === preset.min && values.maxPrice === preset.max;
          return (
            <button
              key={preset.label}
              type="button"
              className={`chip${active ? ' is-active' : ''}`}
              aria-pressed={active}
              onClick={() => usePreset(preset)}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="field">
        <label htmlFor="filter-min">Min price (₹)</label>
        <input
          id="filter-min"
          type="number"
          inputMode="decimal"
          min="0"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          placeholder="0"
          aria-invalid={Boolean(priceError)}
        />
      </div>

      <div className="field">
        <label htmlFor="filter-max">Max price (₹)</label>
        <input
          id="filter-max"
          type="number"
          inputMode="decimal"
          min="0"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Any"
          aria-invalid={Boolean(priceError)}
        />
      </div>

      <div className="filters__buttons">
        <button type="submit" className="btn btn--primary">
          Apply
        </button>
        <button type="button" className="btn btn--ghost" onClick={reset} disabled={!dirty}>
          Reset
        </button>
      </div>

      {priceError && (
        <p className="field-error filters__error" role="alert">
          {priceError}
        </p>
      )}
    </form>
  );
}
