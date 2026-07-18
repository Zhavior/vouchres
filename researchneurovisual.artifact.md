# RESEARCH ARTIFACT: NEURO-VISUAL PARAMETERS v1.0
## SCIENTIFIC DIRECTIVE FOR ADHD UI/UX REGULATION

### 1. OKLCH Color Psychology (Cognitive Fatigue Reduction)
High-contrast neons and pure primary colors (especially red) trigger cortisol and visual fatigue in ADHD brains. Use the perceptually uniform OKLCH color space for calming, low-arousal aesthetics.
* **Backgrounds (Low Reflectance):** Deep Slate `oklch(20% 0.01 260)` to `oklch(15% 0.02 240)`.
* **Primary Accents (Dopamine Safe):** Muted Sage `oklch(75% 0.08 140)` or Soft Lavender `oklch(70% 0.1 300)`. 
* **Text Contrast:** Avoid pure white (`#FFF`). Use `oklch(90% 0.01 260)` for primary text to prevent astigmatism glare and reading fatigue.

### 2. Kinetic Safety (Motion Easing Mathematics)
Erratic, unpredictable UI motion overstimulates the ADHD sensory system. All motion must feel heavy, predictable, and physically grounded.
* **The "Grounding" Curve:** Use `cubic-bezier(0.22, 1, 0.36, 1)` for all structural UI transitions. This creates a fast initial response (dopamine hit) but smoothly decelerates (safety).
* **Duration Limits:** No transition should exceed `400ms`. Waiting for slow animations creates cognitive friction and breaks working memory.

### 3. Visual Noise & Glassmorphism Limits
While blur effects are premium, excessive visual noise destroys focus. 
* **Background Blur:** Limit `backdrop-filter: blur()` to a maximum of `24px`. 
* **Film Grain / Stochastic Visuals:** If using film grain to sync with Brown Noise, opacity must not exceed `0.04` (4%). Anything higher causes visual clutter.

### 4. Gamma Sync (40Hz Visual Modulation)
To reinforce the 40Hz binaural beat used for Default Mode Network (DMN) suppression, WebGPU lighting meshes must pulse subtly.
* **Modulation Formula:** Map the 40Hz audio frequency to a visual opacity shift of no more than `±2.5%` on the global ambient light shader. The pulse must be subconscious; if the user consciously notices the screen flashing, it will induce anxiety.