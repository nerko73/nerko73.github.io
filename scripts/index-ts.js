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
var btnOffline = document.getElementById("btnOffline");
// If firebase is defined (connection is established) then initialize it
if (typeof firebase != 'undefined' && window.navigator.onLine == true) {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    var txtEmail_1 = document.getElementById("txtEmail");
    var txtPass_1 = document.getElementById("txtPass");
    var btnLogin = document.getElementById("btnLogin");
    var btnRegister = document.getElementById("btnRegister");
    var errorMsg_1 = document.getElementById("errorMsg");
    // Login event
    btnLogin.addEventListener('click', function (e) {
        console.log("login");
        var email = txtEmail_1.value;
        var pass = txtPass_1.value;
        var auth = firebase.auth();
        var promise = auth.signInWithEmailAndPassword(email, pass);
        promise["catch"](function (e) { return errorMsg_1.innerHTML = e.message; });
    });
    // Register event
    btnRegister.addEventListener('click', function (e) {
        console.log("register");
        var email = txtEmail_1.value;
        var pass = txtPass_1.value;
        var auth = firebase.auth();
        var promise = auth.createUserWithEmailAndPassword(email, pass);
        promise["catch"](function (e) { return errorMsg_1.innerHTML = e.message; });
    });
    // Event fires when user logs in or out
    firebase.auth().onAuthStateChanged(function (firebaseUser) {
        if (firebaseUser) {
            console.log(firebaseUser);
            location.href = "admin.html";
        }
        else {
            console.log("not logged in");
        }
    });
    // If firebase is not defined then allow access offline
}
else {
    location.href = "admin.html";
}
