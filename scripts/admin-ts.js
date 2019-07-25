"use strict";
exports.__esModule = true;
// Import firebase delete after transpiling to javascript
// It is already included in another <script> tag

// Web app's Firebase configuration
var firebaseConfig = {
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
    var employersRef = firebase.database().ref('employers/');
    employersRef.once('value', updateEmployers);
}
// Open indexedDB database
var indexRequest = indexedDB.open("WorkerDatabase", 5);
var indexDB, indexTx, addStore, employerStore, empRemoveStore, removeStore, workerStore;
// Creating a new database or upgrading an existing one
indexRequest.onupgradeneeded = function (e) {
    console.log("upgrade");
    if (e.oldVersion < 1) {
        // Store for worker data
        workerStore = indexDB.createObjectStore("WorkerStore", {
            keyPath: "id"
        });
        // Store used for syncing with firebase upon reastablishing connection
        addStore = indexDB.createObjectStore("AddStore", {
            keyPath: "id"
        });
        // Store used for syncing with firebase upon reastablishing connection
        removeStore = indexDB.createObjectStore("RemoveStore", {
            keyPath: "id"
        });
    }
    if (e.oldVersion < 4) {
        // Store used for employer data
        employerStore = indexDB.createObjectStore("EmployerStore", {
            keyPath: "id"
        });
        // Store used for syncing with firebase upon reastablishing connection
        empRemoveStore = indexDB.createObjectStore("EmpRemoveStore", {
            keyPath: "id"
        });
    }
};
// Event fires when the database couldn't be opened
indexRequest.onerror = function (e) {
    console.log("Error: " + indexRequest.error.code);
};
//Event fires on successful opening of database 
indexRequest.onsuccess = function (e) {
    indexDB = indexRequest.result;
    indexDB.onerror = function (e) {
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
var mainTable = document.getElementById("mainTable");
var txtName = document.getElementById("txtName");
var txtLastName = document.getElementById("txtLastName");
var txtDate = document.getElementById("txtDate");
var txtQual = document.getElementById("txtQual");
var addEditTable = document.getElementById("addEditTable");
var txtEmpName = document.getElementById("txtEmpName");
var txtLocation = document.getElementById("txtLocation");
var txtStartDate = document.getElementById("txtStartDate");
var txtEndDate = document.getElementById("txtEndDate");
var btnLogout = document.getElementById("btnLogout");
var btnAddWorker = document.getElementById("btnAddWorker");
var imgAdd = document.getElementById("imgAdd");
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
    if (typeof firebase != 'undefined') {
        updateFirebase();
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
        localKeys.forEach(function (key) {
            var empTx = indexDB.transaction("EmployerStore", "readwrite");
            employerStore = empTx.objectStore("EmployerStore");
            var employerStoreRequest = employerStore.getAll();
            employerStoreRequest.onsuccess = function (e) {
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
                employerKeys.forEach(function (empKey) {
                    if (key.id == (empKey.id).substr(0, (empKey.id).length - 1))
                        cell5.innerHTML += empKey.name + ", ";
                });
                // Remove the last excess comma
                cell5.innerHTML = (cell5.innerHTML).substr(0, (cell5.innerHTML).length - 2);
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
                var topDiv = divEditDelete[divEditDelete.length - 1];
                topDiv.classList.add("d-table");
                divEditDelete.push(document.createElement('div'));
                var divEdit = divEditDelete[divEditDelete.length - 1];
                divEdit.classList.add("d-table-cell");
                imgEdit.push(document.createElement('img'));
                imgEdit[imgEdit.length - 1].src = "icons/edit.png";
                imgEdit[imgEdit.length - 1].addEventListener('click', editRecord);
                divEdit.appendChild(imgEdit[imgEdit.length - 1]);
                topDiv.appendChild(divEdit);
                divEditDelete.push(document.createElement('div'));
                var divDelete = divEditDelete[divEditDelete.length - 1];
                divDelete.classList.add("d-table-cell");
                imgDelete.push(document.createElement('img'));
                imgDelete[imgDelete.length - 1].src = "icons/delete.png";
                imgDelete[imgDelete.length - 1].addEventListener('click', deleteRecord);
                divDelete.appendChild(imgDelete[imgDelete.length - 1]);
                topDiv.appendChild(divDelete);
                cell6.appendChild(topDiv);
            };
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
    if (typeof firebase != 'undefined') {
        firebase.database().ref("workers/" + deleteKey).remove();
    }
    else {
        indexTx = indexDB.transaction("RemoveStore", "readwrite");
        removeStore = indexTx.objectStore("RemoveStore");
        removeStore.put({ id: deleteKey });
    }
    indexTx = indexDB.transaction("WorkerStore", "readwrite");
    workerStore = indexTx.objectStore("WorkerStore");
    var empTx = indexDB.transaction("EmployerStore", "readwrite");
    employerStore = empTx.objectStore("EmployerStore");
    var employerStoreRequest = employerStore.getAll();
    employerStoreRequest.onsuccess = function (e) {
        var employerKeys = employerStoreRequest.result;
        employerKeys.forEach(function (empKey) {
            // Finds all mathching employer ids for worker and deletes them
            if (deleteKey == (empKey.id).substr(0, (empKey.id).length - 1)) {
                if (typeof firebase != 'undefined')
                    firebase.database().ref("employers/" + empKey.id).remove();
                employerStore["delete"](empKey.id);
            }
        });
    };
    // Delete the locally stored record
    workerStore["delete"](deleteKey);
    // Refresh the rows with worker data on the page
    insertRows();
}
function editRecord(e) {
    // Sets dataElement to the previous <td> element in the same row in which the edit icon is located
    var dataElement = e.target.parentElement.parentElement.parentElement.previousElementSibling;
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
    empId = [];
    empName = [];
    empLocation = [];
    empStartDate = [];
    empEndDate = [];
    var empTx = indexDB.transaction("EmployerStore", "readwrite");
    employerStore = empTx.objectStore("EmployerStore");
    var employerStoreRequest = employerStore.getAll();
    employerStoreRequest.onsuccess = function (e) {
        var employerKeys = employerStoreRequest.result;
        employerKeys.forEach(function (empKey) {
            // Find all corresponding employer ids and pushed them into arrays for manipulation
            if (updateKey == (empKey.id).substr(0, (empKey.id).length - 1)) {
                empId.push(empKey.id);
                empName.push(empKey.name);
                empLocation.push(empKey.location);
                empStartDate.push(empKey.startDate);
                empEndDate.push(empKey.endDate);
            }
        });
        insertEmployerRows();
    };
    // Removes any previous <img> elements in the div
    while (imgOkDiv.firstChild) {
        imgOkDiv.removeChild(imgOkDiv.firstChild);
    }
    // Create new <img> element
    var imgOk = document.createElement('img');
    imgOk.src = "icons/ok.png";
    // Event fires when imgOk is clicked on
    imgOk.addEventListener('click', function (e) {
        if (txtName.value == "" || txtLastName.value == "" ||
            txtDate.value == "" || txtQual.value == "") {
            alert("All fields must be filled!");
            return;
        }
        if (!Date.parse(txtDate.value)) {
            alert("Invalid date format!");
            return;
        }
        // If firebase is defined then update the record with the updateKey id
        // Else store the updateKey locally for later synchronization
        if (typeof firebase != 'undefined') {
            var updates = {};
            var data = {
                name: txtName.value,
                lastName: txtLastName.value,
                birthDay: txtDate.value,
                qualifications: txtQual.value
            };
            updates['/workers/' + updateKey] = data;
            firebase.database().ref().update(updates);
            for (var i = 0; i < empName.length; i++) {
                firebase.database().ref('employers/' + updateKey + i.toString()).set(({
                    name: empName[i],
                    location: empLocation[i],
                    startDate: empStartDate[i],
                    endDate: empEndDate[i]
                }));
            }
        }
        else {
            indexTx = indexDB.transaction("AddStore", "readwrite");
            addStore = indexTx.objectStore("AddStore");
            addStore.put({ id: updateKey });
        }
        indexTx = indexDB.transaction("WorkerStore", "readwrite");
        // Update the worker record locally
        workerStore = indexTx.objectStore("WorkerStore");
        workerStorePut(updateKey, txtName.value, txtLastName.value, txtDate.value, txtQual.value);
        employerStorePut(updateKey);
        insertRows();
        // Remove <img> element after updating the record
        while (imgOkDiv.firstChild) {
            imgOkDiv.removeChild(imgOkDiv.firstChild);
        }
        empId = [];
        empName = [];
        empLocation = [];
        empStartDate = [];
        empEndDate = [];
        deleteRows('employer-rows');
        // Clears the input fields
        txtName.value = txtLastName.value = txtDate.value = txtQual.value = "";
        addEditTable.classList.add("d-none");
    });
    // Add  the ok img after click edit
    imgOkDiv.appendChild(imgOk);
}
//Finds the key based on the row passed to it
function findKey(elem) {
    var i = 0;
    while ((elem = elem.nextSibling) != null)
        i++;
    return keys[i];
}
// Deletes all rows with worker data
function deleteRows(className) {
    var tableRows = document.getElementsByClassName(className);
    while (tableRows[0]) {
        tableRows[0].parentNode.removeChild(tableRows[0]);
    }
}
// Generates unique id
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}
// Updates firebase based on local storage
function updateFirebase() {
    indexTx = indexDB.transaction("AddStore", "readwrite");
    addStore = indexTx.objectStore("AddStore");
    var addStoreRequest = addStore.getAll();
    addStoreRequest.onsuccess = function (e) {
        var localKeys = addStoreRequest.result;
        indexTx = indexDB.transaction("WorkerStore", "readwrite");
        workerStore = indexTx.objectStore("WorkerStore");
        // Iterate through every record in AddStore
        localKeys.forEach(function (key) {
            // Get the worker data based in id
            workerStore.get(key.id).onsuccess = function (e) {
                // If the record is not found exit the function
                if (typeof e.target.result == 'undefined')
                    return;
                // Update the firebase data
                firebase.database().ref('workers/' + e.target.result.id).set(({
                    name: e.target.result.name,
                    lastName: e.target.result.lastName,
                    birthDay: e.target.result.birthDay,
                    qualifications: e.target.result.qualifications
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
    employerStoreRequest.onsuccess = function (e) {
        var employerKeys = employerStoreRequest.result;
        employerKeys.forEach(function (empKey) {
            firebase.database().ref('employers/' + empKey.id).set(({
                name: empKey.name,
                location: empKey.location,
                startDate: empKey.startDate,
                endDate: empKey.endDate
            }));
        });
    };
    // Removes employer records
    var empRemTx = indexDB.transaction("EmpRemoveStore", "readwrite");
    empRemoveStore = empRemTx.objectStore("EmpRemoveStore");
    var empRemoveStoreRequest = empRemoveStore.getAll();
    empRemoveStoreRequest.onsuccess = function (e) {
        var employerKeys = empRemoveStoreRequest.result;
        employerKeys.forEach(function (empKey) {
            firebase.database().ref('employers/' + empKey.id).remove();
        });
    };
    empRemoveStore.clear();
    // Removes worker records
    indexTx = indexDB.transaction("RemoveStore", "readwrite");
    removeStore = indexTx.objectStore("RemoveStore");
    var removeStoreRequest = removeStore.getAll();
    removeStoreRequest.onsuccess = function (e) {
        var localKeys = removeStoreRequest.result; // Get all objects in the RemoveStore
        // Iterate through every object
        localKeys.forEach(function (key) {
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
    if (workers == null)
        return;
    // Get all the objects
    keys = Object.keys(workers);
    indexTx = indexDB.transaction("WorkerStore", "readwrite");
    workerStore = indexTx.objectStore("WorkerStore");
    // Iterate through every firebase record
    keys.forEach(function (key) {
        workerStore.get(key).onsuccess = function (e) {
            var res = e.target.result;
            // If the record is not found locally the add it
            if (res == null) {
                indexTx = indexDB.transaction("WorkerStore", "readwrite");
                workerStore = indexTx.objectStore("WorkerStore");
                workerStorePut(key, workers[key].name, workers[key].lastName, workers[key].birthDay, workers[key].qualifications);
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
    if (employers == null)
        return;
    var employerKeys = Object.keys(employers);
    var empTx = indexDB.transaction("EmployerStore", "readwrite");
    employerStore = empTx.objectStore("EmployerStore");
    employerKeys.forEach(function (empKey) {
        employerStore.get(empKey).onsuccess = function (e) {
            var res = e.target.result;
            // If the record is not found locally the add it
            if (res == null) {
                var empTx = indexDB.transaction("EmployerStore", "readwrite");
                employerStore = empTx.objectStore("EmployerStore");
                employerStore.put({
                    id: empKey,
                    name: employers[empKey].name,
                    location: employers[empKey].location,
                    startDate: employers[empKey].startDate,
                    endDate: employers[empKey].endDate
                });
            }
        };
    });
    insertRows();
}
imgAdd.addEventListener('click', function (e) {
    if (txtName.value == "" || txtLastName.value == "" ||
        txtDate.value == "" || txtQual.value == "") {
        alert("All fields must be filled!");
        return;
    }
    if (!Date.parse(txtDate.value)) {
        alert("Invalid date format!");
        return;
    }
    var id = generateId();
    // If firebase is defined then add to it
    // Else store the id locally for later synchronization
    if (typeof firebase != 'undefined') {
        firebase.database().ref('workers/' + id).set(({
            name: txtName.value,
            lastName: txtLastName.value,
            birthDay: txtDate.value,
            qualifications: txtQual.value
        }));
        for (var i = 0; i < empName.length; i++) {
            // Stores the employer data and adds an index to it
            firebase.database().ref('employers/' + id + i.toString()).set(({
                name: empName[i],
                location: empLocation[i],
                startDate: empStartDate[i],
                endDate: empEndDate[i]
            }));
        }
    }
    else {
        indexTx = indexDB.transaction("AddStore", "readwrite");
        addStore = indexTx.objectStore("AddStore");
        addStore.put({ id: id });
    }
    // Insert the data to indexedDB
    workerStorePut(id, txtName.value, txtLastName.value, txtDate.value, txtQual.value);
    employerStorePut(id);
    empId = [];
    empName = [];
    empLocation = [];
    empStartDate = [];
    empEndDate = [];
    // Clear the input fields
    txtName.value = txtLastName.value = txtDate.value = txtQual.value = "";
    txtEmpName.value = txtLocation.value = txtStartDate.value = txtEndDate.value = "";
    deleteRows('employer-rows');
    // Refresh the rows with worker data on the page
    addEditTable.classList.add("d-none");
    insertRows();
});
function insertEmployerRows() {
    deleteRows('employer-rows');
    for (var i = 0; i < empName.length; i++) {
        var row = addEditTable.insertRow(3);
        row.classList.add("text-center", "employer-rows");
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        var cell5 = row.insertCell(4);
        cell1.innerHTML = empName[i];
        cell2.innerHTML = empLocation[i];
        cell3.innerHTML = empStartDate[i];
        cell4.innerHTML = empEndDate[i];
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
        divEmpEditDelete.push(document.createElement('div'));
        var topEmpDiv = divEmpEditDelete[divEmpEditDelete.length - 1];
        topEmpDiv.classList.add("d-table");
        divEmpEditDelete.push(document.createElement('div'));
        var divEmpEdit = divEmpEditDelete[divEmpEditDelete.length - 1];
        divEmpEdit.classList.add("d-table-cell");
        imgEmpEdit.push(document.createElement('img'));
        imgEmpEdit[imgEmpEdit.length - 1].src = "icons/edit.png";
        imgEmpEdit[imgEmpEdit.length - 1].addEventListener('click', editEmployerRecord);
        divEmpEdit.appendChild(imgEmpEdit[imgEmpEdit.length - 1]);
        topEmpDiv.appendChild(divEmpEdit);
        divEmpEditDelete.push(document.createElement('div'));
        var divEmpDelete = divEmpEditDelete[divEmpEditDelete.length - 1];
        divEmpDelete.classList.add("d-table-cell");
        imgEmpDelete.push(document.createElement('img'));
        imgEmpDelete[imgEmpDelete.length - 1].src = "icons/delete.png";
        imgEmpDelete[imgEmpDelete.length - 1].addEventListener('click', deleteEmployerRecord);
        divEmpDelete.appendChild(imgEmpDelete[imgEmpDelete.length - 1]);
        topEmpDiv.appendChild(divEmpDelete);
        cell5.appendChild(topEmpDiv);
    }
}
// Finds employer index
function findEmpKey(elem) {
    var i = 0;
    while ((elem = elem.nextSibling) != null)
        i++;
    i -= 2;
    return i;
}
function editEmployerRecord(e) {
    console.log("edit employer");
    // Sets dataElement to the previous <td> element in the same row in which the edit icon is located
    var dataElement = e.target.parentElement.parentElement.parentElement.previousElementSibling;
    txtEndDate.value = dataElement.innerHTML;
    // Moves through the row and sets the input fields to the corresponding data in the row
    dataElement = dataElement.previousElementSibling;
    txtStartDate.value = dataElement.innerHTML;
    dataElement = dataElement.previousElementSibling;
    txtLocation.value = dataElement.innerHTML;
    dataElement = dataElement.previousElementSibling;
    txtEmpName.value = dataElement.innerHTML;
    // Find the id based on the row the edit icon is located in
    empUpdateKey = findEmpKey(dataElement.parentElement);
    // Removes any previous <img> elements in the div
    while (imgEmpOkDiv.firstChild) {
        imgEmpOkDiv.removeChild(imgEmpOkDiv.firstChild);
    }
    // Create new <img> element
    var imgEmpOk = document.createElement('img');
    imgEmpOk.src = "icons/ok.png";
    // Event fires when imgEmpOk is clicked on
    imgEmpOk.addEventListener('click', function (e) {
        if (txtEmpName.value == "" || txtLocation.value == "" ||
            txtStartDate.value == "" || txtEndDate.value == "") {
            alert("All fields must be filled!");
            return;
        }
        if (!Date.parse(txtStartDate.value) || !Date.parse(txtEndDate.value)) {
            alert("Invalid date format!");
            return;
        }
        // The following code updates the row data on the page and the arrays
        empName[empUpdateKey] = txtEmpName.value;
        dataElement.innerHTML = txtEmpName.value;
        dataElement = dataElement.nextElementSibling;
        empLocation[empUpdateKey] = txtLocation.value;
        dataElement.innerHTML = txtLocation.value;
        dataElement = dataElement.nextElementSibling;
        empStartDate[empUpdateKey] = txtStartDate.value;
        dataElement.innerHTML = txtStartDate.value;
        dataElement = dataElement.nextElementSibling;
        empEndDate[empUpdateKey] = txtEndDate.value;
        dataElement.innerHTML = txtEndDate.value;
        dataElement = dataElement.nextElementSibling;
        // Remove <img> element after updating the record
        while (imgEmpOkDiv.firstChild) {
            imgEmpOkDiv.removeChild(imgEmpOkDiv.firstChild);
        }
        // Clears the input fields
        txtEmpName.value = txtLocation.value = txtStartDate.value = txtEndDate.value = "";
    });
    // Add  the ok img after click edit
    imgEmpOkDiv.appendChild(imgEmpOk);
}
function deleteEmployerRecord(e) {
    var dataElement = e.target.parentElement.parentElement.parentElement.parentElement;
    var empDeleteKey = findEmpKey(dataElement);
    dataElement.parentElement.removeChild(dataElement);
    // If firebase is defined then delete the record with the empDeleteKey id
    // Else store the empDeleteKey locally for later synchronization
    if (typeof firebase != 'undefined') {
        firebase.database().ref("employers/" + empId[empDeleteKey]).remove();
    }
    else {
        indexTx = indexDB.transaction("EmpRemoveStore", "readwrite");
        empRemoveStore = indexTx.objectStore("EmpRemoveStore");
        empRemoveStore.put({ id: empId[empDeleteKey] });
    }
    indexTx = indexDB.transaction("EmployerStore", "readwrite");
    employerStore = indexTx.objectStore("EmployerStore");
    // Delete the locally stored record
    employerStore["delete"](empId[empDeleteKey]);
    console.log(empName);
    empId.splice(empDeleteKey, 1);
    empName.splice(empDeleteKey, 1);
    empLocation.splice(empDeleteKey, 1);
    empStartDate.splice(empDeleteKey, 1);
    empEndDate.splice(empDeleteKey, 1);
    console.log(empName);
    // Refresh the rows with employer data on the page
    insertEmployerRows();
}
// Pushed employer data into arrays
imgEmpAdd.addEventListener('click', function (e) {
    if (txtEmpName.value == "" || txtLocation.value == "" ||
        txtStartDate.value == "" || txtEndDate.value == "") {
        alert("All fields must be filled!");
        return;
    }
    if (!Date.parse(txtStartDate.value) || !Date.parse(txtEndDate.value)) {
        alert("Invalid date format!");
        return;
    }
    empId.push("");
    empName.push(txtEmpName.value);
    empLocation.push(txtLocation.value);
    empStartDate.push(txtStartDate.value);
    empEndDate.push(txtEndDate.value);
    insertEmployerRows();
    txtEmpName.value = txtLocation.value = txtStartDate.value = txtEndDate.value = "";
});
if (typeof firebase != 'undefined') {
    btnLogout.addEventListener('click', function (e) {
        firebase.auth().signOut();
        location.href = "index.html";
    });
}
// Add a record to the database
function workerStorePut(id, name, lastName, birthDay, qual) {
    indexTx = indexDB.transaction("WorkerStore", "readwrite");
    workerStore = indexTx.objectStore("WorkerStore");
    workerStore.put({
        id: id,
        name: name,
        lastName: lastName,
        birthDay: birthDay,
        qualifications: qual
    });
}
function employerStorePut(id) {
    indexTx = indexDB.transaction("EmployerStore", "readwrite");
    employerStore = indexTx.objectStore("EmployerStore");
    for (var i = 0; i < empName.length; i++) {
        employerStore.put({
            id: id + i.toString(),
            name: empName[i],
            location: empLocation[i],
            startDate: empStartDate[i],
            endDate: empEndDate[i]
        });
    }
}
btnAddWorker.addEventListener('click', function (e) {
    addEditTable.classList.remove("d-none");
});
