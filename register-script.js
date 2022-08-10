import * as exports from './general-script.js';
Object.entries(exports).forEach(([name, exported]) => window[name] = exported);
let register_form = id("register-form");
if (register_form) {
    register_form.addEventListener("submit", async function (e) {
        await registerManager(e);
    });
}
async function registerManager(e) {
    e.preventDefault();

    let response = false;
    let output = validateRegistrationData();
    let email = id("register-email");
    let password = id("register-password");

    let passwordErrorTwoRegister = id("register-password2-error");

    if (output === true) {
        //utworz konto
        response = await createAccount(email.value, password.value);
        if (!response.ok) {
            const responseJson = await response.json();
            if (responseJson['errors'][0]['message'] == "Field \"email\" has to be unique.") {
                passwordErrorTwoRegister.textContent = "W systeme istnieje już taki adres email";
            }
            else {
                passwordErrorTwoRegister.textContent = "Podczas rejestracji wystąpił błąd. Spróbuj ponownie";
            }
        }
        if (response.ok) {
            alert('Pomyślnie dodano użytkownika');
            window.location = 'index.html';
        }
        else {
            passwordErrorTwoRegister.textContent = "Podczas rejestracji wystąpił błąd. Spróbuj ponownie";
        }

    }

}
function validateRegistrationData() {
    let output = true;
    let email = id("register-email");
    let password = id("register-password");
    let password2 = id("register-password-2");
    let emailErrorRegister = id("register-email-error");
    let passwordErrorOneRegister = id("register-password-error");
    let passwordErrorTwoRegister = id("register-password2-error");

    if (!validateEmail(email.value, emailErrorRegister)) {
        output = false;
    }
    if (!validatePassword(password.value, passwordErrorOneRegister)) {
        output = false;
    }
    if (!validatePassword(password2.value, passwordErrorTwoRegister)) {
        output = false;
    }
    if (password.value !== password2.value) {
        passwordErrorTwoRegister.textContent = "Hasła muszą być takie same";
        output = false;
    }
    else {
        passwordErrorTwoRegister.textContent = "";
    }
    return output;
}
async function createAccount(email, password, studentAccount = true) {
    let roleId = studentAccount ? studentRoleId : teacherRoleId;

    // alert("rola studenta: ", roleId);
    // alert("rola tutejsza:", roleId);
    // 2022-07-02T23:59:00

    let response;
    const date = new Date();
    let initialPlatformAccessTimeout = new Date(date.setDate(date.getDate() + 30));
    console.log(initialPlatformAccessTimeout);
    let initialPlatformAccessTimeoutAsString = displayDate(initialPlatformAccessTimeout, true, true);
    console.log(initialPlatformAccessTimeoutAsString);

    let dataToPost = {
        "email": email,
        "password": password,
        "role": roleId,
        "platform_access_timeout": initialPlatformAccessTimeoutAsString,
        "balance": 30
    }
    let dataToPostJson = JSON.stringify(dataToPost);
    try {
        response = await fetch(`${appAddress}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: dataToPostJson
        });
    }
    catch (err) {
        console.error(`${err}`)
    }

    return response;

}