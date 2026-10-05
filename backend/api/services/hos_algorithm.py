def calculate_hos(trip_duration: float, distance: float, cycle_hours: int, loc_current: str="", loc_pickup: str="", loc_dropoff: str="") -> list:
    schedule = []
    
    def add_status(status, duration, remark=None):
        if duration <= 0: return
        entry = {"status": status, "duration": duration}
        if remark is not None:
            entry["remark"] = remark
        schedule.append(entry)

    continuous_driving = 0.0
    cumulative_driving = 0.0
    shift_time = 0.0
    accumulated_cycle_time = cycle_hours
    distance_covered = 0.0
    miles_since_last_fuel = 0.0
    remaining_duration = trip_duration
    
    speed = distance / trip_duration if trip_duration > 0 else 0.0

    def apply_on_duty(duration, remark=None):
        nonlocal accumulated_cycle_time, shift_time, continuous_driving, cumulative_driving
        
        while duration > 1e-5:
            allowed_cycle = 70.0 - accumulated_cycle_time
            if allowed_cycle <= 1e-5:
                add_status("Off-Duty", 34.0, remark="34-hour restart")
                accumulated_cycle_time = 0.0
                shift_time = 0.0
                continuous_driving = 0.0
                cumulative_driving = 0.0
                allowed_cycle = 70.0
                
            allowed_shift = 14.0 - shift_time
            if allowed_shift <= 1e-5:
                add_status("Off-Duty", 10.0, remark="10-hour rest")
                shift_time = 0.0
                continuous_driving = 0.0
                cumulative_driving = 0.0
                allowed_shift = 14.0
                
            chunk = min(duration, allowed_cycle, allowed_shift)
            chunk = max(chunk, 1e-5)
            
            add_status("On-Duty", chunk, remark=remark)
            accumulated_cycle_time += chunk
            shift_time += chunk
            duration -= chunk
            remark = None

    # 1. 1-hour 'On-Duty' block for pickup at the start
    pickup_text = f"{loc_pickup} - Pickup" if loc_pickup else "Pickup"
    apply_on_duty(1.0, remark=pickup_text)
    
    # 2. Driving phase
    while remaining_duration > 1e-5:
        allowed_cycle = 70.0 - accumulated_cycle_time
        if allowed_cycle <= 1e-5:
            add_status("Off-Duty", 34.0, remark="34-hour restart")
            accumulated_cycle_time = 0.0
            shift_time = 0.0
            continuous_driving = 0.0
            cumulative_driving = 0.0
            continue
            
        allowed_shift = 14.0 - shift_time
        allowed_drive = 11.0 - cumulative_driving
        if allowed_shift <= 1e-5 or allowed_drive <= 1e-5:
            add_status("Off-Duty", 10.0, remark="10-hour rest")
            shift_time = 0.0
            continuous_driving = 0.0
            cumulative_driving = 0.0
            continue
            
        allowed_continuous = 8.0 - continuous_driving
        if allowed_continuous <= 1e-5:
            add_status("Off-Duty", 0.5, remark="30-min break")
            shift_time += 0.5
            continuous_driving = 0.0
            continue
            
        dist_to_fuel = 1000.0 - miles_since_last_fuel
        time_to_fuel = dist_to_fuel / speed if speed > 0 else float('inf')
        
        if time_to_fuel <= 1e-5:
            apply_on_duty(0.25, remark="Fueling")
            miles_since_last_fuel = 0.0
            continue
            
        chunk = min(remaining_duration, allowed_cycle, allowed_shift, allowed_drive, allowed_continuous, time_to_fuel)
        chunk = max(chunk, 1e-5)
        
        distance_chunk = chunk * speed
        distance_covered += distance_chunk
        miles_since_last_fuel += distance_chunk
        
        add_status("Driving", chunk)
        
        continuous_driving += chunk
        cumulative_driving += chunk
        shift_time += chunk
        accumulated_cycle_time += chunk
        remaining_duration -= chunk

    # 3. 1-hour 'On-Duty' block for dropoff at the end
    dropoff_text = f"{loc_dropoff} - Dropoff" if loc_dropoff else "Dropoff"
    apply_on_duty(1.0, remark=dropoff_text)
    
    # Merge consecutive statuses
    merged = []
    for s in schedule:
        if merged and merged[-1]["status"] == s["status"] and "remark" not in s and "remark" not in merged[-1]:
            merged[-1]["duration"] += s["duration"]
        else:
            merged.append(s)
            
    return merged
