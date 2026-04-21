export default function Input({
  label,
  error,
  as = "input",
  options = [],
  className = "",
  ...props
}) {
  const Component = as;

  return (
    <label className="field">
      {label ? <span className="field-label">{label}</span> : null}
      {as === "select" ? (
        <select className={`field-control ${className}`.trim()} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <Component className={`field-control ${className}`.trim()} {...props} />
      )}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
