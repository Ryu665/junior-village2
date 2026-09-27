const TONE_CLASSES = {
  parent: "bg-gradient-to-br from-parent-500 to-parent-700 hover:from-parent-500 hover:to-parent-800 text-white",
  junior: "bg-gradient-to-br from-junior-400 to-junior-600 hover:from-junior-400 hover:to-junior-700 text-white",
  ghost: "bg-gradient-to-b from-gray-50 to-gray-200 hover:from-gray-100 hover:to-gray-300 text-gray-700 shadow-card",
  danger: "bg-gradient-to-br from-red-400 to-red-600 hover:to-red-700 text-white",
  outline: "bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 shadow-none",
};

export default function Button({ tone = "junior", className = "", children, disabled, ...props }) {
  return (
    <button
      disabled={disabled}
      className={`btn-big w-full flex items-center justify-center gap-2 ${
        disabled ? "opacity-50 cursor-not-allowed active:scale-100" : ""
      } ${TONE_CLASSES[tone] || TONE_CLASSES.junior} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
