interface SafariBarProps {
    colorClass?: string;
    zIndexClass?: string;
}

export function SafariBottomBar({
    colorClass = "bg-[#020617] light:bg-[#f1f5f9]",
    zIndexClass = "z-[9999]"
}: SafariBarProps) {
    return (
        <div
            className={`pointer-events-none fixed bottom-[3px] left-1/2 block h-[11px] w-[89%] -translate-x-1/2 [mask-image:linear-gradient(to_right,transparent,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,transparent)] ${colorClass} ${zIndexClass}`}
            aria-hidden="true"
        />
    );
}