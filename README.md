# Network Stability Prediction Dashboard

### AI-Powered Real-Time Network Monitoring and Stability Prediction

A full-stack network monitoring and machine learning system that collects network performance metrics, predicts network stability using a Random Forest classifier, and displays real-time insights through an interactive dashboard.

Developed as an academic project over a 14-week implementation and testing cycle.

## Key Features

- Automated network performance data collection using Python
- Real-time monitoring of latency, jitter, packet loss, and network speed
- Machine learning-based stability classification
- Three prediction categories: Stable, Warning, and Critical
- Random Forest prediction service using FastAPI
- Interactive React dashboard with historical analytics
- Real-time updates using Socket.IO
- Location-based monitoring and filtering
- Separate collector-generated and independent prediction histories
- MongoDB storage for measurements and predictions
- Duplicate measurement prevention and prediction recovery
- Backend validation and error handling

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React.js, Vite, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Machine Learning | Python, scikit-learn, Random Forest |
| ML API | FastAPI, Uvicorn |
| Real-Time Communication | Socket.IO |
| Data Collection | Python |
| Version Control | Git, GitHub |

## System Architecture

```text
       Network Environment
               |
               v
       Python Data Collector
               |
               v
       Node.js / Express API
               |
        +------+------+
        |             |
        v             v
     MongoDB      FastAPI ML Service
        ^             |
        |             v
        +------ Prediction
               |
               v
       Socket.IO Events
               |
               v
       React Dashboard
               |
               v
    Live Monitoring & Analytics
```

The backend receives measurements from the Python collector, stores them in MongoDB, requests predictions from the ML service, links predictions to their measurements, and emits real-time updates to the frontend.

## Network Parameters

The machine learning pipeline uses nine input features:

| Feature | Description |
| --- | --- |
| `latency_ms` | Network round-trip latency |
| `packet_loss_percent` | Percentage of packets lost |
| `jitter_ms` | Variation in network latency |
| `download_mbps` | Download speed |
| `upload_mbps` | Upload speed |
| `wifi_signal_percent` | Wi-Fi signal strength |
| `dns_response_ms` | DNS response time |
| `http_response_ms` | HTTP response time |
| `target_reachable` | Target reachability indicator |

## Machine Learning

The system uses a Random Forest classification model to evaluate network stability.

Prediction categories:

- **Stable:** Network conditions are classified as stable.
- **Warning:** Network conditions indicate potential performance degradation.
- **Critical:** Network conditions indicate significant instability.

The ML service returns a predicted class, confidence score, and model identifier.

Collector-generated predictions are linked to their corresponding network measurements. Independent on-demand predictions are displayed separately in the dashboard.

## Project Structure

```text
network-stability-predictor-dashboard/
|
|-- frontend/       React dashboard
|-- backend/        Express API, MongoDB models, Socket.IO
|-- python-ml/      Python collector and ML prediction service
|-- README.md
|-- LICENSE
```

## Local Setup

### Prerequisites

- Node.js and npm
- Python and pip
- MongoDB database connection
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Ak-270704/network-stability-predictor-dashboard-v2.git
cd network-stability-predictor-dashboard-v2
```

### 2. Backend

Install backend dependencies:

```bash
cd backend
npm install
```

Configure the required backend environment variables, including the MongoDB connection and ML service configuration, according to the project setup.

Start the backend:

```bash
npm run dev
```

Default local backend address:

`http://localhost:5000`

### 3. Machine Learning Service

Open another terminal:

```powershell
cd python-ml
.\.venv\Scripts\Activate.ps1
python -m uvicorn src.api.main:app --reload --port 8000
```

A Python virtual environment and the required Python dependencies must be installed before starting the service.

ML API documentation:

`http://localhost:8000/docs`

### 4. Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Default local frontend address:

`http://localhost:5173`

### 5. Network Collector

The collector submits network measurements to the backend.

Example PowerShell configuration:

```powershell
$env:NETWORK_LOCATION_ID = "<YOUR_LOCATION_ID>"
$env:NETWORK_BACKEND_URL = "http://127.0.0.1:5000/api/metrics/ml"

.\.venv\Scripts\python.exe -m collector.network_collector
```

Replace `<YOUR_LOCATION_ID>` with a valid location ID from your database.

**Important:** Use the correct location ID for the network environment being measured. Do not submit measurements from one location under another location's ID.

## Main API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/locations` | Retrieve configured locations |
| POST | `/api/metrics/ml` | Submit collector measurements |
| GET | `/api/metrics/ml/latest` | Retrieve latest ML measurement |
| GET | `/api/metrics/ml/history/:locationId` | Retrieve measurement history |
| GET | `/api/predictions` | Retrieve predictions |
| GET | `/api/predictions/latest` | Retrieve latest prediction |
| GET | `/api/predictions/classified?locationId=...` | Retrieve collector and independent prediction histories |
| POST | `/api/predictions/ml/current` | Generate an on-demand current prediction |

## Testing and Validation

The project underwent backend, ML integration, frontend, and real-time testing.

Verified checks include:

- API endpoint availability and response validation
- Invalid and nonexistent location/metric ID handling
- Prediction recovery and ML service failure handling
- Measurement-to-prediction database linking
- Collector and independent prediction classification
- Location switching without cross-location data mixing
- Automatic dashboard updates through Socket.IO
- Frontend ESLint validation
- Successful Vite production build
- GitHub synchronization

### Final Integration Test

A controlled measurement was submitted to the Test Location.

| Result | Verified Value |
| --- | --- |
| Measurement ingestion | Successful |
| Prediction status | Completed |
| Predicted network class | Stable |
| Confidence | 92.83% |
| Measurement count | 18 to 19 |
| Collector prediction count | 18 to 19 |
| Independent prediction count | Remained 1 |
| Dashboard automatic update | Successful |

These values represent one verified integration test, not aggregate model accuracy.

## Screenshots

Screenshots of the completed dashboard, prediction history, historical analytics, and location filtering can be added here.

## Future Scope

- Deployment to a hosted environment
- Monitoring across additional network environments
- Expanded model evaluation and retraining
- Advanced anomaly detection and alerting
- Improved dashboard performance and visualization
- Additional predictive analytics capabilities

## Project Team

| Team Member |
| --- |
| Akshat Kaushik |
| Yash Kataria |
| Vishal Bali |
| Balajee Gautam |

Department of Computer Science and Engineering  
Manav Rachna International Institute of Research and Studies

## License

This project is licensed under the **Apache License, Version 2.0**.

See the [LICENSE](LICENSE) file for the complete terms and conditions.

## Acknowledgements

We acknowledge the guidance and support received from our faculty mentors and the Department of Computer Science and Engineering throughout the project.

---

**Network Stability Prediction Dashboard — Academic Project (2026)**
