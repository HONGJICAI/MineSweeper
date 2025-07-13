export function Button({
    children,
    onClick,
    active = false,
    className = "",
    disabled = false,
    title = undefined,
}: {
    children: React.ReactNode;
    onClick?: () => void;
    active?: boolean;
    className?: string;
    disabled?: boolean;
    title?: string;
}) {
    const baseClass =
        "px-3 py-1 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500";
    const activeClass = active
        ? "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600 dark:active:bg-blue-700"
        : "bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:active:bg-gray-500";
    const disabledClass = disabled
        ? "opacity-50 cursor-not-allowed"
        : "";

    return (
        <button
            onClick={onClick}
            className={`${baseClass} ${activeClass} ${disabledClass} ${className}`}
            aria-pressed={active}
            disabled={disabled}
            title={title}
        >
            {children}
        </button>
    );
}