from PIL import Image
import sys

def remove_white_bg(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        
        datas = img.getdata()
        
        newData = []
        for item in datas:
            # Change all white (also shades of whites)
            # to transparent
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
        
        img.putdata(newData)
        img.save(output_path, "PNG")
        print("Success! Background removed.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    remove_white_bg(
        "c:/Users/yasht/OneDrive/Desktop/main project testng/relief-web/public/logo.png",
        "c:/Users/yasht/OneDrive/Desktop/main project testng/relief-web/public/logo.png"
    )
