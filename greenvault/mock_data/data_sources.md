# Data Sources: Gathering and Usage in GreenVault

## Overview
GreenVault integrates data from three main sources to verify and aggregate CO₂ sequestration for carbon credit issuance:

- **Satellite Data**
- **IoT Sensor Data**
- **Carbon Registry Data**

## How Data Are Gathered

### 1. Satellite Data
Satellite data is obtained from remote sensing platforms that monitor land use, vegetation, and forest cover. In a production system, this would involve querying APIs from providers such as NASA, Sentinel Hub, or Google Earth Engine. For this project, sample data is provided in `satellite.json`, including estimated CO₂ sequestration, coverage, and a confidence score reflecting the quality and reliability of the satellite analysis.

### 2. IoT Sensor Data
IoT data comes from ground-based sensors deployed in the project area. These sensors measure environmental parameters relevant to CO₂ sequestration, such as soil moisture, temperature, and biomass. In a real-world scenario, data would be collected via IoT platforms or APIs. Here, `iot.json` contains representative sensor data, including the number of sensors, the measured CO₂ value, and a confidence score based on sensor reliability and data consistency.

### 3. Carbon Registry Data
Carbon registry data is sourced from trusted registries like Verra or Gold Standard, which audit and certify carbon projects. In production, this would involve API access or data exports from these registries. The `carbon_registry.json` file provides sample registry data, including the certified CO₂ amount, registry name, certification level, and a confidence score reflecting the audit quality and registry reputation.

## How Data Are Used

1. **Aggregation:**
   - The integration script reads each data source and extracts the CO₂ amount and confidence score.
   - A weighted average is calculated, giving more influence to sources with higher reliability.

2. **Confidence Calculation:**
   - The confidence scores from each source are averaged and adjusted with a bonus for using multiple sources, resulting in an overall confidence score for the aggregated data.

3. **Blockchain Submission:**
   - The aggregated CO₂ value, confidence score, and a data hash are submitted to the Oasis Oracle contract.
   - The same data is formatted for Sui smart contracts, enabling on-chain carbon credit issuance and verification.

## Summary
By combining satellite, IoT, and registry data, GreenVault ensures that carbon credit claims are based on diverse, cross-validated, and transparent evidence, increasing trust and auditability for all stakeholders.
