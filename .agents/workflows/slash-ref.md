---
name: slash-ref
description: Analyze the attached image and generate a Nano Banana prompt based on its style and subject.
---
# Workflow: Reference Analysis (!ref)

This workflow is triggered when the user executes the command `/slash-ref` or `!ref [request]`.

## Execution Steps:
1. **Deep Analysis**: Observe and analyze the layers of the attached image, including:
   - Lighting
   - Color palette
   - Textures/Materials
   - Composition
2. **Extract Technical Keywords**: Extract relevant photography/imaging terminology (e.g., "Leica color science", "24mm lens", "Chiaroscuro lighting").
3. **Apply DNA Formula**: Build the prompt using the 5-part structure (Shot + Camera Motion + Subject + Action + Style).
4. **Output**: Return the standard Nano Banana/Google Flow prompt inside a markdown code block for easy copying.
