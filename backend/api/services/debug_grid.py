import os
import cv2
import numpy as np

def debug_grid():
    # Paths setup
    script_dir = os.path.dirname(os.path.abspath(__file__))
    api_dir = os.path.dirname(script_dir)
    backend_dir = os.path.dirname(api_dir)
    root_dir = os.path.dirname(backend_dir)
    
    image_path = os.path.join(api_dir, 'assets', 'blank-paper-log.png')
    output_path = os.path.join(root_dir, 'debug_output.png')
    
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: Could not load image from {image_path}")
        return
        
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)
    
    contours, _ = cv2.findContours(thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        print("Error: No contours found.")
        return
        
    # Find header bounding box
    header_contour = max(contours, key=cv2.contourArea)
    hx, hy, hw, hh = cv2.boundingRect(header_contour)
    
    GRID_ORIGIN_X = hx
    GRID_END_X = hx + hw
    HEADER_BOTTOM_Y = hy + hh
    
    # Calculate bottom of grid
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (hw // 2, 1))
    detect_horizontal = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horizontal_kernel)
    
    roi = detect_horizontal[HEADER_BOTTOM_Y:, hx:hx+hw]
    ys, _ = np.nonzero(roi)
    
    if len(ys) > 0:
        GRID_BOTTOM_Y = HEADER_BOTTOM_Y + np.max(ys)
    else:
        GRID_BOTTOM_Y = HEADER_BOTTOM_Y + hh * 4
        
    grid_height = GRID_BOTTOM_Y - HEADER_BOTTOM_Y
    row_height = grid_height / 4.0
    
    Y_OFF_DUTY = int(HEADER_BOTTOM_Y + row_height * 0.5)
    Y_SLEEPER = int(HEADER_BOTTOM_Y + row_height * 1.5)
    Y_DRIVING = int(HEADER_BOTTOM_Y + row_height * 2.5)
    Y_ON_DUTY = int(HEADER_BOTTOM_Y + row_height * 3.5)
    
    REMARKS_Y = int(GRID_BOTTOM_Y + 100)
    
    # --- REPORT ---
    print("=== Grid Detection Diagnostic Report ===")
    print(f"Header Bounding Box: X={hx}, Y={hy}, Width={hw}, Height={hh}")
    print(f"Calculated Y_OFF_DUTY: {Y_OFF_DUTY}")
    print(f"Calculated Y_SLEEPER:  {Y_SLEEPER}")
    print(f"Calculated Y_DRIVING:  {Y_DRIVING}")
    print(f"Calculated Y_ON_DUTY:  {Y_ON_DUTY}")
    print(f"Calculated REMARKS_Y:  {REMARKS_Y}")
    print("======================================")
    
    # --- VISUALIZE ---
    # Green box around header (BGR format: 0, 255, 0)
    cv2.rectangle(img, (hx, hy), (hx + hw, hy + hh), (0, 255, 0), 4)
    
    # Blue horizontal lines for 4 duty rows (BGR format: 255, 0, 0)
    for y_coord in [Y_OFF_DUTY, Y_SLEEPER, Y_DRIVING, Y_ON_DUTY]:
        cv2.line(img, (GRID_ORIGIN_X, y_coord), (GRID_END_X, y_coord), (255, 0, 0), 3)
        
    # Red dot at (GRID_ORIGIN_X, REMARKS_Y) (BGR format: 0, 0, 255)
    cv2.circle(img, (GRID_ORIGIN_X, REMARKS_Y), 10, (0, 0, 255), -1)
    
    cv2.imwrite(output_path, img)
    print(f"Annotated diagnostic image saved to: {output_path}")

if __name__ == "__main__":
    debug_grid()
