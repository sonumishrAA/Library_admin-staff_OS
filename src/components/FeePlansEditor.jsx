import { useMemo, useState } from 'react';

const toEntries = (feePlans) => Object.entries(feePlans || {})
  .map(([month, amount]) => ({ month: String(month), amount: String(amount) }))
  .sort((left, right) => Number(left.month) - Number(right.month));

export default function FeePlansEditor({ value, onChange }) {
  const [draftMonth, setDraftMonth] = useState('');
  const [draftAmount, setDraftAmount] = useState('');
  const entries = useMemo(() => toEntries(value), [value]);

  const updateEntry = (month, amount) => {
    const next = { ...(value || {}) };
    if (!amount) {
      delete next[String(month)];
    } else {
      next[String(month)] = Number(amount);
    }
    onChange(next);
  };

  return (
    <div className="fee-plan-editor">
      <div className="fee-plan-editor__grid">
        {entries.map((entry) => (
          <div className="fee-plan-editor__row" key={entry.month}>
            <label>
              <span>{entry.month}M</span>
              <input
                type="number"
                min="1"
                value={entry.month}
                onChange={(event) => {
                  const next = { ...(value || {}) };
                  const currentAmount = next[entry.month];
                  delete next[entry.month];
                  next[event.target.value] = Number(currentAmount || 0);
                  onChange(next);
                }}
              />
            </label>
            <label>
              <span>₹</span>
              <input
                type="number"
                min="0"
                value={entry.amount}
                onChange={(event) => updateEntry(entry.month, event.target.value)}
              />
            </label>
            <button type="button" className="ghost-button" onClick={() => updateEntry(entry.month, '')}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="fee-plan-editor__add">
        <input
          type="number"
          min="1"
          placeholder="Month"
          value={draftMonth}
          onChange={(event) => setDraftMonth(event.target.value)}
        />
        <input
          type="number"
          min="0"
          placeholder="Amount"
          value={draftAmount}
          onChange={(event) => setDraftAmount(event.target.value)}
        />
        <button
          type="button"
          className="ghost-button"
          onClick={() => {
            if (!draftMonth || !draftAmount) return;
            onChange({ ...(value || {}), [draftMonth]: Number(draftAmount) });
            setDraftMonth('');
            setDraftAmount('');
          }}
        >
          Add plan
        </button>
      </div>
    </div>
  );
}
