interface Props {
  hints: string[];
}

export function HintPanel({ hints }: Props) {
  if (hints.length === 0) return null;
  return (
    <ul className="hints" aria-live="polite">
      {hints.map((hint) => (
        <li key={hint}>💡 {hint}</li>
      ))}
    </ul>
  );
}
