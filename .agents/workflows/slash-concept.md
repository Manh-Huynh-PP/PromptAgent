---
name: slash-concept
description: Generate 3 different style variations for an idea and save them to active_project.md.
---
# Workflow: Ideation Concept (!concept)

This workflow is triggered when the user executes the command `/slash-concept` or `!concept [idea]`.

## Execution Steps:
1. **Analyze Idea**: Grasp the core subject from the user's request.
2. **Create 3 Variations**: Generate 3 distinctly different visual styles (e.g., Cinematic, Minimalist, Cyberpunk, Ethereal, etc.).
3. **Format Prompts**: Each variation must strictly adhere to the 5-part formula (Shot + Camera Motion + Subject + Action + Style).
4. **Presentation**: Display them as a list or a comparison table to help the user choose easily.
5. **Update Project**: Remind the user that the chosen option will be saved into `prompt_studio/active_project.md`.
