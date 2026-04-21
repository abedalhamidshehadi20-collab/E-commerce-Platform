export default function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  loading = false,
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      className={`button button-${variant} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
