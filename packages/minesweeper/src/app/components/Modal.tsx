import React from "react";
const stopPropagation = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
};

function Modal({
    show,
    onClose,
    title = undefined,
    children
}: {
    show: boolean;
    onClose: () => void;
    title?: string;
    blur?: boolean;
    children?: React.ReactNode;
}) {
    if (!show) return null;

    return (
        <div
            className={`fixed inset-0 bg-white/30 flex items-center justify-center z-50`}
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-h-full max-w-md relative"
                onClick={stopPropagation}
            >
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ✖️
                </button>
                {title && (<h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{title}</h2>)
                }
                {children}
            </div>
        </div>
    );
};

export default Modal;