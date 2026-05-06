---
name: slash-polish
description: Convert the user's raw prompt into the standard 5-part Google Flow structure.
---
# Workflow: Prompt Optimization (!polish)

This workflow is triggered when the user executes the command `/slash-polish` or `!polish [prompt]`.

## Execution Steps:
1. **Receive & Analyze**: Read the user's raw prompt and identify missing components (e.g., missing lighting, missing camera type).
2. **Remove Weak Words**: Eliminate generic adjectives like "beautiful", "good", "nice".
3. **Restructure**: Rearrange the prompt following the formula: `[Shot Type] + [Camera Motion] + [Subject] + [Action] + [Style & Ambiance]`.
4. **Add Technical Terminology**: Include physical parameters (24mm lens, f/1.8) or lighting techniques (volumetric, chiaroscuro) to sharpen the image.
5. **Policy-Safe Check**: Ensure there are no policy-violating keywords (change "shock" to "amazement", "beer" to "golden sparkling beverage").
6. **Output**: Display the raw prompt vs. the polished prompt for the user to compare.
