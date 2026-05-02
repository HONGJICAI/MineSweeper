import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "icon" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: Variant;
    size?: Size;
    /** Toggle/pressed state — visually overrides the variant with the primary look. */
    active?: boolean;
    disabled?: boolean;
    className?: string;
    title?: string;
    "aria-label"?: string;
}

const sizeClasses: Record<Size, string> = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1",
    lg: "px-6 py-2 text-base",
};

const iconSizeClasses: Record<Size, string> = {
    sm: "p-1",
    md: "p-2",
    lg: "p-3",
};

const variantClasses: Record<Variant, string> = {
    primary:
        "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600 dark:active:bg-blue-700",
    secondary:
        "bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:active:bg-gray-500",
    ghost:
        "bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
    icon:
        "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
    danger:
        "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 dark:bg-red-500 dark:hover:bg-red-600 dark:active:bg-red-700 focus:ring-red-500",
};

const activeClasses = variantClasses.primary;

export function Button({
    children,
    onClick,
    variant = "secondary",
    size = "md",
    active = false,
    className = "",
    disabled = false,
    title,
    "aria-label": ariaLabel,
}: ButtonProps) {
    const baseClass =
        "rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500";
    const sizing = variant === "icon" ? iconSizeClasses[size] : sizeClasses[size];
    const styling = active ? activeClasses : variantClasses[variant];
    const disabledClass = disabled ? "opacity-50 cursor-not-allowed" : "";

    return (
        <button
            type="button"
            onClick={onClick}
            className={`${baseClass} ${sizing} ${styling} ${disabledClass} ${className}`}
            aria-pressed={active}
            aria-label={ariaLabel}
            disabled={disabled}
            title={title}
        >
            {children}
        </button>
    );
}

export default Button;
