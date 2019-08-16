"use strict";
exports.__esModule = true;

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyBoCkOydaG9eMoHjL15q8LMGhijZHTgTuw",
    authDomain: "workers-24345.firebaseapp.com",
    databaseURL: "https://workers-24345.firebaseio.com",
    projectId: "workers-24345",
    storageBucket: "",
    messagingSenderId: "334675060417",
    appId: "1:334675060417:web:c7f3e0ccf446d1d5"
};
var addEditTable = document.getElementById("addEditTable");
var txtWorkerName = document.getElementById("txtWorkerName");
var txtWorkerLastName = document.getElementById("txtWorkerLastName");
var txtWorkerBirthDay = document.getElementById("txtWorkerBirthDay");
var txtWorkerQual = document.getElementById("txtWorkerQual");
var btnLogout = document.getElementById("btnLogout");
var txtEmpName = document.getElementById("txtEmpName");
var txtLocation = document.getElementById("txtLocation");
var txtStartDate = document.getElementById("txtStartDate");
var txtEndDate = document.getElementById("txtEndDate");
var divSuc = document.getElementById("alertSuc");
var imgEmpAdd = document.getElementById("imgEmpAdd");
var imgEmpOkDiv = document.getElementById("imgEmpOkDiv");
// Arrays for storing img elements for employer edit and delete operations
var imgEmpEdit = [];
var imgEmpDelete = [];
var divEmpEditDelete = [];
// Arrays for storing multiple employer data at the same time
var empId = [];
var empName = [];
var empLocation = [];
var empStartDate = [];
var empEndDate = [];
var updateKey = "";
var empUpdateKey;
if (typeof firebase != 'undefined') {
    firebase.initializeApp(firebaseConfig);
}
// Open indexedDB database
var indexRequest = indexedDB.open("WorkerDatabase", 9);
var indexDB, indexTx, addStore, employerStore, empRemoveStore, removeStore, workerStore;
// Creating a new database or upgrading an existing one
indexRequest.onupgradeneeded = function (e) {
    console.log("upgrade");
    indexDB = indexRequest.result;
    if (!indexDB.objectStoreNames.contains("WorkerStore")) {
        // Store for worker data
        workerStore = indexDB.createObjectStore("WorkerStore", {
            keyPath: "id"
        });
    }
    if (!indexDB.objectStoreNames.contains("AddStore")) {
        // Store used for syncing with firebase upon reastablishing connection
        addStore = indexDB.createObjectStore("AddStore", {
            keyPath: "id"
        });
    }
    if (!indexDB.objectStoreNames.contains("RemoveStore")) {
        // Store used for syncing with firebase upon reastablishing connection
        removeStore = indexDB.createObjectStore("RemoveStore", {
            keyPath: "id"
        });
    }
    if (!indexDB.objectStoreNames.contains("EmployerStore")) {
        // Store used for employer data
        employerStore = indexDB.createObjectStore("EmployerStore", {
            keyPath: "id"
        });
    }
    if (!indexDB.objectStoreNames.contains("EmpRemoveStore")) {
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
    getEmployerRecords();
};
function getEmployerRecords() {
    var urlParams = new URLSearchParams(window.location.search);
    updateKey = urlParams.get('updateKey');
    txtWorkerName.value = urlParams.get('name');
    txtWorkerLastName.value = urlParams.get('lastName');
    txtWorkerBirthDay.value = urlParams.get('date');
    txtWorkerQual.value = urlParams.get('qual');
    var empTx = indexDB.transaction("EmployerStore", "readwrite");
    employerStore = empTx.objectStore("EmployerStore");
    var employerStoreRequest = employerStore.getAll();
    employerStoreRequest.onsuccess = function (e) {
        var employerKeys = employerStoreRequest.result;
        employerKeys.forEach(function (empKey) {
            console.log(updateKey);
            console.log(empKey);
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
        console.log(moment(txtStartDate.value, 'YYYY-M-D', true).isValid());
        if (!moment(txtStartDate.value, 'YYYY-M-D', true).isValid() || !moment(txtEndDate.value, 'YYYY-M-D', true).isValid()) {
            alert("Invalid date format! Example: 2015-12-11");
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
    //Opens confirm or cancel dialog
    var choice = confirm("Do you with do delete worker?");
    if (choice == false)
        return;
    var dataElement = e.target.parentElement.parentElement.parentElement.parentElement;
    var empDeleteKey = findEmpKey(dataElement);
    dataElement.parentElement.removeChild(dataElement);
    // If firebase is defined then delete the record with the empDeleteKey id
    // Else store the empDeleteKey locally for later synchronization
    if (typeof firebase != 'undefined' && window.navigator.onLine == true) {
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
function insertEmployerRows() {
    deleteRows('employer-rows');
    for (var i = 0; i < empName.length; i++) {
        var row = addEditTable.insertRow(1);
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
function viewWorkers() {
    location.href = "admin.html";
}
// Pushes employer data into arrays
imgEmpAdd.addEventListener('click', function (e) {
    if (txtEmpName.value == "" || txtLocation.value == "" ||
        txtStartDate.value == "" || txtEndDate.value == "") {
        alert("All fields must be filled!");
        return;
    }
    if (!moment(txtStartDate.value, 'YYYY-M-D', true).isValid() || !moment(txtEndDate.value, 'YYYY-M-D', true).isValid()) {
        alert("Invalid date format! Example: 2015-12-11");
        return;
    }
    empId.push("");
    empName.push(txtEmpName.value);
    empLocation.push(txtLocation.value);
    empStartDate.push(txtStartDate.value);
    empEndDate.push(txtEndDate.value);
    console.log(empName);
    insertEmployerRows();
    txtEmpName.value = txtLocation.value = txtStartDate.value = txtEndDate.value = "";
});
// Deletes all rows with worker data
function deleteRows(className) {
    var tableRows = document.getElementsByClassName(className);
    while (tableRows[0]) {
        tableRows[0].parentNode.removeChild(tableRows[0]);
    }
}
// Adds worker  to database
function addWorker() {
    if (txtWorkerName.value == "" || txtWorkerLastName.value == "" ||
        txtWorkerBirthDay.value == "" || txtWorkerQual.value == "") {
        alert("All fields must be filled!");
        return;
    }
    if (!moment(txtWorkerBirthDay.value, 'YYYY-M-D', true).isValid()) {
        alert("Invalid date format! Example: 2015-12-11");
        return;
    }
    if (updateKey == "" || updateKey == null) {
        var id = generateId();
    }
    else {
        id = updateKey;
        updateKey = "";
    }
    // If firebase is defined then add to it
    // Else store the id locally for later synchronization
    if (typeof firebase != 'undefined' && window.navigator.onLine == true) {
        firebase.database().ref('workers/' + id).set(({
            name: txtWorkerName.value,
            lastName: txtWorkerLastName.value,
            birthDay: txtWorkerBirthDay.value,
            qualifications: txtWorkerQual.value
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
    workerStorePut(id, txtWorkerName.value, txtWorkerLastName.value, txtWorkerBirthDay.value, txtWorkerQual.value);
    employerStorePut(id);
    empId = [];
    empName = [];
    empLocation = [];
    empStartDate = [];
    empEndDate = [];
    // Clear the input fields
    txtWorkerName.value = txtWorkerLastName.value = txtWorkerBirthDay.value = txtWorkerQual.value = "";
    txtEmpName.value = txtLocation.value = txtStartDate.value = txtEndDate.value = "";
    deleteRows('employer-rows');
    showSuc();
    setTimeout(hideSuc, 2500);
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
// Add a record of employer to database
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
// Generates unique id
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}
window.addEventListener('online', function (e) {
    alert("Established connection. Your data will be synchronized with firebase. You will be redirected to the login page if needed.");
    if (typeof firebase == 'undefined') {
        alert("Please login to synchronize with firebase.");
        location.href = "index.html";
    }
    else {
        // Event fires when user logs in or out
        firebase.auth().onAuthStateChanged(function (firebaseUser) {
            if (!firebaseUser) {
                alert("Please login to synchronize with firebase.");
                location.href = "index.html";
            }
        });
    }
});
window.addEventListener('offline', function (e) {
    alert("Connection lost. Your data will be stored locally and synchronized with firebase upon reestablishing connection.");
});
function showSuc() {
    divSuc.classList.remove("d-none");
}
function hideSuc(argument) {
    divSuc.classList.add("d-none");
}
if (typeof firebase != 'undefined') {
    btnLogout.addEventListener('click', function (e) {
        firebase.auth().signOut();
        location.href = "index.html";
    });
}
