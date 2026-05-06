# Advanced Prompting Techniques

To achieve the best results on Google Flow, apply the following techniques:

## 1. "Anchor & Layer" Technique
Avoid writing a single cluttered sentence. Divide into layers:
- **Layer 1 (Anchor)**: Main subject (e.g., A crystal sphere).
- **Layer 2 (Details)**: Materials and surfaces (e.g., Frosted glass with internal air bubbles).
- **Layer 3 (Environment)**: Lighting and space (e.g., Purple rim light, placed on a wooden table).
- **Layer 4 (Technical)**: Camera and style (e.g., Macro shot, extreme bokeh).

## 2. "Material Specification" Technique
Instead of using generic terms like "metallic," use precise 3D/PBR terminology:
- `Brushed aluminum`
- `Anodized metal`
- `Oxidized copper`
- `Polished chrome`
- `Subsurface scattering` (Use for skin, wax, or plastic to allow light penetration).

## 3. "Motion Prompting" for Veo 3.1
To prevent video distortion, describe actions using strong and simple verbs:
- **Good**: `Fluidly flowing`, `Slowly rotating`, `Merging`, `Disintegrating`.
- **Avoid**: Overly complex actions in a single sentence (e.g., "Run then jump then turn into a bird"). Break them into separate "Scenes."

## 4. "Negative Prompting" (Exclusions)
While Flow primarily uses positive prompts, you can guide the Agent to exclude common errors:
- `Avoid plastic look`
- `No motion blur on the subject`
- `No flickering` (light stability).

## 5. "Ingredient Consistency"
When using an image as input for a video:
- Always start the prompt with: `Based on the attached image...`
- Describe only the **changes**, do not re-describe the entire image to avoid unintended AI creativity.

## 6. "Multimodal Briefing" (Using Reference Images)
When providing an image, include specific requests to focus the Agent:
- **"Match lighting style"**: Focus on light sources, shadow colors, and contrast.
- **"Keep subject identity"**: Detailed description of the character/object to create a consistent "Ingredient."
- **"Simulate texture"**: Analyze surfaces (fabric, metal, skin) to use corresponding PBR terms.

**Example Command**: `/ref create a video from this image, orbit camera around it`

## 7. "Timecode Prompting" (Storyboarding)
To control video content over time within a clip (typically 4-8 seconds), use time-segment syntax:
- **Principle**: Google Veo understands temporal sequences well if placed in square brackets or described in a First/Then/Finally order.
- **Syntax**: `[00:00-00:02: Action 1] + [00:02-00:05: Action 2]`.
- **Application**: Highly effective for transitional shots (e.g., a flower blooming then withering, or a camera dolly-in then panning).

**Note**: Do not pack more than 3 actions into an 8-second clip to prevent AI confusion and image distortion.
