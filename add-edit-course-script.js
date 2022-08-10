import * as exports from './general-script.js'; 
Object.entries(exports).forEach(([name, exported]) => window[name] = exported);

//------------------------------------------------------
//dotyczy addCourse.html
let edit_course_form = id("edit-course-form");
window.onload = (async function () {
    
    let adminLoggedIn = false;
    let teacherLoggedIn = false;
    let studentLoggedIn = false;

    await redirectToIndexIfUserIsNotLoggedInAtAll();
    switch (localStorage.getItem("loggedInRole")) {
        case adminRoleId:
            adminLoggedIn = true;
            break;
        case teacherRoleId:
            teacherLoggedIn = true;
            break;
        case studentRoleId:
            studentLoggedIn = true;
            break;
    }
    
    let buttonAllCoursesEdit=id("edit-course-all-courses-button");
    let buttonMainMenuEdit=id("edit-course-main-menu-button");
    let buttonAllCoursesAdd=id('add-course-main-menu-button');

    if(buttonAllCoursesEdit)buttonAllCoursesEdit.addEventListener('click', function(e){
        e.preventDefault();
        window.location="admin-courses.html";
    });
    if(buttonMainMenuEdit)buttonMainMenuEdit.addEventListener('click', function(e){
        e.preventDefault();
        if(adminLoggedIn) window.location="adminPanel.html";
        else if(teacherLoggedIn) window.location="teacherPanel.html";
        else if(studentLoggedIn) window.location="studentPanel.html";
    })
    if(buttonAllCoursesAdd)buttonAllCoursesAdd.addEventListener('click', function(e){
        e.preventDefault();
        if(adminLoggedIn) window.location="adminPanel.html";
        else if(teacherLoggedIn) window.location="teacherPanel.html";
        else if(studentLoggedIn) window.location="studentPanel.html";
    })
    
    
    
    if (document.body.contains(document.getElementById('add-course-teacher-default'))) {
        await addCourseSetTeachersSelect(document.getElementById('add-course-teacher-default'));
    }
    else if (document.body.contains(document.getElementById('edit-course-main-container'))) {
        await editCourseSetDefaultValues();
        let edit_course_form = id("edit-course-form");
        if (edit_course_form) {
            edit_course_form.addEventListener("submit", async function (e, mode) {
                await courseManager(e, "edition");
            });
        }

    }

});
let add_course_form = id("add-course-form");
if (add_course_form) {
    add_course_form.addEventListener("submit", async function (e, mode) {
        await courseManager(e, "addition");
    });
}
const buttonAddAnotherSelectTeacher = id("add-course-add-select-for-another-teacher");
if(buttonAddAnotherSelectTeacher)buttonAddAnotherSelectTeacher.onclick = async (e) => {
    e.preventDefault();
    await selectAnotherTeacher(0, "add-course-teacher-selects", "add-course-select-number-", "add-course");
};
//------------------------------------------------------
//dotyczy editCourse.html

// let editCourseSubmitButton = id("edit-course-submit");
// if (document.body.contains(document.getElementById('edit-course-submit'))) {
//     console.log("zawiera");

//     // if (edit_course_form) {
//     //     editCourseSubmitButton.addEventListener("click", async function (e, mode) {
//     //         await courseManager(e, "edition");
//     //     });
//     // }
//     editCourseSubmitButton.addEventListener('click', function (e) {
//         e.preventDefault();
//         console.log("klikniete!");

//     })
// }



//------------------------------------------------------


