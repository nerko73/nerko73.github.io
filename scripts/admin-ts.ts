// Import firebase delete after transpiling to javascript
// It is already included in another <script> tag
import * as firebase from 'firebase';
// Web app's Firebase configuration
let firebaseConfig = {
	apiKey: "AIzaSyBoCkOydaG9eMoHjL15q8LMGhijZHTgTuw",
	authDomain: "workers-24345.firebaseapp.com",
	databaseURL: "https://workers-24345.firebaseio.com",
    projectId: "workers-24345",
    storageBucket: "",
    messagingSenderId: "334675060417",
	appId: "1:334675060417:web:c7f3e0ccf446d1d5"
};
// If firebase is defined (connection is established) then initialize it
if (typeof firebase != 'undefined') {
    firebase.initializeApp(firebaseConfig);
    var workersRef = firebase.database().ref('workers/');
    workersRef.once('value', updateWorkers);

    var employersRef =  firebase.database().ref('employers/');
    employersRef.once('value', updateEmployers);
}

// Open indexedDB database
var indexRequest = indexedDB.open("WorkerDatabase", 9);
var indexDB, indexTx, addStore, employerStore, empRemoveStore, removeStore, workerStore;

// Creating a new database or upgrading an existing one
indexRequest.onupgradeneeded = function(e) {
	console.log("upgrade");
	indexDB = indexRequest.result;
	if(!indexDB.objectStoreNames.contains("WorkerStore")){
		// Store for worker data
		workerStore = indexDB.createObjectStore("WorkerStore", {
			keyPath : "id"
		});
	}
	if(!indexDB.objectStoreNames.contains("AddStore")){
		// Store used for syncing with firebase upon reastablishing connection
		addStore = indexDB.createObjectStore("AddStore", {
			keyPath : "id"
		});
	}
	if(!indexDB.objectStoreNames.contains("RemoveStore")){
		// Store used for syncing with firebase upon reastablishing connection
		removeStore = indexDB.createObjectStore("RemoveStore", {
			keyPath : "id"
		});
	}
	if(!indexDB.objectStoreNames.contains("EmployerStore")){
		// Store used for employer data
		employerStore  = indexDB.createObjectStore("EmployerStore", {
			keyPath : "id"
		});
	}
	if(!indexDB.objectStoreNames.contains("EmpRemoveStore")){
		// Store used for syncing with firebase upon reastablishing connection
		empRemoveStore = indexDB.createObjectStore("EmpRemoveStore", {
			keyPath : "id"
		});
	}
};
	
// Event fires when the database couldn't be opened
indexRequest.onerror = function(e) {
	console.log("Error: " + indexRequest.error.code);
};
//Event fires on successful opening of database 
indexRequest.onsuccess = function(e){
	indexDB = indexRequest.result;
    indexDB.onerror = function(e){
    	console.log("Error:" + indexDB.error.code);
    };
    synch(); // Synchronize local and online storage
};

// Arrays for storing img elements for worker edit and delete operations
var imgEdit = [];
var imgDelete = [];
var divEditDelete = [];

// Arrays for storing img elements for employer edit and delete operations
var imgEmpEdit = [];
var imgEmpDelete = [];
var divEmpEditDelete = [];


var updateKey, empUpdateKey;

// Get elements
var mainTable = <HTMLTableElement>document.getElementById("mainTable");
var txtName = <HTMLInputElement>document.getElementById("txtName");
var txtLastName = <HTMLInputElement>document.getElementById("txtLastName");
var txtDate = <HTMLInputElement>document.getElementById("txtDate");
var txtQual = <HTMLInputElement>document.getElementById("txtQual");

var addEditTable = <HTMLTableElement>document.getElementById("addEditTable");
var txtEmpName = <HTMLInputElement>document.getElementById("txtEmpName");
var txtLocation = <HTMLInputElement>document.getElementById("txtLocation");
var txtStartDate = <HTMLInputElement>document.getElementById("txtStartDate");
var txtEndDate = <HTMLInputElement>document.getElementById("txtEndDate");

const btnLogout = document.getElementById("btnLogout");
var btnAddWorker = document.getElementById("btnAddWorker");
const imgAdd = document.getElementById("imgAdd");
var imgOkDiv = document.getElementById("imgOkDiv");

var imgEmpAdd = document.getElementById("imgEmpAdd");
var imgEmpOkDiv = document.getElementById("imgEmpOkDiv");

var workers;
// Array for storing ids of workers
var keys = [];

