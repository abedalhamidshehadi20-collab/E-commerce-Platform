export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${status || "pending"}`}>
      {String(status || "pending").replace("_", " ")}
    </span>
  );
}
