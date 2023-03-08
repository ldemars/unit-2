//declare map variable globally so all functions have access
var map; //Initialize global variable "map"
var dataStats = {}; //Initialize global object for later use.

function createMap(){ //Function is called upon web page opening.

    
    map = L.map('map', { //create the Leaflet map
        center: [0, 0],
        zoom: 1
    });

    //add OSM base tilelayer
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
	maxZoom: 19,
    minZoom: 3, //Zoom prevents user from zooming in or out too much, making proportional symbols less cluttered. 
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
    }).addTo(map);

    //call getData function to continue program.
    getData(map);
};

function calcPropRadius(attValue) { //calculates the radius of each proportional symbol
    var minRadius = 1.85; //constant factor adjusts symbol sizes evenly - readjusted to fit mortality data.
    
    if (dataStats.min > 0){ //Sets radius value using min value and att values if minValue is greater than 0.
        var radius = 1.0083 * Math.pow(attValue / dataStats.min, 0.5715) * minRadius}
    else{
        var radius = 1} //Sets a small default radius if there is no data or no minimum.

    return radius; //Returns radius
};

function createPropSymbols(data, attributes){ //Function creates proportional symbols and sends them to pointToLayer for correct sizing.
    
    L.geoJson(data, { //create a Leaflet GeoJSON layer and add it to the map
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map); //Add proportional symbols to map.
};

function getCircleValues(attribute) {
    //start with min at highest possible (infinity) and max at lowest possible number (negative infinity)
    var min = Infinity, max = -Infinity;
  
    map.eachLayer(function (layer) {
      //get the attribute value
      if (layer.feature) {
        var attributeValue = Number(layer.feature.properties[attribute]);
                
        //test for min using infinity.
        if (attributeValue < min) {
          min = attributeValue;
        }
  
        //test for max using negative infinity.
        if (attributeValue > max) {
          max = attributeValue;
        }
      }
    });
  
    //set mean value between max and min.
    var mean = (max + min) / 2;
    
    //return values as an object
    return {
      max: max,
      mean: mean,
      min: min,
    };
  }

function createPopupContent(properties, attribute){
    //adds country to popup content string
    var popupContent = "<p><b>Country:</b> " + properties.Country + "</p>";

    //adds formatted attribute to panel content string
    var year = attribute.split("_")[1];

    if (properties[attribute]>0)
        popupContent += "<p><b>Mortality rate under 5 in " + year + ":</b> " + properties[attribute] + " per 1000 live births.</p>";
    else //If statement rules changes string if there is no data available for a specific year.
        popupContent += "<p><b>No data for " + year + ":</b></p>";

    return popupContent;
};

function pointToLayer(feature, latlng,attributes){ //function to convert markers to circle markers and add popups

    var attribute = attributes[0]; //Determine which attribute to visualize with proportional symbols

    var options = {
        color: "#000",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 0.8
    };     //initializes marker options

    var attValue = Number(feature.properties[attribute]); //For each feature, determine its value for the selected attribute
    
    options.radius = calcPropRadius(attValue); //Give each feature's circle marker a radius based on its attribute value

    options.fillColor = updateColor(attValue); //Sets colors of markers when they are first being created.


    var layer = L.circleMarker(latlng, options); //create circle marker layer using options specified above.

    var popupContent = createPopupContent(feature.properties, attribute);  //build popup content string starting with each country...Example 2.1 line 24
    layer.bindPopup(popupContent, {  offset: new L.Point(0,-options.radius)    });

    return layer;  //return the circle marker to the L.geoJson pointToLayer option

};

function updateColor(attValue){ //If statement determines color based on circle marker associated mortality rate and the global mean of the data from 2020-1960.

  if (attValue>dataStats.mean+50){
    var fillCol = "#ff0000"; } //If mortality rate is above average by enough, return red.
  else if (attValue<dataStats.mean+50 && attValue>dataStats.mean-50){
    var fillCol = "#ff8000";} //If mortality rate is near average, return orange.
  else {
    var fillCol = "#ffff00";   //In all other cases, return yellow
  }
  return fillCol; //Returns color code.
}

function updatePropSymbols(attribute) {
    map.eachLayer(function (layer) {
      if (layer.feature && layer.feature.properties[attribute]) {
        //access feature properties
        var props = layer.feature.properties; 

        //update each feature's radius based on new attribute values
        var radius = calcPropRadius(props[attribute]);
        layer.setRadius(radius); //Updates radius of each circle marker using updated year values.
        layer.setStyle({fillColor: updateColor(props[attribute])}) //Performs resymbolization of circle markers using updateColor to determine color.

        //add country to popup content string
        var popupContent = "<p><b>Country:</b> " + props.Country + "</p>";
  
        //var popupContent = "<p><b>Country:</b> " + props.Country + "</p>"; //add country to popup content string
        var popupContent = createPopupContent(props, attribute);    

        //update popup with new content   
        popup = layer.getPopup();
        popup.setContent(popupContent).update();
      }
    });
  
    updateLegend(attribute); //Calls function to update legend after proportional symbols are updated.
  }
function createSequenceControls(attributes){   
    
    var SequenceControl = L.Control.extend({ //Generates slider in bottom left of map - controllable using css style sheet.
        options: {
            position: 'bottomleft'
        },
  
        onAdd: function () {
            //create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');
  
            //create range input element (slider)
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')
  
            //add arrow buttons on the slider
            container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse"><img src="img/reverse.png"></button>'); 
            container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward"><img src="img/forward.png"></button>'); 
  
            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);
  
            return container;
  
        }
    });
  
    map.addControl(new SequenceControl());
  
    //adds listeners after adding the control//
    //set slider index values and steps.
    document.querySelector(".range-slider").max = 6;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;
  
    var steps = document.querySelectorAll('.step');
  
    steps.forEach(function(step){
        step.addEventListener("click", function(){
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
  
            //update slider using index value.
            document.querySelector('.range-slider').value = index;
  
            //pass new attribute to update symbols using index value to obtain the current year.
            updatePropSymbols(attributes[index]);
        })
    })
  
    //input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        //get the new index value
        var index = this.value;
  
        //pass new attribute to update symbols
        updatePropSymbols(attributes[index]);
    });
  
  };

