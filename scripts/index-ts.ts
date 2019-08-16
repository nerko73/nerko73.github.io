
// Import firebase delete after transpiling to javascript
// It is already included in another <script> tag
import * as firebase from 'firebase';

// Your web app's Firebase configuration
  let firebaseConfig = {
    apiKey: "AIzaSyBoCkOydaG9eMoHjL15q8LMGhijZHTgTuw",
    authDomain: "workers-24345.firebaseapp.com",
    databaseURL: "https://workers-24345.firebaseio.com",
    projectId: "workers-24345",
    storageBucket: "",
    messagingSenderId: "334675060417",
    appId: "1:334675060417:web:c7f3e0ccf446d1d5"
  };

  const btnOffline = document.getElementById("btnOffline");
  	// If firebase is defined (connection is established) then initialize it
	if (typeof firebase != 'undefined'){
	  // Initialize Firebase
	  firebase.initializeApp(firebaseConfig);

	  const txtEmail = <HTMLInputElement>document.getElementById("txtEmail");
	  const txtPass = <HTMLInputElement>document.getElementById("txtPass");
	  const btnLogin = document.getElementById("btnLogin");
	  const btnRegister = document.getElementById("btnRegister");
	  const errorMsg = document.getElementById("errorMsg");
	  
	  // Login event
	  btnLogin.addEventListener('click', e => {
	  	console.log("login");
	  	const email = txtEmail.value;
	  	const pass = txtPass.value;
	  	const auth = firebase.auth();
	  	const promise = auth.signInWithEmailAndPassword(email, pass);
	  	promise.catch(e => errorMsg.innerHTML = e.message);
	  });

	  // Register event
	  btnRegister.addEventListener('click', e =>{
	  	console.log("register");
	  	const email = txtEmail.value;
	  	const pass = txtPass.value;
	  	const auth = firebase.auth();
	  	const promise = auth.createUserWithEmailAndPassword(email, pass);
	  	promise.catch(e => errorMsg.innerHTML = e.message);
	  });

	  // Event fires when user logs in or out
	  firebase.auth().onAuthStateChanged(firebaseUser =>{
	  	if(firebaseUser){
	  		location.href = "admin.html";
	  	}else{
	  		console.log("not logged in");
	  	}
	  });
	// If firebase is not defined then allow access offline
	}else{
    	location.href = "admin.html";
	}



