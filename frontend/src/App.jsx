
import { useEffect, useRef, useState } from "react";

import DashboardHeader from "./components/Dashboard/DashboardHeader";
import MetricCard from "./components/Dashboard/MetricCard";
import PredictionPanel from "./components/Dashboard/PredictionPanel";
import HistoricalMetricsChart from "./components/Analytics/HistoricalMetricsChart";
import PredictionHistoryAnalytics from "./components/Analytics/PredictionHistoryAnalytics";

import {
  getLocations,
  getMLMetricHistory,
  getClassifiedPredictionHistory,
  getPredictionByMetricId,
} from "./services/api";

import { socket, joinLocation } from "./services/socket";

import "./App.css";

const METRIC_FIELDS = [
  { key: "latency_ms", title: "Latency", unit: "ms", icon: "⏱️" },
  { key: "packet_loss_percent", title: "Packet Loss", unit: "%", icon: "📉" },
  { key: "jitter_ms", title: "Jitter", unit: "ms", icon: "📊" },
  { key: "download_mbps", title: "Download Speed", unit: "Mbps", icon: "⬇️" },
  { key: "upload_mbps", title: "Upload Speed", unit: "Mbps", icon: "⬆️" },
  { key: "wifi_signal_percent", title: "Wi-Fi Signal", unit: "%", icon: "📶" },
  { key: "dns_response_ms", title: "DNS Response", unit: "ms", icon: "🌐" },
  { key: "http_response_ms", title: "HTTP Response", unit: "ms", icon: "🔗" },
  { key: "target_reachable", title: "Target Reachable", unit: "", icon: "🎯" },
];

const getLocationId = (item) =>
  typeof item?.location === "object"
    ? item.location?._id
    : item?.location;

const formatMetricValue = (metric, key) => {
  const value = metric?.[key];

  if (value === null || value === undefined) return null;

  if (key === "target_reachable") {
    return value === 1 || value === true ? "Yes" : "No";
  }

  return typeof value === "number"
    ? Number(value.toFixed(2))
    : value;
};

const sortPredictions = (records) =>
  [...records].sort(
    (a, b) =>
      new Date(b.predictedAt).getTime() -
      new Date(a.predictedAt).getTime()
  );

const sortHistory = (records) =>
  [...records].sort(
    (a, b) =>
      new Date(b.recordedAt).getTime() -
      new Date(a.recordedAt).getTime()
  );

