import fitz  # PyMuPDF
import os
from PIL import Image
import io

def extract_and_slice():
    pdf_path = os.path.join(os.path.dirname(__file__), '../src/dataset for sign language.pdf')
    out_dir = os.path.join(os.path.dirname(__file__), '../public/dataset-images')
    os.makedirs(out_dir, exist_ok=True)
    
    print("Opening PDF...")
    doc = fitz.open(pdf_path)
    
    # Page 94 in the document (0-indexed, so 93)
    # The OCR text says page 90 has the title "SIGN LANGUAGE AND PICTOGRAPHY" and the words "Brothers", "Come", etc.
    # Let's render page 93 (0-indexed). We might need to check pages 90-95 to be sure.
    page_num = 93 
    
    print(f"Rendering page {page_num}...")
    page = doc.load_page(page_num)
    pix = page.get_pixmap(dpi=200)
    
    img_data = pix.tobytes("png")
    img = Image.open(io.BytesIO(img_data))
    
    print("Original image size:", img.size)
    
    # Crop the grid. We will assume the grid takes up most of the page.
    # We will slice into 8 rows and 3 columns.
    words = [
        'below', 'brothers', 'come',
        'day', 'deer', 'eat',
        'fear', 'grass', 'hear',
        'heart', 'hungry', 'lightning',
        'many', 'moon', 'mountain',
        'old', 'peace', 'rain',
        'see', 'snake', 'sun',
        'talk', 'trade', 'tree'
    ]
    
    # We need to drop the margins. 
    # Let's assume margins are roughly 10% top, 10% bottom, 10% left, 10% right.
    # We will crop the center 80% and slice.
    width, height = img.size
    left_margin = width * 0.08
    right_margin = width * 0.92
    top_margin = height * 0.08
    bottom_margin = height * 0.92
    
    grid_width = right_margin - left_margin
    grid_height = bottom_margin - top_margin
    
    cell_width = grid_width / 3
    cell_height = grid_height / 8
    
    print("Slicing image into 24 cells...")
    for i, word in enumerate(words):
        row = i // 3
        col = i % 3
        
        left = left_margin + col * cell_width
        top = top_margin + row * cell_height
        right = left + cell_width
        bottom = top + cell_height
        
        cell_img = img.crop((left, top, right, bottom))
        cell_img.save(os.path.join(out_dir, f"{word}.jpg"))
        
    print(f"Successfully extracted {len(words)} hand-drawn illustrations!")

if __name__ == "__main__":
    extract_and_slice()
