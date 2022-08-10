import * as exports from './general-script.js'; 
Object.entries(exports).forEach(([name, exported]) => window[name] = exported);


let numberOfBoxesChecked = 0;

window.onload = (async function () {
    await redirectToIndexIfUserIsNotLoggedInAdmin();

    let userInfo = await getUserInfo(localStorage.getItem("loggedInUserId"));
    console.log(userInfo);
    let pageName = id("admin-panel-page-name");
    let nameTextNode = document.createTextNode(`${userInfo["email"]}`);
    pageName.appendChild(nameTextNode);

    let buttonGoToUsers = id("admin-panel-button-users");
    let buttonGoToCourses = id("admin-panel-button-courses");
    let buttonLogOut = id("admin-panel-log-out");

    buttonGoToUsers.addEventListener('click', function (e) {
        e.preventDefault();
        document.location = '/admin-users.html'
    });
    buttonGoToCourses.addEventListener('click', function (e) {
        e.preventDefault();
        document.location = '/admin-courses.html'
    });
    buttonLogOut.addEventListener('click', async function (e) {
        e.preventDefault();
        await logOut();
    });

    let filePrefix = "admin-panel";
    let divForTimetable = id("admin-panel-week-timetable");
    let divForWeekData = id("admin-panel-week-name");
    let selectTeacherElement = id("admin-panel-select-teacher-to-meet");
    let divForSelectTeacher = id("admin-panel-select-teacher-div");

//DIVY Z MAIN-CONTAINER
    let divForParticularTeacherShifts = id("admin-panel-show-teachers-shifts");
    let divForInputToAddNewShifts=id("admin-panel-shift-form");
    let divForAllShifts = id("admin-panel-show-all-teachers-shifts");
    let divForAllMeetings = id("admin-panel-show-all-teachers-meetings");
    let divForDeposits=id("admin-panel-my-deposits");


    let weekStartEnd = setMondayAndSaturdayForThisWeek();

    //POKAŻ DYŻURY WYBRANEGO NAUCZYCIELA
    if (localStorage.getItem("setMainContainerToShiftForm") == "true") {
        divForAllShifts.remove();
        divForAllMeetings.remove();
        divForDeposits.remove();

        localStorage.setItem("setMainContainerToShiftForm", false);
        await chooseTeacherAndSetMeeting(divForTimetable, divForWeekData, weekStartEnd, divForSelectTeacher, selectTeacherElement, filePrefix);
    }
    //POKAŻ WPŁATY
    else if (localStorage.getItem("setMainContainerToDeposits") == "true") {
        divForParticularTeacherShifts.remove();
        divForInputToAddNewShifts.remove();
        divForAllShifts.remove();
        divForAllMeetings.remove();

        localStorage.setItem("setMainContainerToDeposits", false);
        await setMainContainerToDeposits("admin-panel");
    }
    //POKAŻ DYŻURY WSZYSTKICH NAUCZYCIELI
    else if (localStorage.getItem("setMainContainerToShowAllShifts") == "true") {
        divForParticularTeacherShifts.remove();
        divForInputToAddNewShifts.remove();
        divForAllMeetings.remove();
        divForDeposits.remove();

        localStorage.setItem("setMainContainerToShowAllShifts", false);
        let tbody=id('admin-panel-all-shifts-table-body');
        await displayAllShifts(divForAllShifts, tbody);
    }
    //POKAŻ WSZYSTKIE SPOTKANIA
    else if(localStorage.getItem("setMainContainerToShowAllMeetings")=="true"){
        console.log("TAK")
        divForParticularTeacherShifts.remove();
        divForInputToAddNewShifts.remove();
        divForAllShifts.remove();
        divForDeposits.remove();

        localStorage.setItem("setMainContainerToShowAllMeetings", false);
        let tbody=id("admin-panel-show-all-teachers-meetings-table-body");
        await displayAllMeetings(divForAllMeetings, tbody);
    }


    let buttonToSeeParticularTeacherShifts = id("admin-panel-particular-teacher-shifts");
    buttonToSeeParticularTeacherShifts.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToShiftForm", true);
        window.location.reload();
    });

    let buttonToShowAllShifts = id("admin-panel-teachers-shifts");
    buttonToShowAllShifts.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToShowAllShifts", true);
        window.location = "adminPanel.html";
    });
    let buttonToShowAllMeetings = id("admin-panel-teachers-meetings");
    buttonToShowAllMeetings.addEventListener('click', async function (e) {
        e.preventDefault();
        console.log("KLIK")
        localStorage.setItem("setMainContainerToShowAllMeetings", true);
        window.location = "adminPanel.html";
    });

    let buttonMyDeposits = id("admin-panel-deposits");
    buttonMyDeposits.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToDeposits", true);
        window.location.reload();
    });
    let buttonToLogOut = id("admin-panel-log-out");
    buttonToLogOut.addEventListener('click', async function (e) {
        e.preventDefault();
        await logOut();
        window.location = "index.html";
    });

});
async function getAllMeetings(){
    
}
async function displayAllMeetings(divForAllMeetings, tbody){
    divForAllMeetings.style.visibility="visible";
    let allMeetings = await getAllSomethingFromDatabase("Appointments");
    if (allMeetings.length==0) {divForAllMeetings.classList.add('error'); divForAllMeetings.textContent="Brak spotkań"; return false;};
    if (!allMeetings) return false;
    allMeetings.sort(function(a,b){
        const date1 = new Date(a.date);
        const date2 = new Date(b.date);
    
    return date1 - date2;
    });
    let buttonToDeleteManyMeetings = id("admin-panel-delete-many-meetings-button");
    buttonToDeleteManyMeetings.disabled=true;

    let checkboxToCheckAllMeetings=id(`admin-panel-show-all-teachers-meetings-table-checkbox-check-all`);
    checkboxToCheckAllMeetings.addEventListener('click', function(){
        let allCheckBoxesElements=document.querySelectorAll('.meeting-details-form-check-input');
        if(numberOfBoxesChecked==0){
            
            allCheckBoxesElements.forEach(function(element){
                element.checked=true;
                numberOfBoxesChecked++;
            });
            
        }
        else{
            allCheckBoxesElements.forEach(function(element){
                element.checked=false;
                if(numberOfBoxesChecked>0) numberOfBoxesChecked--;
            });
        }
        if(numberOfBoxesChecked>0) buttonToDeleteManyMeetings.disabled=false;
        else buttonToDeleteManyMeetings.disabled=true;
            // buttonToDeleteManyShifts.classList.add("disabled");
           
            
    
        })


    

    buttonToDeleteManyMeetings.addEventListener('click', async function (e) {
        e.preventDefault();
        let deleted = await deleteManyItemsManager(checkboxesElements, "Appointments");
        if(deleted){
            alert('Pomyślnie usunięto wybrane spotkania');
            localStorage.setItem("setMainContainerToShowAllMeetings", true);
            window.location.reload();
        }
        else{
            alert('BŁĄD SERWERA. Nie udało się usunąć wybranych spotkań')
        }
    })
    let checkboxesElements = {};
    console.log(allMeetings);
    for (var i = 0; i < allMeetings.length; i++) {
        let meeting = allMeetings[i];

        let row = document.createElement('tr');

        let dateBox = document.createElement('td');
        dateBox.setAttribute('id', `meeting-details-date-${i}`);
        dateBox.textContent = displayDate(new Date(meeting.date));
        row.appendChild(dateBox);

        let startHourBox = document.createElement('td');
        startHourBox.setAttribute('id', `meeting-details-start-hour-${i}`);
        startHourBox.textContent = String(meeting.app_start).substring(0, meeting.app_start.length - 3);
        row.appendChild(startHourBox);

        let endHourBox = document.createElement('td');
        endHourBox.setAttribute('id', `meeting-details-end-hour-${i}`);
        endHourBox.textContent = String(meeting.app_end).substring(0, meeting.app_end.length - 3);
        row.appendChild(endHourBox);

        let teacherBox = document.createElement('td');
        teacherBox.setAttribute('id', `meeting-details-teacher-${i}`);
        let teacherInfo = await getUserInfo(meeting.teacher);
        teacherBox.textContent = teacherInfo.email;
        row.appendChild(teacherBox);

        let studentBox = document.createElement('td');
        studentBox.setAttribute('id', `meeting-details-teacher-${i}`);
        let studentInfo = await getUserInfo(meeting.student);
        studentBox.textContent = studentInfo.email;
        row.appendChild(studentBox);

        let topicBox = document.createElement('td');
        topicBox.setAttribute('id', `meeting-details-topic-${i}`);
        topicBox.textContent = meeting.topic;
        row.appendChild(topicBox);

        let deleteBox = document.createElement('td');
        deleteBox.setAttribute('id', `meeting-details-deletebox-${meeting.id}`);

        let buttonDeleteMeeting = document.createElement('button');
        buttonDeleteMeeting.setAttribute('id', `meeting-details-delete-meeting-${meeting.id}`);
        buttonDeleteMeeting.setAttribute('class', `btn btn-secondary`);
        buttonDeleteMeeting.textContent = "Usuń spotkanie";
        buttonDeleteMeeting.addEventListener('click', async function (e) {
            e.preventDefault();
            console.log(meeting.id);

            let deleted = await deleteSomethingById("Appointments", meeting.id);
            if (deleted) {
                alert('Pomyślnie usunięto spotkanie');
                localStorage.setItem("setMainContainerToShowAllMeetings", true);
                window.location.reload();
            }

        });
        deleteBox.appendChild(buttonDeleteMeeting);
        row.appendChild(deleteBox);


        let checkboxBox = document.createElement('td');
        checkboxBox.setAttribute('id', `meeting-details-checkbox-td-meeting-${meeting.id}`);

        let checkbox = document.createElement('input');
        checkbox.setAttribute('id', `meeting-details-checkbox-${meeting.id}`);
        checkbox.setAttribute('class', `meeting-details-form-check-input`);
        checkbox.setAttribute('type', 'checkbox');
        checkbox.addEventListener('click', function () { 
            if(numberOfBoxesChecked>0) buttonToDeleteManyMeetings.disabled=false;
            numberOfBoxesChecked = enableDisableButtonVersion2(this, buttonToDeleteManyMeetings, numberOfBoxesChecked) });
        checkboxesElements[`${meeting["id"]}`] = checkbox;
        checkboxBox.appendChild(checkbox);

        row.appendChild(checkboxBox);

        tbody.appendChild(row);

    }
}
async function getAllSomethingFromDatabase(whatToGet) {
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
    return responseData;
}
async function displayAllShifts(divForAllShifts, tbody) {

    divForAllShifts.style.visibility="visible";
    let allShifts = await getAllSomethingFromDatabase("Shifts");
    if (allShifts.length==0) {divForAllShifts.classList.add('error'); divForAllShifts.textContent="Brak dyżurów"; return false;};
    if (!allShifts) return false;
    allShifts.sort(function(a,b){
        const date1 = new Date(a.date);
        const date2 = new Date(b.date);
    
    return date1 - date2;
    });
    let buttonToDeleteManyShifts = id("admin-panel-delete-many-shifts-button");
    buttonToDeleteManyShifts.disabled=true;

    let checkboxToCheckAllShifts=id(`admin-panel-all-shifts-table-checkbox-check-all`);
    checkboxToCheckAllShifts.addEventListener('click', function(){
        let allCheckBoxesElements=document.querySelectorAll('.shift-details-form-check-input');
        if(numberOfBoxesChecked==0){
            
            allCheckBoxesElements.forEach(function(element){
                element.checked=true;
                numberOfBoxesChecked++;
            });
            
        }
        else{
            allCheckBoxesElements.forEach(function(element){
                element.checked=false;
                if(numberOfBoxesChecked>0) numberOfBoxesChecked--;
            });
        }
        if(numberOfBoxesChecked>0) buttonToDeleteManyShifts.disabled=false;
        else buttonToDeleteManyShifts.disabled=true;
            // buttonToDeleteManyShifts.classList.add("disabled");
           
            
    
        })


    

    buttonToDeleteManyShifts.addEventListener('click', async function (e) {
        e.preventDefault();
        let deleted = await deleteManyItemsManager(checkboxesElements, "Shifts");
        if(deleted){
            alert('Pomyślnie usunięto wybrane dyżury');
            localStorage.setItem("setMainContainerToShowAllShifts", true);
            window.location.reload();
        }
        else{
            alert('BŁĄD SERWERA. Nie udało się usunąć wybranych dyżurów')
        }
    })
    let checkboxesElements = {};
    console.log(allShifts);
    for (var i = 0; i < allShifts.length; i++) {
        let shift = allShifts[i];

        let row = document.createElement('tr');

        let dateBox = document.createElement('td');
        dateBox.setAttribute('id', `shift-details-date-${i}`);
        dateBox.textContent = displayDate(new Date(shift.date));
        row.appendChild(dateBox);

        let startHourBox = document.createElement('td');
        startHourBox.setAttribute('id', `shift-details-start-hour-${i}`);
        startHourBox.textContent = String(shift.shift_start).substring(0, shift.shift_start.length - 3);
        row.appendChild(startHourBox);

        let endHourBox = document.createElement('td');
        endHourBox.setAttribute('id', `shift-details-end-hour-${i}`);
        endHourBox.textContent = String(shift.shift_end).substring(0, shift.shift_end.length - 3);
        row.appendChild(endHourBox);

        let teacherBox = document.createElement('td');
        teacherBox.setAttribute('id', `shift-details-teacher-${i}`);
        let teacherInfo = await getUserInfo(shift.teacher);
        teacherBox.textContent = teacherInfo.email;
        row.appendChild(teacherBox);

        let deleteBox = document.createElement('td');
        deleteBox.setAttribute('id', `shift-details-deletebox-${shift.id}`);

        let buttonDeleteShift = document.createElement('button');
        buttonDeleteShift.setAttribute('id', `shift-details-delete-shift-${shift.id}`);
        buttonDeleteShift.setAttribute('class', `btn btn-secondary`);
        buttonDeleteShift.textContent = "Usuń dyżur";
        buttonDeleteShift.addEventListener('click', async function (e) {
            e.preventDefault();
            console.log(shift.id);

            let deleted = await deleteSomethingById("Shifts", shift.id);
            if (deleted) {
                alert('Pomyślnie usunięto dyżur');
                localStorage.setItem("setMainContainerToShowAllShifts", true);
                window.location.reload();
            }

        });
        deleteBox.appendChild(buttonDeleteShift);
        row.appendChild(deleteBox);


        let checkboxBox = document.createElement('td');
        checkboxBox.setAttribute('id', `shift-details-checkbox-td-shift-${shift.id}`);

        let checkbox = document.createElement('input');
        checkbox.setAttribute('id', `shift-details-checkbox-${shift.id}`);
        checkbox.setAttribute('class', `shift-details-form-check-input`);
        checkbox.setAttribute('type', 'checkbox');
        checkbox.addEventListener('click', function () { 
            if(numberOfBoxesChecked>0) buttonToDeleteManyShifts.disabled=false;
            numberOfBoxesChecked = enableDisableButtonVersion2(this, buttonToDeleteManyShifts, numberOfBoxesChecked) });
        checkboxesElements[`${shift["id"]}`] = checkbox;
        checkboxBox.appendChild(checkbox);

        row.appendChild(checkboxBox);

        tbody.appendChild(row);

    }
}

async function deleteSomethingById(collectionName, itemId) {
    console.log(itemId);
    let response;
    let responseNotOkayFound = false;
    let errorOccured = false;
    try {
        response = await fetch(`${appAddress}/items/${collectionName}/${itemId}`, {
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



