// --------------------selectors--------------------

export let id = (id) => document.getElementById(id);
export let classes = (classes) => document.getElementsByClassName(classes);
export let nameGetter = (names) => document.getElementsByName(names);

// --------------------END OF selectors--------------------

// --------------------roles' IDs--------------------
export const appAddress = "https://3qyn4234.directus.app";
export const studentRoleId = "063a370c-d078-44bf-b803-a84e72ca2255";
export const teacherRoleId = "f3886bec-904f-4e69-82c6-31f3735f0e7b";
export const adminRoleId = "cb3534ce-3c8d-4b22-86b7-6fb8f9646ccc";
// --------------------END OF roles' IDs--------------------

export function validateEmail(inputText, outputPlace) {
    var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (inputText.match(mailformat)) {
        return true;
    }
    else {
        outputPlace.textContent = "Format maila jest niepoprawny!";
        return false;
    }
}

export function validatePassword(myInput, outputPlace) {
    // Validate length
    if (myInput.length < 8) {
        outputPlace.textContent = "Hasło powinno zawierać co najmniej 8 znaków";
        return false;
    }
    else outputPlace.textContent = "";
    // Validate lowercase letters
    let lowerCaseLetters = /[a-z]/g;
    if (!myInput.match(lowerCaseLetters)) {
        outputPlace.textContent = "Hasło powinno zawierać małe litery";
        return false;
    }
    else outputPlace.textContent = "";
    // Validate capital letters
    let upperCaseLetters = /[A-Z]/g;
    if (!myInput.match(upperCaseLetters)) {
        outputPlace.textContent = "Hasło powinno zawierać wielkie litery";
        return false;
    }
    else outputPlace.textContent = "";

    // Validate numbers
    let numbers = /[0-9]/g;
    if (!myInput.match(numbers)) {
        outputPlace.textContent = "Hasło powinno zawierać liczby";
        return false;
    }
    else outputPlace.textContent = "";


    return true;
}
export function displayDate(date, formatWithDash = false, datetime = false) {
    const yyyy = date.getFullYear();
    let mm = date.getMonth() + 1; // Months start at 0!
    let dd = date.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    let dateToDisplay = dd + '.' + mm + '.' + yyyy;
    if (formatWithDash) dateToDisplay = yyyy + '-' + mm + '-' + dd;
    if (datetime) {
        let hr = date.getHours();
        let min = date.getMinutes();
        let sec = date.getSeconds();

        if (hr < 10) hr = '0' + hr;
        if (min < 10) min = '0' + min;
        if (sec < 10) sec = '0' + sec;

        dateToDisplay = dateToDisplay + "T" + hr + ":" + min + ":" + sec;
    }
    return dateToDisplay;
}
export async function logOut() {
    let response;
    try {
        response = await fetch(`${appAddress}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: `{ "refresh_token": "${localStorage.getItem("refresh_token")}"}`
        });
    }
    catch (err) {
        console.error(`${err}`);
    }
    console.log(JSON.stringify(response));
    localStorage.clear();
    window.location = "index.html";
    return response;
}
export async function redirectToIndexIfUserIsNotLoggedInAdmin() {
    let userIsLoggedAndAdmin = await checkIfUserIsLoggedInAndIfItIsAdmin();
    if (!userIsLoggedAndAdmin) {
        alert("Sesja wygasła. Zaloguj się ponownie");
        window.location.href = "/index.html";
    }
}
export async function checkIfUserIsLoggedInAndIfItIsAdmin() {
    if (!checkIfUserIsAdmin()) {
        console.log(localStorage.getItem("loggedInRole"));
        return false;
    }
    if (checkIfUserIsLoggedIn()) {
        // let tokenGotRefreshed = await refreshTokenIfExpired();
        let tokenGotRefreshed = await refreshToken();
        console.log(tokenGotRefreshed);
        return tokenGotRefreshed;
    }
    return false;
}
export function checkIfUserIsAdmin() {
    if (localStorage.getItem("loggedInRole") == adminRoleId) return true;
    return false;
}
export function checkIfUserIsLoggedIn() {
    if (localStorage.getItem("access_token") == null) return false;
    return true;
}
export async function refreshToken() {
    localStorage.setItem("old_refresh_token", localStorage.getItem("refresh_token"));
    let responseWithNewToken;
    try {
        responseWithNewToken = await fetch(`${appAddress}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: `{ "refresh_token": "${localStorage.getItem("refresh_token")}"}`
        });
    }
    catch (err) {

        console.error(`${err}`);
        return false;
    }
    let responseJsonWithNewToken = await responseWithNewToken.json();
    if (!responseWithNewToken.ok) {
        if (responseJsonWithNewToken['errors'][0]['message'] == "Invalid user credentials.") {
            return false;
        }
    }

    localStorage.setItem("access_token", responseJsonWithNewToken["data"]["access_token"]);
    localStorage.setItem("refresh_token", responseJsonWithNewToken["data"]["refresh_token"]);
    return true;
}
export async function getAllUsersFromDatabase() {
    console.log("refresh token get all users from database", localStorage.getItem("refresh_token"));
    let response;
    try {
        response = await fetch(`${appAddress}/users?limit=-1`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
    }
    catch (err) {
        alert(err);
        console.error(`${err}`)
    }

    return response;
}
export function enableDisableButton(checkbox, buttonToEnableOrDisable, numberOfBoxesChecked) {
    if (checkbox.checked) {
        numberOfBoxesChecked += 1;
        buttonToEnableOrDisable.classList.remove("disabled");
    }
    else {
        numberOfBoxesChecked -= 1;
        if (numberOfBoxesChecked < 1) {
            buttonToEnableOrDisable.classList.add("disabled");
        }
    }
    return numberOfBoxesChecked;
}
export async function isolateParticularGroupOfUsersFromAllUsers(containerToDisplayError, roleId, infoToDisplay, typeOfIsolation) {
    let response = await getAllUsersFromDatabase();
    let responseJson = await response.json();
    if (!response.ok) {
        containerToDisplayError.textContent = infoToDisplay;
        return {};
    }
    let users = responseJson.data;
    let isolatedUsersDictionary = {};

    for (let i = 0; i < users.length; i++) {
        let obj = users[i];
        if (obj["role"] == roleId) {
            let userData = [obj["first_name"], obj["last_name"], obj["email"]];
            isolatedUsersDictionary[obj["id"]] = userData;
        }
    }
    // console.log(isolatedUsersDictionary);
    return isolatedUsersDictionary;
}
export async function getAllCoursesFromDatabase() {
    let response;
    try {
        response = await fetch(`${appAddress}/items/Courses`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
    }
    catch (err) {
        console.error(`${err}`)
    }
    return response;
}
export async function getAllItemsFromStudentsCoursesJunctionTable(containerForError = null) {
    let response;
    let errorCought = false;
    try {
        response = await fetch(`${appAddress}/items/junction_directus_users_Courses`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
    }
    catch (err) {
        // alert(err);
        console.error(`${err}`);
        errorCought = true;
    }
    let responseJson = [];
    if (!response.ok || errorCought) {
        if (containerForError != null) containerForError.textContent = "Wystąpił problem z pobieraniem studentów";
        return false;
    }
    responseJson = await response.json();
    // console.log(responseJson);
    return responseJson;
}
export function getStudentsAssigned(allStudentsDictionary, studentsAssignedToThisCourse) {
    let studentsAssignedToThisCourseDict = {};
    for (let key in allStudentsDictionary) {
        let idFromStudentDictionary = key;
        for (let i = 0; i < studentsAssignedToThisCourse.length; i++) {
            let studentAssignedToThisCourseId = studentsAssignedToThisCourse[i];
            if (idFromStudentDictionary == studentAssignedToThisCourseId) {
                studentsAssignedToThisCourseDict[key] = allStudentsDictionary[key];
            }
        }
    }
    return studentsAssignedToThisCourseDict;
}
function getStudentsNotAssigned(allStudentsDictionary, studentsAssignedToThisCourse) {
    let thisStudentsIsAssignedToThisCourse = false;
    let students = {};

    for (let key in allStudentsDictionary) {
        let idFromStudentDictionary = key;
        thisStudentsIsAssignedToThisCourse = false;
        for (let i = 0; i < studentsAssignedToThisCourse.length; i++) {
            let studentAssignedToThisCourseId = studentsAssignedToThisCourse[i];
            if (idFromStudentDictionary == studentAssignedToThisCourseId) {
                thisStudentsIsAssignedToThisCourse = true;
                break;
            }
        }
        if (thisStudentsIsAssignedToThisCourse == false) {
            students[key] = allStudentsDictionary[key];
        }
    }

    return students;
}
export async function redirectToIndexIfUserIsNotLoggedInAtAll() {
    if (!checkIfUserIsLoggedIn()) {
        window.location = "index.html";
    }
    else {
        // console.log("HELLO")
    }
}
export async function updateCourse(courseId, fieldName, fieldValue, actualizationName) {
    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    try {
        response = await fetch(`${appAddress}/items/Courses/${courseId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: `{
                "${fieldName}": "${fieldValue}"
            }`
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        errorOccured = true;
        console.error(`${err}`);
    }
    if (responseNotOkayFound || errorOccured) return false;
    return true;
}
export async function deleteTeacherFromCourse(itemId, errorContainer, errorMessage) {
    // console.log("usuwamy", itemId);
    let response;
    let errorOccured = false;

    try {
        response = await fetch(`${appAddress}/items/Courses_directus_users/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
    }
    catch (err) {
        console.error(`${err}`);
        errorOccured = true;
    }
    if (!response.ok || errorOccured) {
        errorContainer.textContent = errorMessage;
        return false;
    }

    return true;
}
export async function deleteUserFromDatabase(userId) {
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    try {
        response = await fetch(`${appAddress}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (!response.ok) responseNotOkayFound = true;

    }
    catch (err) {
        console.error(`${err}`);
        errorOccured = true;
    }
    console.log(response.statusText);
    if (errorOccured || responseNotOkayFound) return false;
    return true;
}
export async function getStudentsFromStudentsCoursesJunctionTable(courseId, getAssignedStudents = true, containerForError) {


    let allItemsFromStudentsCoursesJunctionTable = await getAllItemsFromStudentsCoursesJunctionTable(containerForError);
    let allStudentsDictionary = await isolateParticularGroupOfUsersFromAllUsers(containerForError, studentRoleId,
        "Problem z pobraniem studentów z serwera", "student");

    let data = allItemsFromStudentsCoursesJunctionTable.data;
    let studentsAssignedToThisCourse = [];
    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        // console.log(item["directus_users_id"]);
        if (item["Courses_id"] == courseId) studentsAssignedToThisCourse.push(item["directus_users_id"]);
    }
    // console.log(studentsAssignedToThisCourse);

    if (getAssignedStudents == true) {
        if (studentsAssignedToThisCourse.length == 0) { return null; }
        return getStudentsAssigned(allStudentsDictionary, studentsAssignedToThisCourse);
    }
    else {
        if (data.length == 0) return allStudentsDictionary;
        return getStudentsNotAssigned(allStudentsDictionary, studentsAssignedToThisCourse);
    }

}

export async function getCourseDetails(courseId, errorContainer) {
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    try {
        response = await fetch(`${appAddress}/items/Courses/${courseId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        console.error(`${err}`);
        errorOccured = true;
    }
    if (responseNotOkayFound || errorOccured) {
        errorContainer.textContent = `Nie udało załadować szczegółów kursu`;
        return null;
    }

    return response;
}
export async function getSectionsAssignedToTheModule(moduleId, containerForError) {
    let allSections = await getAllSections();

    if (allSections == null) {
        containerForError.textContent = "Wystąpił problem z pobraniem sekcji należących do modułu";
        return null;
    }
    let allSectionsJson = await allSections.json();

    let data = allSectionsJson.data;
    if (Object.keys(data).length === 0) return [];
    let sectionsAssignedToThisModule = [];
    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        if (item["module"] == moduleId) sectionsAssignedToThisModule.push(item);
    }
    // console.log(sectionsAssignedToThisModule);
    return sectionsAssignedToThisModule;
}
export async function getAllSections() {
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    try {

        response = await fetch(`${appAddress}/items/Sections`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (!response.ok) responseNotOkayFound = true;

    }
    catch (err) {
        console.error(`${err}`);
        errorOccured = true;
    }
    // console.log(response.statusText);
    if (errorOccured || responseNotOkayFound) return null;
    return response;
}
export function checkIfElementOccursInArrayMoreThanOnce(array) {
    let occursTwice = false;
    for (let i = 0; i < array.length; i++) {
        for (let k = i + 1; k < array.length; k++) {
            if (array[i] == array[k]) {
                occursTwice = true;
                break;
            }
        }
    }
    return occursTwice;
}
export async function getTeachersDataToDisplay(course_directus_users_relation_ids) {
    let teachersData = {};
    let teachersDataToDisplay = [];
    // console.log(course_directus_users_relation_ids);
    for (let number in course_directus_users_relation_ids) {
        console.log(number);
        teachersData[course_directus_users_relation_ids[number]] = await getTeacherIdFromCourseDirectusUsersRelation(course_directus_users_relation_ids[number]);
    }
    for (let key in teachersData) {
        if (teachersData[key] != -1) {
            let data = await getTeacherDataById(teachersData[key]);
            if (data != -1) teachersDataToDisplay.push(data);
        }
    }
    // console.log(teachersData);
    return teachersDataToDisplay;
}
export async function getTeacherIdFromCourseDirectusUsersRelation(id) {
    let response;
    try {
        response = await fetch(`${appAddress}/items/Courses_directus_users/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (response.ok) {
            let json = await response.json();
            return json.data["directus_users_id"];
        }
    }
    catch (err) {
        alert(err);
        console.error(`${err}`);
        return -1;
    }

}
export async function getTeacherDataById(id) {
    let response;
    try {
        response = await fetch(`${appAddress}/users/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (response.ok) {
            let json = await response.json();
            let first_name = json.data["first_name"];
            let last_name = json.data["last_name"];
            let email = json.data["email"];
            if (first_name != null && last_name != null && first_name != "" && last_name != "") return first_name + " " + last_name;
            else return email;
        }
    }
    catch (err) {
        alert(err);
        console.error(`${err}`);
        return -1;
    }
}
export async function getModulesAssignedToThisCourse(courseId) {
    let allModulesResponse = await getAllModules();
    if (allModulesResponse == null) return null;
    let json = await allModulesResponse.json();
    let data = json.data;
    let modulesAssignedToThisCourseRepresentedAsDictionaryWithOrderNumberAsKeyAndModuleDataAsValue = {};
    if (data.length == 0) return modulesAssignedToThisCourseRepresentedAsDictionaryWithOrderNumberAsKeyAndModuleDataAsValue;
    for (let i = 0; i < data.length; i++) {
        if (data[i]["course"] == courseId) {
            modulesAssignedToThisCourseRepresentedAsDictionaryWithOrderNumberAsKeyAndModuleDataAsValue[data[i]["order_number"]] = data[i];
        }
    }
    return modulesAssignedToThisCourseRepresentedAsDictionaryWithOrderNumberAsKeyAndModuleDataAsValue;

}
export async function getAllModules() {
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    try {

        response = await fetch(`${appAddress}/items/Modules`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (!response.ok) responseNotOkayFound = true;

    }
    catch (err) {
        console.error(`${err}`);
        errorOccured = true;
    }
    console.log(response.statusText);
    if (errorOccured || responseNotOkayFound) return null;
    return response;
}
export async function addFileElementManager(element, sectionId, userCreated = localStorage.getItem("loggedInUserId")) {

    let fileAddedId = await uploadFile(element["value"], element["file_name"]);
    if (fileAddedId == null) {
        return false;
    }
    let valuesToAddFileElement = {
        "user_created": userCreated,
        "order_number": element["order_number"],
        "section": sectionId,
        "file": fileAddedId
    }
    let valuesJson = JSON.stringify(valuesToAddFileElement);

    let errorOccured = false;
    let responseNotOkayFound = false;
    let responseJson;

    try {
        let response = await fetch(`${appAddress}/items/File_elements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: valuesJson,
        });
        if (!response.ok) responseNotOkayFound = true;
        console.log(response.statusText);
        responseJson = await response.json();

    } catch (error) {
        console.log(error.message);
        errorOccured = true;
    }
    if (errorOccured || responseNotOkayFound) {
        return false;
    }
    return true;
}
export async function uploadFile(file, fileName) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename_download', fileName);

    let errorOccured = false;
    let responseNotOkayFound = false;
    let responseJson;

    try {
        let response = await fetch(`${appAddress}/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: formData,
        });
        if (!response.ok) responseNotOkayFound = true;
        console.log(response.statusText);
        responseJson = await response.json();

    } catch (error) {
        console.log(error.message);
        errorOccured = true;
    }
    if (errorOccured || responseNotOkayFound) {
        return null;
    }
    return responseJson.data["id"];
}
export async function getUserInfo(userId) {
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    try {

        response = await fetch(`${appAddress}/users/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (!response.ok) responseNotOkayFound = true;

    }
    catch (err) {
        console.error(`${err}`);
        errorOccured = true;
    }
    if (errorOccured || responseNotOkayFound) return null;
    let responseJson = await response.json();
    let responseData = responseJson.data;
    return responseData;
}
export async function updateUserData(userId, fieldName, fieldValue, actualizationName) {
    console.log(actualizationName);
    // await redirectToIndexIfUserIsNotLoggedInAdmin();
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
        console.error(`${err}`);
    }
    // console.log(response.statusText);
    // let json = await response.json();
    // console.log(JSON.stringify(json));
    return response;
}
export async function updateUserDataVersion2(userId, fieldName, fieldValue, actualizationName) {
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
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
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        console.error(`${err}`);
        errorOccured = true;
    }
    if (errorOccured || responseNotOkayFound) return false;
    return true;
}
export function displayUpperInfo(divForWeekData, weekStartEnd, howManyWeeksToAdd = 0) {

    let weekNo = getWeekNumber(new Date())[1];
    weekNo += howManyWeeksToAdd;
    weekNo = weekNo % 52;
    if (weekNo == 0) weekNo = 52;

    let startDate = weekStartEnd["monday_date"];
    let endNewDate = startDate.getTime() + 6 * 86400000;
    let endDate = new Date(endNewDate);

    let startDateAsString = displayDate(startDate);
    let endDateAsString = displayDate(endDate);

    let dateGeneralInfoTextNode = document.createTextNode(`Tydzień numer: ${weekNo}`);
    let dateGeneralInfoTextNode2 = document.createTextNode(`${startDateAsString} - ${endDateAsString}`);
    let br = document.createElement("br");
    divForWeekData.setAttribute('style', 'white-space: pre;');

    divForWeekData.textContent = `Tydzień numer: ${weekNo}\r\n${startDateAsString} - ${endDateAsString}`;

    // divForWeekData.appendChild(dateGeneralInfoTextNode);
    // divForWeekData.appendChild(br);
    // divForWeekData.appendChild(dateGeneralInfoTextNode2);
}
export async function getModuleAsssignedToThisCourseLastOrderNumber(courseId) {
    let modulesAssignedToThisCourse = await getModulesAssignedToThisCourse(courseId);
    if (modulesAssignedToThisCourse == null) {
        return -1;
    }
    else if (Object.keys(modulesAssignedToThisCourse).length == 0) {
        return 0;
    }
    let maxOrderNumber = 0;
    for (let key in modulesAssignedToThisCourse) {
        if (Number(modulesAssignedToThisCourse[key]["order_number"]) > maxOrderNumber) {
            maxOrderNumber = Number(modulesAssignedToThisCourse[key]["order_number"]);
        }
    }
    return maxOrderNumber;

}
export async function addModuleManager(courseId, moduleToAddAtCourseAllModulesSectionsPage = false, containerToDisplayAddModule = null) {
    console.log("JESTEM")
    let lastModuleAssignedToThisCourseOrderNumber = await getModuleAsssignedToThisCourseLastOrderNumber(courseId);
    if (lastModuleAssignedToThisCourseOrderNumber == -1) return false;

    let containerForDisplayingUpperButtons;
    let prefix;
    if (!moduleToAddAtCourseAllModulesSectionsPage) {
        prefix = "course-details";
        containerForDisplayingUpperButtons = id("course-details-add-module-upper-buttons-div");
    }
    else {
        prefix = "courses-all-modules-sections"
        containerForDisplayingUpperButtons = document.createElement("div");
        containerForDisplayingUpperButtons.setAttribute('id', `${prefix}-add-module-upper-buttons-div`);
        containerToDisplayAddModule.appendChild(containerForDisplayingUpperButtons);
    }

    let containerForInput = document.createElement('div');
    containerForInput.setAttribute('id', `${prefix}-add-module-div`);

    // <label for="add-course-name">Nazwa kursu</label><br>
    //             <input id="add-course-name" name="add-course-name" placeholder="Pole obowiązkowe" required><br>
    //             <div class="error" id="add-course-name-error"></div>
    let labelForNameInput = document.createElement('label');
    labelForNameInput.setAttribute('for', `${prefix}-module-name-input`);
    labelForNameInput.textContent = "Nazwa modułu";

    let moduleNameInput = document.createElement('input');
    moduleNameInput.setAttribute('id', `${prefix}-module-name-input`);
    moduleNameInput.setAttribute('placeholder', 'Pole obowiązkowe');

    let labelForDescriptionInput = document.createElement('label');
    labelForDescriptionInput.setAttribute('for', `${prefix}-module-description-input`);
    labelForDescriptionInput.textContent = "Opis modułu";

    let moduleDescriptionInput = document.createElement('input');
    moduleDescriptionInput.setAttribute('id', `${prefix}-module-description-input`);

    let submitButton = document.createElement('button');
    submitButton.setAttribute('id', `${prefix}-add-module-submit-button`);
    submitButton.textContent = "Zapisz";
    let buttonToDeleteOptionToAddModule = document.createElement('button');
    buttonToDeleteOptionToAddModule.setAttribute('id', `${prefix}-button-to-delete-option-to-add-module`);
    buttonToDeleteOptionToAddModule.setAttribute('class', 'btn btn-danger');
    buttonToDeleteOptionToAddModule.textContent = "X";


    containerForInput.appendChild(labelForNameInput);
    containerForInput.appendChild(moduleNameInput);
    containerForInput.appendChild(labelForDescriptionInput);
    containerForInput.appendChild(moduleDescriptionInput);
    containerForInput.appendChild(submitButton);
    containerForInput.appendChild(buttonToDeleteOptionToAddModule);

    containerForDisplayingUpperButtons.appendChild(containerForInput);

    buttonToDeleteOptionToAddModule.addEventListener('click', function (e) {
        e.preventDefault();
        buttonToDeleteOptionToAddModule.parentElement.remove();
    })

    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        let moduleAdded = await addModuleToDatabase(courseId, moduleNameInput.value, moduleDescriptionInput.value, lastModuleAssignedToThisCourseOrderNumber + 1);
        if (moduleAdded) {
            alert('Pomyślnie dodano moduł');
            location.reload();
        }
        else {
            alert('Wystąpił błąd przy dodawaniu modułu');
        }
        return moduleAdded;
    });
    return true;
}
async function addModuleToDatabase(courseId, name, description, orderNumber) {
    let data = {
        "course": courseId,
        "name": name,
        "description": description,
        "order_number": orderNumber
    };
    let dataToPostJson = JSON.stringify(data);
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    try {

        response = await fetch(`${appAddress}/items/Modules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: dataToPostJson
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        console.error(`${err}`);
        errorOccured = true;
    }
    console.log(response.statusText);
    if (errorOccured || responseNotOkayFound) return false;
    return true;
}
async function getTeachersShiftsForParticularDate(chosenDate, teacher) {
    let allTeachersShifts = await getAllTeachersShiftsOrAppointments("Shifts", teacher);
    let shiftsForChosenDate = allTeachersShifts
        .filter(
            n => n.date == chosenDate
        );
    return shiftsForChosenDate;
}
export async function deleteShiftsOfChosenDateFromDatabase(chosenDate, teacher) {

    console.log(chosenDate);
    let shiftsForChosenDate = await getTeachersShiftsForParticularDate(chosenDate, teacher);
    let shiftsIdsToRemove = [];
    shiftsForChosenDate.forEach(function (element) {
        shiftsIdsToRemove.push(element.id);
    });
    console.log('###############');
    console.log(shiftsIdsToRemove);
    console.log('###############');
    let bodyToDelete = JSON.stringify(shiftsIdsToRemove);


    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    try {
        response = await fetch(`${appAddress}/items/Shifts`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: bodyToDelete
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        errorOccured = true;
        console.error(`${err}`);
    }
    if (responseNotOkayFound || errorOccured) return false;
    return true;
}
export function getStartTime(startHourIndex) {
    let startTime = 0;
    switch (startHourIndex) {
        case 1:
            startTime = "08:00:00";
            break;
        case 2:
            startTime = "09:45:00";
            break;
        case 3:
            startTime = "11:30:00";
            break;
        case 4:
            startTime = "13:15:00";
            break;
        case 5:
            startTime = "15:00:00";
            break;
        case 6:
            startTime = "16:45:00";
            break;
        case 7:
            startTime = "18:30:00";
            break;
    }
    return startTime;
}
export function getEndTime(startHourIndex) {
    let endTime = 0;
    switch (startHourIndex) {
        case 1:
            endTime = "09:30:00";
            break;
        case 2:
            endTime = "11:15:00";
            break;
        case 3:
            endTime = "13:00:00";
            break;
        case 4:
            endTime = "14:45:00";
            break;
        case 5:
            endTime = "16:30:00";
            break;
        case 6:
            endTime = "18:15:00";
            break;
        case 7:
            endTime = "20:00:00";
            break;
    }
    return endTime;
}

export function setMondayAndSaturdayForThisWeek(numberOfWeeksToAddOrRemove = 0) {
    let yearWithWeekNo = getWeekNumber(new Date());
    let weekNo = yearWithWeekNo[1];
    weekNo += numberOfWeeksToAddOrRemove;

    let currentdate = new Date();
    let oneJun = new Date(currentdate.getFullYear(), 0, 1, 0, 0);

    let numberOfDaysToAdd = (weekNo - 1) * 7;
    let newDate = oneJun.getTime() + numberOfDaysToAdd * 86400000;
    let possibleMonday = new Date(newDate);
    let dayOfWeek = possibleMonday.getDay();

    while (dayOfWeek != 1) {
        numberOfDaysToAdd += 1;
        newDate = oneJun.getTime() + numberOfDaysToAdd * 86400000;
        possibleMonday = new Date(newDate);
        dayOfWeek = possibleMonday.getDay();
    }

    let mondayForThisWeek = possibleMonday;
    let newSaturday = mondayForThisWeek.getTime() + 5 * 86400000;
    let saturdayForThisWeek = new Date(newSaturday);
    saturdayForThisWeek = new Date(saturdayForThisWeek.getFullYear(), saturdayForThisWeek.getMonth(), saturdayForThisWeek.getDate(), 23, 59);

    let data = {
        "monday_date": mondayForThisWeek,
        "saturday_date": saturdayForThisWeek
    }
    return data;

    // console.log(mondayForThisWeek);
    // console.log(saturdayForThisWeek);
}
export async function setEditUserDefaultFieldsVersion2(userId, filePrefix) {

    let userInfo = await getUserInfo(userId);
    let firstName = userInfo.first_name;
    let lastName = userInfo.last_name;
    let email = userInfo.email;
    // student-panel-my-account-email

    let firstNameElement = nameGetter(`${filePrefix}-my-account-first-name`);
    let lastNameElement = nameGetter(`${filePrefix}-my-account-last-name`);
    let emailElement = nameGetter(`${filePrefix}-my-account-email`);


    firstName != null ? firstNameElement[0].placeholder = firstName : firstNameElement[0].placeholder = "";
    lastName != null ? lastNameElement[0].placeholder = lastName : lastNameElement[0].placeholder = "";
    email != null ? emailElement[0].placeholder = email : emailElement[0].placeholder = "";

}
export function validateAdditionOrEditionDataVersion2(email, passwordOne, passwordTwo,
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
export async function editMyData(filePrefix) {
    let emailElement = id(`${filePrefix}-my-account-email`);
    let passwordElementOne = id(`${filePrefix}-my-account-password`);
    let passwordElementTwo = id(`${filePrefix}-my-account-password-2`);
    let passwordOneErrorContainer = id(`${filePrefix}-my-account-password-error`);
    let passwordTwoErrorContainer = id(`${filePrefix}-my-account-password2-error`);
    let emailErrorContainer = id(`${filePrefix}-my-account-email-error`);

    let firstNameElement = id(`${filePrefix}-my-account-first-name`);
    let lastNameElement = id(`${filePrefix}-my-account-last-name`);

    let validated = validateAdditionOrEditionDataVersion2(emailElement.value, passwordElementOne.value, passwordElementTwo.value,
        passwordOneErrorContainer, passwordTwoErrorContainer, emailErrorContainer);
    // console.log(validated);
    console.log(filePrefix)
    console.log(emailElement.value);
    console.log(passwordElementOne.value);
    console.log(passwordElementTwo.value);
    let errorContainer = id(`${filePrefix}-my-account-all-error`);
    let response;

    let errorOccured = false;

    if (validated) {
        const valuesToUpdate = makeDictionaryOfInputData(emailElement.value,
            passwordElementOne.value, firstNameElement.value, lastNameElement.value);
        console.log(valuesToUpdate);
        for (let key in valuesToUpdate) {
            if (valuesToUpdate[key] != "") {
                response = await updateUserDataVersion2(localStorage.getItem("loggedInUserId"), key, valuesToUpdate[key]);
                if (!response) errorOccured = true;
            }

        }
    }
    else {
        errorContainer.textContent = `Wprowadzono niepoprawne dane. Spróbuj jeszcze raz`;
    }
    return !errorOccured;
}
export function makeDictionaryOfInputData(email, passwordOne, firstName, lastName) {
    const data = {
        "email": email,
        "password": passwordOne,
        "first_name": firstName,
        "last_name": lastName
    };
    return data;

}

export async function setMainContainerToMyData(filePrefix) {
    // student-panel-my-account-data-div
    // student-panel-my-account-data-div
    let divForMyData = id(`${filePrefix}-my-account-data-div`);
    divForMyData.style.visibility = "visible";
    await setEditUserDefaultFieldsVersion2(localStorage.getItem("loggedInUserId"), filePrefix);

    // student-panel-my-account-submit
    let buttonToEditPersonalData = id(`${filePrefix}-my-account-submit`);
    buttonToEditPersonalData.addEventListener('click', async function (e) {
        e.preventDefault();
        let editted = await editMyData(filePrefix);
        if (editted) {
            alert('Pomyślnie edytowano wybrane dane');
            localStorage.setItem("setMainContainerToMyData", true);
            window.location.reload();
        }
        else {
            alert('BŁĄD SERWERA. Wystąpił problem przy edycji danych')
        }


    });

    // student-panel-my-account-delete-account
    let userInfo = await getUserInfo(localStorage.getItem("loggedInUserId"));
    let email = userInfo.email;

    let buttonToDeleteAccount = id(`${filePrefix}-my-account-delete-account`);
    buttonToDeleteAccount.addEventListener('click', async function (e) {
        e.preventDefault();
        let confirmed = confirm('Czy na pewno chcesz usunąć konto?');
        if (confirmed) {
            let deleted = await deleteUserFromDatabase(localStorage.getItem("loggedInUserId"));
            if (deleted) {
                alert(`Konto użytkownika ${email} zostało usunięte`);
                window.location = "index.html";
            }
            else {
                alert('BŁĄD SERWERA! Nie udało się usunąć konta');
            }
        }

    });
}

export async function displayUserDepositsUpperPanel(userId, filePrefix, withoutAccessTimeout = false) {
    let userInfo = await getUserInfo(userId);
    let balance = userInfo.balance;
    let platform_access_timeout = userInfo.platform_access_timeout;
    let timeoutDisplay = displayDateTime(platform_access_timeout);

    let balancePlace = id(`${filePrefix}-my-deposits-my-balance`);
    balancePlace.textContent = `Bieżące saldo: ${balance == null ? 0 : balance} PLN`;
    if (withoutAccessTimeout) return;
    let platform_access_timeout_Place = id(`${filePrefix}-my-deposits-platform-access-timeout`);
    platform_access_timeout_Place.textContent = "Data ważności konta: " + timeoutDisplay;

    let buttonToProlongPlaftormAccess = id(`${filePrefix}-prolong-platform-access-timeout`);
    let buttonToTopUpAccount = id(`${filePrefix}-top-up-account`);

    buttonToProlongPlaftormAccess.addEventListener('click', async function (e) {
        e.preventDefault();
        let prolonged = await prolongAccess(userId);
    });
    buttonToTopUpAccount.addEventListener('click', async function (e) {
        e.preventDefault();
        platform_access_timeout_Place.remove()
        let toppedUp = await topUpAccountManager(userId, buttonToTopUpAccount, filePrefix);
    });

}
export async function topUpAccountManager(userId, button, filePrefix) {

    let userInfo = await getUserInfo(userId);
    let userBalance = userInfo.balance;
    if (userBalance == null) userBalance = 0;
    userBalance = Number(userBalance);
    console.log(userBalance);

    let divForChoosingAmountOfMoney = document.createElement('div');

    let label10 = document.createElement("label");
    label10.textContent = "10 zł"
    divForChoosingAmountOfMoney.appendChild(label10);

    let pln10 = document.createElement("input");
    // pln10.type="radio";
    pln10.setAttribute('type', 'radio');
    pln10.setAttribute('name', 'money-select');
    pln10.setAttribute('id', `${filePrefix}-top-up-account-radio-10-pln`);
    pln10.value = 10;
    divForChoosingAmountOfMoney.appendChild(pln10);

    let label20 = document.createElement("label");
    label20.textContent = "20 zł"

    divForChoosingAmountOfMoney.appendChild(label20);

    let pln20 = document.createElement("input");
    // pln20.type="radio";
    pln20.setAttribute('type', 'radio');
    pln20.setAttribute('name', 'money-select');
    pln20.setAttribute('id', `${filePrefix}-top-up-account-radio-20-pln`);
    pln20.value = 20;

    divForChoosingAmountOfMoney.appendChild(pln20);

    let label50 = document.createElement("label");
    label50.textContent = "50 zł"

    divForChoosingAmountOfMoney.appendChild(label50);

    let pln50 = document.createElement("input");
    // pln50.type="radio";

    pln50.setAttribute('type', 'radio');
    pln50.setAttribute('name', 'money-select');
    pln50.setAttribute('id', `${filePrefix}-top-up-account-radio-50-pln`);
    pln50.value = 50;
    divForChoosingAmountOfMoney.appendChild(pln50);


    let label100 = document.createElement("label");
    label100.textContent = "100 zł";

    divForChoosingAmountOfMoney.appendChild(label100);

    let pln100 = document.createElement("input");
    // pln100.type="radio";

    pln100.setAttribute('type', 'radio');
    pln100.setAttribute('name', 'money-select');
    pln100.setAttribute('id', `${filePrefix}-top-up-account-radio-100-pln`);
    pln100.value = 100;

    divForChoosingAmountOfMoney.appendChild(pln100);


    let submitButton = document.createElement('button');
    submitButton.setAttribute('id', `${filePrefix}-top-up-account-submit-button`);
    submitButton.textContent = 'Zatwierdź';
    divForChoosingAmountOfMoney.appendChild(submitButton);

    button.after(divForChoosingAmountOfMoney);
    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        let value = pln10.checked ? pln10.value : pln20.checked ? pln20.value : pln50.checked ? pln50.value : pln100.checked ? pln100.value : null;
        if (value != null) {
            let transferMade = await makeTransferManager(userId, value, "Doładowanie konta", displayDate(new Date(), true, true), userId);
            if (transferMade) {
                let updated = await updateUserDataVersion2(userId, "balance", Number(userBalance + Number(value)), "doładowanie konta");
                if (updated) {
                    alert('Pomyślnie doładowano konto');

                    localStorage.setItem("setMainContainerToDeposits", true);
                    window.location.reload();
                }

            }
        }
        else {
            let errorContainer = document.createElement('div');
            errorContainer.setAttribute('id', `${filePrefix}-top-up-account-error-place`);
            errorContainer.setAttribute('class', `error`);
            errorContainer.textContent = 'Zaznacz wartość!';
            divForChoosingAmountOfMoney.appendChild(errorContainer);
        }
    });

    // let transferMade=await makeTransferManager(userId, 10, "Przedłużenie ważności konta", datetime, userId);
}

export async function prolongAccess(userId) {
    let confirmed = confirm('Czy na pewno chcesz wydłużyć ważność konta? Wiąże się to z wpłatą 10zł');
    if (!confirmed) return false;
    let date = new Date();
    let datetime = displayDate(date, true, true);

    let userInfo = await getUserInfo(userId);
    let oldDate = userInfo.platform_access_timeout;
    let oldDateAsDate = new Date(oldDate);
    let newTimeout = new Date(oldDateAsDate.setDate(oldDateAsDate.getDate() + 30));


    console.log(datetime);
    // let newDate=new Date(oldDate.get);
    console.log(newTimeout);
    // await updateUserData(userId, "platform_access_timeout", displayDate(newTimeout,true,true,
    //     "prolonging_platfrom_access_timetour"));


    let transferMade = await makeTransferManager(userId, 10, "Przedłużenie ważności konta", datetime, userId);
    if (transferMade) {
        let updated = await updateUserDataVersion2(userId, "platform_access_timeout", displayDate(newTimeout, true, true));
        if (updated) {
            alert('Pomyślnie przedłużono ważność konta');

            localStorage.setItem("setMainContainerToDeposits", true);
            window.location.reload();

        }
        else alert('BŁĄD SERWERA. Nie udało się przedłużyć ważności konta!')

    }
}

export async function makeTransfer(receiver, amountOfMoney, title, dateTime, sender) {
    console.log("ROBIE PRZELEW");
    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    let dataToPost = {
        "transfer_title": title,
        "transfer_datetime": dateTime,
        "sender": sender,
        "receiver": receiver,
        "value": amountOfMoney
    };
    let dataToPostJson = JSON.stringify(dataToPost);
    try {
        response = await fetch(`${appAddress}/items/Bank_transfers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: dataToPostJson
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        errorOccured = true;
        console.error(`${err}`);
    }
    if (responseNotOkayFound || errorOccured) return false;
    return true;
}


export function displayDateTime(datetime) {
    let Tindex = String(datetime).search("T");
    let dateOnly = String(datetime).substring(0, Tindex);
    let dateDisplay = displayDate(new Date(dateOnly));
    let timeOnly = String(datetime).substring(Tindex + 1, String(datetime).length - 3);

    let dateTimeDisplay = dateDisplay + " " + timeOnly;
    return dateTimeDisplay;

}
export async function getBankTransfersFromDatabase(userId) {
    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    try {
        response = await fetch(`${appAddress}/items/Bank_transfers`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        errorOccured = true;
        console.error(`${err}`);
    }
    if (responseNotOkayFound || errorOccured) return false;
    let responseJson = await response.json();
    let responseData = responseJson.data;
    // console.log(responseData);
    if (userId != null) {
        let thisUserBankTransfers = responseData.filter(n => n.sender == userId || n.receiver == userId);
        return thisUserBankTransfers;
    }
    return responseData;

}


export async function setMainContainerToDeposits(filePrefix, userId = localStorage.getItem("loggedInUserId")) {
    let buttonToDeleteManyDeposits;
    let checkboxesElements;
    let numberOfBoxesChecked = 0;
    let userIsAdmin = localStorage.getItem("loggedInRole") == adminRoleId ? true : false;
    let userIsTeacher = localStorage.getItem("loggedInRole") == teacherRoleId ? true : false;
    let userIsStudent = localStorage.getItem("loggedInRole") == studentRoleId ? true : false;

    let myDepositsMainDiv = id(`${filePrefix}-my-deposits`);
    console.log(myDepositsMainDiv);
    myDepositsMainDiv.style.visibility = "visible";

    let myDepositsTBody = id(`${filePrefix}-my-deposits-table-all-transfers`);
    if (userIsStudent) await displayUserDepositsUpperPanel(userId, filePrefix);

    if (userIsTeacher) await displayUserDepositsUpperPanel(userId, filePrefix, true);
    console.log('HEELOOOO');

    let bankTransfers;
    if (userIsAdmin) {
        bankTransfers = await getBankTransfersFromDatabase(null);

        buttonToDeleteManyDeposits = document.createElement('button');
        buttonToDeleteManyDeposits.setAttribute('id', 'admin-panel-button-to-delete-many-deposits');
        buttonToDeleteManyDeposits.setAttribute('class', 'btn btn-danger');
        buttonToDeleteManyDeposits.textContent = "Usuń wybrane przelewy";
        buttonToDeleteManyDeposits.disabled = true;

        checkboxesElements = {};

        let checkboxToCheckAllShifts = id(`admin-panel-my-deposits-table-receiver-checkbox-input`);
        checkboxToCheckAllShifts.addEventListener('click', function () {
            let allCheckBoxesElements = document.querySelectorAll('.deposit-details-form-check-input');
            if (numberOfBoxesChecked == 0) {

                allCheckBoxesElements.forEach(function (element) {
                    element.checked = true;
                    numberOfBoxesChecked++;
                });

            }
            else {
                allCheckBoxesElements.forEach(function (element) {
                    element.checked = false;
                    if (numberOfBoxesChecked > 0) numberOfBoxesChecked--;
                });
            }
            if (numberOfBoxesChecked > 0) buttonToDeleteManyDeposits.disabled = false;
            else buttonToDeleteManyDeposits.disabled = true;


        })
    }
    else {
        bankTransfers = await getBankTransfersFromDatabase(userId);
    }


    bankTransfers.sort(function (a, b) {
        const date1 = new Date(a.transfer_datetime);
        const date2 = new Date(b.transfer_datetime);

        return date1 - date2;
    });
    console.log(bankTransfers);

    for (let i = 0; i < bankTransfers.length; i++) {

        let transfer = bankTransfers[i];
        let receiverInfo = await getUserInfo(transfer.receiver);
        let receiverEmail = receiverInfo.email;

        let senderInfo = await getUserInfo(transfer.sender);
        let senderEmail = senderInfo.email;

        let datetime = transfer.transfer_datetime;
        let datetimeToDisplay = displayDateTime(datetime);

        let title = transfer.transfer_title;



        let tr = document.createElement('tr');
        tr.setAttribute('id', `${filePrefix}-tr-${i}`);

        let tdForDateTime = document.createElement('td');
        tdForDateTime.setAttribute('id', `${filePrefix}-td-datetime-${i}`);
        tdForDateTime.textContent = datetimeToDisplay;
        tr.appendChild(tdForDateTime);

        let tdForTitle = document.createElement('td');
        tdForTitle.setAttribute('id', `${filePrefix}-td-title-${i}`);
        tdForTitle.textContent = title;
        tr.appendChild(tdForTitle);

        let tdForSender = document.createElement('td');
        tdForSender.setAttribute('id', `${filePrefix}-td-sender-${i}`);

        let tdForReceiver = document.createElement('td');
        tdForReceiver.setAttribute('id', `${filePrefix}-td-receiver-${i}`);

        if (!userIsAdmin) {
            if (senderEmail != receiverEmail) {
                if (senderInfo.id == userId) {
                    console.log("if 1")
                    tdForSender.textContent = '';
                    tdForReceiver.textContent = receiverEmail;
                    tr.style.backgroundColor = "red";

                }
                else if (receiverInfo.id == userId) {
                    console.log("if 2")
                    tdForSender.textContent = senderEmail;
                    tdForReceiver.textContent = '';
                    tr.style.backgroundColor = "green";
                }
            }
            else {
                console.log("if 3")
                tdForSender.textContent = senderEmail;
                tdForReceiver.textContent = '';
                tr.style.backgroundColor = "green";
            }
        }
        else {
            console.log("if 4")
            tdForSender.textContent = senderEmail;
            tdForReceiver.textContent = receiverEmail;
        }



        tr.appendChild(tdForSender);
        tr.appendChild(tdForReceiver);

        let tdForSum = document.createElement('td');
        tdForSum.setAttribute('id', `${filePrefix}-td-sum-${i}`);
        if (!userIsAdmin) {
            if (receiverInfo.id == userId) tdForSum.textContent = transfer.value;
            else tdForSum.textContent = "-" + transfer.value;
        }
        else {
            tdForSum.textContent = transfer.value
        }


        tr.appendChild(tdForSum);

        if (userIsAdmin) {
            let checkboxBox = document.createElement('td');
            checkboxBox.setAttribute('id', `deposit-details-checkbox-td-meeting-${i}`);

            let checkbox = document.createElement('input');
            checkbox.setAttribute('id', `deposit-details-checkbox-${transfer.id}`);
            checkbox.setAttribute('class', `deposit-details-form-check-input`);
            checkbox.setAttribute('type', 'checkbox');
            checkbox.addEventListener('click', function () {
                if (numberOfBoxesChecked > 0) buttonToDeleteManyDeposits.disabled = false;
                numberOfBoxesChecked = enableDisableButtonVersion2(this, buttonToDeleteManyDeposits, numberOfBoxesChecked)
            });
            checkboxesElements[`${transfer.id}`] = checkbox;
            checkboxBox.appendChild(checkbox);

            tr.appendChild(checkboxBox);
        }


        myDepositsTBody.appendChild(tr);



    }
    if (userIsAdmin) {
        myDepositsTBody.after(buttonToDeleteManyDeposits);
        buttonToDeleteManyDeposits.addEventListener('click', async function (e) {
            e.preventDefault();
            let deleted = await deleteManyItemsManager(checkboxesElements, "Bank_transfers");
            if (deleted) {
                alert('Pomyślnie usunięto wybrane transakcje');
                localStorage.setItem("setMainContainerToDeposits", true);
                window.location.reload();
            }
            else {
                alert('BŁĄD SERWERA. Nie udało się usunąć wybranych transakcji')
            }
        })
    }



}

export async function deleteManyItemsManager(checkboxes, shifOrMeetingOrTransfer) {
    let itemsToDelete = [];
    for (let key in checkboxes) {
        console.log(checkboxes[key].checked);
        let itemToPush = "";
        if (shifOrMeetingOrTransfer == "Shifts") {
            itemToPush = checkboxes[key].getAttribute('id').slice(23);
        }
        else if (shifOrMeetingOrTransfer == "Appointments") {
            console.log(checkboxes[key].getAttribute('id'));
            itemToPush = checkboxes[key].getAttribute('id').slice(25);
        }
        else if (shifOrMeetingOrTransfer == "Bank_transfers") {
            console.log(checkboxes[key].getAttribute('id'));
            itemToPush = checkboxes[key].getAttribute('id').slice(25);
        }
        if (checkboxes[key].checked) itemsToDelete.push(itemToPush);
    }
    console.log(itemsToDelete);
    return await deleteManyItemsFromChosenCollection(shifOrMeetingOrTransfer, itemsToDelete);
}
export async function deleteManyItemsFromChosenCollection(collectionName, shiftsIdsToRemove) {
    let bodyToDelete = JSON.stringify(shiftsIdsToRemove);


    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    try {
        response = await fetch(`${appAddress}/items/${collectionName}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: bodyToDelete
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        errorOccured = true;
        console.error(`${err}`);
    }
    if (responseNotOkayFound || errorOccured) return false;
    return true;
}
export function enableDisableButtonVersion2(checkbox, buttonToEnableOrDisable, numberOfBoxesChecked) {
    if (checkbox.checked) {
        numberOfBoxesChecked += 1;
        buttonToEnableOrDisable.disabled = false;
    }
    else {
        numberOfBoxesChecked -= 1;
        if (numberOfBoxesChecked < 1) {
            buttonToEnableOrDisable.disabled = true;
        }
    }
    return numberOfBoxesChecked;
}
export async function chooseTeacherAndSetMeeting(divForTable, divForWeekData, weekStartEnd, divForSelectTeacher, selectTeacherElement,
    filePrefix, rightArrowClicked, leftArrowClicked) {
    let divForShiftForm = "";
    if (filePrefix == "admin-panel") divForShiftForm = id(`${filePrefix}-shift-form`);
    let errorContainer = id(`${filePrefix}-select-teacher-to-meet-error`);
    divForSelectTeacher.style.visibility = "visible";
    await setMeetingWithTeacherAddTeachersSelectOptions(selectTeacherElement);
    let submitButton = id(`${filePrefix}-select-teacher-to-meet-submit-button`);
    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        if (selectTeacherElement.value != "none") {
            let rightLeft = await showTeachersCalendar(divForTable, divForWeekData, weekStartEnd, selectTeacherElement.value, filePrefix,
                rightArrowClicked, leftArrowClicked);

            rightArrowClicked = rightLeft[0];
            leftArrowClicked = rightLeft[1];
            if (filePrefix == "admin-panel") await setMainContainerToShiftForm(divForShiftForm, weekStartEnd, filePrefix, selectTeacherElement.value);
            errorContainer.textContent = '';
        }
        else errorContainer.textContent = "Musisz wybrać nauczyciela, aby sprawdzić grafik";
    });


    //    await 

}
export async function getTeacherAppointmentsForThisWeek(weekStartEnd, teacherId) {
    let allTeachersApps = await getAllTeachersShiftsOrAppointments("Appointments", teacherId);
    let appsForThisWeek = allTeachersApps
        .filter(
            n => new Date(n.date) >= weekStartEnd["monday_date"]
                && new Date(n.date) <= weekStartEnd["saturday_date"]
        );
    return appsForThisWeek;
}
export async function displayWeekTimetable(weekStartEnd, allTdsInTable, cellId,
    teacherId, displayButtons = false) {
    console.log(teacherId)
    allTdsInTable.forEach(td => {
        td.style.backgroundColor = "";
        td.textContent = "";
    });


    let thisWeekShifts = await getTeacherShiftsForThisWeek(weekStartEnd, teacherId);
    let thisWeekAppointments = await getTeacherAppointmentsForThisWeek(weekStartEnd, teacherId);
    // console.log(thisWeekShifts);

    for (let i = 0; i < thisWeekShifts.length; i++) {
        let shiftData = thisWeekShifts[i];
        await displayShiftOrAppointmentDataInTable(shiftData, cellId, displayButtons, teacherId, "shift");
    }
    for (let i = 0; i < thisWeekAppointments.length; i++) {
        let appData = thisWeekAppointments[i];
        await displayShiftOrAppointmentDataInTable(appData, cellId, displayButtons, teacherId, "appointment");
    }


}

export function setWeekDayName(shiftDayOfWeek) {
    let tdIdWeekDayName = "";
    switch (shiftDayOfWeek) {
        case 1:
            tdIdWeekDayName = "monday";
            break;
        case 2:
            tdIdWeekDayName = "tuesday";
            break;
        case 3:
            tdIdWeekDayName = "wednesday";
            break;
        case 4:
            tdIdWeekDayName = "thursday";
            break;
        case 5:
            tdIdWeekDayName = "friday";
            break;
        case 6:
            tdIdWeekDayName = "saturday";
            break;
        case 0:
            tdIdWeekDayName = "sunday";
            break;
    }
    return tdIdWeekDayName;
}

export function setStartCell(startHour) {
    let tdItemNumber = 0;
    switch (startHour) {
        case "08:00:00":
            tdItemNumber = 1;
            break;
        case "09:45:00":
            tdItemNumber = 2;
            break;
        case "11:30:00":
            tdItemNumber = 3;
            break;
        case "13:15:00":
            tdItemNumber = 4;
            break;
        case "15:00:00":
            tdItemNumber = 5;
            break;
        case "16:45:00":
            tdItemNumber = 6;
            break;
        case "18:30:00":
            tdItemNumber = 7;
            break;
    }
    return tdItemNumber;

}

export function setEndCell(endHour) {
    let tdItemNumber = 0;
    switch (endHour) {
        case "09:30:00":
            tdItemNumber = 1;
            break;
        case "11:15:00":
            tdItemNumber = 2;
            break;
        case "13:00:00":
            tdItemNumber = 3;
            break;
        case "14:45:00":
            tdItemNumber = 4;
            break;
        case "16:30:00":
            tdItemNumber = 5;
            break;
        case "18:15:00":
            tdItemNumber = 6;
            break;
        case "20:00:00":
            tdItemNumber = 7;
            break;
    }
    return tdItemNumber;

}



export async function displayShiftOrAppointmentDataInTable(dataDict, tdElementToChangeBackgroundColorName, displayButtons, teacherId, whatData) {

    let date;
    let dayOfWeek;
    let startHour;
    let endHour;
    let appointmentTopic = "";
    let studentInfo = "";

    if (whatData == "shift") {
        date = new Date(dataDict["date"]);
        dayOfWeek = date.getDay();
        startHour = dataDict["shift_start"];
        endHour = dataDict["shift_end"];
    }
    else if (whatData == "appointment") {
        date = new Date(dataDict["date"]);
        dayOfWeek = date.getDay();
        startHour = dataDict["app_start"];
        endHour = dataDict["app_end"];
        appointmentTopic = dataDict["topic"];
        studentInfo = await getUserInfo(dataDict["student"]);
        console.log(studentInfo);
    }
    else return;


    // console.log(endHour);

    // console.log(shiftDate);
    // console.log(shiftDayOfWeek);

    let tdIdWeekDayName = setWeekDayName(dayOfWeek);
    // console.log(tdIdWeekDayName);

    let tdStartCell = setStartCell(startHour);
    // console.log(tdStartCell);

    let tdEndCell = setEndCell(endHour);

    for (let i = tdStartCell; i <= tdEndCell; i++) {
        let tdElementToChangeBackgroundColor = id(`${tdElementToChangeBackgroundColorName}${tdIdWeekDayName}-${i}`);

        if (whatData == "shift") {
            if (tdElementToChangeBackgroundColor) {
                tdElementToChangeBackgroundColor.style.backgroundColor = "green";
                tdElementToChangeBackgroundColor.textContent = "DYŻUR";
            }
            if (displayButtons && date >= new Date()) {
                let buttonForSettingMeeting = document.createElement('button');
                buttonForSettingMeeting.setAttribute('id', `${tdElementToChangeBackgroundColorName}${tdIdWeekDayName}-${i}-add-meeting-button`);
                buttonForSettingMeeting.textContent = 'UMÓW SPOTKANIE';
                tdElementToChangeBackgroundColor.appendChild(buttonForSettingMeeting);

                buttonForSettingMeeting.addEventListener('click', async function (e) {
                    e.preventDefault();
                    console.log(i);
                    console.log(date);
                    await addMeetingManager(i, date, teacherId);
                });


            }
        }

        if (whatData == "appointment") {
            if (tdElementToChangeBackgroundColor) {
                tdElementToChangeBackgroundColor.style.backgroundColor = "red";
                let info = `SPOTKANIE | ${studentInfo["email"]} | ${appointmentTopic}`;
                tdElementToChangeBackgroundColor.textContent = info;

            }
            if (dataDict["student"] == localStorage.getItem("loggedInUserId") || dataDict["teacher"] == localStorage.getItem("loggedInUserId")
                || localStorage.getItem("loggedInRole") == adminRoleId) {
                let buttonForDeletingMeeting = document.createElement('button');
                buttonForDeletingMeeting.setAttribute('id', `${tdElementToChangeBackgroundColorName}${tdIdWeekDayName}-${i}-delete-meeting-button`);
                buttonForDeletingMeeting.textContent = 'ODWOŁAJ';
                if (tdElementToChangeBackgroundColor) tdElementToChangeBackgroundColor.appendChild(buttonForDeletingMeeting);

                buttonForDeletingMeeting.addEventListener('click', async function (e) {
                    e.preventDefault();
                    let meetingDeleted = await deleteMeeting(i, date, teacherId);
                    if (meetingDeleted) {
                        alert('Pomyślnie usunięto spotkanie!');
                        localStorage.setItem("setMainContainerToSetMeeting", true);
                        localStorage.setItem("setMainContainerToShowShifts", true);
                        localStorage.setItem("setMainContainerToShiftForm", true);

                        // await notifyPersonAboutMeetingDeletion()



                        window.location.reload();
                    }
                    else alert('BŁĄD SERWERA. Nie udało się usunąć spotkania');
                })
            }
        }


    }
}
export async function getMeetingIdToDelete(startHourIndex, meetingDateInProperFormat, teacherId) {
    let startTime = getStartTime(startHourIndex);
    let allTeachersApps = await getAllTeachersShiftsOrAppointments("Appointments", teacherId);
    let meetingsToDelete = allTeachersApps
        .filter(
            n => n.date == meetingDateInProperFormat
                && n.app_start == startTime && n.teacher == teacherId
        );
    return meetingsToDelete[0].id;
}
export async function deleteMeeting(startHourIndex, meetingDate, teacherId) {

    let startTime = getStartTime(startHourIndex);
    let endTime = getEndTime(startHourIndex);
    let date = displayDate(meetingDate, true);
    let meetingIdToDelete = await getMeetingIdToDelete(startHourIndex, date, teacherId);

    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    try {
        response = await fetch(`${appAddress}/items/Appointments/${meetingIdToDelete}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        errorOccured = true;
        console.error(`${err}`);
    }
    if (responseNotOkayFound || errorOccured) return false;
    return true;

}

export async function getTeacherShiftsForThisWeek(weekStartEnd, teacherId) {
    let allTeachersShifts = await getAllTeachersShiftsOrAppointments("Shifts", teacherId);
    let shiftsForThisWeek = allTeachersShifts
        .filter(
            n => new Date(n.date) >= weekStartEnd["monday_date"]
                && new Date(n.date) <= weekStartEnd["saturday_date"]
        );
    return shiftsForThisWeek;
    // console.log(allTeachersShifts);
    // console.log(shiftsForThisWeek);
}
export async function getAllTeachersShiftsOrAppointments(whatToGet, teacherId) {
    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    try {
        response = await fetch(`${appAddress}/items/${whatToGet}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        errorOccured = true;
        console.error(`${err}`);
    }
    if (responseNotOkayFound || errorOccured) return false;
    let responseJson = await response.json();
    let responseData = responseJson.data;
    // console.log(responseData);
    let thisTeacherShifts = responseData.filter(n => n.teacher == teacherId);
    return thisTeacherShifts;
}
export async function addMeeting(startHourIndex, meetingDate, topic, teacherId, studentId) {
    let startTime = getStartTime(startHourIndex);
    let endTime = getEndTime(startHourIndex);
    let date = displayDate(meetingDate, true);

    let body = {
        "date": date,
        "app_start": startTime,
        "app_end": endTime,
        "teacher": teacherId,
        "student": studentId,
        "topic": topic
    }
    let bodyToPost = JSON.stringify(body);

    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    try {
        response = await fetch(`${appAddress}/items/Appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: bodyToPost
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        errorOccured = true;
        console.error(`${err}`);
    }
    if (responseNotOkayFound || errorOccured) return false;
    return true;

}
export async function setMonthShifts(filePrefix, teacherId) {
    let selectsWithStartTimes = 0;
    let weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    console.log('SET MONTH SHIFTS')
    console.log(filePrefix);
    let selectForMonth = id(`${filePrefix}-form-for-month-shift-month-choice`);


    setMonthsToChoose(selectForMonth, `${filePrefix}-form-for-month-shift-month-choice-`);

    for (let i = 0; i < weekdays.length; i++) {
        let weekday = weekdays[i];
        let weekDaySelectStartHour = id(`${filePrefix}-form-for-month-shift-${weekday}-setup-start-hour`);
        let weekDaySelectEndHour = id(`${filePrefix}-form-for-month-shift-${weekday}-setup-end-hour`);


        let option = document.createElement('option');
        option.setAttribute('id', `${filePrefix}-form-for-month-shift-${weekday}-setup-end-hour-option-none`);
        option.value = 'none';
        option.textContent = '-';
        weekDaySelectEndHour.appendChild(option);

        weekDaySelectStartHour.addEventListener('change', function () {
            let endTimes = ['09:30', '11:15', '13:00', '14:45', '16:30', '18:15', '20:00'];
            let startIndex = 0;
            switch (weekDaySelectStartHour.value) {
                case 'none':
                    startIndex = -1;
                    break;
                case '08:00':
                    startIndex = 0;
                    break;
                case '09:45':
                    startIndex = 1;
                    break;
                case '11:30':
                    startIndex = 2;
                    break;
                case '13:15':
                    startIndex = 3;
                    break;
                case '15:00':
                    startIndex = 4;
                    break;
                case '16:45':
                    startIndex = 5;
                    break;
                case '18:30':
                    startIndex = 6;
                    break;
            }
            weekDaySelectEndHour.innerHTML = '';
            if (startIndex == -1) {
                let option = document.createElement('option');
                option.setAttribute('id', `${filePrefix}-form-for-month-shift-${weekday}-setup-end-hour-option-none`);
                option.textContent = "-";
                weekDaySelectEndHour.appendChild(option);
            }
            else {
                for (let i = startIndex; i < endTimes.length; i++) {
                    let option = document.createElement('option');
                    option.setAttribute('id', `${filePrefix}-form-for-month-shift-${weekday}-setup-end-hour-option-${i}`);
                    option.value = endTimes[i];
                    option.textContent = endTimes[i];
                    weekDaySelectEndHour.appendChild(option);
                }
            }



        });

    }
    let submitButton = id(`${filePrefix}-form-for-month-shift-submit-button`);
    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        await addManyShiftsManager(filePrefix, teacherId);
    });
    let returnButton = id(`${filePrefix}-form-for-month-shift-return-button`);
    returnButton.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToShiftForm", true);
        window.location.reload();
    });
}
export async function addManyShiftsManager(filePrefix, teacherId) {

    let errorContainer = id(`${filePrefix}-form-for-month-shift-error-container`);

    let weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let shiftStartsEnds = [];
    for (let i = 0; i < weekdays.length; i++) {
        let weekday = weekdays[i];
        let weekDaySelectStartHour = id(`${filePrefix}-form-for-month-shift-${weekday}-setup-start-hour`);
        let weekDaySelectEndHour = id(`${filePrefix}-form-for-month-shift-${weekday}-setup-end-hour`);

        let data = {
            "weekday": weekday,
            "weekday_number": changeWeekdayNameToNumber(weekday),
            "start": weekDaySelectStartHour.value,
            "end": weekDaySelectEndHour.value
        }
        if (weekDaySelectStartHour.value != "none") shiftStartsEnds.push(data);
    }
    let shiftsAdded = await addManyShiftsToDatabaseManager(shiftStartsEnds, filePrefix, teacherId);
    // if(noneValueFound) errorContainer.textContent="Godzina rozpoczęcia dyżuru musi być ustawiona dla każdego z dni"
}
export function checkWeekdaysForFirstSevenDaysOfChosenMonth(month) {
    let chosenMonthFirstSevenDays = [];
    console.log(month);
    for (let i = 1; i <= 7; i++) {
        let todayDate = new Date();
        let date = new Date(todayDate.getFullYear(), month, i);
        console.log(date);
        let data = {
            "date": date,
            "weekday_number": date.getDay(),
        }
        chosenMonthFirstSevenDays.push(data);
    }
    console.log(chosenMonthFirstSevenDays);
    return chosenMonthFirstSevenDays;
}
async function setShift(date, startTime, endTime, checkboxForDeletionOtherShifts, filePrefix, teacherId) {

    let errorContainer = id(`${filePrefix}-form-for-one-time-shift-error-container`);
    let deleteOtherShiftsFromChosenDate = false;
    if (checkboxForDeletionOtherShifts.checked) deleteOtherShiftsFromChosenDate = true;

    if (deleteOtherShiftsFromChosenDate) {
        let shiftsDeleted = await deleteShiftsOfChosenDateFromDatabase(date, teacherId);
        if (shiftsDeleted) {
            let shiftAddedCorrectly = await addOneShiftToDatabase(date, startTime, endTime, teacherId);
            if (!shiftAddedCorrectly) errorContainer.textContent = "BŁĄD SERWERA. Nie udało się dodać dyżuru";
            else {
                errorContainer.textContent = '';
                alert('Pomyślnie dodano dyżur');
                localStorage.setItem("setMainContainerToShiftForm", true);
                window.location.reload();
            }
        }
    }
    else {
        console.log("sprawdź daty")
        let shiftsCoverOneAnother = await checkIfShiftsDoCoverOneAnother(date, startTime, endTime, teacherId);
        if (shiftsCoverOneAnother) errorContainer.textContent = "Dyżur nie może być utworzony, ponieważ pokrywa się czasowo z innym, już istniejacym";
        else {
            let shiftAddedCorrectly = await addOneShiftToDatabase(date, startTime, endTime, teacherId);
            if (!shiftAddedCorrectly) errorContainer.textContent = "BŁĄD SERWERA. Nie udało się dodać dyżuru";
            else {
                errorContainer.textContent = '';
                alert('Pomyślnie dodano dyżur');
                localStorage.setItem("setMainContainerToShiftForm", true);
                window.location.reload();
            }
        }
    }

}
async function checkIfShiftsDoCoverOneAnother(date, startTime, endTime, teacher) {
    let shiftsForChosenDate = await getTeachersShiftsForParticularDate(date, teacher);
    let shiftsForChosenDateParsed = [];
    shiftsForChosenDate.forEach(function (element) {
        let startString = element.date + ' ' + element.shift_start;
        let endString = element.date + ' ' + element.shift_end;
        let data = {
            "start": new Date(Date.parse(startString)),
            "end": new Date(Date.parse(endString))
        };
        shiftsForChosenDateParsed.push(data);
    });

    let chosenShiftStart = new Date(Date.parse(date + ' ' + startTime));
    let chosenShiftEnd = new Date(Date.parse(date + ' ' + endTime));

    // console.log(shiftsForChosenDateParsed);

    let coverageOccured = false;

    for (let i = 0; i < shiftsForChosenDateParsed.length; i++) {
        let element = shiftsForChosenDateParsed[i];
        // console.log(element);
        if (element["start"].getTime() == chosenShiftStart.getTime() && element["end"].getTime() == chosenShiftEnd.getTime()) {
            // console.log("1 IF")
            coverageOccured = true;
            break;
        }
        if (element["start"].getTime() == chosenShiftStart.getTime()) {
            // console.log("2 IF")
            coverageOccured = true;
            break;
        }
        if (element["end"].getTime() == chosenShiftEnd.getTime()) {
            // console.log("3 IF")
            coverageOccured = true;
            break;
        }
        if (element["start"].getTime() < chosenShiftStart.getTime() && element["end"].getTime() > chosenShiftStart.getTime()) {
            // console.log("4 IF")
            coverageOccured = true;
            break;
        }
        if (chosenShiftStart.getTime() < element["start"].getTime() && chosenShiftEnd.getTime() > element["start"].getTime()) {
            // console.log("5 IF")
            coverageOccured = true;
            break;
        }
    }

    return coverageOccured;

}
async function addOneShiftToDatabase(date, startTime, endTime, teacher) {
    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    let bodyToPost = {
        "date": date,
        "shift_start": startTime + ':00',
        "shift_end": endTime + ':00',
        "teacher": teacher
    };
    // console.log(bodyToPost);
    // console.log(endTime);
    let bodyToPostJson = JSON.stringify(bodyToPost);
    try {
        response = await fetch(`${appAddress}/items/Shifts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: bodyToPostJson
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        errorOccured = true;
        console.error(`${err}`);
    }
    if (responseNotOkayFound || errorOccured) return false;
    return true;
}

export async function addManyShiftsToDatabaseManager(shiftStartsEnds, filePrefix, teacherId) {
    let firstSevenDaysOfChosenMonth = checkWeekdaysForFirstSevenDaysOfChosenMonth(id(`${filePrefix}-form-for-month-shift-month-choice`).value);
    let errorOccured = false;
    for (let i = 0; i < firstSevenDaysOfChosenMonth.length; i++) {
        let dayOfMonth = firstSevenDaysOfChosenMonth[i];
        let shiftStartEndForParticularWeekday = shiftStartsEnds.filter(shift => shift.weekday_number == dayOfMonth.weekday_number);
        if (shiftStartEndForParticularWeekday.length > 0) {
            let addedCorrectly = await setShiftForChosenWeekdayForNextMonth(dayOfMonth, shiftStartEndForParticularWeekday[0],
                id(`${filePrefix}-form-for-month-shift-month-choice`).value, teacherId);
            if (!addedCorrectly) errorOccured = true;
        }
        // console.log(shiftStartEndForParticularWeekday);
    }

    if (!errorOccured) {
        alert('Poprawnie ustawiono dyżury na wybrany miesiąc');
        localStorage.setItem("setMainContainerToShiftForm", true);
        window.location.reload();
    }
    else alert('BŁĄD SERWERA - nie udało się dodać wszystkich dyżurów');
}
export async function setShiftForChosenWeekdayForNextMonth(dayOfMonth, shiftData, month, teacher) {
    // await addOneShiftToDatabase(date, startTime, endTime);
    console.log(shiftData);
    let firstDateForShift = dayOfMonth.date;
    let allItemsAdded = [];
    let allItemsRemoved = [];
    let allShiftsToAdd = [];
    // let addedCorrectly=await addOneShiftToDatabase(firstDateForShift, shiftData.start, shiftData.end);
    // allItemsAdded.push(addedCorrectly);
    for (let i = 0; i < 5; i++) {
        let timeToCreateNewDate = firstDateForShift.getTime() + 86400000 * i * 7;
        let newDate = new Date(timeToCreateNewDate);
        if (newDate.getMonth() == month) {


            let deleted = await deleteShiftsOfChosenDateFromDatabase(displayDate(newDate, true), teacher);
            allItemsRemoved.push(deleted);

            let bodyToPost = {
                "date": displayDate(newDate, true),
                "shift_start": shiftData.start + ':00',
                "shift_end": shiftData.end + ':00',
                "teacher": teacher
            };
            allShiftsToAdd.push(bodyToPost);
            // let added=await addOneShiftToDatabase(displayDate(newDate,true), shiftData.start, shiftData.end);
            // allItemsAdded.push(added);

            // console.log(newDate);

        }

    }

    let addedCorrectly = await addManyShiftsToDatabase(allShiftsToAdd);
    return addedCorrectly;

    // console.log(allItemsAdded);
    // console.log(allItemsRemoved);
}
export async function addManyShiftsToDatabase(allShiftsToAdd) {
    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    let dataToPostJson = JSON.stringify(allShiftsToAdd);
    try {
        response = await fetch(`${appAddress}/items/Shifts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: dataToPostJson
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        errorOccured = true;
        console.error(`${err}`);
    }
    if (responseNotOkayFound || errorOccured) return false;
    return true;
}

export function changeWeekdayNameToNumber(weekdayName) {
    let number = -1;
    switch (weekdayName) {
        case 'monday':
            number = 1;
            break;
        case 'tuesday':
            number = 2;
            break;
        case 'wednesday':
            number = 3;
            break;
        case 'thursday':
            number = 4;
            break;
        case 'friday':
            number = 5;
            break;
        case 'saturday':
            number = 6;
            break;
    }
    return number;

}
export async function setOneTimeShift(filePrefix, teacherId) {

    console.log(teacherId);
    // value="2018-07-22" min="2018-01-01" max="2018-12-31">

    let inputForDate = id(`${filePrefix}-form-for-one-time-shift-date-choice`);
    let today = new Date();
    let tomorrowForDateMaker = today.getTime() + 86400000;
    let tomorrow = new Date(tomorrowForDateMaker);
    let date = displayDate(tomorrow, true);

    inputForDate.value = date;
    inputForDate.min = date;

    let selectStartTime = id(`${filePrefix}-form-for-one-time-shift-select-start-time`);
    let selectEndTime = id(`${filePrefix}-form-for-one-time-shift-select-end-time`)
    selectStartTime.addEventListener('change', function () {
        // console.log('ZMIANA');
        let endTimes = ['09:30', '11:15', '13:00', '14:45', '16:30', '18:15', '20:00'];
        let startIndex = 0;
        switch (selectStartTime.value) {
            case '08:00':
                startIndex = 0;
                break;
            case '09:45':
                startIndex = 1;
                break;
            case '11:30':
                startIndex = 2;
                break;
            case '13:15':
                startIndex = 3;
                break;
            case '15:00':
                startIndex = 4;
                break;
            case '16:45':
                startIndex = 5;
                break;
            case '18:30':
                startIndex = 6;
                break;
        }
        selectEndTime.innerHTML = '';
        for (let i = startIndex; i < endTimes.length; i++) {
            // console.log(endTimes[i]);
            let option = document.createElement('option');
            option.setAttribute('id', `${filePrefix}-form-for-one-time-shift-select-end-time-option-${i}`);
            option.value = endTimes[i];
            option.textContent = endTimes[i];
            selectEndTime.appendChild(option);
        }

    });

    let checkboxForDeletionOtherShifts = id(`${filePrefix}-form-for-one-time-shift-checkbox-for-delete`);

    let errorContainer = id(`${filePrefix}-form-for-one-time-shift-error-container`);

    let submitButton = id(`${filePrefix}-form-for-one-time-shift-submit-button`);
    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        if (selectStartTime.value == "none") errorContainer.textContent = "Proszę wybrać godzinę rozpoczęcia dyżuru!";
        else {
            console.log(checkboxForDeletionOtherShifts)
            console.log(checkboxForDeletionOtherShifts.checked);
            await setShift(inputForDate.value, selectStartTime.value, selectEndTime.value,
                checkboxForDeletionOtherShifts, filePrefix, teacherId);
        }
    });
    let returnButton = id(`${filePrefix}-form-for-one-time-shift-return-button`);
    returnButton.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToShiftForm", true);
        window.location.reload();
    });


}


export async function setMainContainerToShiftForm(divForShiftForm, weekStartEnd, filePrefix, teacherId) {
    console.log(teacherId)
    divForShiftForm.style.visibility = "visible";
    let buttonMonthShiftForm = id(`${filePrefix}-month-shift-button`);
    let buttonOneTimeShiftForm = id(`${filePrefix}-one-time-shift-button`);
    let buttonToDeleteOneDayShift = id(`${filePrefix}-delete-shift-from-particular-date-button`);
    let buttonToDeleteOneMonthShift = id(`${filePrefix}-delete-shift-from-particular-month-button`);

    let divMonthShiftForm = id(`${filePrefix}-form-for-month-shift`);
    let divOneTimeShiftForm = id(`${filePrefix}-form-for-one-time-shift`);
    let divDeleteOneDayShiftForm = id(`${filePrefix}-form-for-delete-shift`);
    let divDeleteMonthShiftForm = id(`${filePrefix}-form-for-delete-shift-month`);


    buttonMonthShiftForm.addEventListener('click', async function (e) {
        e.preventDefault();
        divOneTimeShiftForm.remove();
        buttonMonthShiftForm.remove();
        buttonOneTimeShiftForm.remove();
        divMonthShiftForm.style.visibility = "visible";
        await setMonthShifts(filePrefix, teacherId);
    });
    buttonOneTimeShiftForm.addEventListener('click', async function (e) {
        e.preventDefault();
        divMonthShiftForm.remove();
        buttonMonthShiftForm.remove();
        buttonOneTimeShiftForm.remove();
        divOneTimeShiftForm.style.visibility = "visible";
        await setOneTimeShift(filePrefix, teacherId);
    });
    buttonToDeleteOneDayShift.addEventListener('click', async function (e) {
        e.preventDefault();
        divMonthShiftForm.remove();
        divOneTimeShiftForm.remove()
        buttonMonthShiftForm.remove();
        buttonOneTimeShiftForm.remove();
        buttonToDeleteOneDayShift.remove();

        let dateInput = id(`${filePrefix}-form-for-delete-shift-date-choice`);

        let today = new Date();
        let tomorrowForDateMaker = today.getTime() + 86400000;
        let tomorrow = new Date(tomorrowForDateMaker);
        let date = displayDate(tomorrow, true);
        dateInput.min = date;
        dateInput.value = date;
        divDeleteOneDayShiftForm.style.visibility = "visible";
        await deleteShiftManager(filePrefix, teacherId);
    });
    buttonToDeleteOneMonthShift.addEventListener('click', async function (e) {
        e.preventDefault();
        divMonthShiftForm.remove();
        divOneTimeShiftForm.remove()
        buttonMonthShiftForm.remove();
        buttonOneTimeShiftForm.remove();
        buttonToDeleteOneDayShift.remove();
        buttonToDeleteOneMonthShift.remove();

        divDeleteMonthShiftForm.style.visibility = "visible";
        await deleteManyShiftsManager(filePrefix, teacherId);
    });
}
export async function deleteShiftManager(filePrefix, teacherId) {
    let submitButton = id(`${filePrefix}-form-for-delete-shift-submit-button`);
    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        let dateToDelete = id(`${filePrefix}-form-for-delete-shift-date-choice`).value;
        let deleted = await deleteShiftsOfChosenDateFromDatabase(dateToDelete, teacherId);
        if (deleted) {
            alert('Pomyślnie usunięto dyżury z wybranego dnia');
            localStorage.setItem("setMainContainerToShiftForm", true);
            window.location.reload();
        }
        else alert('BŁĄD SERWERA! Nie udało się usunąć dyżurów z wybranego dnia');

    });
}
export function setMonthsToChoose(selectForMonth, optionId) {
    let todayDate = new Date();
    let todayMonth = todayDate.getMonth();
    let nextMonth = todayMonth;
    console.log(nextMonth);
    let monthsNames = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];

    //WAŻNE - WYBÓR MIESIĘCY BĘDZIE OD 0 DO 11!!!!
    for (let i = nextMonth; i < 12; i++) {
        // console.log(endTimes[i]);
        let option = document.createElement('option');
        option.setAttribute('id', `${optionId}${i}`);
        option.value = i;
        option.textContent = monthsNames[i]
        selectForMonth.appendChild(option);
    }
}
export async function deleteManyShiftsFromDatabase(monthSelected, teacher) {
    let allShifts = await getAllTeachersShiftsOrAppointments("Shifts", teacher);
    let shiftsForChosenMonth = allShifts.filter(shift => new Date(shift.date).getMonth() == monthSelected);
    console.log(shiftsForChosenMonth);
    let idsToDelete = [];
    shiftsForChosenMonth.forEach(function (shift) {
        idsToDelete.push(shift.id);
    });

    let bodyToDelete = JSON.stringify(idsToDelete);

    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    try {
        response = await fetch(`${appAddress}/items/Shifts`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: bodyToDelete
        });
        if (!response.ok) responseNotOkayFound = true;
    }
    catch (err) {
        errorOccured = true;
        console.error(`${err}`);
    }
    if (responseNotOkayFound || errorOccured) return false;
    return true;

}

export async function deleteManyShiftsManager(filePrefix, teacherId) {
    let selectForMonth = id(`${filePrefix}-form-for-delete-shift-month-select`);
    setMonthsToChoose(selectForMonth, `${filePrefix}-form-for-delete-shift-month-select-option-`);

    let submitButton = id(`${filePrefix}-form-for-delete-shift-month-submit-button`);
    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        let deleted = await deleteManyShiftsFromDatabase(selectForMonth.value, teacherId);
        if (deleted) {
            alert('Usunięto dyżury z wybranego miesiąca');
            localStorage.setItem("setMainContainerToShiftForm", true);
            window.location.reload();
        }
        else alert('BŁĄD SERWERA. Nie udało się usunąć dyżurów z wybranego miesiąca');
    });
}

export async function addMeetingManager(startHourIndex, dateNotParsed, teacherId) {

    let startTime = getStartTime(startHourIndex);
    let endTime = getEndTime(startHourIndex);



    let mainContainer = id("student-panel-main-container");

    let timetableContainer = id("student-panel-set-meetings-div");
    timetableContainer.remove();

    let divForInput = document.createElement("div");
    divForInput.setAttribute("id", "student-panel-set-topic-div");

    let divForMeetingDetails = document.createElement("div");
    divForMeetingDetails.setAttribute("id", "student-panel-set-topic-meeting-details");
    divForMeetingDetails.textContent = `${displayDate(dateNotParsed)} | ${startTime} - ${endTime}`;
    divForInput.appendChild(divForMeetingDetails);


    let labelForTopic = document.createElement("label");
    labelForTopic.textContent = "Podaj temat spotkania:";
    divForInput.appendChild(labelForTopic);


    let topicInput = document.createElement("input");
    topicInput.type = "text";
    topicInput.maxLength = "100";
    topicInput.required = "required";
    divForInput.appendChild(topicInput);



    let submitButton = document.createElement("button");
    submitButton.setAttribute("id", "student-panel-set-topic-submit-button");
    submitButton.textContent = "Zatwierdź temat";
    divForInput.appendChild(submitButton);

    let errorContainer = document.createElement("div");
    errorContainer.setAttribute("id", "student-panel-set-topic-error");
    errorContainer.setAttribute("class", "error");
    divForInput.appendChild(errorContainer);

    let meetingAdded = false;
    let transferMade = false;

    mainContainer.appendChild(divForInput);
    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        if (divForInput != "") {
            let confirmed = confirm("Czy na pewno chcesz umówić spotkanie? Opłata: 50 PLN");
            if (confirmed) {
                transferMade = await makeTransferManager(teacherId, 50.0, topicInput.value, displayDate(new Date(), true, true));
                if (transferMade) {
                    meetingAdded = await addMeeting(startHourIndex, dateNotParsed, topicInput.value, teacherId, localStorage.getItem("loggedInUserId"));
                    if (meetingAdded) {
                        alert(`Pomyślnie dodano spotkanie! Szczegóły: data: ${displayDate(dateNotParsed)}, godzina: ${getStartTime(startHourIndex)}, temat: ${topicInput.value}`);
                        if (teacherId == "38d04205-5bb8-4862-ab17-8d13783bd42a") {
                            await postNotification(teacherId, displayDate(dateNotParsed), getStartTime(startHourIndex), topicInput.value, localStorage.getItem("loggedInUserId"));
                        }



                    }
                    else alert('BŁĄD SERWERA. Nie udało się umówić spotkania');
                }
                localStorage.setItem("setMainContainerToSetMeeting", true);
                localStorage.setItem("setMainContainerToShiftForm", true);
                window.location.reload();

            }

        }
        else errorContainer.textContent = "Temat spotkania jest wymagany!";
    });
}
async function postNotification(teacherId, date, startTime, topic, userId) {
    console.log("wysylam maila")
    let userInfo = await getUserInfo(userId);
    let userEmail = userInfo.email;
    let body = {
        "recipient": teacherId,
        "subject": "Umówiona konsultacja",
        "message": `Masz umówioną konsultację ${date} z użytkownikiem ${userEmail} od godziny ${startTime}. Temat spotkania: ${topic} `
    }
    let bodyToPostJson = JSON.stringify(body);
    let response;
    try {
        response = await fetch(`${appAddress}/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: bodyToPostJson

        });
        if (response.ok) console.log("WYSLANO POWIADOMIENIE NA MAILA");
    }
    catch (err) {
        console.error(`${err}`)
    }
    return response;
}

export async function checkSenderBalance(senderId, moneySenderWantsToPay) {
    let studentInfo = await getUserInfo(senderId);
    let balance = Number(studentInfo.balance);
    if (moneySenderWantsToPay <= balance) return true;
    return false;
}

export async function makeTransferManager(receiver, amountOfMoney, title, dateTime, sender = localStorage.getItem("loggedInUserId")) {
    let moneyTakenFromSender = false;
    let moneyGivenToReceiver = false;
    let senderInfo = await getUserInfo(sender);
    let senderBalance = senderInfo.balance;
    if (senderBalance == null) senderBalance = 0;
    senderBalance = Number(senderBalance);

    let receiverInfo = await getUserInfo(receiver);
    let receiverBalance = receiverInfo.balance;
    if (receiverBalance == null) receiverBalance = 0;
    receiverBalance = Number(receiverBalance);

    let makeTransferPossible = false;
    let accountUpdated = false;

    if (receiver != sender) {
        let senderHasEnoughMoney = await checkSenderBalance(sender, amountOfMoney);
        if (!senderHasEnoughMoney) {
            alert('Nie masz wystarczających środków na koncie, aby umówić spotkanie!');
            return false;
        }
        moneyTakenFromSender = await updateUserDataVersion2(sender, "balance", senderBalance - amountOfMoney, "balance");
        moneyGivenToReceiver = await updateUserDataVersion2(receiver, "balance", receiverBalance + amountOfMoney, "balance");
        if (moneyGivenToReceiver && moneyTakenFromSender) makeTransferPossible = true;
    }
    else {
        accountUpdated = await updateUserDataVersion2(receiver, "balance", receiverBalance + amountOfMoney, "balance");

        if (accountUpdated) makeTransferPossible = true;
    }
    if (makeTransferPossible) {
        let transferDone = await makeTransfer(receiver, amountOfMoney, title, dateTime, sender);

        if (transferDone) return true;
        else {
            alert('BŁĄD SERWERA. Nie udało się zrobić przelewu');
            return false;
        }
    }



}
export function getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    // Return array of year and week number
    return [d.getUTCFullYear(), weekNo];
    // return weekNo;
}
export async function setMeetingWithTeacherAddTeachersSelectOptions(containerForSelect, errorContainer) {


    let teachersDictionary = await isolateParticularGroupOfUsersFromAllUsers(errorContainer,
        teacherRoleId, "Wystąpił problem z pobieraniem nauczycieli z serwera", "teachers");

    console.log(teachersDictionary);
    // let sectionOfteachers = id("add-course-teacher");
    let option = document.createElement('option');
    option.setAttribute('value', 'none');
    option.textContent = "-";

    containerForSelect.appendChild(option);

    for (let key in teachersDictionary) {
        let first_name = teachersDictionary[key][0];
        let last_name = teachersDictionary[key][1];
        let email = teachersDictionary[key][2];
        let display = "";

        if (first_name != null && last_name != null && first_name != "" && last_name != "") display = first_name + " " + last_name;
        else display = email;

        option = document.createElement('option');
        option.setAttribute('value', key);
        option.textContent = `${display}`;

        containerForSelect.appendChild(option);

    }


}
export function setWeekdaysDates(weekStartEnd, filePrefix) {

    let weekdays = document.querySelectorAll(`.${filePrefix}-week-day`);
    // console.log(weekdays);
    let startMonday = weekStartEnd["monday_date"];
    // let weekdaysArray=[...]
    for (let i = 0; i < weekdays.length; i++) {
        let newDate = startMonday.getTime() + i * 86400000;
        let dateToDisplay = new Date(newDate);
        let dateToDisplayAsString = displayDate(dateToDisplay);


        let newDateDiv = document.createElement("div");
        newDateDiv.setAttribute("id", `${filePrefix}-text-node-with-date-${i}`);
        newDateDiv.textContent = dateToDisplayAsString;

        let oldDateDiv = id(`${filePrefix}-text-node-with-date-${i}`);
        if (oldDateDiv) oldDateDiv.remove();

        weekdays[i].appendChild(newDateDiv);
        // weekdays[i].textContent+=dateToDisplayAsString;
    }



}
export async function showTeachersCalendar(divForTable, divForWeekData, weekStartEnd, teacherId, filePrefix,
    rightArrowClicked, leftArrowClicked) {
    rightArrowClicked = 0;
    leftArrowClicked = 0;
    console.log("RIGHT: ", rightArrowClicked);
    console.log("LEFT: ", leftArrowClicked);

    divForTable.style.visibility = "visible";
    displayUpperInfo(divForWeekData, weekStartEnd);
    setWeekdaysDates(weekStartEnd, filePrefix);
    console.log(teacherId);

    let buttonsIds = id(`${filePrefix}-shift-choice-button-`);

    let displayButtons = false;
    if (filePrefix == "student-panel") displayButtons = true;

    await displayWeekTimetable(weekStartEnd, document.querySelectorAll(`.${filePrefix}-week-day-indicator`),
        `${filePrefix}-timetable-`, teacherId, displayButtons);

    let buttonDisplayNextWeek = id(`${filePrefix}-next-week-button`);
    buttonDisplayNextWeek.addEventListener('click', async function (e) {
        console.log("RIGHT: ", rightArrowClicked);
        console.log("LEFT: ", leftArrowClicked);
        e.preventDefault();
        divForTable.style.visibility = "hidden";
        rightArrowClicked += 1;
        let howManyWeeksToAdd = setHowManyWeeksToAdd(rightArrowClicked, leftArrowClicked);
        let weekStartEnd = setMondayAndSaturdayForThisWeek(howManyWeeksToAdd);
        divForTable.style.visibility = "visible";
        displayUpperInfo(divForWeekData, weekStartEnd, howManyWeeksToAdd);
        setWeekdaysDates(weekStartEnd, filePrefix);
        await displayWeekTimetable(weekStartEnd, document.querySelectorAll(`.${filePrefix}-week-day-indicator`), `${filePrefix}-timetable-`, teacherId, displayButtons);

    });

    let buttonDisplayPreviousWeek = id(`${filePrefix}-previous-week-button`);
    buttonDisplayPreviousWeek.addEventListener('click', async function (e) {
        console.log("RIGHT: ", rightArrowClicked);
        console.log("LEFT: ", leftArrowClicked);
        e.preventDefault();
        divForTable.style.visibility = "hidden";
        leftArrowClicked += 1;
        let howManyWeeksToAdd = setHowManyWeeksToAdd(rightArrowClicked, leftArrowClicked);
        let weekStartEnd = setMondayAndSaturdayForThisWeek(howManyWeeksToAdd);
        divForTable.style.visibility = "visible";
        displayUpperInfo(divForWeekData, weekStartEnd, howManyWeeksToAdd);
        setWeekdaysDates(weekStartEnd, filePrefix);
        await displayWeekTimetable(weekStartEnd, document.querySelectorAll(`.${filePrefix}-week-day-indicator`), `${filePrefix}-timetable-`, teacherId, displayButtons);

    });

    return [rightArrowClicked, leftArrowClicked]



}
export function setHowManyWeeksToAdd(rightArrowClicked, leftArrowClicked) {
    if (leftArrowClicked == rightArrowClicked) return 0;
    let rightNumber = rightArrowClicked;
    let leftNumber = -leftArrowClicked;
    return rightNumber + leftNumber;

}




