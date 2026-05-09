---
name: tts
description: Create a professional structured TTS prompt for Gemini 3.1 Flash with specialized tags.
---
# Workflow: TTS Prompt Creation (/tts)

This workflow is triggered when the user executes the command `/tts` or `/tts [script]`.

## Execution Steps:
1. **Script Acquisition**: If a script is provided, use it. Otherwise, ask the user for the text they want the AI to speak.
2. **Persona Selection**: Ask or determine the **Audio Profile** (Gender, Age, Tone).
3. **Environment Setup**: Define the **Scene** (Ambiance, location).
4. **Director's Notes**:
    - Select a **Style** (Emotional tone/Persona).
    - Specify an **Accent** (if needed).
    - Set the **Pacing**.
5. **Tag Integration**: Inject appropriate creative tags `[]` into the script for emotional peaks or specific pacing changes.
6. **Output**: Generate the final structured prompt ready for the Gemini 3.1 Flash TTS model.

## Final Output Template:
# AUDIO PROFILE: [Invent a Name]
## "[Invent a Title]"

## THE SCENE: [Invent a Scene Title]
[Vivid description of the scene]

### DIRECTOR'S NOTES
Style: [Style instructions]
Pace: [Pace instructions]
Accent: [Accent instructions]

### SAMPLE CONTEXT
[Role/Persona description]

#### TRANSCRIPT
[Script with [tags]]