function processData(data){
    
    var attributes = []; //empty array to hold attributes
    var properties = data.features[0].properties; //properties of the first feature in the dataset

    
    for (var attribute in properties){ //push each attribute name into attributes array
        
        if (attribute.indexOf("MR") > -1){ //only take attributes with mortality rate values using string "MR"
            attributes.push(attribute);
        };
    };

    return attributes; //Returns array containing data for use in other functions.
};

function calcStats(data) {
    //initialize empty array to store all data values
    var allValues = [];

    //loop through each country
    for (var country of data.features) {
      //loop through each year in 10 year intervals.
      for (var year = 1960; year <= 2020; year += 10) {
        //get population for current year
        var value = country.properties["MR_" + String(year)];

        //append value to arrays
        allValues.push(value);
        
      }
    }

    //get min, max, mean stats for our array
    dataStats.min = Math.min(...allValues);
   
    dataStats.max = Math.max(...allValues);
  
    //calculate meanValue
    var sum = allValues.reduce(function (a, b) {
      return a + b;
    });
    dataStats.mean = sum / allValues.length; //Use length of array to get number to divide by.
  }


function createLegend(attributes) {
    var LegendControl = L.Control.extend({ //Creates legend that is controllable using css file in bottom right of map.
      options: {
        position: "bottomright",
      },
  
      onAdd: function () {
        // create the control container with a particular class name
        var container = L.DomUtil.create("div", "legend-control-container");
        
        container.innerHTML = '<p class="temporalLegend">Mortality rate under the age of 5 in <span class="year">1960</span></p>';
  
        //start attribute legend svg string
        var svg = '<svg id="attribute-legend" width="300px" height="90px">';
  
        //array of circle names to base loop on
        var circles = ["max", "mean", "min"];
        var circleValues = getCircleValues(attributes[0]); //Gets min, mean, and max values at initial index value (first year visible on map)
        var colorLegend = '#ff0000' //Initializes color of legend circles.

        //loop to add each circle and text to svg string
        for (var i = 0; i < circles.length; i++) {
          //calculate r and cy

          var radius = calcPropRadius(circleValues[circles[i]]); //Variable contains radius of each legend circle.
          var cy = 80 - radius; //Variable contains vertical position of legend circles.
          
          if(i==0){ //If statement sets colors of each legend circle using iterative variable.
            colorLegend = '#ff0000'; 
            } else if(i==1){
            colorLegend = '#ff8000';
            } else{
            colorLegend = '#ffff00'
            }
        
          //circle string constructed using variables specified above.
          svg +=
            '<circle class="legend-circle" id="' +
            circles[i] + //Sets id in html code.
            '" r="' +
            radius + //Sets radius
            '"cy="' +
            cy + //Sets y position
            '" fill="' + 
            colorLegend //Sets color (resymbolization operator implemented in legend)
            +
            '"fill-opacity="0.8" stroke="#000000" cx="50"/>';
  
          //evenly space out labels
          var textY = i * 20 + 30;
  
          //text string
          svg +=
            '<text id="' +
            circles[i] +
            '-text" x="95" y="' +
            textY +
            '">' +
            Math.round(circleValues[circles[i]] * 100) / 100 +
            " per 1,000" +
            "</text>";
        }
  
        //close svg html string
        svg += "</svg>";
  
        //add attribute legend svg to container
        container.insertAdjacentHTML('beforeend',svg);
  
        return container;
      },
    });
  
    map.addControl(new LegendControl()); //Finishes legend creation for use in css.
  }
  
  function updateLegend(attribute) {
    //create content for legend
    var year = attribute.split("_")[1];
    //replace legend content
    document.querySelector("span.year").innerHTML = year;
    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(attribute);
    
    for (var key in circleValues) { //For loop uses "key" variable to avoid using another array containing the object keys.
      //get the radius for legend to be updated to.
      var radius = calcPropRadius(circleValues[key]); 
  
      document.querySelector("#" + key).setAttribute("cy", 80 - radius); //updates y position of legend circles
      document.querySelector("#" + key).setAttribute("r", radius) //updates radius of legend circles.
  
      document.querySelector("#" + key + "-text").textContent = Math.round(circleValues[key] * 100) / 100 + " per 1,000"; //Updates numerical text next to legend circles.
    }
  }


function getData(map){
    //load the geojson data.
    fetch("data/NatMortalityRateUnder5.geojson") //Fetches geojson file data.
        .then(function(response){ 
            return response.json(); 
        })
        .then(function(json){
            var attributes = processData(json); //runs processData and stores returned value in attributes.
            calcStats(json) //Runs statistics and stores data in global object.
            createPropSymbols(json, attributes); //Runs createPropSymbols to create proportional symbols.
            createSequenceControls(attributes); //Runs createSequenceControl to create slider.
            createLegend(attributes); //Runs createLegend to create legend using attributes taken from GeoJSON data.
        })
};

document.addEventListener('DOMContentLoaded',createMap) //Upon loading page, runs createMap function. DOMContentLoaded will wait for data to load before loading page further.