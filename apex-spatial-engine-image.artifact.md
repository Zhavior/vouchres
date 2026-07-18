# ARTIFACT: APEX SPATIAL ENGINE v2.0
## MANDATE: REAL-WORLD GEOSPATIAL SYNTHESIS & VERIFICATION

### 1. Verification-First Mandate
* **No Synthesis without Ground Truth:** Every generation task must start by ingesting real-world reference data.
* **The Verification Loop:** The agent is required to compare the rendered output against the "Ground Truth" coordinate/visual data.
* **Zero-Error Tolerance:** If the geometry or lighting does not mathematically align with the reference, the agent must trigger an autonomous self-correction loop until the error is eliminated.

### 2. High-Fidelity Rendering Rules
* Utilize HDR lighting to replicate real-world light bounces.
* Maintain Apple-tier texture clarity for all stadium/structural surfaces.