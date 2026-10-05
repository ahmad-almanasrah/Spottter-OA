import os
import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from dotenv import load_dotenv

# Try loading standard .env format
load_dotenv()

MAPBOX_KEY = os.getenv("MAPBOX_KEY")

# Fallback: manually parse .env if it has a colon instead of an equals sign
if not MAPBOX_KEY:
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('MAPBOX_KEY:'):
                    MAPBOX_KEY = line.split(':', 1)[1].strip()
                    break

def geocode_location(location_name):
    if not MAPBOX_KEY:
        raise Exception("MAPBOX_KEY not found in environment variables.")
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{location_name}.json"
    params = {
        "access_token": MAPBOX_KEY,
        "limit": 1
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    if data.get("features"):
        coords = data["features"][0]["center"] # [longitude, latitude]
        return coords
    else:
        raise Exception(f"Could not geocode location: {location_name}")

@api_view(['POST'])
def route_view(request):
    try:
        data = request.data
        current_location = data.get('current_location')
        pickup = data.get('pickup')
        dropoff = data.get('dropoff')
        
        if not all([current_location, pickup, dropoff]):
            return Response({"error": "Missing locations."}, status=400)
            
        # Geocode the 3 locations
        coords_curr = geocode_location(current_location)
        coords_pickup = geocode_location(pickup)
        coords_drop = geocode_location(dropoff)
        
        # Directions API
        # Current Location -> Pickup -> Dropoff
        coords_str = f"{coords_curr[0]},{coords_curr[1]};{coords_pickup[0]},{coords_pickup[1]};{coords_drop[0]},{coords_drop[1]}"
        directions_url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{coords_str}"
        params = {
            "access_token": MAPBOX_KEY,
            "geometries": "geojson",
            "overview": "full"
        }
        resp = requests.get(directions_url, params=params)
        try:
            resp.raise_for_status()
        except requests.exceptions.HTTPError as e:
            if resp.status_code == 422:
                return Response({"error": "Unable to calculate a driving route between these locations. Ensure the locations are connected by roads."}, status=400)
            raise e
            
        route_data = resp.json()
        
        if route_data.get("routes"):
            route = route_data["routes"][0]
            distance_meters = route["distance"]
            duration_seconds = route["duration"]
            geometry = route["geometry"]
            
            # Convert distance to miles
            distance_miles = distance_meters * 0.000621371
            
            # Calculate HOS
            from .services.hos_algorithm import calculate_hos
            from .services.log_generator import generate_logs
            
            cycle_hours_raw = data.get('cycle_hours')
            cycle_hours = int(cycle_hours_raw) if cycle_hours_raw not in [None, ''] else 0
            
            duration_hours = duration_seconds / 3600.0
            
            hos_schedule = calculate_hos(duration_hours, distance_miles, cycle_hours, current_location, pickup, dropoff)
            log_filenames = generate_logs(hos_schedule)
            log_urls = [request.build_absolute_uri(f'/media/{fname}') for fname in log_filenames]
            
            return Response({
                "status": "success",
                "distance_miles": round(distance_miles, 2),
                "duration_seconds": duration_seconds,
                "geometry": geometry,
                "waypoints": {
                    "current": coords_curr,
                    "pickup": coords_pickup,
                    "dropoff": coords_drop
                },
                "hos_schedule": hos_schedule,
                "log_urls": log_urls
            })
        else:
            return Response({"error": "No route found."}, status=400)
            
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def autocomplete_view(request):
    try:
        query = request.GET.get('q', '')
        if not query or not MAPBOX_KEY:
            return Response([])
            
        url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json"
        params = {
            "access_token": MAPBOX_KEY,
            "autocomplete": "true",
            "limit": 5
        }
        resp = requests.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        
        suggestions = [{"place_name": f["place_name"]} for f in data.get("features", [])]
        return Response(suggestions)
    except Exception as e:
        return Response([])