// Arrays for storing multiple employer data at the same time
var empId = [];
var empName = [];
var empLocation = [];
var empStartDate = [];
var empEndDate = [];

function synch() {
   	// If firebase is defined (connection is established) then update it
   	if (typeof firebase != 'undefined'){
   		updateFirebase();
   	}else{
   		insertRows();
   	}
}
function insertRows() {
	// Deletes all rows with worker data
   	deleteRows('data-rows'); 

    indexTx = indexDB.transaction("WorkerStore", "readwrite");
    workerStore = indexTx.objectStore("WorkerStore");



    var workerStoreRequest = workerStore.getAll(); // Gets all worker data from local storage

    keys = [];

    // Event fires when worker data is successfully retrieved
    workerStoreRequest.onsuccess = function (e) {
	    var localKeys = workerStoreRequest.result;

	    // For every entry in database insert a row
	    localKeys.forEach(function(key){

	    	var empTx = indexDB.transaction("EmployerStore", "readwrite");
    		employerStore = empTx.objectStore("EmployerStore");

	    	var employerStoreRequest = employerStore.getAll();

	    	employerStoreRequest.onsuccess = function (e){

	    		var employerKeys = employerStoreRequest.result;

		       	keys.push(key.id);
		       	var row = mainTable.insertRow(1);

		        row.classList.add("text-center", "data-rows");


		        var cell1 = row.insertCell(0);
		        var cell2 = row.insertCell(1);
		        var cell3 = row.insertCell(2);
		        var cell4 = row.insertCell(3);
		        var cell5 = row.insertCell(4);
		        var cell6 = row.insertCell(5);

		        cell1.innerHTML = key.name;
		        cell2.innerHTML = key.lastName;
		        cell3.innerHTML = key.birthDay;
		        cell4.innerHTML = key.qualifications;

		        employerKeys.forEach(function(empKey){
	
		        if(key.id == (empKey.id).substr(0, (empKey.id).length-1))
		        	cell5.innerHTML += empKey.name + ", ";
		        });
		        
		        // Remove the last excess comma
		        cell5.innerHTML = (cell5.innerHTML).substr(0, (cell5.innerHTML).length-2);

		        /*
				Code below creates the following dom structure
				<div class = "d-table">
					<div class = "d-table-cell">
						<img src="icons/edit.png">
					</div>
					<div class = "d-table-cell">
						<img src="icons/delete.png">
					</div>
				</div>
				Which is appended to cell6
		        */

		        divEditDelete.push(document.createElement('div'));
		        var topDiv = divEditDelete[divEditDelete.length-1]
			        
		        topDiv.classList.add("d-table");

		        divEditDelete.push(document.createElement('div'));
		        var divEdit = divEditDelete[divEditDelete.length-1]

		        divEdit.classList.add("d-table-cell");

		        imgEdit.push(document.createElement('img'));
		        imgEdit[imgEdit.length-1].src = "icons/edit.png";
		        imgEdit[imgEdit.length-1].addEventListener('click', editRecord);

		        divEdit.appendChild(imgEdit[imgEdit.length-1]);

		        topDiv.appendChild(divEdit);

		        divEditDelete.push(document.createElement('div'));
		        var divDelete = divEditDelete[divEditDelete.length-1]

		        divDelete.classList.add("d-table-cell");

		        imgDelete.push(document.createElement('img'));
		        imgDelete[imgDelete.length-1].src = "icons/delete.png";
		        imgDelete[imgDelete.length-1].addEventListener('click', deleteRecord);

		        divDelete.appendChild(imgDelete[imgDelete.length-1]);

		        topDiv.appendChild(divDelete);
			        
		        cell6.appendChild(topDiv);
		    };
	    });
	}
}
 
