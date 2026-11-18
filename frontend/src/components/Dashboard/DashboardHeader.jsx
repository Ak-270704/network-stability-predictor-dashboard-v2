function DashboardHeader({
  locations = [],
  selectedLocationId = "",
  onLocationChange,
  isConnected = false,
}) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-brand">
        <span className="dashboard-brand-icon" aria-hidden="true">
          📡
        </span>

        <div>
          <h1>Network Stability Dashboard</h1>
          <p>AI-Powered Real-Time Network Monitoring</p>
        </div>
      </div>

      <div className="dashboard-header-controls">
        <div className="location-selector">
          <label htmlFor="location-select">
            Monitoring Location
          </label>

          <select
            id="location-select"
            value={selectedLocationId}
            onChange={(event) =>
              onLocationChange?.(event.target.value)
            }
            disabled={locations.length === 0}
          >
            {locations.length === 0 && (
              <option value="">No locations available</option>
            )}

            {locations.map((location) => (
              <option key={location._id} value={location._id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div
          className={`connection-indicator ${
            isConnected ? "connected" : "disconnected"
          }`}
          role="status"
        >
          <span className="connection-dot" aria-hidden="true" />
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
