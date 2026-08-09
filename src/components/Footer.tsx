export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6">
        <p>
          <span className="font-semibold text-slate-700">FindBack</span> — reunite lost items with
          their owners.
        </p>
        <p className="text-xs">Matches are possible matches, never a guarantee of ownership.</p>
      </div>
    </footer>
  );
}
