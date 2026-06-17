export function SafariTopBar() {
    return (
        <div
            className="pointer-events-none fixed left-1/2 top-1 z-[9999] block h-[11px] w-[89%] -translate-x-1/2 bg-[#020617] [mask-image:linear-gradient(to_right,transparent,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,transparent)] light:bg-[#f1f5f9]"
            aria-hidden="true"
        />
    );
}