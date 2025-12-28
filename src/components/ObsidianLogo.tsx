export function ObsidianLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Sharp faceted crystal note design */}
            <path
                d="M65 10 L85 25 L65 40 L65 75 L35 90 L15 75 L15 45 L45 30 L45 70 L65 60 L65 10 Z"
                fill="currentColor"
                stroke="none"
            />
            {/* Internal facet detail line for depth */}
            <path
                d="M45 30 L65 40 M45 30 L45 70 M45 70 L15 75 M45 70 L35 90"
                fill="none"
                stroke="#1e1e1e"
                strokeWidth="2"
                opacity="0.3"
            />
        </svg>
    );
}
