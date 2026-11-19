
import { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const STATUS_CONFIG = [
  { name: "Stable", color: "#34d399" },
  { name: "Warning", color: "#fbbf24" },
  { name: "Critical", color: "#fb7185" },
];

const normalizeStatus = (status) => {
  if (status === "Unstable") return "Critical";

  return STATUS_CONFIG.some(
    (item) => item.name === status
  )
    ? status
    : null;
};

const formatDate = (value) => {
  if (!value) return "--";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "--"
    : date.toLocaleString("en-IN");
};

const formatModelName = (version) =>
  version
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");

function PredictionHistoryAnalytics({ predictions = [] }) {
  const analytics = useMemo(() => {
    const validPredictions = Array.isArray(predictions)
      ? predictions.filter((item) =>
          normalizeStatus(item?.predictedStatus)
        )
      : [];

    const distribution = STATUS_CONFIG.map((status) => ({
      name: status.name,
      color: status.color,
      value: validPredictions.filter(
        (item) =>
          normalizeStatus(item.predictedStatus) === status.name
      ).length,
    }));

    // Step 2: Identify the ML model from API records.
    const modelVersions = [
      ...new Set(
        validPredictions
          .map((item) => item.modelVersion)
          .filter(Boolean)
      ),
    ];

    const modelName =
      modelVersions.length === 0
        ? "Not Available"
        : modelVersions
            .map(formatModelName)
            .join(", ");

    const confidences = validPredictions
      .map((item) => Number(item.confidence))
      .filter((value) => Number.isFinite(value));

    const averageConfidence = confidences.length
      ? (
          confidences.reduce((sum, value) => sum + value, 0) /
          confidences.length
        ).toFixed(2)
      : null;

    const recentPredictions = [...validPredictions]
      .sort(
        (a, b) =>
          new Date(b.predictedAt).getTime() -
          new Date(a.predictedAt).getTime()
      )
      .slice(0, 5);

    // Step 3: Include modelName in analytics.
    return {
      distribution,
      averageConfidence,
      recentPredictions,
      modelName,
      total: validPredictions.length,
    };
  }, [predictions]);

  return (
    <section className="prediction-history">
      <div className="historical-chart-header">
        <div>
          <h2>AI Prediction History</h2>
          <p>
            Review historical network stability predictions
            and model confidence.
          </p>
        </div>

        <span>{analytics.total} predictions</span>
      </div>

      {analytics.total === 0 ? (
        <p className="dashboard-message">
          No prediction history available for this location.
        </p>
      ) : (
        <>
          <div className="prediction-summary-grid">
            {analytics.distribution.map((item) => (
              <div
                className="prediction-summary-card"
                key={item.name}
              >
                <span style={{ color: item.color }}>
                  {item.name}
                </span>
                <strong>{item.value}</strong>
              </div>
            ))}

            <div className="prediction-summary-card">
              <span>Average Confidence</span>
              <strong>
                {analytics.averageConfidence === null
                  ? "--"
                  : `${analytics.averageConfidence}%`}
              </strong>
            </div>

            {/* Step 4: Display the ML model used. */}
            <div className="prediction-summary-card">
              <span>ML Model Used</span>
              <strong>{analytics.modelName}</strong>
            </div>
          </div>

          <div className="prediction-history-grid">
            <div className="historical-trend-card">
              <div className="historical-trend-header">
                <h3>Prediction Distribution</h3>
                <p>
                  Stability classifications across recorded
                  predictions.
                </p>
              </div>

              <div className="historical-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.distribution.filter(
                        (item) => item.value > 0
                      )}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="55%"
                      outerRadius="80%"
                      paddingAngle={3}
                    >
                      {analytics.distribution
                        .filter((item) => item.value > 0)
                        .map((item) => (
                          <Cell
                            key={item.name}
                            fill={item.color}
                          />
                        ))}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "10px",
                        color: "#f8fafc",
                      }}
                    />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="historical-trend-card">
              <div className="historical-trend-header">
                <h3>Recent AI Predictions</h3>
                <p>
                  Latest five recorded model decisions.
                </p>
              </div>

              <div className="prediction-history-list">
                {analytics.recentPredictions.map((item) => {
                  const status = normalizeStatus(
                    item.predictedStatus
                  );

                  const statusColor =
                    STATUS_CONFIG.find(
                      (entry) => entry.name === status
                    )?.color ?? "#cbd5e1";

                  return (
                    <div
                      className="prediction-history-item"
                      key={item._id}
                    >
                      <div>
                        <strong
                          style={{ color: statusColor }}
                        >
                          {status}
                        </strong>

                        <small>
                          {formatDate(item.predictedAt)}
                        </small>
                      </div>

                      <span>
                        {Number.isFinite(
                          Number(item.confidence)
                        )
                          ? `${Number(item.confidence).toFixed(2)}%`
                          : "--"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default PredictionHistoryAnalytics;