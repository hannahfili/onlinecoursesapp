import * as exports from './general-script.js'; 
Object.entries(exports).forEach(([name, exported]) => window[name] = exported);
let log_in_form = id("log-in-form");

if (log_in_form) {
    log_in_form.addEventListener("submit", function (e) {
        logInManager(e);
    });
}
async function logInManager(e) {
    let email = id("email-log-in");
    let password = id("password-log-in");
    let emailErrorLogIn = id("email-log-in-error");
    let passwordErrorLogIn = id("password-log-in-error");

    e.preventDefault();

    let output = true;
    if (!validateEmail(email.value, emailErrorLogIn)) {
        output = false;
    }
    if (!validatePassword(password.value, passwordErrorLogIn)) {
        output = false;
    }
    if (output) {
        let response = await logIn(email.value, password.value);
        let responseJson = await response.json();
        if (response.ok) {
            //get users data: roleId
            let loggedInRole = await setLoggedUserData(email.value, password.value, responseJson);
            if (loggedInRole == teacherRoleId) window.location = "teacherPanel.html";
            else if (loggedInRole == studentRoleId) window.location = "studentPanel.html";
            else if (loggedInRole == adminRoleId) window.location = "adminPanel.html";
            else alert("Rola nieprzypisana!");
        }
        else {
            if (responseJson['errors'][0]['message'] == "Invalid user credentials.") {
                passwordErrorLogIn.textContent = "Niepoprawny login lub hasło";
            }
            console.log("error");
        }
    }
}
async function logIn(email, password) {
    let response;
    try {
        response = await fetch(`${appAddress}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: `{
           "email": "${email}",
           "password": "${password}"
          }`,
        });
    }
    catch (err) {
        console.error(`${err}`)
    }

    return response;

}
async function setLoggedUserData(email, password, responseJson) {
    // localStorage.setItem("loggedInEmail", email);
    // localStorage.setItem("loggedInPassword", password);
    localStorage.setItem("access_token", responseJson["data"]["access_token"]);
    localStorage.setItem("refresh_token", responseJson["data"]["refresh_token"]);

    let response;
    try {
        response = await fetch(`${appAddress}/users/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        const responseJsonAboutMe = await response.json();
        localStorage.setItem("loggedInRole", responseJsonAboutMe["data"]["role"]);
        localStorage.setItem("loggedInUserId", responseJsonAboutMe["data"]["id"]);
        localStorage.setItem("loggedInPlatformAccessTimeout", responseJsonAboutMe["data"]["platform_access_timeout"]);
    }
    catch (err) {
        console.error(`${err}`);
    }
    // wypisz();
    return localStorage.getItem("loggedInRole");

}