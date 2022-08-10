import * as exports from './general-script.js'; 
Object.entries(exports).forEach(([name, exported]) => window[name] = exported);

window.onload = (async function () {
    exports.redirectToIndexIfUserIsNotLoggedInAtAll();
    
    await displayDetails();
})
async function displayDetails(courseId = localStorage.getItem("courseIdToShowDetails")) {
    let nameElement = id("course-details-course-name");
    let descriptionElement = id("course-details-course-description");
    let maxStudentsCountElement = id("course-details-course-maximum-students-count-span");
    let studentsAttendingElement = id("course-details-number-of-students-attending-course-span");
    let activityStatusElement = id("course-details-activity-status-span");
    let studentsListElement = id("course-details-students-attending-course-list");
    let errorContainer = id("course-details-all-errors");
    let errorContainerForDisplayingModules = id("course-details-display-modules-errors");

    let courseDetails = await getCourseDetails(courseId, errorContainer);
    let courseDetailsJson = await courseDetails.json();
    let data = courseDetailsJson.data;
    console.log(data);

    nameElement.textContent = `Nazwa kursu: ${data["name"]}`;
    descriptionElement.textContent = `Opis kursu: ${data["description"] == "" ? "-" : data["description"]}`;

    maxStudentsCountElement.setAttribute('class', 'badge bg-success');
    studentsAttendingElement.setAttribute("class", "badge bg-warning text-dark");
    maxStudentsCountElement.textContent = `Maksymalna liczba uczestników: ${data["maximum_students_count"]}`;
    studentsAttendingElement.textContent = `Aktualna liczba uczestników: ${data["number_of_students_attending_course"]}`;

    if (data["activity_status"] == "disabled") {
        activityStatusElement.setAttribute('class', 'badge bg-danger');
        activityStatusElement.textContent = "Kurs nieaktywny";
    }
    else {
        activityStatusElement.setAttribute('class', 'badge bg-success');
        activityStatusElement.textContent = "Kurs aktywny";
    }

    if (data["number_of_students_attending_course"] > 0) await displayAllStudents(courseId, studentsListElement, errorContainer);
    else {
        id("course-details-students-label").textContent = "Brak uczestników"
        id("course-details-delete-many-students").remove();
    }
    let moduleContainerToDisplay = id("course-details-all-modules");

    let buttonToAddModule = id("course-details-add-module-button-div");
    buttonToAddModule.addEventListener('click', async function (e) {
        e.preventDefault();
        let moduleNameInput=id("course-details-module-name-input");
        if(!moduleNameInput){
            let addedModule = await addModuleManager(courseId);
        if (!addedModule) errorContainer.textContent="Dodanie modułu nie jest możliwe. Błąd serwera";
        }
        
    })
    let buttonToSeeAllDetails=id("course-details-see-all-courses-modules-and-sections");
    buttonToSeeAllDetails.addEventListener('click', function(e){
        e.preventDefault();
        window.location="courses-all-modules-sections.html";
        
    });
   
    let buttonToAddManyStudents=id("course-details-add-many-students");
    buttonToAddManyStudents.addEventListener('click', function(e){
        e.preventDefault();
        localStorage.setItem("courseIdToAddStudents", courseId);
        window.location = "addStudentsToCourse.html";        
    });


    await displayAllModules(courseId, moduleContainerToDisplay);
}


