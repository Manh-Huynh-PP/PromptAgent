---
name: animate
description: Create a video prompt (Veo 3.1) incorporating dynamic camera movements from a reference image.
---
# Workflow: Video Motion (/animate)

This workflow is triggered when the user executes the command `/animate` or `/animate [image_desc]`.

## Execution Steps:
1. **Define the Anchor**: Use the reference image or description as the Start Frame / End Frame.
2. **Assign Camera Motion**: Use strong action verbs to direct the camera (e.g., Dolly-in, pan right, whip pan, crash zoom).
3. **Physical Constraints**:
   - Add an "Identity Lock" to preserve the character/product appearance.
   - Add "rigid body" or "maintains perfect structural integrity" keywords to prevent morphing.
4. **Output**: Output the complete video prompt for Veo 3.1 inside a code block.


