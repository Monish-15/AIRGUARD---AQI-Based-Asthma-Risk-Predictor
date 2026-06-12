# 🌬️ AIRGUARD – AQI Based Asthma Risk Predictor

AIRGUARD is an intelligent healthcare and environmental monitoring system that predicts asthma risk based on Air Quality Index (AQI) and environmental conditions. The system leverages Machine Learning to analyze pollution levels and assess the potential health impact on asthma patients, helping users take preventive measures before exposure to harmful air conditions.

---

## 📌 Project Overview

Air pollution is one of the major triggers for asthma attacks and respiratory illnesses. AIRGUARD aims to provide early warnings by analyzing air quality parameters and predicting the likelihood of asthma-related health risks.

The system combines environmental data analysis with machine learning techniques to generate personalized asthma risk assessments and health recommendations.

---

## 🎯 Objectives

- Predict asthma risk using AQI and environmental parameters.
- Monitor air quality conditions in real time.
- Provide health alerts for sensitive individuals.
- Assist users in making informed outdoor activity decisions.
- Promote awareness regarding air pollution and respiratory health.

---

## ✨ Key Features

### 🌍 Air Quality Monitoring
- AQI-based environmental analysis
- Pollution severity classification
- Air quality trend visualization

### 🤖 Machine Learning Prediction
- Asthma risk prediction model
- Data-driven health assessment
- Predictive analytics based on environmental factors

### 📊 Data Visualization
- Interactive charts and graphs
- AQI trend monitoring
- Pollution level analysis

### ⚠ Health Risk Alerts
- Risk categorization (Low, Moderate, High)
- Personalized recommendations
- Preventive health guidance

### 💻 User-Friendly Interface
- Simple and intuitive design
- Real-time prediction results
- Easy accessibility for users

---

## 🏗 System Architecture

```text
Environmental Data
        │
        ▼
 Data Collection
        │
        ▼
 Data Preprocessing
        │
        ▼
 Machine Learning Model
        │
        ▼
 Asthma Risk Prediction
        │
        ▼
 Health Recommendations
```

---

## 🛠 Technology Stack

### Programming Language
- Python

### Data Analysis
- Pandas
- NumPy

### Machine Learning
- Scikit-Learn
- Random Forest / Regression Models

### Data Visualization
- Matplotlib
- Seaborn

### Frontend
- HTML
- CSS
- JavaScript

### Development Environment
- Jupyter Notebook
- VS Code

---

## 📂 Project Structure

```text
AIRGUARD-AQI-Based-Asthma-Risk-Predictor/
│
├── dataset/
│   ├── AQI Dataset
│
├── notebooks/
│   ├── Data Analysis
│   ├── Model Training
│
├── models/
│   ├── Trained ML Models
│
├── frontend/
│   ├── HTML
│   ├── CSS
│   └── JavaScript
│
├── app.py
├── requirements.txt
└── README.md
```

---

## 📊 Dataset Features

The prediction model utilizes environmental factors such as:

- AQI
- PM2.5
- PM10
- NO₂
- SO₂
- CO
- O₃
- Temperature
- Humidity

These factors are commonly associated with respiratory health risks and asthma symptoms. Research has shown that particulate matter and poor air quality significantly influence asthma conditions. :contentReference[oaicite:0]{index=0}

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/Monish-15/AIRGUARD---AQI-Based-Asthma-Risk-Predictor.git
```

### Navigate to Project Directory

```bash
cd AIRGUARD---AQI-Based-Asthma-Risk-Predictor
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Application

```bash
python app.py
```

---

## 🔄 Workflow

### Step 1: Data Collection
Environmental and AQI data are collected from the dataset or external sources.

### Step 2: Data Preprocessing
- Missing value handling
- Feature scaling
- Data cleaning

### Step 3: Model Training
Machine learning algorithms are trained using historical AQI and health-related data.

### Step 4: Prediction
The trained model predicts asthma risk levels.

### Step 5: Result Generation
Users receive:
- Predicted risk category
- AQI information
- Health recommendations

---

## 📈 Machine Learning Pipeline

```text
Data Collection
      │
      ▼
Preprocessing
      │
      ▼
Feature Selection
      │
      ▼
Model Training
      │
      ▼
Evaluation
      │
      ▼
Asthma Risk Prediction
```

---

## 🚦 Risk Categories

| AQI Range | Risk Level | Recommendation |
|------------|------------|----------------|
| 0 – 50 | Low | Safe for outdoor activities |
| 51 – 100 | Moderate | Sensitive individuals should be cautious |
| 101 – 200 | High | Reduce outdoor exposure |
| 201+ | Very High | Avoid outdoor activities |

---

## 📊 Expected Outcomes

- Accurate asthma risk prediction
- Improved public awareness
- Better preventive healthcare decisions
- Enhanced environmental health monitoring

---

## 🔮 Future Enhancements

- Real-time AQI API integration
- Mobile application development
- IoT sensor integration
- Personalized health dashboards
- Deep Learning-based prediction models
- Location-based air quality alerts

---

## 🌟 Project Impact

AIRGUARD bridges the gap between environmental monitoring and healthcare by transforming air quality data into actionable health insights. It empowers asthma patients and sensitive individuals to make safer lifestyle decisions based on current environmental conditions.

---

## 👨‍💻 Author

**Monish**

GitHub: :contentReference[oaicite:1]{index=1}

---

## 📜 License

This project is developed for academic, research, and educational purposes. Feel free to modify and extend it according to your requirements.
