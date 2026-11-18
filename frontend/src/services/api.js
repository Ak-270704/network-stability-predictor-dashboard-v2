import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export const getLocations = async () => {
  const response = await api.get("/api/locations");
  return response.data.data;
};

export const getLatestMLMetric = async () => {
  const response = await api.get("/api/metrics/ml/latest");
  return response.data.data;
};

export const getMLMetricHistory = async (locationId) => {
  const response = await api.get(
    `/api/metrics/ml/history/${locationId}`
  );
  return response.data.data;
};

export const getLatestPrediction = async () => {
  const response = await api.get("/api/predictions/latest");
  return response.data.data;
};

export const getPredictionByMetricId = async (metricId) => {
  if (!metricId) return null;

  const response = await api.get("/api/predictions");

  const predictions = response.data.data;

  if (!Array.isArray(predictions)) {
    return null;
  }

  return (
    predictions.find(
      (prediction) => prediction._id === metricId
    ) || null
  );
};
export default api;
