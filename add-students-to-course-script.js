import * as exports from './general-script.js'; 
Object.entries(exports).forEach(([name, exported]) => window[name] = exported);

window.onload = (async function () {
    await addStudentsToCourse();
});
let numberOfBoxesChecked = 0;

async function addStudentsToCourse(courseId = localStorage.getItem("courseIdToAddStudents")) {

    let adminLoggedIn = false;
    let teacherLoggedIn = false;
    let studentLoggedIn = false;
    exports.redirectToIndexIfUserIsNotLoggedInAtAll();
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

    let buttonReturn = id("addStudentsToCourse-return-button");
    let buttonToReturnToShowCourseDetails=id("addStudentsToCourse-button-course-details");
    let buttonToAddManyStudents = id("addStudentsToCourse-add-many-students");
    let errorContainer = id("addStudentsToCourse-error-place");
    let studentsWhoAreNotAssignedToTheCourseIDs = await getStudentsFromStudentsCoursesJunctionTable(courseId, false, errorContainer);
    console.log(studentsWhoAreNotAssignedToTheCourseIDs);
    let checkboxesElements = displayStudentsDetails(studentsWhoAreNotAssignedToTheCourseIDs, buttonToAddManyStudents);
    let maximumStudentsCountElement = id("addStudentsToCourse-course-maximum-students-count");
    let maximumStudentsCount = await getCourseFeatureById(courseId, "maximum_students_count");
    maximumStudentsCount != -1 ? maximumStudentsCountElement.textContent = `Maksymalna liczba uczestników kursu: ${maximumStudentsCount}` : maximumStudentsCountElement.textContent = `Maksymalna liczba uczestników kursu: ERROR`

    let currentStudentsCountElement = id("addStudentsToCourse-course-current-students-count");
    let currentStudentsCount = await getCourseFeatureById(courseId, "number_of_students_attending_course");
    console.log(currentStudentsCount);

    if (currentStudentsCount != -1) {
        if (currentStudentsCount == null) currentStudentsCount = 0;
        console.log(currentStudentsCount);
        if (currentStudentsCount < maximumStudentsCount) currentStudentsCountElement.textContent = `Aktualna liczba uczestników kursu: ${currentStudentsCount}`;
    }
    else {
        currentStudentsCountElement.textContent = "Aktualna liczba uczestników kursu: ERROR";
    }
    if (currentStudentsCount == maximumStudentsCount) {
        currentStudentsCountElement.setAttribute('class', 'btn btn-outline-danger');
        currentStudentsCountElement.textContent = "Limit uczestników kursu został osiągnięty";

        for (let key in checkboxesElements) {
            checkboxesElements[key].disabled = true;
        }
    }

    buttonToAddManyStudents.addEventListener('click', function (e) {
        let studentsChecked = getStudentsChecked(checkboxesElements, courseId);
        if (currentStudentsCount + studentsChecked.length > maximumStudentsCount) {
            alert('Nie można dodać studentów ponad limit!');
        }

        else {
            currentStudentsCountElement.textContent = `Aktualna liczba uczestników kursu: ${currentStudentsCount + studentsChecked.length}`;
            addManyStudentsToCourseManager(e, checkboxesElements, courseId, currentStudentsCount, maximumStudentsCount);
        }
        // addManyStudentsToCourseManager(e, checkboxesElements, courseId, currentStudentsCount, maximumStudentsCount);
        // let studentsDetailsBasedOnIds = await getStudentsDetailsBasedOnIds(studentsWhoAreNotAssignedToTheCourseIDs);
    });
    buttonReturn.addEventListener('click', function (e) {
        e.preventDefault();
        window.location="admin-courses.html";
    })
    buttonToReturnToShowCourseDetails.addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.setItem("courseIdToAddStudents", courseId);
        window.location = "course-details.html";
    })

}
async function getCourseFeatureById(courseId, featureName) {
    let response;
    let errorOccured = false;
    try {
        response = await fetch(`${appAddress}/items/Courses/${courseId}`, {
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
    if (!response.ok || errorOccured) return -1;
    let responseJson = await response.json();
    let data = responseJson.data;
    return data[featureName];

}



function displayStudentsDetails(studentsDictionary, buttonToAddManyStudents) {
    let errorContainer = id("addStudentsToCourse-error-place");
    let mainContainer = id("addStudentsToCourse-students-not-assigned-to-this-course-display");
    let checkboxesElements = {};
    if (Object.keys(studentsDictionary).length == 0) {
        const text = document.createTextNode("Brak uczniów, których można dodać do kursu");
        const br = document.createElement("br");
        errorContainer.appendChild(br);
        errorContainer.appendChild(text);
    }
    console.log(Object.keys(studentsDictionary).length);
    for (let key in studentsDictionary) {
        const row = document.createElement('tr');

        const emailBox = document.createElement('td');
        emailBox.setAttribute('id', `addStudentsToCourse-email-${key}`);
        emailBox.textContent = studentsDictionary[key][2];
        row.appendChild(emailBox);

        const first_nameBox = document.createElement('td');
        first_nameBox.setAttribute('id', `addStudentsToCourse-first-name-${key}`);
        first_nameBox.textContent = studentsDictionary[key][0];
        row.appendChild(first_nameBox);

        const last_nameBox = document.createElement('td');
        last_nameBox.setAttribute('id', `addStudentsToCourse-last-name-${key}`);
        last_nameBox.textContent = studentsDictionary[key][1];
        row.appendChild(last_nameBox);

        const checkboxBox = document.createElement('td');
        checkboxBox.setAttribute('id', `addStudentsToCourse-checkbox-box-${key}`);

        const checkbox = document.createElement('input');
        checkbox.setAttribute('id', `addStudentsToCourse-checkbox-${key}`);
        checkbox.setAttribute('class', `form-check-input`);
        checkbox.setAttribute('type', 'checkbox');
        checkbox.addEventListener('click', function () { numberOfBoxesChecked = enableDisableButton(this, buttonToAddManyStudents, numberOfBoxesChecked) });
        checkboxesElements[key] = checkbox;
        checkboxBox.appendChild(checkbox);

        row.appendChild(checkboxBox);

        mainContainer.appendChild(row);
    }
    return checkboxesElements;


}
const getStudentsChecked = function (studentsCheckboxesElements, courseId) {
    return Object.entries(studentsCheckboxesElements).reduce((a, [k, v]) => {
        if (v.checked) a.push({ "directus_users_id": k, "Courses_id": courseId });
        return a;
    }, []);
}
async function addManyStudentsToCourseManager(e, studentsCheckboxesElements, courseId, currentStudentsCount, maximumStudentsCount) {

    e.preventDefault();
    let mainContainer = id("addStudentsToCourse-students-not-assigned-to-this-course");

    let studentsChecked = getStudentsChecked(studentsCheckboxesElements, courseId);

    let dataToPost = JSON.stringify(studentsChecked);

    id("addStudentsToCourse-students-not-assigned-to-this-course-table").remove();
    id("addStudentsToCourse-add-many-students").remove();
    // if (currentStudentsCount + studentsChecked.length > maximumStudentsCount) {
    //     id("addStudentsToCourse-error-place").textContent = "Limit użytkowników tego kursu został osiągnięty. Nie można dodać wybranych uczniów do kursu.";
    // }
    let studentsAdded = await addManyStudentsToDatabase(dataToPost, mainContainer);
    if (studentsAdded) await increaseStudentsNumberInCourse(courseId, currentStudentsCount, studentsChecked.length);

    let continueButton = document.createElement('button');
    continueButton.setAttribute('id', 'addStudentsToCourse-continue-button');
    continueButton.setAttribute('class', 'btn btn-outline-success');
    continueButton.addEventListener('click', function () { window.location = "addStudentsToCourse.html" });
    continueButton.textContent = "Kontynuuj dodawanie";
    mainContainer.appendChild(continueButton);
}
async function increaseStudentsNumberInCourse(courseId, currentStudentsCount, studentsAddedCount) {
    let newNumberOfStudents = currentStudentsCount + studentsAddedCount;
    console.log(currentStudentsCount);
    console.log(studentsAddedCount);
    await updateOneItemFeature("Courses", courseId, "number_of_students_attending_course", newNumberOfStudents);
}
async function updateOneItemFeature(collectionName, itemId, featureName, value) {
    let errorOccured = false;
    let response;
    let x = `{ "${featureName}": "${value}" }`;
    console.log(x);
    try {

        response = await fetch(`${appAddress}/items/${collectionName}/${itemId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: `{
                "${featureName}": "${value}"
            }`
        });

    }
    catch (err) {
        console.error(`${err}`);
        errorOccured = true;
    }
    if (errorOccured || !response.ok) {
        console.log("nie dodano uzytkownikow do kursu (nie dodano ich liczby)");
    }
}

async function addManyStudentsToDatabase(dataToPost, mainContainer) {
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    try {

        response = await fetch(`${appAddress}/items/junction_directus_users_Courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: dataToPost
        });

        if (response.ok) {

            let success = document.createElement('div');
            success.setAttribute('class', `success`);
            success.setAttribute('id', `addStudentsToCourse-success-div`);
            success.textContent = `Dodano zaznaczonych użytkowników`;
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
        failure.setAttribute('id', `addStudentsToCourse-failure-div`);
        failure.textContent = `Nie udało się dodać zaznaczonych użytkowników`;
        mainContainer.appendChild(failure);
        return false;
    }
    return true;
}