
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TIME_OPTIONS = [
  { label: "All Available Time", value: "all" },
  { label: "Last 15 Minutes", value: "900" },
  { label: "Last 1 Hour", value: "3600" },
  { label: "Last 6 Hours", value: "21600" },
  { label: "Last 24 Hours", value: "86400" },
  { label: "Last 7 Days", value: "604800" },
];

const COUNT_OPTIONS = [
  { label: "All Records", value: "all" },
  { label: "Last 5 Measurements", value: "5" },
  { label: "Last 10 Measurements", value: "10" },
  { label: "Last 25 Measurements", value: "25" },
  { label: "Last 50 Measurements", value: "50" },
  { label: "Last 100 Measurements", value: "100" },
];

const CHART_CONFIGS = [
  {
    id: "latency-jitter",
    title: "Latency & Jitter Trends",
    description: "Network response time and latency fluctuations.",
    unit: "ms",
    lines: [
      { key: "latency", name: "Latency (ms)", color: "#38bdf8" },
      { key: "jitter", name: "Jitter (ms)", color: "#a78bfa" },
    ],
  },
  {
    id: "packet-loss",
    title: "Packet Loss Trend",
    description: "Percentage of packets lost over time.",
    unit: "%",
    lines: [
      { key: "packetLoss", name: "Packet Loss (%)", color: "#fb7185" },
    ],
  },
  {
    id: "internet-speed",
    title: "Download & Upload Speed",
    description: "Download and upload bandwidth across measurements.",
    unit: "Mbps",
    lines: [
      { key: "download", name: "Download (Mbps)", color: "#34d399" },
      { key: "upload", name: "Upload (Mbps)", color: "#fbbf24" },
    ],
  },
];

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const formatTime = (value) =>
  new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

function NetworkTrendChart({ config, data }) {
  return (
    <div className="historical-trend-card">
      <div className="historical-trend-header">
        <h3>{config.title}</h3>
        <p>{config.description}</p>
      </div>

      <div className="historical-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 25, left: 5, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              tick={{ fontSize: 11 }}
              minTickGap={30}
              interval="preserveStartEnd"
            />

            <YAxis
              stroke="#94a3b8"
              tick={{ fontSize: 12 }}
              width={55}
              domain={[0, "auto"]}
              unit={` ${config.unit}`}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "10px",
                color: "#f8fafc",
              }}
              labelStyle={{ color: "#f8fafc" }}
              formatter={(value, name) => [
                typeof value === "number"
                  ? Number(value.toFixed(2))
                  : value,
                name,
              ]}
            />

            <Legend verticalAlign="bottom" height={36} />

            {config.lines.map((line) => (
              <Line
                key={line.key}
                type="linear"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#0f172a", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function HistoricalMetricsChart({ history = [] }) {
  const [timeRange, setTimeRange] = useState("all");
  const [measurementCount, setMeasurementCount] = useState("all");
  const [referenceNow, setReferenceNow] = useState(() => Date.now());

  const records = useMemo(() => {
    if (!Array.isArray(history)) return [];

    return history
      .filter(
        (item) =>
          item?.recordedAt &&
          Number.isFinite(new Date(item.recordedAt).getTime())
      )
      .map((item) => ({
        id: item._id,
        recordedAt: new Date(item.recordedAt).getTime(),
        timestamp: new Date(item.recordedAt).toLocaleString("en-IN"),
        time: formatTime(item.recordedAt),
        latency: toNumberOrNull(item.latency_ms),
        jitter: toNumberOrNull(item.jitter_ms),
        packetLoss: toNumberOrNull(item.packet_loss_percent),
        download: toNumberOrNull(item.download_mbps),
        upload: toNumberOrNull(item.upload_mbps),
      }))
      .sort((a, b) => a.recordedAt - b.recordedAt);
  }, [history]);

  const filteredData = useMemo(() => {
    let result = records;

    if (timeRange !== "all") {
      const cutoff = referenceNow - Number(timeRange) * 1000;

      result = result.filter(
        (item) =>
          item.recordedAt >= cutoff &&
          item.recordedAt <= referenceNow
      );
    }

    if (measurementCount !== "all") {
      result = result.slice(-Number(measurementCount));
    }

    return result;
  }, [records, timeRange, measurementCount, referenceNow]);

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
    setReferenceNow(Date.now());
  };

  const handleMeasurementCountChange = (event) => {
    setMeasurementCount(event.target.value);
  };

  const resetFilters = () => {
    setTimeRange("all");
    setMeasurementCount("all");
    setReferenceNow(Date.now());
  };

  return (
    <section className="historical-chart">
      <div className="historical-chart-header">
        <div>
          <h2>Historical Network Analytics</h2>
          <p>
            Explore recorded network performance using interactive filters.
          </p>
        </div>

        <span>{filteredData.length} / {records.length} measurements</span>
      </div>

      <div className="historical-filters">
        <div className="historical-filter-field">
          <label htmlFor="history-time-range">Time Range</label>
          <select
            id="history-time-range"
            value={timeRange}
            onChange={handleTimeRangeChange}
          >
            {TIME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="historical-filter-field">
          <label htmlFor="history-count">Measurements</label>
          <select
            id="history-count"
            value={measurementCount}
            onChange={handleMeasurementCountChange}
          >
            {COUNT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="historical-filter-reset"
          onClick={resetFilters}
        >
          Reset Filters
        </button>
      </div>

      {filteredData.length === 0 ? (
        <p className="dashboard-message">
          {records.length === 0
            ? "No historical measurements available for this location."
            : "No measurements match the selected filters."}
        </p>
      ) : (
        <div className="historical-charts-grid">
          {CHART_CONFIGS.map((config) => (
            <NetworkTrendChart
              key={config.id}
              config={config}
              data={filteredData}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default HistoricalMetricsChart;
