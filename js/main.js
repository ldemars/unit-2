//declare map variable globally so all functions have access
var map;

//function to instantiate the Leaflet map
function createMap(){

    //create the map
    map = L.map('map', { //Uses id map for use in html
        center: [0, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData(map);
};

//function to retrieve the data and place it on the map
//function to attach popups to each mapped feature
function onEachFeature(feature, layer) { //Passes in variables "feature" and "layer" from geojson data.
    //no property named popupContent; instead, create html string with all properties
    var popupContent = ""; //Initializes popupContent
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties){ //Loop is performed for each item stored in the GeoJSON data.
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent); //Binds information as popup content.
    };
};

//function to retrieve the data and place it on the map
function getData(map){
    //load the data
    fetch("data/NatMortalityRateUnder5.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){ 
            var geojsonMarkerOptions = { //Creates characteristics of polygons to replace markers.
                radius: 8,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };
            
            //create a Leaflet GeoJSON layer and add it to the map
            
            L.geoJson(json, {
                pointToLayer: function (feature, latlng){ //Converts point features to polygon layer
                    return L.circleMarker(latlng, geojsonMarkerOptions); //Specifies circleMarker as polygon type, using variables set above in geojsonMarkerOptions.
                },
                onEachFeature: onEachFeature //Sends data to onEachFeature, to implement data into each marker upon clicking them.
            }).addTo(map); //Adds circle markers with linked data to the final map.
        })  
};

document.addEventListener('DOMContentLoaded',createMap) //Waits for each process to finish while running createMap.