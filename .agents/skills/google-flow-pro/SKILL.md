---
name: google-flow-pro
description: Advanced prompting techniques for Google Veo 3.1 (Video) and Nano Banana (Image) models.
---

# Google Flow & Image Pro Skill

This skill provides the official framework and advanced techniques for directing Google's state-of-the-art creative models: Veo 3.1 and Nano Banana (Gemini 3 family).

## 🎥 Google Veo 3.1 (Video Generation)

### 1. The Core Formula
`[Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]`

### 2. Timestamp Prompting
Use the `[00:xx-00:xx]` format to define specific action durations within the 4s, 6s, or 8s clips.
- **Example:** `[00:00-00:02] Tracking shot of a runner...`

### 3. Audio Directing
Veo 3.1 supports synchronized audio generation via text cues:
- `SFX:` for specific sound effects (e.g., `SFX: thunder cracks`).
- `Ambient noise:` for background soundscapes (e.g., `Ambient noise: busy cafe chatter`).
- Use quotes for dialogue: `A person says, "Hello there."`

### 4. Transition Control (First & Last Frame)
When using image-to-video transitions, explicitly describe the movement AND the audio connecting them.
- **Rule:** Mention `Using the End Frame as a visual reference` to maintain subject identity.

---

## 🖼️ Google Nano Banana (Image Generation/Gemini 3)

### 1. The Narrative Formula
`[Subject] + [Action] + [Location/context] + [Composition] + [Style]`

### 2. Creative Director Controls
- **Hardware Emulation:** Use specific camera types for unique "Visual DNA" (e.g., `Fujifilm medium-format`, `Leica color science`, `GoPro for action`, `Disposable camera for raw flash`).
- **Lighting Design:** Use professional terms (e.g., `Chiaroscuro`, `Golden hour backlighting`, `Three-point softbox setup`).
- **Materiality:** Describe physical textures explicitly (e.g., `navy blue tweed`, `metallic foil`, `etched silver`).

### 3. Multimodal Prompting
`[Reference images] + [Relationship instruction] + [New scenario]`
- Use up to 14 reference images to maintain characters or objects.

### 4. Typographic Excellence
- Enclose text in quotes: `"TEXT HERE"`.
- Specify fonts: `bold white sans-serif` or `Century Gothic 12px`.

---

## 🎙️ Google Gemini 3.1 Flash TTS (Text-to-Speech)

### 1. The Director's Note Formula
`[Audio Profile] + [Scene] + [Director's Notes]`

### 2. In-Transcript Tags
Use square brackets `[]` within the text to control performance dynamically:
- **Energy:** `[excitedly]`, `[bored]`, `[reluctantly]`, `[panicked]`, `[amazed]`
- **Speed:** `[very fast]`, `[very slow]`, `[one painfully slow word at a time]`
- **Vocal Style:** `[asmr]`, `[deep and loud shouting]`, `[trembling]`, `[whispered]`
- **Non-Verbal:** `[gasp]`, `[giggles]`, `[sighs]`, `[snorts]`, `[crying]`

### 3. Structured Components (Strict Format)
- **# AUDIO PROFILE:** Invent a creative name and title (e.g., `# AUDIO PROFILE: Jasper` followed by `## "The Smooth Storyteller"`).
- **## THE SCENE:** A vivid description of the environment.
- **### DIRECTOR'S NOTES:** 
    - **Style:** Detailed emotional persona and tone instructions.
    - **Pace:** Tempo, rhythm, and flow details.
    - **Accent:** Specific regional or dialect patterns.
- **### SAMPLE CONTEXT:** Description of the role or persona's background.
- **#### TRANSCRIPT:** The exact text to be spoken, utilizing in-transcript tags for performance.

---

## 🛠️ Best Practices
- **Positive Framing:** Describe what is there, not what is missing.
- **Material Consistency:** Always repeat key material descriptions (e.g., "dark brown rustic wood") to prevent jumping between frames.
- **Negative Constraints:** Use specific exclusions like "The bag must not tear or break."
- **TTS Precision:** Use phonetic spellings if the model struggles with a specific word.
