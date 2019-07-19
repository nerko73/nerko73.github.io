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
if (typeof firebase != 'undefined'){
	firebase.initializeApp(firebaseConfig);
	var workersRef = firebase.database().ref('workers/');
	workersRef.once('value', updateIndexDB);
}

// Open indexedDB database
var indexRequest = indexedDB.open("WorkerDatabase", 2);
var indexDB, indexTx, addStore, removeStore, workerStore;

// Creating a new database or upgrading an existing one
indexRequest.onupgradeneeded = function(e) {

	indexDB = indexRequest.result,
	// Store for worker data
	workerStore = indexDB.createObjectStore("WorkerStore", {
		keyPath : "id"
	});
	// Store used for syncing with firebase upon reastablishing connection
	addStore = indexDB.createObjectStore("AddStore", {
		keyPath : "id"
	});
	// Store used for syncing with firebase upon reastablishing connection
	removeStore = indexDB.createObjectStore("RemoveStore", {
		keyPath : "id"
	});
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


var imgEdit = [];
var imgDelete = [];
var divEditDelete = [];
var updateKey;

// Get elements
var mainTable = <HTMLTableElement>document.getElementById("mainTable");
var txtName = <HTMLInputElement>document.getElementById("txtName");
var txtLastName = <HTMLInputElement>document.getElementById("txtLastName");
var txtDate = <HTMLInputElement>document.getElementById("txtDate");
var txtQual = <HTMLInputElement>document.getElementById("txtQual");
var txtEmp = <HTMLInputElement>document.getElementById("txtEmp");

const btnLogout = document.getElementById("btnLogout");

const imgAdd = document.getElementById("imgAdd");
var imgOkDiv = document.getElementById("imgOkDiv");

var workers;
var keys = [];

function synch() {
   	// If firebase is defined (connection is established) then update it
   	if (typeof firebase != 'undefined'){
   		updateFirebase();
   	}
}
function insertRows() {
	// Deletes all rows with worker data
   	deleteRows(); 

    indexTx = indexDB.transaction("WorkerStore", "readwrite");
    workerStore = indexTx.objectStore("WorkerStore");

    var workerStoreRequest = workerStore.getAll(); // Gets all worker data from local storage

    keys = [];

    // Event fires when worker data is successfully retrieved
    workerStoreRequest.onsuccess = function (e) {
	    var localKeys = workerStoreRequest.result;

	    // For every entry in database insert a row
	    localKeys.forEach(function(key){
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
	        cell5.innerHTML = key.employers;

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
	    });
	};
}
 
function deleteRecord(e) {
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

	// Delete the locally stored record
	workerStore.delete(deleteKey);

	// Refresh the rows with worker data on the page
	insertRows();

}
function editRecord(e) {
      	
   	// Sets dataElement to the previous <td> element in the same row in which the edit icon is located
   	var dataElement = e.target.parentElement.parentElement.parentElement.previousElementSibling;
   	txtEmp.value = dataElement.innerHTML;

   	// Moves through the row and sets the input fields to the corresponding data in the row
    dataElement = dataElement.previousElementSibling;
    txtQual.value = dataElement.innerHTML;

    dataElement = dataElement.previousElementSibling;
   	txtDate.value = dataElement.innerHTML;

	dataElement = dataElement.previousElementSibling;
    txtLastName.value = dataElement.innerHTML;

    dataElement = dataElement.previousElementSibling;
    txtName.value = dataElement.innerHTML;

    // Find the id based on the row the edit icon is located in
    updateKey = findKey(dataElement.parentElement);

    // Removes any previous <img> elements in the div
    while (imgOkDiv.firstChild) {
	    imgOkDiv.removeChild(imgOkDiv.firstChild);
	}

	// Create new <img> element
    var imgOk = document.createElement('img');
    imgOk.src = "icons/ok.png";
	
	// Event fires when imgOk is clicked on
    imgOk.addEventListener('click', e =>{
	    // If firebase is defined then update the record with the updateKey id
	  	// Else store the updateKey locally for later synchronization
	    if (typeof firebase != 'undefined'){
		    var updates = {};
		    var data = {
		  		name: txtName.value,
		  		lastName: txtLastName.value,
		  		birthDay: txtDate.value,
		  		qualifications: txtQual.value,
		  		employers: txtEmp.value
		  	};
	  		updates['/workers/' + updateKey] = data;
	  		firebase.database().ref().update(updates);
		}else{
			indexTx = indexDB.transaction("AddStore", "readwrite");
			addStore = indexTx.objectStore("AddStore");
			addStore.put({id: updateKey});
		}

	  	indexTx = indexDB.transaction("WorkerStore", "readwrite");

	  	// Update the worker record locally
		workerStore = indexTx.objectStore("WorkerStore");
	    workerStorePut(updateKey, txtName.value, txtLastName.value,
	    			   txtDate.value, txtQual.value, txtEmp.value);

	    // The following code updates the row data on the page
	    dataElement.innerHTML = txtName.value;
	    dataElement = dataElement.nextElementSibling;

	    dataElement.innerHTML = txtLastName.value;
	    dataElement = dataElement.nextElementSibling;

	    dataElement.innerHTML = txtDate.value;
	    dataElement = dataElement.nextElementSibling;

	    dataElement.innerHTML = txtQual.value;
	    dataElement = dataElement.nextElementSibling;

	    dataElement.innerHTML = txtEmp.value;

	    // Remove <img> element after updating the record
		while (imgOkDiv.firstChild) {
		    imgOkDiv.removeChild(imgOkDiv.firstChild);
		}

		// Clears the input fields
		txtName.value = txtLastName.value = txtDate.value = txtQual.value = txtEmp.value = "";
    });
	    
   	// Add  the ok img after click edit
	imgOkDiv.appendChild(imgOk);

	


}

//Finds the key based on the row passed to it
function findKey(elem) {
   	var i = 0;
	while( (elem = elem.nextSibling) != null ) 
	  i++;

	i -= 2;

	return keys[i];
}
// Deletes all rows with worker data
function deleteRows(){
	var tableRows = document.getElementsByClassName('data-rows');
	while( tableRows[0] ) {
   		tableRows[0].parentNode.removeChild(tableRows[0] );
	}
}
// Generates unique id
 function generateId(){
   	return '_' + Math.random().toString(36).substr(2, 9);
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
		  		employers: e.target.result.employers
  				}));
			};
		});
	};

	// After adding all the records clear the AddStore
	addStore.clear();

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
// Update local storage based on firebase
function updateIndexDB(data) {
   	// Get the data from firebase
   	workers = data.val(); 

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
      			workers[key].birthDay,  workers[key].qualifications, workers[key].employers);
      		}
   		};
   	});    	
   	insertRows();
 }