async function displayAllModules(courseId, containerToDisplay, containerForError) {
    let modulesAssignedToThisCourse = await getModulesAssignedToThisCourse(courseId);
    if (modulesAssignedToThisCourse == null) {
        containerForError.textContent = "Wystąpił problem z ładowaniem modułów";
        return;
    }
    else if (Object.keys(modulesAssignedToThisCourse).length == 0) {
        let info=document.createTextNode("Nie dodano jeszcze żadnego modułu");
        containerToDisplay.appendChild(info);
        return;
    }

    let tableForModules = document.createElement("table");
    tableForModules.setAttribute("id", "course-details-table");
    tableForModules.setAttribute("class", "table table-hover");

    let tbody = document.createElement("tbody");
    tbody.setAttribute("id", "course-details-tbody");


    for (let key in modulesAssignedToThisCourse) {
        const row = document.createElement('tr');
        //utworzenie okienka na nazwę kursu
        const tdForItem = document.createElement('td');
        tdForItem.setAttribute('id', `course-details-module-${key}`);
        // tdForItem.textContent = modulesAssignedToThisCourse[key]["name"];


        await displaySectionsWithCollapseManager(modulesAssignedToThisCourse[key], tdForItem);

        // const collapseItem=document.createElement("a");
        // collapseItem.setAttribute("class", "btn btn-primary");
        // collapseItem.setAttribute("class", "btn btn-primary");
        // collapseItem.setAttribute("class", "btn btn-primary");
        // collapseItem.setAttribute("class", "btn btn-primary");
        // collapseItem.setAttribute("class", "btn btn-primary");
        // collapseItem.setAttribute("class", "btn btn-primary");






        row.appendChild(tdForItem);
        tbody.appendChild(row);
    }

    tableForModules.appendChild(tbody);
    containerToDisplay.appendChild(tableForModules);


    console.log(modulesAssignedToThisCourse);
}
async function displaySectionsWithCollapseManager(moduleElement, mainContainer) {

    // <p>
    //     <a class="btn btn-primary" data-bs-toggle="collapse" href="#collapseExample" role="button" aria-expanded="false" aria-controls="collapseExample">
    //       Link with href
    //     </a>
    //   </p>
    //   <div class="collapse" id="collapseExample">
    //     <div class="card card-body">
    //       Some placeholder content for the collapse component. This panel is hidden by default but revealed when the user activates the relevant trigger.
    //     </div>
    //   </div>
    //poniżej napisano to, co jest wyżej tylko w JS, jest kilka dodatków
    let pForCollapse = document.createElement("p");
    let aForCollapse = document.createElement("a");
    aForCollapse.setAttribute("class", "btn btn-primary");
    aForCollapse.setAttribute("data-bs-toggle", "collapse");
    aForCollapse.setAttribute("href", `#moduleSections-${moduleElement["id"]}`);
    aForCollapse.setAttribute("role", "button");
    aForCollapse.setAttribute("aria-expanded", "false");
    aForCollapse.setAttribute("aria-controls", "moduleSections");
    aForCollapse.textContent = `${moduleElement["name"]}`; //wyswietl nazwę modułu

    let imgCollapse = document.createElement("img");
    imgCollapse.setAttribute("src", `${appAddress}/assets/1761ceff-5563-4b87-8c3d-631c9ec4351f?key=actual-size`);
    imgCollapse.setAttribute("alt", "icon-for-collapse");
    imgCollapse.setAttribute("width", "20");
    imgCollapse.setAttribute("height", "20");
    imgCollapse.setAttribute("id", "course-details-icon-for-collapse");
    aForCollapse.appendChild(imgCollapse);

    let buttonToAddSection = document.createElement("button");
    buttonToAddSection.setAttribute("id", "course-details-button-to-add-section");
    buttonToAddSection.setAttribute("class", "btn btn-success");
    buttonToAddSection.textContent = "[+] dodaj sekcję";
    buttonToAddSection.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("moduleIdToAddSectionTo", moduleElement["id"]);
        window.location = "add-section.html";
    });
    aForCollapse.appendChild(buttonToAddSection);


    pForCollapse.appendChild(aForCollapse);

    let divForCollapes = document.createElement("div");
    divForCollapes.setAttribute("class", "collapse");
    divForCollapes.setAttribute("id", `moduleSections-${moduleElement["id"]}`);

    let divForCard = document.createElement("div");
    divForCard.setAttribute("class", "card card-body");
    const errorContainerForDisplayingSections = document.createElement("div");
    errorContainerForDisplayingSections.setAttribute("id", `course-details-error-container-module-${moduleElement["id"]}-sections`);


    let sectionsAssignedToThisModule = await getSectionsAssignedToTheModule(moduleElement["id"], errorContainerForDisplayingSections);
    console.log(sectionsAssignedToThisModule);
    if (sectionsAssignedToThisModule == null || sectionsAssignedToThisModule.length == 0) {
        let divForSection = document.createElement("div");
        divForSection.setAttribute("id", `course-details-module-${moduleElement["id"]}-section-empty`);
        divForSection.textContent = "Brak sekcji do wyświetlenia";

        divForCard.appendChild(divForSection);
        divForCollapes.appendChild(divForCard);
        mainContainer.appendChild(pForCollapse);
        mainContainer.appendChild(divForCollapes);
        return;
    }

    for (let i = 0; i < sectionsAssignedToThisModule.length; i++) {
        let section = sectionsAssignedToThisModule[i];
        let sectionId = section["id"];
        console.log(section);

        let divForSection = document.createElement("div");
        divForSection.setAttribute("id", `course-details-module-${moduleElement["id"]}-section-${sectionId}`);
        divForSection.textContent = section.name;

        divForCard.appendChild(divForSection);
        divForCollapes.appendChild(divForCard);
    }



    mainContainer.appendChild(pForCollapse);
    mainContainer.appendChild(divForCollapes);

}




