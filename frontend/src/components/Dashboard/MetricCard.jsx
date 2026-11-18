function MetricCard({ title, value, unit = "", icon = "📊" }) {
  const hasValue =
    value !== null &&
    value !== undefined &&
    value !== "";

  const displayValue = hasValue ? value : "--";

  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <span className="metric-card-title">{title}</span>
        <span className="metric-card-icon" aria-hidden="true">
          {icon}
        </span>
      </div>

      <div className="metric-card-value">
        <span>{displayValue}</span>
        {hasValue && unit && (
          <span className="metric-card-unit">{unit}</span>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