function App() {
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [metric, setMetric] = useState(null);
  const [history, setHistory] = useState([]);
  const [prediction, setPrediction] = useState(null);

  // Week 14: Keep the two prediction categories separate.
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [independentPredictions, setIndependentPredictions] = useState([]);
  const [predictionHistoryError, setPredictionHistoryError] = useState("");

  const [connected, setConnected] = useState(socket.connected);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);

  const selectedLocationRef = useRef("");
  const metricRef = useRef(null);

  // Prevent older classification responses from overwriting newer ones.
  const classificationRequestRef = useRef(0);

  useEffect(() => {
    const updateClock = () => setNow(Date.now());

    const initialTimer = setTimeout(updateClock, 0);
    const interval = setInterval(updateClock, 10000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    selectedLocationRef.current = selectedLocationId;
  }, [selectedLocationId]);

  useEffect(() => {
    let active = true;

    getLocations()
      .then((data) => {
        if (!active) return;

        const list = Array.isArray(data) ? data : [];
        setLocations(list);

        if (list.length > 0) {
          selectedLocationRef.current = list[0]._id;
          setSelectedLocationId(list[0]._id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        if (!active) return;

        setError("Unable to load monitoring locations.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedLocationId) return;

    let active = true;

    metricRef.current = null;

    if (socket.connected) {
      joinLocation(selectedLocationId);
    }

    const loadLocationData = async () => {
      setLoading(true);
      setError("");
      setMetric(null);
      setHistory([]);
      setPrediction(null);

      try {
        const historicalRecords =
          await getMLMetricHistory(selectedLocationId);

        if (!active) return;

        const records = Array.isArray(historicalRecords)
          ? sortHistory(historicalRecords)
          : [];

        // Preserve measurements received during the API request.
        setHistory((previous) => {
          const merged = new Map();

          for (const item of records) {
            if (item?._id) {
              merged.set(item._id, item);
            }
          }

          for (const item of previous) {
            if (
              item?._id &&
              getLocationId(item) === selectedLocationId
            ) {
              merged.set(item._id, item);
            }
          }

          return sortHistory([...merged.values()]).slice(0, 100);
        });

        const latest = records[0] ?? null;
        const current = metricRef.current;

        const currentTime = current?.recordedAt
          ? new Date(current.recordedAt).getTime()
          : 0;

        const latestTime = latest?.recordedAt
          ? new Date(latest.recordedAt).getTime()
          : 0;

        if (current && currentTime >= latestTime) {
          return;
        }

        metricRef.current = latest;
        setMetric(latest);
        setPrediction(null);

        if (latest?.predictionStatus === "completed") {
          const matchedPrediction =
            await getPredictionByMetricId(latest._id);

          if (
            active &&
            selectedLocationRef.current === selectedLocationId &&
            metricRef.current?._id === latest._id
          ) {
            setPrediction(matchedPrediction);
          }
        }
      } catch {
        if (active) {
          setError("Unable to load network metrics.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadLocationData();

    return () => {
      active = false;
    };
  }, [selectedLocationId]);

  useEffect(() => {
    if (!selectedLocationId) return;

    let active = true;

    const refreshPredictions = async () => {
      const requestId = ++classificationRequestRef.current;

      try {
        const classified =
          await getClassifiedPredictionHistory(selectedLocationId);

        if (
          !active ||
          requestId !== classificationRequestRef.current ||
          selectedLocationRef.current !== selectedLocationId
        ) {
          return;
        }

        setPredictionHistory(sortPredictions(classified.collector));
        setIndependentPredictions(
          sortPredictions(classified.independent)
        );
        setPredictionHistoryError("");
      } catch {
        if (
          active &&
          requestId === classificationRequestRef.current &&
          selectedLocationRef.current === selectedLocationId
        ) {
          setPredictionHistoryError(
            "Unable to load classified prediction history."
          );
        }
      }
    };

    refreshPredictions();

    // Socket events request a fresh backend classification.
    const handlePredictionUpdate = (incomingPrediction) => {
      if (getLocationId(incomingPrediction) !== selectedLocationId) {
        return;
      }

      refreshPredictions();
    };

    socket.on("prediction:new", handlePredictionUpdate);

    return () => {
      active = false;
      classificationRequestRef.current += 1;
      socket.off("prediction:new", handlePredictionUpdate);
    };
  }, [selectedLocationId]);

  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);

      if (selectedLocationRef.current) {
        joinLocation(selectedLocationRef.current);
      }
    };

    const handleDisconnect = () => setConnected(false);

    const handleMetricUpdate = (incomingMetric) => {
      if (
        getLocationId(incomingMetric) !==
        selectedLocationRef.current
      ) {
        return;
      }

      setHistory((previous) => {
        const existing = previous.filter(
          (item) => item._id !== incomingMetric._id
        );

        return sortHistory([
          incomingMetric,
          ...existing,
        ]).slice(0, 100);
      });

      const current = metricRef.current;

      if (
        current?.recordedAt &&
        incomingMetric?.recordedAt &&
        new Date(incomingMetric.recordedAt) <
          new Date(current.recordedAt)
      ) {
        return;
      }

      metricRef.current = incomingMetric;
      setMetric(incomingMetric);
      setPrediction(null);
      setError("");
    };

    const handlePredictionUpdate = (incomingPrediction) => {
      if (
        getLocationId(incomingPrediction) !==
        selectedLocationRef.current
      ) {
        return;
      }

      // Classification history is refreshed by the other
      // prediction:new listener. This listener only updates
      // the latest measurement's prediction panel.
      if (
        incomingPrediction?._id !==
        metricRef.current?._id
      ) {
        return;
      }

      setPrediction(incomingPrediction);

      setMetric((current) =>
        current
          ? {
              ...current,
              predictionStatus: "completed",
            }
          : current
      );

      setHistory((previous) =>
        previous.map((item) =>
          item._id === incomingPrediction._id
            ? {
                ...item,
                predictionStatus: "completed",
                predictionId: incomingPrediction._id,
              }
            : item
        )
      );
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("networkUpdate", handleMetricUpdate);
    socket.on("prediction:new", handlePredictionUpdate);

    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("networkUpdate", handleMetricUpdate);
      socket.off("prediction:new", handlePredictionUpdate);
      socket.disconnect();
    };
  }, []);

  const handleLocationChange = (locationId) => {
    selectedLocationRef.current = locationId;
    metricRef.current = null;
    classificationRequestRef.current += 1;

    setSelectedLocationId(locationId);
    setMetric(null);
    setPrediction(null);
    setHistory([]);
    setPredictionHistory([]);
    setIndependentPredictions([]);
    setPredictionHistoryError("");
  };

  const recordedAt = metric?.recordedAt
    ? new Date(metric.recordedAt)
    : null;

  const isRecent =
    recordedAt &&
    now - recordedAt.getTime() < 60000 &&
    now >= recordedAt.getTime();

  return (
    <div className="dashboard-page">
      <DashboardHeader
        locations={locations}
        selectedLocationId={selectedLocationId}
        onLocationChange={handleLocationChange}
        isConnected={connected}
      />

      <main className="dashboard-main">
        <section className="dashboard-intro">
          <div>
            <h2>Network Overview</h2>
            <p>
              Monitor network performance and AI-based
              stability predictions.
            </p>
          </div>

          <span
            className={`data-freshness ${
              isRecent ? "fresh" : "stale"
            }`}
          >
            {isRecent
              ? "Recent Measurement"
              : "Historical / No Recent Data"}
          </span>
        </section>

        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}

        {loading ? (
          <p className="dashboard-message">
            Loading network data...
          </p>
        ) : (
          <>
            <section className="metrics-grid">
              {METRIC_FIELDS.map((field) => (
                <MetricCard
                  key={field.key}
                  title={field.title}
                  icon={field.icon}
                  unit={field.unit}
                  value={formatMetricValue(metric, field.key)}
                />
              ))}
            </section>

            <PredictionPanel
              prediction={prediction}
              processingStatus={metric?.predictionStatus}
            />

            <HistoricalMetricsChart history={history} />

            {predictionHistoryError && (
              <p className="dashboard-error" role="alert">
                {predictionHistoryError}
              </p>
            )}

            <PredictionHistoryAnalytics
              predictions={predictionHistory}
            />

            {/* Week 14: Separate independent predictions */}
            <section className="prediction-history">
              <div className="historical-chart-header">
                <div>
                  <h2>On-Demand / Independent Predictions</h2>
                  <p>
                    Predictions generated independently of
                    recorded network measurements.
                  </p>
                </div>

                <span>
                  {independentPredictions.length} predictions
                </span>
              </div>

              {independentPredictions.length === 0 ? (
                <p className="dashboard-message">
                  No independent predictions for this location.
                </p>
              ) : (
                <div className="prediction-history-list">
                  {independentPredictions.map((item) => (
                    <div
                      className="prediction-history-item"
                      key={item._id}
                    >
                      <div>
                        <strong>{item.predictedStatus}</strong>
                        <small>
                          {item.predictedAt
                            ? new Date(
                                item.predictedAt
                              ).toLocaleString("en-IN")
                            : "--"}
                        </small>
                      </div>

                      <span>
                        {Number.isFinite(Number(item.confidence))
                          ? `${Number(item.confidence).toFixed(2)}%`
                          : "--"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="measurement-info">
              <h2>Measurement Information</h2>

              <p>
                <strong>Last Recorded:</strong>{" "}
                {recordedAt
                  ? recordedAt.toLocaleString()
                  : "No measurements available"}
              </p>

              <p>
                <strong>Measurement ID:</strong>{" "}
                {metric?.measurementId ?? "--"}
              </p>

              <p>
                <strong>Prediction ID:</strong>{" "}
                {metric?.predictionId ?? "--"}
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
