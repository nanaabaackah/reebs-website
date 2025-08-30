import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "500px"
};

const reebsLocation = {
  lat: 5.629976957360835,  
  lng: -0.06104706927628969
};

// White & Black Map Style
const whiteBlackMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }] // White background
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#000000" }] // Black text
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }] // White outline
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#434343" }] // Black roads
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#333333" }] // Dark gray borders
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#f4f4f4" }] // Light gray water
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }] // Very light gray POIs
  }
];

function MapComponent() {
  const [userLocation, setUserLocation] = useState(null);
  const [selected, setSelected] = useState(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => {
          console.warn("Geolocation error:", err.message);
        }
      );
    }
  }, []);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  const handleDirections = () => {
    if (userLocation) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${reebsLocation.lat},${reebsLocation.lng}`,
        "_blank"
      );
    } else {
      alert("Please allow location access to get directions.");
    }
  };

  if (!apiKey) {
    return <p>Google Maps API key missing. Please check your .env file.</p>;
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation || reebsLocation}
        zoom={14}
        options={{ styles: whiteBlackMapStyle }}
      >
        {/* REEBS marker */}
        <Marker
          position={reebsLocation}
          onClick={() => setSelected({ name: "REEBS Party Themes", position: reebsLocation })}
        />

        {/* User marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            }}
          />
        )}

        {/* InfoWindow for REEBS */}
        {selected && (
          <InfoWindow
            position={selected.position}
            onCloseClick={() => setSelected(null)}
          >
            <div>
              <h3>{selected.name}</h3>
              <button
                style={{
                  padding: "10px 25px",
                  background: "#854e6b", 
                  border: "none",
                  color: "white",
                  cursor: "pointer"
                }}
                onClick={handleDirections}
              >
                Get Directions
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
}

export default MapComponent;