function deleteRecord(e) {

	//Opens confirm or cancel dialog
	var choice = confirm("Do you with do delete worker?");

	if(choice == false)	return;

   	// Sets dataElement to the row in which the delete icon is located
  	var dataElement = e.target.parentElement.parentElement.parentElement.parentElement;

  	// Find the id of the record to be deleted
  	var deleteKey = findKey(dataElement);

  	// Removes the row in which the delete icon is located
  	dataElement.parentElement.removeChild(dataElement);  

  	// If firebase is defined then delete the record with the deleteKey id
  	// Else store the deletekey locally for later synchronization
  	if (typeof firebase != 'undefined'){
  		firebase.database().ref("workers/" + deleteKey).remove(); 	
    }else{
    	indexTx = indexDB.transaction("RemoveStore", "readwrite");
		removeStore = indexTx.objectStore("RemoveStore");
		removeStore.put({id: deleteKey});
    }

  	indexTx = indexDB.transaction("WorkerStore", "readwrite");
	workerStore = indexTx.objectStore("WorkerStore");

	var empTx = indexDB.transaction("EmployerStore", "readwrite");
    employerStore = empTx.objectStore("EmployerStore");

	var employerStoreRequest = employerStore.getAll();

	employerStoreRequest.onsuccess = function (e){

		var employerKeys = employerStoreRequest.result;

	    employerKeys.forEach(function(empKey){
	    	// Finds all mathching employer ids for worker and deletes them
	    	if(deleteKey == (empKey.id).substr(0, (empKey.id).length-1)){
	    		if (typeof firebase != 'undefined')
  					firebase.database().ref("employers/" + empKey.id).remove(); 

	    		employerStore.delete(empKey.id);
	    	}
	    });
	};

	// Delete the locally stored record
	workerStore.delete(deleteKey);

	// Refresh the rows with worker data on the page
	insertRows();

}
function editRecord(e) {
    
   	// Sets dataElement to the previous <td> element in the same row in which the edit icon is located
   	var dataElement = e.target.parentElement.parentElement.parentElement.previousElementSibling;
 
   	var href = "addworker.html?";
   	// Moves through the row and sets the href to the corresponding data in the row
    dataElement = dataElement.previousElementSibling;
    href = href + "qual=" + dataElement.innerHTML + "&";

    dataElement = dataElement.previousElementSibling;
     href = href + "date=" + dataElement.innerHTML + "&";

	dataElement = dataElement.previousElementSibling;
	 href = href + "lastName=" + dataElement.innerHTML + "&";

    dataElement = dataElement.previousElementSibling;
     href = href + "name=" + dataElement.innerHTML + "&";

    // Find the id based on the row the edit icon is located in
    updateKey = findKey(dataElement.parentElement);

    //Go to add worker page passing the worker data in the href
    location.href=href + "updateKey=" + updateKey;
}

