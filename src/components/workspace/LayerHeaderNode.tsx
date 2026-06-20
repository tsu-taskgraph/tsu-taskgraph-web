export function LayerHeaderNode() {
  return (
    <div className="pointer-events-none select-none flex flex-col items-center justify-center -translate-x-1/2 w-[300px] h-1 relative">
      <div
        className="w-px border-l border-dashed border-slate-800/40 light:border-slate-300/60 pointer-events-none absolute"
        style={{ height: '12000px', top: '-6000px' }}
      />
    </div>
  );
}
