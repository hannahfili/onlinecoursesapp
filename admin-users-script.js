import * as exports from './general-script.js'; 
Object.entries(exports).forEach(([name, exported]) => window[name] = exported);

let checkboxesCount = 0;
let numberOfBoxesChecked = 0;

window.onload = (async function () {
    await displayAllUsers();
})

async function displayAllUsers() {
    // wypisz();
    console.log("display users access token", localStorage.getItem("access_token"));
    console.log("display users refresh token", localStorage.getItem("refresh_token"));
    await redirectToIndexIfUserIsNotLoggedInAdmin();
    // let userIsLoggedIn = await checkIfUserIsLoggedInAndIfItIsAdmin();
    // if (!userIsLoggedIn) {
    //     alert("Sesja wygasła. Zaloguj się ponownie");
    //     // window.location.href = "/index.html";
    // }

    let response = await getAllUsersFromDatabase();
    if (response.ok) {
        await displayUsersOneByOne(response);
    }
    else {
        alert('Problem z wczytaniem użytkowników!');
        console.log("error");
    }
}

async function displayUsersOneByOne(response) {
    var mainContainer = id("admin-users-all-users-table-display");
    let buttonToDeleteManyUsers = id("admin-users-delete-many-users");
    const json = await response.json();
    checkboxesCount = json.data.length;
    let checkboxesElements = {};
    console.log(json);
    for (var i = 0; i < json.data.length; i++) {
        (function (index) {
            var person = json.data[index];
            var email = person["email"];

            const row = document.createElement('tr');

            const emailBox = document.createElement('td');
            emailBox.setAttribute('id', `user-details-email-${person["id"]}`);
            emailBox.textContent = `${email}`;
            row.appendChild(emailBox);

            const editBox = document.createElement('td');
            editBox.setAttribute('id', `user-details-editbox-user-${person["id"]}`);

            const buttonEditUser = document.createElement('button');
            buttonEditUser.setAttribute('id', `button-admin-users-edit-user-${person["id"]}`);
            buttonEditUser.setAttribute('class', `btn btn-secondary`);
            buttonEditUser.textContent = "Edytuj dane";
            buttonEditUser.addEventListener('click', function (e) { e.preventDefault(); saveUserToEditAndRedirect(person) });



            editBox.appendChild(buttonEditUser);
            row.appendChild(editBox);

            const deleteBox = document.createElement('td');
            deleteBox.setAttribute('id', `user-details-deletebox-user-${person["id"]}`);

            const buttonDeleteUser = document.createElement('button');
            buttonDeleteUser.setAttribute('id', `button-admin-users-delete-user-${person["id"]}`);
            buttonDeleteUser.setAttribute('class', `btn btn-secondary`);
            buttonDeleteUser.textContent = "Usuń użytkownika";
            buttonDeleteUser.addEventListener('click', function () { deleteManager(person) });
            deleteBox.appendChild(buttonDeleteUser);
            row.appendChild(deleteBox);

            const roleBox = document.createElement('td');
            roleBox.setAttribute('id', `user-details-rolebox-user-${person["id"]}`);

            if (person["role"] != teacherRoleId) {
                const buttonBestowTeacherRoleUponPerson = document.createElement('button');
                buttonBestowTeacherRoleUponPerson.setAttribute('id', `button-admin-users-bestow-teacher-role-${person["id"]}`);
                buttonBestowTeacherRoleUponPerson.setAttribute('class', `btn btn-secondary btn-success`);
                buttonBestowTeacherRoleUponPerson.textContent = "Nadaj rolę nauczyciela";

                buttonBestowTeacherRoleUponPerson.addEventListener('click', async function (e) {
                    e.preventDefault();
                    await updateUserData(person["id"], "role", teacherRoleId, "bestow teacher role");
                    document.location.reload();
                });
                roleBox.appendChild(buttonBestowTeacherRoleUponPerson);
            }
            else {
                const buttonCancelTeacherRoleUponPerson = document.createElement('button');
                buttonCancelTeacherRoleUponPerson.setAttribute('id', `button-admin-users-cancel-teacher-role-${person["id"]}`);
                buttonCancelTeacherRoleUponPerson.setAttribute('class', `btn btn-secondary`);
                buttonCancelTeacherRoleUponPerson.textContent = "Odbierz rolę nauczyciela";

                buttonCancelTeacherRoleUponPerson.addEventListener('click', async function (e) {
                    e.preventDefault();
                    await updateUserData(person["id"], "role", studentRoleId, "cancel teacher role");
                    document.location.reload();
                });
                roleBox.appendChild(buttonCancelTeacherRoleUponPerson);
            }
            row.appendChild(roleBox);

            const checkboxBox = document.createElement('td');
            checkboxBox.setAttribute('id', `user-details-checkbox-user-${person["id"]}`);

            const checkbox = document.createElement('input');
            checkbox.setAttribute('id', `checkbox-admin-users-${person["id"]}`);
            checkbox.setAttribute('class', `form-check-input`);
            checkbox.setAttribute('type', 'checkbox');
            checkbox.addEventListener('click', function () { numberOfBoxesChecked = enableDisableButton(this, buttonToDeleteManyUsers, numberOfBoxesChecked) });
            checkboxesElements[`${person["id"]}`] = checkbox;
            checkboxBox.appendChild(checkbox);

            row.appendChild(checkboxBox);

            mainContainer.appendChild(row);
        })(i);
    }

    buttonToDeleteManyUsers.addEventListener('click', function (e) { deleteManyUsers(e, checkboxesElements) });

}
async function updateUserData(userId, fieldName, fieldValue, actualizationName) {
    console.log(actualizationName);
    await redirectToIndexIfUserIsNotLoggedInAdmin();
    let response;
    try {
        response = await fetch(`${appAddress}/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: `{
                "${fieldName}": "${fieldValue}"
            }`
        });
    }
    catch (err) {
        alert(err);
        console.error(`${err}`)
    }
    // console.log(response.statusText);
    // let json = await response.json();
    // console.log(JSON.stringify(json));
    return response;
}
async function deleteManager(person) {
    let userId = person["id"];
    let confirmed = confirmDeletion(person);
    let message;
    if (confirmed) {
        let deleted=await deleteUserFromDatabase(userId);
        if(deleted) message = `Usunięto użytkownika: ${person["email"]}`;
        else message=`BŁĄD SERWERA. Nie udało się usunąć użytkownika: ${person["email"]}`;
    }
    else {
        message = `Użytkownik ${person["email"]} nie został usunięty`;
    }
    alert(message);
    if (confirmed) document.location.reload();
}
function confirmDeletion(user) {
    console.log(JSON.stringify(user));
    let email = user["email"];
    let answer = window.confirm(`Czy na pewno chcesz usunąć poniższego użytkownika?\n${email}`);
    return answer;
}


function saveUserToEditAndRedirect(userDataJson) {

    localStorage.setItem("edit_user_id", userDataJson["id"]);
    localStorage.setItem("edit_user_firstName", userDataJson["first_name"]);
    localStorage.setItem("edit_user_lastName", userDataJson["last_name"]);
    localStorage.setItem("edit_user_email", userDataJson["email"]);

    // console.log(localStorage.getItem("edit_user_firstName"));
    // console.log(localStorage.getItem("edit_user_lastName"));
    // console.log(localStorage.getItem("edit_user_email"));

    window.location = "/editUser.html";
}

async function deleteManyUsers(e, checkboxesElements) {
    e.preventDefault();
    let mainContainer = id("admin-users-all-users");
    let usersToDelete = "[";
    for (let key in checkboxesElements) {
        if (checkboxesElements[key].checked) {
            console.log("usunac: ", key);
            usersToDelete += '"';
            usersToDelete += key;
            usersToDelete += '"';
            usersToDelete += ", ";
        }
    }
    let removeLastCommaAndSpace = usersToDelete.slice(0, usersToDelete.length - 2);
    let jsonUsersArray = removeLastCommaAndSpace += "]";
    console.log(jsonUsersArray);
    let answer = window.confirm(`Czy na pewno chcesz usunąć zaznaczonych użytkowników?`);

    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    if (answer) {
        try {
            id("admin-users-all-users-table").remove();
            id("admin-users-delete-many-users").remove();
            response = await fetch(`${appAddress}/users`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem("access_token")}`
                },
                body: jsonUsersArray
            });

            if (response.ok) {

                let success = document.createElement('div');
                success.setAttribute('class', `success`);
                success.setAttribute('id', `admin-users-success-div`);
                success.textContent = `Usunięto zaznaczonych użytkowników`;
                mainContainer.appendChild(success);
            }
            else {
                responseNotOkayFound = true;
            }

        }
        catch (err) {
            console.error(`${err}`);
            errorOccured = true;
        }
        if (errorOccured || responseNotOkayFound) {
            let failure = document.createElement('div');
            failure.setAttribute('class', `failure`);
            failure.setAttribute('id', `admin-users-failure-div`);
            failure.textContent = `Nie udało się usunąć zaznaczonych użytkowników`;
            mainContainer.appendChild(failure);
        }

        let returnButton = document.createElement('button');
        returnButton.setAttribute('id', 'admin-users-return-button');
        returnButton.addEventListener('click', function () { window.location = "admin-users.html" });
        returnButton.textContent = "Wróć do menadżera użytkowników";
        mainContainer.appendChild(returnButton);
    }

}