function PredictionPanel({ prediction, processingStatus }) {
  const status = prediction?.predictedStatus ?? "Unavailable";

  const confidence =
    typeof prediction?.confidence === "number"
      ? `${prediction.confidence.toFixed(2)}%`
      : "--";

  const statusClass = status.toLowerCase();

  return (
    <section className="prediction-panel">
      <div className="prediction-panel-header">
        <div>
          <h2>AI Network Stability Prediction</h2>
          <p>Machine learning-based network assessment</p>
        </div>
        <span className={`prediction-status ${statusClass}`}>
          {status}
        </span>
      </div>

      <div className="prediction-panel-content">
        <div className="prediction-detail">
          <span>Prediction Confidence</span>
          <strong>{confidence}</strong>
        </div>

        <div className="prediction-detail">
          <span>Model Version</span>
          <strong>{prediction?.modelVersion ?? "--"}</strong>
        </div>

        <div className="prediction-detail">
          <span>Prediction Horizon</span>
          <strong>{prediction?.predictionHorizon ?? "--"}</strong>
        </div>

        <div className="prediction-detail">
          <span>Processing Status</span>
          <strong>{processingStatus ?? "--"}</strong>
        </div>
      </div>
    </section>
  );
}

export default PredictionPanel;
