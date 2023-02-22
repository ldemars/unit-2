var cityPop = [
	{ 
		city: 'Madison',
		population: 233209
	},
	{
		city: 'Milwaukee',
		population: 594833
	},
	{
		city: 'Green Bay',
		population: 104057
	},
	{
		city: 'Superior',
		population: 27244
	}
]; //cityPop is a variable made up of objects with two values stored within.

//This function generates a new value for the table using data from each object population.
function addColumns(cityPop){
    
	//This runs the following code for each row in the table.
    document.querySelectorAll("tr").forEach(function(row, i){

    	if (i == 0){

    		row.insertAdjacentHTML('beforeend', '<th>City Size</th>'); //Creates header row if code has not run yet.
    	} else {

    		var citySize; //Initializes variable that will be changed below using the if, if else, else statement.
			//Uses mathematical greater than operators to classify citySize, using population values from cityPop object.
    		if (cityPop[i-1].population < 100000){
    			citySize = 'Small'; 

    		} else if (cityPop[i-1].population < 500000){
    			citySize = 'Medium';

    		} else {
    			citySize = 'Large';
    		};

			row.insertAdjacentHTML('beforeend','<td>' + citySize + '</td>'); //Adds citySize to table in the new column created to the right.
    	};
    });
};

function clickme(){

	alert('Hey, you clicked me!'); //clickme function alerts user with text. 
};

//This function adds interactive features such as changing color of the text and a clicking alert.
function addEvents(){
	
	//EventListener mouseover means that if the mouse is hovering over the table, the code within will be performed. 
	document.querySelector("table").addEventListener("mouseover", function(){
		
		var color = "rgb("; //Creates string variable to represent color of text. 
		
		//This loop runs 3 times using i as a counting variable. 
		for (var i=0; i<3; i++){

			var random = Math.round(Math.random() * 255); //Random numbers are generated that represent the color of the text.
			
			color += random; //The number is stored in a variable.

			if (i<2){
				color += ","; //Since 3 numbers are needed to determine a rgb color separated by commas, this if else statement takes this into account.
			
			} else {
				color += ")"; //When the loop has run 3 times, the parantheses is closed.
			};
		
		document.querySelector("table").style.color = color;  //Sets table text color using the rgb string variable created through initialization and the for loop.
		};

	document.querySelector("table").addEventListener("click", clickme) //EventListener click runs clickme function.
	});

};

//function to create a table with cities and their populations
function cities(){

    //create a table element
    var table = document.createElement("table");

    //create a header row
    var headerRow = document.createElement("tr");

    //add city column to header row
    var cityHeader = document.createElement("th");
    cityHeader.innerHTML = "City";
    headerRow.appendChild(cityHeader);

    //add population column to header row
    var popHeader = document.createElement("th");
    popHeader.innerHTML = "Population";
    headerRow.appendChild(popHeader);

    //add the header row
    table.appendChild(headerRow);

    //loop to add a new row for each city
    for (var i = 0; i < cityPop.length; i++){
        var tr = document.createElement("tr"); //Creates new table row in html

        var city = document.createElement("td"); //Adds city name to row
        city.innerHTML = cityPop[i].city;
        tr.appendChild(city);

        var pop = document.createElement("td"); //Adds city population to row
        pop.innerHTML = cityPop[i].population;
        tr.appendChild(pop);

        table.appendChild(tr); //appends table, before restarting the loop
    };

    //add the table to the div in index.html
    var mydiv = document.getElementById("mydiv");
    mydiv.appendChild(table);
};

function debugCallback(response){
	var myData = response; //Response is stored in a local variable for use in the following code.
	
	//Adds unfiltered and unformatted GeoJSON data to html div underneath table as a string.
	document.querySelector("#mydiv").insertAdjacentHTML('beforeend', 'GeoJSON data: ' + JSON.stringify(myData)) 
	
};

function debugAjax(){
	
	
	//Fetches file from data file: GeoJSON file contains city information.
	fetch('data/MegaCities.geojson')
		.then(function(response){
			return response.json();
		}) //After fetch is performed on file, returns GeoJSON data for use.
		.then(function(response){
			debugCallback(response);
			//Inputs response into debugCallback function to run code using data that is fetched from GeoJSON file.
			
		})

	//document.querySelector("#mydiv").insertAdjacentHTML('beforeend', '<br>GeoJSON data:<br>' + JSON.stringify(myData))
	//document.querySelector("#mydiv").insertAdjacentHTML('beforeend', 'GeoJSON data: ' + JSON.stringify(myData))
	
};


//initialize function called when script loads
function initialize(){ 
	cities(); //Runs cities function to organize pre-existing city data
	addColumns(cityPop); //Runs addColumns function to add a new city size column, creates data from pre-existing data.
	addEvents(); //Runs addEvents function to add color changing and clicking interactive features.
	debugAjax(); //Runs debugAjax function to fetch data from GeoJSON file and return it. 
};

//When website is opened, initialize function is ran. Event listener waits for file to load before performing debugAjax.
document.addEventListener('DOMContentLoaded',debugAjax)

window.onload = initialize(); 