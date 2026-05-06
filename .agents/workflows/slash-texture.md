---
name: slash-texture
description: Generate a seamless flat-color albedo map prompt for 3D rendering.
---
# Workflow: Seamless Texture (!texture)

This workflow is triggered when the user executes the command `/slash-texture` or `!texture [material]`.

## Execution Steps:
1. **Surface Positioning**: Ensure the prompt describes a flat surface, viewed directly from above (top-down view, flat lay).
2. **Material Properties**: Detail the roughness, glossiness, porosity, and light reflection style (albedo, diffuse, roughness map style).
3. **Seamless Constraint**: Add keywords such as "seamless repeating pattern", "edge-to-edge uniform lighting", "no vignette", "no harsh shadows".
4. **Output**: Return a prompt structure optimized for generating PBR textures.