async function displayAllStudents(courseId, containerToDisplay, containerForError) {
    console.log(courseId);
    let numberOfBoxesChecked = 0;
    let checkboxesElements = {};
    let dataDictionary = await getStudentsFromStudentsCoursesJunctionTable(courseId, true, containerForError);
    // console.log(dataDictionary);
    let tableForStudents = document.createElement("table");
    tableForStudents.setAttribute("id", `course-details-course-number-${courseId}-students-table`);
    tableForStudents.setAttribute("class", "table table-hover");

    let tbody = document.createElement("tbody");
    tbody.setAttribute("id", `course-details-course-number-${courseId}-students-tbody`);

    let buttonToDeleteManyStudents = id("course-details-delete-many-students");


    for (let key in dataDictionary) {
        const row = document.createElement('tr');

        const emailBox = document.createElement('td');
        emailBox.setAttribute('id', `course-details-email-${courseId}`);
        emailBox.textContent = `${dataDictionary[key][2]}`;
        row.appendChild(emailBox);

        const deleteButtonBox = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.setAttribute('type', 'button');
        deleteButton.setAttribute('id', key);
        deleteButton.setAttribute('class', 'btn-close');
        deleteButton.setAttribute('aria-label', 'close');
        deleteButtonBox.appendChild(deleteButton);
        deleteButton.addEventListener('click', async function (e) {
            e.preventDefault();
            console.log(dataDictionary[key]);
            // console.log(key[0]);
            // console.log(key[1]);
            await deleteStudentsManager(courseId, key, containerForError);
        })
        row.appendChild(deleteButtonBox);

        const checkboxBox = document.createElement('td');
        checkboxBox.setAttribute('id', `course-details-${courseId}`);

        const checkbox = document.createElement('input');
        checkbox.setAttribute('id', `course-details-checkbox-${key}`);
        checkbox.setAttribute('class', `form-check-input`);
        checkbox.setAttribute('type', 'checkbox');
        checkbox.addEventListener('click', function () { numberOfBoxesChecked = enableDisableButton(this, buttonToDeleteManyStudents, numberOfBoxesChecked) });
        checkboxesElements[`${key}`] = checkbox;
        checkboxBox.appendChild(checkbox);
        row.appendChild(checkboxBox);

        // row.appendChild(checkboxBox);
        // <button type="button" class="btn-close" aria-label="Close"></button>

        tbody.appendChild(row);
    }
    tableForStudents.appendChild(tbody);
    containerToDisplay.appendChild(tableForStudents);

    buttonToDeleteManyStudents.addEventListener('click', async function (e) {
        e.preventDefault();
        await deleteManyUsersFromParticularCourseManager(checkboxesElements, courseId, containerForError);
        window.location.reload();
    });
}
async function deleteManyUsersFromParticularCourseManager(checkboxes, courseId, errorContainer) {
    let studentsIdsToDelete = [];
    for (let key in checkboxes) {
        console.log(checkboxes[key].checked);
        if (checkboxes[key].checked) studentsIdsToDelete.push(checkboxes[key].getAttribute('id').slice(24));
    }
    let itemsToDeleteIds = [];
    for (let i = 0; i < studentsIdsToDelete.length; i++) {
        let itemToDeleteId = await findItemIdInjunction_directus_users_CoursesBased(courseId, studentsIdsToDelete[i]);
        console.log(itemToDeleteId);
        itemsToDeleteIds.push(itemToDeleteId);
    }
    // studentsIdsToDelete.forEach(async function (studentId) {
    //     let itemToDeleteId = await findItemIdInjunction_directus_users_CoursesBased(courseId, studentId);
    //     console.log(itemToDeleteId);
    //     itemsToDeleteIds.push(itemToDeleteId);
    // });
    console.log(itemsToDeleteIds);
    let deleted = await deleteManyUsersFromParticularCourse(JSON.stringify(itemsToDeleteIds));
    if (deleted) {
        updateCourseInfoConcerningStudentsNumber(courseId, errorContainer, itemsToDeleteIds.length);
        // window.location.reload();
    }
}

