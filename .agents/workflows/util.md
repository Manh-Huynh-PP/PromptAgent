---
name: util
description: Generate specialized prompts for utilities (image expansion, sketching, vector creation, text insertion).
---
# Workflow: Utilities (/util)

This workflow is triggered when the user executes the command `/util` or `/util [task]`.

## Execution Steps:
1. **Identify Utility**: Classify the request category (Vector, Sketch, Typography, Image Expansion).
2. **Set Specific Parameters**:
   - **Text/Typography**: Place text in double quotes `"TEXT"`, specify the font (bold sans-serif, neon script).
   - **Vector/Logo**: Add "flat vector design", "SVG style", "no gradients", "white background".
   - **Sketch**: Add "rough pencil sketch", "charcoal drawing", "architectural blueprint".
   - **Expand/Outpaint**: Use expanded context that seamlessly blends with the original image.
3. **Output**: Return the specialized custom prompt.