//Finds the key based on the row passed to it
function findKey(elem) {
   	var i = 0;
	while( (elem = elem.nextSibling) != null ) 
	  i++;

	return keys[i];
}
// Deletes all rows with worker data
function deleteRows(className){
	var tableRows = document.getElementsByClassName(className);
	while( tableRows[0] ) {
   		tableRows[0].parentNode.removeChild(tableRows[0] );
	}
}
// Updates firebase based on local storage
function updateFirebase() {
   	indexTx = indexDB.transaction("AddStore", "readwrite");
	addStore = indexTx.objectStore("AddStore");
	var addStoreRequest = addStore.getAll();

    addStoreRequest.onsuccess = function(e){
	    var localKeys = addStoreRequest.result;
	    indexTx = indexDB.transaction("WorkerStore", "readwrite");
		workerStore = indexTx.objectStore("WorkerStore");
		// Iterate through every record in AddStore
	    localKeys.forEach(function(key) {
	    	// Get the worker data based in id
	    	workerStore.get(key.id).onsuccess = function(e) {
	    		// If the record is not found exit the function
	    		if (typeof e.target.result == 'undefined') return;

	    		// Update the firebase data
	   	    	firebase.database().ref('workers/' + e.target.result.id).set(({
		  		name: e.target.result.name,
		  		lastName: e.target.result.lastName,
		  		birthDay: e.target.result.birthDay,
		  		qualifications: e.target.result.qualifications,
  				}));
			};
		});
	};

	// After adding all the records clear the AddStore
	addStore.clear();

	// Updates all employer records
	var empTx = indexDB.transaction("EmployerStore", "readwrite");
    employerStore = empTx.objectStore("EmployerStore");

	var employerStoreRequest = employerStore.getAll();

	employerStoreRequest.onsuccess = function (e){

		var employerKeys = employerStoreRequest.result;

	    employerKeys.forEach(function(empKey){
	    	firebase.database().ref('employers/' + empKey.id).set(({
		  		name: empKey.name,
		  		location: empKey.location,
		  		startDate: empKey.startDate,
		  		endDate: empKey.endDate,
  				}));
	    });
	}

	// Removes employer records
	var empRemTx = indexDB.transaction("EmpRemoveStore", "readwrite");
    empRemoveStore = empRemTx.objectStore("EmpRemoveStore");

	var empRemoveStoreRequest = empRemoveStore.getAll();

	empRemoveStoreRequest.onsuccess = function (e){

		var employerKeys = empRemoveStoreRequest.result;

	    employerKeys.forEach(function(empKey){
	    	firebase.database().ref('employers/' + empKey.id).remove();
	    });
	}

	empRemoveStore.clear();

	// Removes worker records
	indexTx = indexDB.transaction("RemoveStore", "readwrite");
	removeStore = indexTx.objectStore("RemoveStore");
	var removeStoreRequest = removeStore.getAll();


	removeStoreRequest.onsuccess = function(e){
		var localKeys = removeStoreRequest.result; // Get all objects in the RemoveStore

		// Iterate through every object
		localKeys.forEach(function(key){
			// Remove the firebase record with the corresponding with key.id
			firebase.database().ref("workers/" + key.id).remove(); 
		});
	};

	// After removing all the records clear the AddStore
	removeStore.clear();

	// Refresh the rows with worker data
	insertRows();
		
}
// Update local worker storage based on firebase
function updateWorkers(data) {
   	// Get the data from firebase
   	workers = data.val(); 
   	console.log(workers);
   	// If no data is found in firebase then exit the function
   	if(workers==null) return;

   	// Get all the objects
   	keys = Object.keys(workers);

   	indexTx = indexDB.transaction("WorkerStore", "readwrite");
	workerStore = indexTx.objectStore("WorkerStore");
      
	// Iterate through every firebase record
   	keys.forEach(function(key){
   		workerStore.get(key).onsuccess = function(e) {
      		var res = e.target.result;

      		// If the record is not found locally the add it
      		if(res == null){
      			indexTx = indexDB.transaction("WorkerStore", "readwrite");
				workerStore = indexTx.objectStore("WorkerStore");
      			workerStorePut(key, workers[key].name,  workers[key].lastName,
      			workers[key].birthDay,  workers[key].qualifications);
      		}
   		};
   	}); 
 }
 // Update local employer storage based od firebase
 function updateEmployers(data) {

 	// Get the data from firebase
   	var employers = data.val(); 
   	console.log(employers);
   	// If no data is found in firebase then exit the function
   	if(employers==null) return;

 	var employerKeys = Object.keys(employers)
   	var empTx = indexDB.transaction("EmployerStore", "readwrite");
    employerStore = empTx.objectStore("EmployerStore");

    employerKeys.forEach(function(empKey){
    	employerStore.get(empKey).onsuccess = function(e) {
	      	var res = e.target.result;

	      	// If the record is not found locally the add it
	      	if(res == null){
	      		var empTx = indexDB.transaction("EmployerStore", "readwrite");
				employerStore = empTx.objectStore("EmployerStore");
	      		employerStore.put({
			        id: empKey,
			        name: employers[empKey].name,
			        location: employers[empKey].location,
			        startDate: employers[empKey].startDate,
			        endDate: employers[empKey].endDate,
			    });
	      	}
   		};
    });
    insertRows();
 }
if (typeof firebase != 'undefined'){
	btnLogout.addEventListener('click', e => {
		firebase.auth().signOut();
		location.href = "index.html"
	});
}

btnAddWorker.addEventListener('click', e => {
	location.href = "addworker.html";
});
// Add a record to the database
function workerStorePut(id, name, lastName, birthDay, qual){
	indexTx = indexDB.transaction("WorkerStore", "readwrite");
    workerStore = indexTx.objectStore("WorkerStore");
    workerStore.put({
        id: id,
        name: name,
        lastName: lastName,
        birthDay: birthDay,
        qualifications: qual,
    });
}
// Add a record of employer to database
function employerStorePut(id) {
	indexTx = indexDB.transaction("EmployerStore", "readwrite");
    employerStore = indexTx.objectStore("EmployerStore");

    for(var i = 0; i < empName.length; i++){
	    employerStore.put({
	        id: id + i.toString(),
	        name: empName[i],
	        location: empLocation[i],
	        startDate: empStartDate[i],
	        endDate: empEndDate[i],
	    });
	}
}
window.addEventListener('online',  e =>{
	alert("Established connection. Your data will be synchronized with firebase. You will be redirected to the login page if needed.");
	if (typeof firebase == 'undefined') {
		alert("Please login to synchronize with firebase.")
		location.href = "index.html";
	}else{
		// Event fires when user logs in or out
	 	 firebase.auth().onAuthStateChanged(firebaseUser =>{
	  		if(!firebaseUser){
	  			alert("Please login to synchronize with firebase.")
	  			location.href = "index.html";
	  		}
	  	});
	}
	
});
 window.addEventListener('offline', e =>{
	alert("Connection lost. Your data will be stored locally and synchronized with firebase upon reestablishing connection.");
});