async function selectAnotherTeacher(alreadyExistingTeachers, mainContainerId, minorContainerId, prefix) {

    let mainContainer = id(mainContainerId);
    let selectItemNumber = 0;
    let i = 0;

    let containerToShowError = document.createElement("div");
    containerToShowError.setAttribute("class", "error");
    containerToShowError.setAttribute("id", "select-another-teacher-error");
    containerToShowError.textContent = "Nie można dodać więcej niż 3 nauczycieli do kursu";

    while (true) {
        if (id(`${minorContainerId}${i}`) == null) break;
        i++;
    }

    //nie pozwalamy na dodanie wiecej niz trzech nauczycieli do kursu
    selectItemNumber = i;
    if (selectItemNumber + alreadyExistingTeachers < 2) {
        let newSelectElement = document.createElement("select");
        // localStorage.setItem(`new-select-${selectItemNumber}`, "present");
        newSelectElement.setAttribute('id', `${prefix}-select-number-${selectItemNumber}`);
        let br = document.createElement("br");
        br.setAttribute('id', `${prefix}-select-number-${selectItemNumber}-br`);
        mainContainer.appendChild(newSelectElement);
        mainContainer.appendChild(br);

        addCourseSetTeachersSelect(newSelectElement);
        if (document.contains(containerToShowError)) mainContainer.removeChild(containerToShowError);
    }
    else {
        if (!document.contains(document.getElementById("select-another-teacher-error"))) mainContainer.appendChild(containerToShowError);
    }

}
async function addCourseSetTeachersSelect(containerForSelect, alreadyExistingTeachers) {
    if (alreadyExistingTeachers == 3) {
        return;
    }
    await exports.redirectToIndexIfUserIsNotLoggedInAtAll();

    let teachersDictionary = await isolateParticularGroupOfUsersFromAllUsers(id("add-course-teacher-error"),
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
async function courseManager(e, mode, courseId = localStorage.getItem("courseIdEdit")) {

    e.preventDefault();
    console.log("coursemanager");
    let prefix = "";

    if (mode == "edition") prefix = "edit";
    else {
        prefix = "add";
    }


    let courseNameElement = id(`${prefix}-course-name`);
    let courseDescriptionElement = id(`${prefix}-course-description`);
    let courseMaximumStudentsCountElement = id(`${prefix}-course-maximum-students-count`);
    let mainContainer = id(`${prefix}-course-main-container`);

    let courseTeacherElementDefault = id(`${prefix}-course-teacher-default`);
    let teachersIdsFromSelects = [];
    teachersIdsFromSelects.push(courseTeacherElementDefault.value);

    let i = 0;
    let theSameTeacherSelectedMoreThanOnce = false;
    while (true) {
        if (id(`${prefix}-course-select-number-${i}`) == null) break;
        else if (id(`${prefix}-course-select-number-${i}`) == 'none') continue;
        else {
            teachersIdsFromSelects.push(id(`${prefix}-course-select-number-${i}`).value);
        };
        i++;
    }
    if (mode == "edition") {
        let teachersIdsFromDivs = document.getElementsByClassName("edit-course-teacher-div");
        for (let i = 0; i < teachersIdsFromSelects.length; i++) {
            for (let k = 0; k < teachersIdsFromDivs.length; k++) {
                console.log(teachersIdsFromDivs[k].getAttribute('id'));
                if (teachersIdsFromSelects[i] == teachersIdsFromDivs[k].getAttribute('id').substring(36)) {
                    console.log(teachersIdsFromSelects[i]);
                    theSameTeacherSelectedMoreThanOnce = true;
                    break;
                }
            }
        }
    }
    console.log(theSameTeacherSelectedMoreThanOnce);
    if (!theSameTeacherSelectedMoreThanOnce) {
        theSameTeacherSelectedMoreThanOnce = checkIfElementOccursInArrayMoreThanOnce(teachersIdsFromSelects);

    }
    let failure;
    if (theSameTeacherSelectedMoreThanOnce) {
        failure = document.createElement('div');
        failure.setAttribute('class', `failure error`);
        failure.setAttribute('id', `${prefix}-course-failure-div`);
        failure.textContent = `Nie można dodać tego samego nauczyciela do kursu więcej niż raz`;
        mainContainer.appendChild(failure);
        deleteAdditionalSelects();
        return;
    }
    else {
        if (document.contains(document.getElementById(`${prefix}-course-failure-div`)))
            document.getElementById(`${prefix}-course-failure-div`).remove();
    }
    // console.log(courseNameElement.value)
    // console.log(courseTeacherElement.value)
    // console.log(courseDescriptionElement.value)
    // console.log(courseMaximumStudentsCountElement.value)
    if (mode == "addition") {
        let lastCourseId = await getLastCourseIdFromDatabase();
        let thisCourseId = lastCourseId + 1;

        let valuesToCreateCourse = {
            "id": thisCourseId,
            "name": courseNameElement.value,
            "description": courseDescriptionElement.value,
            "maximum_students_count": courseMaximumStudentsCountElement.value,
            "activity_status": "disabled"
        };
        await addCourse(valuesToCreateCourse, mainContainer, teachersIdsFromSelects, thisCourseId);
    }
    else {
        let valuesToEditCourse = {
            "id": courseId,
            "name": courseNameElement.value,
            "description": courseDescriptionElement.value,
            "maximum_students_count": courseMaximumStudentsCountElement.value
        }
        await editCourseManager(courseId, valuesToEditCourse, teachersIdsFromSelects);
    }
}
async function editCourseManager(courseId, valuesToEditCourse, teachersIdsFromSelects) {
    let mainContainer = document.getElementById("edit-course-main-container");
    let errorContainer = document.getElementById("edit-user-all-error");
    let id = await getLastIdFromCourses_directus_users_Database(errorContainer);
    if (id != -1) {
        teachersIdsFromSelects.forEach(async function (teacherId) {
            await addTeacherDatabaseManyToManyManager(teacherId, courseId, "edit", mainContainer);
        })

    }
    let updateResponses = [];

    for (let key in valuesToEditCourse) {
        console.log(key, valuesToEditCourse[key]);
        if ((valuesToEditCourse[key] != "")) {
            let responseBoolean = await updateCourse(courseId, key, valuesToEditCourse[key], key);
            updateResponses.push(responseBoolean);
        }
    }
    edit_course_form.remove();
    let errorUpdateResponses = updateResponses.filter((response) => !response);

    if (errorUpdateResponses.length == 0) {
        let success = document.createElement('div');
        success.setAttribute('class', `success`);
        success.setAttribute('id', `add-user-success-div`);
        success.textContent = `Edycja powiodła się`;

        let returnButton = document.createElement('button');
        returnButton.setAttribute('id', 'edit-user-return-button');
        returnButton.addEventListener('click', function (e) { e.preventDefault(); window.location = "admin-courses.html" });
        returnButton.textContent = "Wróć do menadżera kursów";


        mainContainer.appendChild(success);
        mainContainer.appendChild(returnButton);
    }
    else {
        errorContainer.textContent = "Edycja nie powiodła się.";
    }

}
async function getLastIdFromCourses_directus_users_Database(errorContainer) {
    let response = await getAllItemsFromCourses_directus_usersRelationship();
    if (!response.ok) {
        errorContainer.textContent = "Wystąpił problem z pobieraniem danych. Spróbuj później";
        return -1;
    }
    let responseJson = await response.json();
    if (responseJson.data.length == 0) return 0;
    let lastItem = responseJson.data[responseJson.data.length - 1];
    let lastId = lastItem["id"];

    return lastId;

}

async function addCourse(valuesToCreateCourse, mainContainer, teachersIdsFromSelects, thisCourseId) {

    let valuesToCreateCourseJson = JSON.stringify(valuesToCreateCourse);

    let response1 = await addCourseToDatabase(valuesToCreateCourseJson, mainContainer);
    let responses = [];
    let responseNotOkayFound = false;
    teachersIdsFromSelects.forEach(async id => {
        console.log(id);
        let response2 = await addTeacherDatabaseManyToManyManager(id, thisCourseId, "add", mainContainer);
        responses.push(response2);
        if (!response2.ok) { responseNotOkayFound = true; }
    });

    console.log(JSON.stringify(response1));

    add_course_form.remove();
    if (response1.ok && (!responseNotOkayFound) && thisCourseId > 0) {
        let success = document.createElement('div');
        success.setAttribute('class', `success`);
        success.setAttribute('id', `add-course-success-div`);
        success.textContent = `Dodano kurs`;
        mainContainer.appendChild(success);
    }
    else {
        let failure = document.createElement('div');
        failure.setAttribute('class', `failure`);
        failure.setAttribute('id', `add-course-failure-div`);
        failure.textContent = `Nie udało się dodać kursu`;
        mainContainer.appendChild(failure);
    }

}
async function addCourseToDatabase(valuesToCreateCourseJson, mainContainer) {
    let response;
    console.log(valuesToCreateCourseJson);
    try {
        response = await fetch(`${appAddress}/items/Courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: valuesToCreateCourseJson
        });
    }
    catch (err) {
        console.error(`${err}`);
        let failure = document.createElement('div');
        failure.setAttribute('class', `failure`);
        failure.setAttribute('id', `create-course-failure-div`);
        failure.textContent = `Nie udało się dodać kursu`;
        mainContainer.appendChild(failure);
    }

    return response;
}
function deleteAdditionalSelects() {
    let i = 0;
    while (true) {
        if (id(`add-course-select-number-${i}`) == null) break;
        else {
            id(`add-course-select-number-${i}`).remove();
            id(`add-course-select-number-${i}-br`).remove();
        }
        i++;
    }
}
async function getLastCourseIdFromDatabase() {
    let response = await getAllCoursesFromDatabase();
    if (!response.ok) {
        id("add-course-all-error").textContent = "Wystąpił problem z pobieraniem danych. Spróbuj później";
        return -1;
    }
    let responseJson = await response.json();
    if (responseJson.data.length == 0) return 0;
    let lastItem = responseJson.data[responseJson.data.length - 1];
    let lastId = lastItem["id"];

    return lastId;

}
async function addTeacherDatabaseManyToManyManager(teacherId, courseId, prefix, mainContainer) {
    let response;

    try {
        response = await fetch(`${appAddress}/items/Courses_directus_users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: `{
                "Courses_id": "${courseId}",
                "directus_users_id": "${teacherId}"
               }`,
        });
    }
    catch (err) {
        console.error(`${err}`);
        let failure = document.createElement('div');
        failure.setAttribute('class', `failure`);
        failure.setAttribute('id', `${prefix}-course-failure-div`);
        failure.textContent = `Nie udało się przypisać nauczyciela do kursu`;
        mainContainer.appendChild(failure);
    }

    return response;


}
async function editCourseSetDefaultValues(courseId = localStorage.getItem("courseIdEdit")) {

    exports.redirectToIndexIfUserIsNotLoggedInAtAll();

    let teachersContainer = id("edit-course-teacher-selects");
    let errorContainer = id("edit-course-all-error");
    let courseDetails = await getCourseDetails(courseId, errorContainer);
    let courseDetailsJson = await courseDetails.json();
    let courseData = courseDetailsJson.data;
    console.log(courseData);

    let nameElement = nameGetter("edit-course-name");
    nameElement[0].placeholder = courseData["name"];
    let nameElementByID = id("edit-course-name");
    nameElementByID.setAttribute('size', courseData["name"].length);

    let maxStudentsCountElem = nameGetter("edit-course-maximum-students-count");
    let maxStudents = courseData["maximum_students_count"];
    maxStudents != null ? maxStudentsCountElem[0].placeholder = maxStudents : maxStudentsCountElem[0].placeholder = "";

    let descriptionElem=exports.nameGetter('edit-course-description');
    let description=courseData["description"];
    description != null ? descriptionElem[0].placeholder = description.substring(0,25) : descriptionElem[0].placeholder = "";
    
    
    let teachersIDs = await getCourseTeachersAndIdFromCourses_directus_usersTable(courseId);
    let teachersNumber = Object.keys(teachersIDs).length;
    let editCourseFirstSelect = id("edit-course-teacher-default");
    addCourseSetTeachersSelect(editCourseFirstSelect, teachersNumber);

    //pokaż nauczycieli przypisanych do kursu, których można usunąć
    for (let key in teachersIDs) {
        let idInCourses_directus_usersTable = key;
        console.log(idInCourses_directus_usersTable);
        let teacherId = teachersIDs[key];
        let teacherNameSurnameOrEmail = await getTeacherDataById(teacherId);
        console.log(teacherNameSurnameOrEmail);
        //utworz diva z danymi nauczyciela
        let teacherBox = document.createElement('div');
        teacherBox.setAttribute('id', `edit-course-teacher-name-or-surname-${teacherId}`);
        teacherBox.setAttribute('class', `edit-course-teacher-div`);
        teacherBox.textContent = teacherNameSurnameOrEmail;
        //utworz krzyzyk do usuwania juz istniejacych nauczycieli
        let Xbox = document.createElement('button');
        Xbox.setAttribute('id', `edit-course-teacher-${teacherId}-xbox`);
        Xbox.textContent = "X";
        Xbox.addEventListener('click', async function (e, id = idInCourses_directus_usersTable, err = errorContainer) {
            e.preventDefault();
            let deleted = await deleteTeacherFromCourse(id, err, "Nie udało się usunąć wybranego nauczyciela");
            if (deleted) {
                teacherBox.remove();
                teachersNumber -= 1;
                if (document.contains(document.getElementById("select-another-teacher-error"))) {
                    document.getElementById("select-another-teacher-error").remove();
                }
                addCourseSetTeachersSelect(editCourseFirstSelect, teachersNumber);
            }
        })
        teacherBox.appendChild(Xbox);
        teachersContainer.appendChild(teacherBox);

    }
    let buttonAddAnotherSelectTeacher = id("edit-course-add-select-for-another-teacher");
    buttonAddAnotherSelectTeacher.onclick = async (e) => {
        e.preventDefault();
        await selectAnotherTeacher(teachersNumber, teachersContainer.getAttribute('id'), "edit-course-select-number-", "edit-course");
    };
}

async function getCourseTeachersAndIdFromCourses_directus_usersTable(courseId) {
    let errorContainer = id("edit-course-teacher-error");
    let courses = await getAllItemsFromCourses_directus_usersRelationship(errorContainer);
    let coursesJson = await courses.json();
    let thisCourseData = coursesJson.data.filter(n => n.Courses_id == courseId);
    let thisCourseTeachersIDs = {};
    thisCourseData.forEach(function (course) {
        thisCourseTeachersIDs[course.id] = course.directus_users_id;
    });
    return thisCourseTeachersIDs;

}
async function getAllItemsFromCourses_directus_usersRelationship(errorContainer) {
    let response;
    let errorOccured = false;

    try {
        response = await fetch(`${appAddress}/items/Courses_directus_users`, {
            method: 'GET',
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
        errorContainer.textContent = `Nie udało się pobrać nauczycieli przypisanych do kursu`;
    }

    return response;


}
async function getTeacherDataById(id) {
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