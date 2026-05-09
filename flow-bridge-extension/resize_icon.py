import sys
from PIL import Image

def resize_image(input_path, output_sizes):
    try:
        img = Image.open(input_path)
        for size in output_sizes:
            resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
            output_path = input_path.replace("@4096x", f"_{size}")
            resized_img.save(output_path, format="PNG")
            print(f"Saved: {output_path}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    input_path = "e:/FREELANCE/linkweb/PromptAgent/flow-bridge-extension/prompt_icon@4096x.png"
    sizes = [16, 32, 48, 128]
    resize_image(input_path, sizes)
