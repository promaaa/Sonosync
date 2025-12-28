export function Logo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <circle cx="50" cy="50" r="45" fill="none" stroke="#a882ff" strokeWidth="3" opacity="0.5" />
            <path
                d="M40 30 V70 A 10 10 0 1 0 50 75 V30 L75 25 V60 A 10 10 0 1 0 85 65 V20 Z"
                fill="#a882ff"
            />
        </svg>
    );
}
