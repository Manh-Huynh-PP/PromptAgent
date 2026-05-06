# Workflow: PromptAgent Command Execution

This workflow defines how the Agent processes specialized commands to ensure prompt quality meets Google Flow standards.

## 🔄 Workflow Overview

Upon receiving a command starting with `/`, the Agent follows these steps:
1. **Command Analysis**: Determine the task type (Ref, Concept, Animate, etc.).
2. **Data Collection**: Read reference images (if any) or context from the current day's project file.
3. **Apply DNA Formula**: Construct the prompt using the 5-part structure (Shot + Motion + Subject + Action + Style).
4. **Validation**: Cross-check against constraints (avoid generic terms, enforce identity locking).
5. **Output**: Export the prompt in a code block and update the corresponding date file in `Projects/<project-name>/YYYY-MM-DD.md`.

---

## 🧠 Technique Intelligence

The Agent prioritizes automatic context detection to apply the appropriate technique, while supporting manual overrides via Flags.

### 1. Auto-Detection
- **Temporal Context** (e.g., "8 seconds", "start... end"): Automatically triggers **Timestamping** `[00:00-00:xx]`.
- **Visual Data** (attached images): Automatically triggers **Identity Locking** and **Reference Bridge** terminology.
- **Material Specifics** (e.g., "metal", "leather", "plastic"): Automatically uses **Material Specification** (PBR/3D terminology).
- **Complex Ideas** (multiple subject layers): Automatically applies the **Anchor & Layer** technique.

### 2. Manual Override (Flags)
Users can force specific techniques using the `[flag]` or `--flag` syntax:
- `[timestamp]`: Force time-coded segments even for short descriptions.
- `[macro]`: Focus on surface details and shallow depth of field.
- `[sfx]`: Focus on generating detailed audio descriptions.
- `[lock]`: Enforce strict control over subject/product deformation.

---

## 🛠 Command Logic

### 1. `/ref [request]` (Reference Analysis)
- **Step 1**: Deep analysis of image layers: Lighting, Color, Materials.
- **Step 2**: Extract technical keywords (e.g., "Leica color science", "24mm lens").
- **Step 3**: Generate a Nano Banana prompt maintaining the image's style.

### 2. `/concept [idea]` (Ideation)
- **Step 1**: Create 3 different style variations (e.g., Cinematic, Minimalist, Cyberpunk).
- **Step 2**: Present in a comparison table or Carousel.
- **Step 3**: Save the selected option to the current day's project file.

### 3. `/animate [image_desc]` (Video Motion)
- **Step 1**: Define the Start Frame from the description or image.
- **Step 2**: Assign camera motions (Dolly, Pan, Zoom) using strong verbs.
- **Step 3**: Add physical constraints (Rigid body, No morphing).

### 4. `/storyboard [idea]` (Timeline)
- **Step 1**: Fragment the idea into time-coded segments `[00:00-00:xx]`.
- **Step 2**: Assign SFX and Ambient noise to each segment.
- **Step 3**: Ensure continuity between segments.

### 5. `/polish [prompt]` (Optimization)
- **Step 1**: Receive the user's raw prompt.
- **Step 2**: Restructure into the standard 5-part Google format.
- **Step 3**: Replace weak adjectives with technical terminology.

---

## ⚠️ Execution Constraints

- **No Creative Drift**: Strictly follow Start/End Frame images if provided.
- **Identity Locking**: Automatically append "Identity Lock" for characters/products.
- **Policy-Safe**: Automatically replace sensitive keywords with safe visual descriptions.