async function deleteManyUsersFromParticularCourse(dataToDelete) {
    console.log(dataToDelete.length);
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    try {

        response = await fetch(`${appAddress}/items/junction_directus_users_Courses`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: dataToDelete
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
async function deleteStudentsManager(courseId, studentId, errorContainer) {

    let itemIdToDelete = await findItemIdInjunction_directus_users_CoursesBased(courseId, studentId);
    let deleted = await deleteStudentFromCourse(itemIdToDelete, courseId, errorContainer);
    if (!deleted) errorContainer.textContent = "Nie udało się usunąć użytkownika";
    else document.location.reload();

    // data.forEach(function (item) {
    //     console.log(item);
    //     if (item["Courses_id"] == courseId && item["directus_users_id"] == studentId) {
    //         console.log(item["id"]);
    //     }
    // })
}
async function findItemIdInjunction_directus_users_CoursesBased(courseId, studentId, errorContainer) {
    let allItemsFromStudentsCoursesJunctionTable = await getAllItemsFromStudentsCoursesJunctionTable(errorContainer);
    // console.log(allItemsFromStudentsCoursesJunctionTable);
    let data = allItemsFromStudentsCoursesJunctionTable.data;
    let itemIdToDelete = -1;
    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        if (item["Courses_id"] == courseId && item["directus_users_id"] == studentId) {
            itemIdToDelete = item["id"];
            break;
        }
    }
    return itemIdToDelete;
}
async function deleteStudentFromCourse(itemInjunction_directus_users_CoursesId, courseId, errorContainer) {
    let deleted = await deleteStudentFromCourseDatabase(itemInjunction_directus_users_CoursesId);
    if (deleted) await updateCourseInfoConcerningStudentsNumber(courseId, errorContainer, 1);
    return deleted;
}
async function updateCourseInfoConcerningStudentsNumber(courseId, errorContainer, numberOfStudentsDeleted) {
    let courseInfoResponse = await getCourseDetails(courseId, errorContainer);
    let json = await courseInfoResponse.json();
    let currentStudentsCount = json.data["number_of_students_attending_course"];
    await updateCourse(courseId, "number_of_students_attending_course", currentStudentsCount - numberOfStudentsDeleted, "studentsCount");
}

async function deleteStudentFromCourseDatabase(itemInjunction_directus_users_CoursesId) {
    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    try {
        response = await fetch(`${appAddress}/items/junction_directus_users_Courses/${itemInjunction_directus_users_CoursesId}`, {
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
    if (responseNotOkayFound || errorOccured) return false;
    return true;

}
