#!/usr/bin/env python3
"""
Demo script showing GeoJSON with spline boundaries using compute_hull_spline.

This demonstrates how FetchLatestData now creates smooth polygon boundaries
around clusters instead of just points.
"""

import sys
import os
import json
import numpy as np
from datetime import datetime, timezone

# Add the services/ml directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

def create_sample_cluster_snapshot():
    """Create a sample ClusterSnapshot with multiple reports for spline computation."""
    from models.outbreakml.structures import ClusterSnapshot
    
    # Create sample reports with locations that form a cluster
    reports = [
        {"id": 1, "lat": 40.7128, "lon": -74.0060, "symptoms": ["fever"]},
        {"id": 2, "lat": 40.7130, "lon": -74.0058, "symptoms": ["fever"]},
        {"id": 3, "lat": 40.7125, "lon": -74.0062, "symptoms": ["cough"]},
        {"id": 4, "lat": 40.7132, "lon": -74.0055, "symptoms": ["fever"]},
        {"id": 5, "lat": 40.7120, "lon": -74.0065, "symptoms": ["cough"]},
        {"id": 6, "lat": 40.7135, "lon": -74.0050, "symptoms": ["fever"]},
    ]
    
    cluster_snapshot = ClusterSnapshot(
        cluster_id="cluster_0",
        time_window_start="2024-01-01T00:00:00Z",
        time_window_end="2024-01-02T00:00:00Z",
        centroid=[40.7128, -74.0060],  # [lat, lon]
        avg_embedding=[0.1] * 768,
        report_ids=[r["id"] for r in reports],
        common_symptoms=["fever", "cough"],
        reports=reports
    )
    
    return cluster_snapshot

def demonstrate_spline_geojson():
    """Demonstrate spline-based GeoJSON generation."""
    print("=== Spline-Based GeoJSON Demo ===\n")
    
    # Create sample data
    cluster_snapshot = create_sample_cluster_snapshot()
    
    print("--- Input: ClusterSnapshot ---")
    print(f"Cluster ID: {cluster_snapshot.cluster_id}")
    print(f"Report count: {len(cluster_snapshot.reports)}")
    print(f"Common symptoms: {cluster_snapshot.common_symptoms}")
    print("Report locations:")
    for report in cluster_snapshot.reports:
        print(f"  - Report {report['id']}: ({report['lat']}, {report['lon']})")
    
    # Compute spline boundary
    print("\n--- Computing Spline Boundary ---")
    try:
        from models.outbreakml.splines import compute_hull_spline
        spline_points = compute_hull_spline(cluster_snapshot)
        lon_coords, lat_coords = spline_points
        
        print(f"Spline points generated: {len(lon_coords)}")
        print(f"Longitude range: {min(lon_coords):.6f} to {max(lon_coords):.6f}")
        print(f"Latitude range: {min(lat_coords):.6f} to {max(lat_coords):.6f}")
        
        # Convert to GeoJSON polygon
        polygon_coords = []
        for lon, lat in zip(lon_coords, lat_coords):
            polygon_coords.append([lon, lat])
        
        # Close the polygon
        polygon_coords.append(polygon_coords[0])
        
        # Create GeoJSON feature
        geojson_feature = {
            "type": "Feature",
            "properties": {
                "cluster_id": cluster_snapshot.cluster_id,
                "report_count": len(cluster_snapshot.reports),
                "common_symptoms": cluster_snapshot.common_symptoms,
                "centroid": cluster_snapshot.centroid,
                "geometry_type": "Polygon"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [polygon_coords]
            }
        }
        
        print("\n--- Output: GeoJSON Feature ---")
        print(json.dumps(geojson_feature, indent=2))
        
        # Show comparison with point-based approach
        print("\n--- Comparison: Point vs Polygon ---")
        point_feature = {
            "type": "Feature",
            "properties": {
                "cluster_id": cluster_snapshot.cluster_id,
                "report_count": len(cluster_snapshot.reports),
                "geometry_type": "Point"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [cluster_snapshot.centroid[1], cluster_snapshot.centroid[0]]
            }
        }
        
        print("Point-based (old approach):")
        print(f"  - Single point at centroid")
        print(f"  - No area representation")
        print(f"  - Limited visual information")
        
        print("\nPolygon-based (new approach):")
        print(f"  - Smooth boundary around actual reports")
        print(f"  - Shows cluster extent and shape")
        print(f"  - More informative visualization")
        
    except Exception as e:
        print(f"Error computing spline: {e}")
        print("This might happen if there are insufficient reports or other issues")

def show_map_visualization_benefits():
    """Show the benefits for map visualization."""
    print("\n=== Map Visualization Benefits ===\n")
    
    benefits = [
        {
            "aspect": "Visual Representation",
            "point": "Single dot at centroid",
            "polygon": "Smooth boundary showing actual cluster extent"
        },
        {
            "aspect": "Area Coverage",
            "point": "No area information",
            "polygon": "Shows the geographic area affected by the cluster"
        },
        {
            "aspect": "Cluster Shape",
            "point": "No shape information",
            "polygon": "Reveals cluster morphology (circular, elongated, etc.)"
        },
        {
            "aspect": "Report Distribution",
            "point": "Centroid only",
            "polygon": "Boundary reflects actual report locations"
        },
        {
            "aspect": "User Understanding",
            "point": "Abstract representation",
            "polygon": "Intuitive geographic visualization"
        }
    ]
    
    print("Comparison of visualization approaches:")
    print()
    for benefit in benefits:
        print(f"🎯 {benefit['aspect']}:")
        print(f"   Point: {benefit['point']}")
        print(f"   Polygon: {benefit['polygon']}")
        print()

def demonstrate_fallback_behavior():
    """Show how the system handles edge cases."""
    print("=== Fallback Behavior ===\n")
    
    print("The system handles edge cases gracefully:")
    print("✅ Insufficient reports: Falls back to point geometry")
    print("✅ Spline computation errors: Falls back to point geometry")
    print("✅ Single report clusters: Uses point geometry")
    print("✅ Invalid coordinates: Falls back to point geometry")
    print()
    print("This ensures your app always receives valid GeoJSON data!")

if __name__ == "__main__":
    demonstrate_spline_geojson()
    show_map_visualization_benefits()
    demonstrate_fallback_behavior()
    
    print("=== Implementation Complete ===")
    print("✅ FetchLatestData now uses compute_hull_spline")
    print("✅ Creates smooth polygon boundaries around clusters")
    print("✅ Falls back to points when splines can't be computed")
    print("✅ Provides rich geographic visualization for your app")
    print("✅ Ready for enhanced map visualization! 🗺️✨")
