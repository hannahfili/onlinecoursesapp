import * as exports from './general-script.js'; 
Object.entries(exports).forEach(([name, exported]) => window[name] = exported);
//dotyczy pliku addUser.html
let add_user_form = id("add-user-form");
if (add_user_form) {
    add_user_form.addEventListener("submit", async function (e) {
        e.preventDefault();
        userManager("addition");
    });
}
//----------------------------------
//dotyczy pliku editUser.html
window.onload = (async function () {
    await redirectToIndexIfUserIsNotLoggedInAdmin();
    await setEditUserDefaultFields();

});
let edit_user_form = id("edit-user-form");
if (edit_user_form) {
    edit_user_form.addEventListener("submit", async function (e) {
        e.preventDefault();
        await userManager("edition");
    });
}
let editUserReturnButton = id("editUser-return-admin-users");
editUserReturnButton.addEventListener('click', function (e) {
    e.preventDefault();
    window.location = "admin-users.html";
});

//------------------------------------
async function userManager(mode) {

    console.log("userManager");
    
    let checked = false;
    let prefix;
    if (mode == "edition") prefix = "edit";
    else {
        prefix = "add";
        if (id("add-user-bestow-teacher-role").checked) {
            checked = true;
            console.log(checked);
        }
    }
    let mainContainer = id(`${prefix}-user-main-container`);

    let firstNameElement = id(`${prefix}-user-first-name`);
    let lastNameElement = id(`${prefix}-user-last-name`);
    let emailElement = id(`${prefix}-user-email`);
    let passwordElementOne = id(`${prefix}-user-password`);
    let passwordElementTwo = id(`${prefix}-user-password-2`);

    console.log(firstNameElement.value);
    console.log(lastNameElement.value);
    console.log(emailElement.value);
    console.log(passwordElementOne.value);
    console.log(passwordElementTwo.value);

    let passwordOneErrorContainer = id(`${prefix}-user-password-error`);
    let passwordTwoErrorContainer = id(`${prefix}-user-password2-error`);
    let emailErrorContainer = id(`${prefix}-user-email-error`);


    let validated = validateAdditionOrEditionData(emailElement.value, passwordElementOne.value, passwordElementTwo.value,
        passwordOneErrorContainer, passwordTwoErrorContainer, emailErrorContainer);
    console.log(validated);
    console.log(firstNameElement.value);
    console.log(lastNameElement.value);
    let errorContainer = id(`${prefix}-user-all-error`);

    if (validated) {
        const valuesToUpdate = makeDictionaryOfInputData(emailElement.value,
            passwordElementOne.value, firstNameElement.value, lastNameElement.value);
        if (mode == "addition") {
            if (checked) valuesToUpdate["role"] = teacherRoleId;
            else valuesToUpdate["role"] = studentRoleId;
        }

        for (let key in valuesToUpdate) {
            console.log(key, ": ", valuesToUpdate[key]);
        }
        if (mode == "edition") updateUserDataManager(valuesToUpdate, errorContainer, mainContainer)
        else addUserDataManager(valuesToUpdate, errorContainer, mainContainer);
    }
    else {
        errorContainer.textContent = `Wprowadzono niepoprawne dane. Spróbuj jeszcze raz`;
    }
}
function validateAdditionOrEditionData(email, passwordOne, passwordTwo,
    passwordOneErrorContainer, passwordTwoErrorContainer, emailErrorContainer) {

    if (email != "") {
        if (!validateEmail(email, emailErrorContainer)) return false;
    }
    if (passwordOne != "" && passwordTwo != "") {
        if (!validatePassword(passwordOne, passwordOneErrorContainer)) return false;
        if (!validatePassword(passwordTwo, passwordTwoErrorContainer)) return false;
        if (passwordOne != passwordTwo) {
            passwordTwoErrorContainer.textContent = "Hasła muszą być takie same";
            return false;
        }
    }
    return true;

}
function makeDictionaryOfInputData(email, passwordOne, firstName, lastName) {
    const data = {
        "email": email,
        "password": passwordOne,
        "first_name": firstName,
        "last_name": lastName
    };
    return data;

}
async function updateUserDataManager(valuesToUpdate, errorContainer, mainContainer) {
    let response;
    let allResponses = [];
    let responseNotOkayFound = false;

    for (let key in valuesToUpdate) {
        if (valuesToUpdate[key] != "") {
            console.log(valuesToUpdate[key]);
            console.log(key);
            response = await updateUserData(localStorage.getItem("edit_user_id"), key, valuesToUpdate[key], `edit_${key}`);
            allResponses.push(response);
        }
    }
    console.log(allResponses);
    for (let partResponse in allResponses) {
        console.log(allResponses[partResponse].ok);
        if (!allResponses[partResponse].ok) {
            errorContainer.textContent = `Wystąpił problem przy aktualizacji danej: ${partResponse.statusText}`;
            responseNotOkayFound = true;
            break;
        }
    }
    if (!responseNotOkayFound) {
        edit_user_form.remove();
        let success = document.createElement('div');
        success.setAttribute('class', `success`);
        success.setAttribute('id', `edit-user-success-div`);
        success.textContent = `Edycja powiodła się`;

        let returnButton = document.createElement('button');
        returnButton.setAttribute('id', 'edit-user-return-button');
        returnButton.addEventListener('click', function (e) { e.preventDefault(); window.location = "admin-users.html" });
        returnButton.textContent = "Wróć do menadżera użytkowników";


        mainContainer.appendChild(success);
        mainContainer.appendChild(returnButton);

    }
}
async function addUserDataManager(valuesToAdd, errorContainer, mainContainer) {
    let jsonValues = JSON.stringify(valuesToAdd);
    let response;
    try {
        response = await fetch(`${appAddress}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: jsonValues
        });
        if (!response.ok) {
            errorContainer.textContent = `Wystąpił problem przy dodawaniu użytkownika - ${response.statusText}`;
        }
        else {
            add_user_form.remove();
            let success = document.createElement('div');
            success.setAttribute('class', `success`);
            success.setAttribute('id', `add-user-success-div`);
            success.textContent = `Udało się dodać użytkownika: ${valuesToAdd["email"]}`;

            let returnButton = document.createElement('button');
            returnButton.setAttribute('id', 'add-user-return-button');
            returnButton.addEventListener('click', function () { window.location = "admin-users.html" });
            returnButton.textContent = "Wróć do menadżera użytkowników";


            mainContainer.appendChild(success);
            mainContainer.appendChild(returnButton);
        }
    }
    catch (err) {
        console.error(`${err}`)

    }


}
async function setEditUserDefaultFields() {
    await redirectToIndexIfUserIsNotLoggedInAdmin();

    let firstName = localStorage.getItem("edit_user_firstName");
    let lastName = localStorage.getItem("edit_user_lastName");
    let email = localStorage.getItem("edit_user_email");

    let firstNameElement = nameGetter("edit-user-first-name");
    let lastNameElement = nameGetter("edit-user-last-name");
    let emailElement = nameGetter("edit-user-email");


    firstName != "null" ? firstNameElement[0].placeholder = firstName : firstNameElement[0].placeholder = "";
    lastName != "null" ? lastNameElement[0].placeholder = lastName : lastNameElement[0].placeholder = "";
    email != "null" ? emailElement[0].placeholder = email : emailElement[0].placeholder = "";

    console.log(localStorage.getItem("edit_user_firstName"));
    console.log(localStorage.getItem("edit_user_lastName"));
    console.log(localStorage.getItem("edit_user_email"));

    console.log("set edit refresh: ", localStorage.getItem("refresh_token"));

}
