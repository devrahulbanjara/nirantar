"use client";

export type ChoiceItem = {
  id: string;
  title: string;
  meta?: string;
  disabled?: boolean;
};

export function ChoiceList({
  items,
  labelledBy,
  onSelect,
}: {
  items: ChoiceItem[];
  labelledBy: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="choice-list" role="listbox" aria-labelledby={labelledBy}>
      {items.map((item) => (
        <button
          key={item.id}
          className="choice-row"
          type="button"
          role="option"
          disabled={item.disabled}
          onClick={() => onSelect(item.id)}
        >
          <span className="choice-row-title">{item.title}</span>
          {item.meta ? <span className="choice-row-meta">{item.meta}</span> : null}
        </button>
      ))}
    </div>
  );
}