imgAdd.addEventListener('click', e => {
	var id = generateId();
	// If firebase is defined then add to it
	// Else store the id locally for later synchronization
  	if (typeof firebase != 'undefined'){
  		firebase.database().ref('workers/' + id).set(({
  		name: txtName.value,
  		lastName: txtLastName.value,
  		birthDay: txtDate.value,
  		qualifications: txtQual.value,
  		employers: txtEmp.value
  		}));
	}else{
		indexTx = indexDB.transaction("AddStore", "readwrite");
		addStore = indexTx.objectStore("AddStore");
		addStore.put({id: id});
	}

	// Insert the data to indexedDB
	workerStorePut(id, txtName.value, txtLastName.value, txtDate.value, txtQual.value, txtEmp.value);

	// Clear the input fields
  	txtName.value = txtLastName.value = txtDate.value = txtQual.value = txtEmp.value = "";

  	// Refresh the rows with worker data on the page
  	insertRows();
});
if (typeof firebase != 'undefined'){
	btnLogout.addEventListener('click', e => {
		firebase.auth().signOut();
		location.href = "index.html"
	});
}
// Add a record to the database
function workerStorePut(id, name, lastName, birthDay, qual, emp){
	indexTx = indexDB.transaction("WorkerStore", "readwrite");
    workerStore = indexTx.objectStore("WorkerStore");
    workerStore.put({
        id: id,
        name: name,
        lastName: lastName,
        birthDay: birthDay,
        qualifications: qual,
        employers: emp
    });
}