//declare map variable globally so all functions have access
var map; //Initialize variable "map"
var minValue; //Initialize variable "minValue"

//Function is called upon web page opening.
function createMap(){

    //create the Leaflet map
    map = L.map('map', {
        center: [0, 0],
        zoom: 1
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData(map);
};

function calcMinValue(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each country
    for(var country of data.features){
        //loop through each year
        for(var year = 1960; year <= 2020; year+=10){
              //get mortality rate value for current year
              var value = country.properties["MR_"+ String(year)];
              //add value to array
              allValues.push(value);
        }
    }
    //get minimum value of array and store in minValue.
    var minValue = Math.min(...allValues)

    return minValue; //returns minValue to when function is called.
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 2;
    //Sets radius value using min value and att values.
    var radius = 1.0033 * Math.pow(attValue/minValue,0.5715) * minRadius

    return radius;
};

//function to convert markers to circle markers and add popups
function pointToLayer(feature, latlng,attributes){
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];
    //check
    //console.log(attribute);

    //initializes marker options
    var options = {
        fillColor: "#ff0000",
        color: "#000",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string starting with each country...Example 2.1 line 24
    var popupContent = "<p><b>Country:</b> " + feature.properties.Country + "</p>";

    //add formatted attribute to popup content string
    var year = attribute.split("_")[1];
    popupContent += "<p><b>Mortality rate under 5 in " + year + ":</b> " + feature.properties[attribute] + "</p>"; //Includes text for pop up.

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
          offset: new L.Point(0,-options.radius)
      });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//Function creates proportional symbols and sends them to pointToLayer for correct sizing.
function createPropSymbols(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map); //Add proportional symbols to map.
};

//Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
      console.log("");
        if (layer.feature && layer.feature.properties[attribute]){
          //access feature properties
           var props = layer.feature.properties;

           //updates each feature's radius based on new attribute values
           var radius = calcPropRadius(props[attribute]);
           layer.setRadius(radius);

           //add country to popup content string
           var popupContent = "<p><b>Country:</b> " + props.Country + "</p>";

           //add formatted attribute to panel content string
           var year = attribute.split("_")[1];
           popupContent += "<p><b>Mortality rate under 5 in " + year + ":</b> " + props[attribute] + " per 1000 births</p>"; //Pop up text input. 

           //update popup with new content
           popup = layer.getPopup();
           popup.setContent(popupContent).update();

        };
    });
};

function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with mortality rate values using string "MR"
        if (attribute.indexOf("MR") > -1){
            attributes.push(attribute);
        };
    };

    return attributes;
};

//Create sequence controls (slider)
function createSequenceControls(attributes){
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);

    //set slider attributes
    document.querySelector(".range-slider").max = 6;
    document.querySelector(".range-slider").min = 0; //0-6 indicates 7 possible slider options.
    document.querySelector(".range-slider").value = 0; 
    document.querySelector(".range-slider").step = 1;

    //add step buttons, using panel id in html.
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse">Reverse</button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward">Forward</button>');

    //replace button content with images
    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/reverse.png'>")
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/forward.png'>")

    var steps = document.querySelectorAll('.step');

    steps.forEach(function(step){
        step.addEventListener("click", function(){ //Event listening for user click.
            var index = document.querySelector('.range-slider').value;
            //increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //if past the last attribute, wrap around to first attribute
                index = index > 6 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                //if past the first attribute, wrap around to last attribute
                index = index < 0 ? 6 : index;
            };

            //update slider
            document.querySelector('.range-slider').value = index;

            //pass new attribute to update symbols
            updatePropSymbols(attributes[index]);
        })
    })

    //input listener for slider so it response to user input
    document.querySelector('.range-slider').addEventListener('input', function(){
        //get the new index value
        var index = this.value;

        //pass new attribute to update symbols
        updatePropSymbols(attributes[index]);
    });
};


function getData(map){
    //load the geojson data.
    fetch("data/NatMortalityRateUnder5.geojson") 
        .then(function(response){ 
            return response.json(); 
        })
        .then(function(json){
            var attributes = processData(json); //runs processData and stores returned value in attributes.
            minValue = calcMinValue(json); //Runs minValue and stores returned value in minValue.
            //call function to create proportional symbols
            createPropSymbols(json, attributes); //Runs createPropSymbols to create proportional symbols.
            createSequenceControls(attributes); //Runs createSequenceControl to create slider.
        })
};

document.addEventListener('DOMContentLoaded',createMap) //Upon loading page, runs createMap function.