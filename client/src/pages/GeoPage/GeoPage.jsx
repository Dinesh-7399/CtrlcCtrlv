// client/src/pages/GeoPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FaSearch, FaInfoCircle, FaDrumstickBite, FaChartLine } from 'react-icons/fa';
import './GeoPage.css';

// --- NEW: Import data directly ---
// !! IMPORTANT: Adjust these paths relative to THIS GeoPage.jsx file !!
import geoJsonData from '../../assets/geo/indian_states.geo.json'; 
import thematicData from '../../assets/geo/india_state_themes.json'; // <-- Import Thematic JSON
// --- End Import ---


// Map configuration
const INDIA_CENTER = [22.5, 82.0];
const INITIAL_ZOOM = 5;
const MAP_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// --- Helper: Info Box Component ---
const InfoBox = ({ title, content }) => {
    if (!title) return <div className="info-box">Hover over a state</div>;
    return (
        <div className="info-box">
            <h4>{title}</h4>
            {content ? <div>{content}</div> : 'No data available'}
        </div>
    );
};

// --- Main GeoPage Component ---
const GeoPage = () => {
    // REMOVED useState for geoJsonData and thematicData
    const [activeTheme, setActiveTheme] = useState('none');
    const [hoveredState, setHoveredState] = useState(null);
    const [mapInstance, setMapInstance] = useState(null);
    const geoJsonLayerRef = useRef(null);

    // REMOVED useEffect for fetching data

    // --- Styling and Interaction Logic ---

    // Function to get color based on theme and value
    const getColor = useCallback((value) => {
        if (activeTheme === 'vegStatus') {
            return value === 'High Non-Veg' ? '#d73027' :
                   value === 'Mid' ? '#fee08b' :
                   value === 'High Veg' ? '#1a9850' :
                   '#cccccc';
        } else if (activeTheme === 'economyLevel') {
            return value === 'High' ? '#2b83ba' :
                   value === 'Mid' ? '#abdda4' :
                   value === 'Low' ? '#fdae61' :
                   '#cccccc';
        }
        return '#cccccc';
    }, [activeTheme]);

    // Style function for GeoJSON features
    const styleFeature = useCallback((feature) => {
        // *** Adjust property name if needed for your GeoJSON ***
        const stateName = feature?.properties?.ST_NM || feature?.properties?.name;
        const themeDataForCurrentTheme = thematicData?.[activeTheme]; // Use imported data
        const value = stateName && themeDataForCurrentTheme ? themeDataForCurrentTheme[stateName] : null;

        return {
            fillColor: getColor(value),
            weight: 1, opacity: 1, color: 'white', dashArray: '3', fillOpacity: 0.7
        };
    }, [activeTheme, getColor]); // Removed thematicData state dependency

    // Highlight feature on hover
    const highlightFeature = (e) => {
        const layer = e.target;
        const stateName = layer.feature?.properties?.ST_NM || layer.feature?.properties?.name;
        const themeDataForCurrentTheme = thematicData?.[activeTheme]; // Use imported data
        const value = stateName && themeDataForCurrentTheme ? themeDataForCurrentTheme[stateName] : null;

        layer.setStyle({ weight: 3, color: '#666', dashArray: '', fillOpacity: 0.9 });
        layer.bringToFront();
        setHoveredState({ name: stateName || 'Unknown', value: value });
    };

    // Reset highlight on mouse out
    const resetHighlight = (e) => {
         if (geoJsonLayerRef.current) {
             geoJsonLayerRef.current.resetStyle(e.target);
         }
        setHoveredState(null);
    };

    // Zoom to feature on click
    const zoomToFeature = (e) => {
        if (mapInstance) {
             mapInstance.fitBounds(e.target.getBounds());
        }
    };

    // Function to attach listeners to each feature
    const onEachFeature = (feature, layer) => {
        layer.on({ mouseover: highlightFeature, mouseout: resetHighlight, click: zoomToFeature });
    };
    // --- End Styling and Interaction ---

    // No need for loading check based on fetch anymore
    // if (!geoJsonData || !thematicData) { return ... }

    return (
        <div className="page-container geo-page">
            <h1>India - Thematic Map</h1>
            <p>Explore different data layers for states in India.</p>

            {/* Controls: Theme Buttons and Search */}
            <div className="map-controls">
                 <div className="theme-buttons">
                    <Button onClick={() => setActiveTheme('none')} variant={activeTheme === 'none' ? 'primary' : 'outline'}> Reset </Button>
                    <Button onClick={() => setActiveTheme('vegStatus')} variant={activeTheme === 'vegStatus' ? 'primary' : 'outline'}> <FaDrumstickBite/> Veg/Non-Veg </Button>
                    <Button onClick={() => setActiveTheme('economyLevel')} variant={activeTheme === 'economyLevel' ? 'primary' : 'outline'}> <FaChartLine/> Economy </Button>
                 </div>
                 <div className="map-search">
                     <Input type="search" placeholder="Search State/District..." className="search-input" />
                     <Button variant="secondary"><FaSearch/></Button>
                 </div>
            </div>

            {/* Map Container */}
            <div className="map-container">
                {/* Check if geoJsonData loaded successfully from import */}
                {geoJsonData ? (
                    <MapContainer
                        center={INDIA_CENTER}
                        zoom={INITIAL_ZOOM}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                        whenCreated={setMapInstance}
                    >
                        <TileLayer url={MAP_TILE_URL} attribution={MAP_ATTRIBUTION} />
                        <InfoBox title={hoveredState?.name} content={hoveredState?.value} />
                        <GeoJSON
                            key={`${activeTheme}-${Date.now()}`}
                            ref={geoJsonLayerRef}
                            data={geoJsonData} // Use imported data
                            style={styleFeature}
                            onEachFeature={onEachFeature}
                        />
                    </MapContainer>
                 ) : (
                     // Show error if import failed somehow
                     <div style={{ padding: '20px', textAlign: 'center', color: 'red'}}>Error: Could not load GeoJSON data from import. Check file path and content.</div>
                 )}
                 {/* TODO: Add Legend component */}
            </div>
        </div>
    );
};

export default GeoPage;