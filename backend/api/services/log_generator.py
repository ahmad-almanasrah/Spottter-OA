import os
import cv2
import uuid
import numpy as np
from PIL import Image, ImageDraw, ImageFont

SCALE_FACTOR = 3

import urllib.request

def get_font(size):
    font_filename = 'Roboto-Regular.ttf'
    font_path = os.path.join(os.path.dirname(__file__), font_filename)
    if not os.path.exists(font_path):
        url = 'https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf'
        try:
            urllib.request.urlretrieve(url, font_path)
        except Exception:
            pass
    try:
        return ImageFont.truetype(font_path, size)
    except Exception:
        return ImageFont.load_default()

def get_grid_coordinates(image_path):
    fallback = (200, 1800, 400, 450, 500, 550, 750, 690)
    
    if not os.path.exists(image_path):
        return fallback
        
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return fallback
        
    _, thresh = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return fallback
        
    grid_contour = max(contours, key=cv2.contourArea)
    hx, hy, hw, hh = cv2.boundingRect(grid_contour)
    
    GRID_ORIGIN_X = int(hx + (hw * 0.055))
    GRID_END_X = int(hx + (hw * 0.89))
    
    Y_OFF_DUTY = int(hy + (hh * 0.30))
    Y_SLEEPER = int(hy + (hh * 0.50))
    Y_DRIVING = int(hy + (hh * 0.70))
    Y_ON_DUTY = int(hy + (hh * 0.90))
    
    GRID_BOTTOM_Y = int(hy + hh)
    REMARKS_Y = int(GRID_BOTTOM_Y + 60)
    
    return GRID_ORIGIN_X, GRID_END_X, Y_OFF_DUTY, Y_SLEEPER, Y_DRIVING, Y_ON_DUTY, REMARKS_Y, GRID_BOTTOM_Y


def generate_logs(schedule):
    base_dir = os.path.dirname(os.path.dirname(__file__))
    assets_dir = os.path.join(base_dir, 'assets')
    blank_log_path = os.path.join(assets_dir, 'blank-paper-log.png')
    
    media_dir = os.path.join(os.path.dirname(base_dir), 'media')
    if not os.path.exists(media_dir):
        os.makedirs(media_dir)
    else:
        for f in os.listdir(media_dir):
            if f.endswith('.png'):
                try:
                    os.remove(os.path.join(media_dir, f))
                except Exception:
                    pass
        
    try:
        base_img = Image.open(blank_log_path).convert('RGB')
    except Exception as e:
        base_img = Image.new('RGB', (2000, 1000), color='white')
        
    orig_width, orig_height = base_img.size
    base_img = base_img.resize((orig_width * SCALE_FACTOR, orig_height * SCALE_FACTOR), Image.Resampling.LANCZOS)
        
    (GRID_ORIGIN_X, GRID_END_X, 
     Y_OFF_DUTY, Y_SLEEPER, Y_DRIVING, Y_ON_DUTY, 
     REMARKS_Y, GRID_BOTTOM_Y) = get_grid_coordinates(blank_log_path)
     
    # Scale coordinates
    GRID_ORIGIN_X *= SCALE_FACTOR
    GRID_END_X *= SCALE_FACTOR
    Y_OFF_DUTY *= SCALE_FACTOR
    Y_SLEEPER *= SCALE_FACTOR
    Y_DRIVING *= SCALE_FACTOR
    Y_ON_DUTY *= SCALE_FACTOR
    REMARKS_Y *= SCALE_FACTOR
    GRID_BOTTOM_Y *= SCALE_FACTOR
        
    pixels_per_hour = (GRID_END_X - GRID_ORIGIN_X) / 24.0
    
    y_positions = {
        "Off-Duty": Y_OFF_DUTY,
        "Sleeper": Y_SLEEPER,
        "Driving": Y_DRIVING,
        "On-Duty": Y_ON_DUTY
    }
    
    day_schedules = []
    current_day = []
    current_day_time = 0.0
    
    for s in schedule:
        dur = s["duration"]
        status = s["status"]
        remark = s.get("remark")
        
        while dur > 0:
            rem_in_day = 24.0 - current_day_time
            if dur <= rem_in_day:
                current_day.append({"status": status, "duration": dur, "remark": remark})
                current_day_time += dur
                dur = 0
            else:
                current_day.append({"status": status, "duration": rem_in_day, "remark": remark})
                day_schedules.append(current_day)
                current_day = []
                current_day_time = 0.0
                dur -= rem_in_day
                remark = None
                
    if current_day:
        day_schedules.append(current_day)
                
    urls = []
    for day_index, day in enumerate(day_schedules):
        img = base_img.copy()
        draw = ImageDraw.Draw(img)
        
        current_x = float(GRID_ORIGIN_X)
        last_y = None
        last_remark_x = -9999
        remark_level = 0
        
        font = get_font(15 * SCALE_FACTOR)
            
        for entry in day:
            status = entry["status"]
            dur = entry["duration"]
            remark = entry.get("remark")
            
            y = y_positions.get(status, Y_OFF_DUTY)
            
            if last_y is not None and last_y != y:
                draw.line([(current_x, last_y), (current_x, y)], fill="red", width=4 * SCALE_FACTOR)
                
            if remark:
                pixels_diff = current_x - last_remark_x
                min_dist = 2.0 * pixels_per_hour
                if pixels_diff < min_dist:
                    remark_level = (remark_level + 1) % 3
                else:
                    remark_level = 0
                    
                staggered_y = REMARKS_Y + (remark_level * 50 * SCALE_FACTOR)
                
                # Flag line straight down to staggered_y
                draw.line([(current_x, GRID_BOTTOM_Y), (current_x, staggered_y)], fill="black", width=1 * SCALE_FACTOR)
                # Short angled line
                draw.line([(current_x, staggered_y), (current_x + 20 * SCALE_FACTOR, staggered_y + 20 * SCALE_FACTOR)], fill="black", width=1 * SCALE_FACTOR)
                
                text_bbox = font.getbbox(remark)
                text_width = text_bbox[2] - text_bbox[0]
                text_height = text_bbox[3] - text_bbox[1]
                
                txt_img = Image.new('RGBA', (text_width + 10 * SCALE_FACTOR, text_height + 10 * SCALE_FACTOR), (255, 255, 255, 0))
                txt_draw = ImageDraw.Draw(txt_img)
                txt_draw.text((5 * SCALE_FACTOR, 5 * SCALE_FACTOR), remark, fill="black", font=font)
                
                rotated_txt = txt_img.rotate(-45, expand=True)
                img.paste(rotated_txt, (int(current_x + 20 * SCALE_FACTOR), int(staggered_y + 20 * SCALE_FACTOR)), mask=rotated_txt)
                
                last_remark_x = current_x
                
            next_x = current_x + (dur * pixels_per_hour)
            draw.line([(current_x, y), (next_x, y)], fill="red", width=4 * SCALE_FACTOR)
            
            current_x = next_x
            last_y = y
            
        uid = uuid.uuid4().hex[:8]
        filename = f"log_day_{day_index+1}_{uid}.png"
        filepath = os.path.join(media_dir, filename)
        
        img = img.resize((orig_width, orig_height), Image.Resampling.LANCZOS)
        img.save(filepath, quality=100)
        urls.append(filename)
        
    return urls
