import * as exports from './general-script.js'; 
Object.entries(exports).forEach(([name, exported]) => window[name] = exported);

let leftArrowClicked = 0;
let rightArrowClicked = 0;

window.onload = (async function () {
    await redirectToIndexIfUserIsNotLoggedInTeacher();
    let userInfo = await getUserInfo(localStorage.getItem("loggedInUserId"));
    let teacherId=userInfo.id;
    console.log(userInfo);
    let pageName = id("teacher-panel-page-name");
    let nameTextNode = document.createTextNode(`${userInfo["email"]}`);
    pageName.appendChild(nameTextNode);

    let divForTable = id("teacher-panel-week-timetable");
    let divForShiftForm = id("teacher-panel-shift-form");
    let divForMyData=id('teacher-panel-my-account-data-div');
    let divForDeposits=id('teacher-panel-my-deposits');

    let divForWeekData = id("teacher-panel-week-name");
    // let test=id("teacher-panel-week-timetable");
    // console.log(test);
    // test=id("teacher-panel-week-timetable-table");
    // console.log(test);
    // test=id("teacher-panel-week-name");
    // console.log(test);
    
    
    let filePrefix="teacher-panel";

    let weekStartEnd = setMondayAndSaturdayForThisWeek();
    console.log(localStorage.getItem("setMainContainerToShiftForm"));

    if (localStorage.getItem("setMainContainerToShiftForm") == "true") {
        // divForTable.remove();
        divForMyData.remove();
        divForDeposits.remove();

        localStorage.setItem("setMainContainerToShiftForm", false);
        
        let rightLeft=await setMainContainerToCalendar(divForTable, divForWeekData, weekStartEnd, filePrefix, teacherId, rightArrowClicked, leftArrowClicked);
        rightArrowClicked=rightLeft[0];
        leftArrowClicked=rightLeft[1];
        await setMainContainerToShiftForm(divForShiftForm, weekStartEnd, filePrefix, teacherId);
    }
    else if (localStorage.getItem("setMainContainerToCalendar") == "true") {
        // divForShiftForm.remove();    
        divForMyData.remove();
        divForDeposits.remove();

        localStorage.setItem("setMainContainerToCalendar", false);
        let rightLeft=await setMainContainerToCalendar(divForTable, divForWeekData, weekStartEnd, filePrefix, teacherId, rightArrowClicked, leftArrowClicked);
        rightArrowClicked=rightLeft[0];
        leftArrowClicked=rightLeft[1];
    
    }
    else if (localStorage.getItem("setMainContainerToDeposits") == "true") {
        divForShiftForm.remove();
        divForTable.remove();
        divForMyData.remove();

        localStorage.setItem("setMainContainerToDeposits", false);
        await setMainContainerToDeposits("teacher-panel");
    }
    else if (localStorage.getItem("setMainContainerToMyData") == "true") {
        divForShiftForm.remove();
        divForTable.remove();
        divForDeposits.remove();
        

        localStorage.setItem("setMainContainerToMyData", false);
        await setMainContainerToMyData("teacher-panel");
    }

    let fileWithCoursesPath="admin-courses.html";

    let buttonToSeeTeachersCourses = id("teacher-panel-my-courses");
    buttonToSeeTeachersCourses.addEventListener('click', async function (e) {
        e.preventDefault();
        console.log(fileWithCoursesPath);
        window.location=fileWithCoursesPath;
    });

    let buttonToShowCalendar = id("teacher-panel-show-calendar-button");
    buttonToShowCalendar.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToCalendar", true);
        window.location.reload();
    });

    let buttonMainMenu = id("teacher-panel-main-menu");
    buttonMainMenu.addEventListener('click', async function (e) {
        e.preventDefault();
        window.location = "teacherPanel.html";
    });

    let buttonToSetShift = id("teacher-panel-set-shift-button");
    buttonToSetShift.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToShiftForm", true);
        window.location.reload();
    });

    let buttonToLogOut=id("teacher-panel-log-out");
    buttonToLogOut.addEventListener('click', async function (e) {
        e.preventDefault();
        await logOut();
        window.location="index.html";
    });
    let buttonMyDeposits = id("teacher-panel-my-deposits-button");
    buttonMyDeposits.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToDeposits", true);
        window.location.reload();
    });
    let buttonMyData = id("teacher-panel-my-account-data");
    buttonMyData.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToMyData", true);
        window.location.reload();
    });



});








async function setMainContainerToCalendar(divForTable, divForWeekData, weekStartEnd, filePrefix, teacherId, rightArrowClicked, leftArrowClicked) {

    console.log(rightArrowClicked);
    console.log(leftArrowClicked);
    divForTable.style.visibility = "visible";
    displayUpperInfo(divForWeekData, weekStartEnd);
    setWeekdaysDates(weekStartEnd, filePrefix);

    await displayWeekTimetable(weekStartEnd, document.querySelectorAll(`.${filePrefix}-week-day-indicator`),
    `${filePrefix}-timetable-`, teacherId);
    
    let buttonDisplayNextWeek = id(`${filePrefix}-next-week-button`);

    console.log(buttonDisplayNextWeek);
    buttonDisplayNextWeek.addEventListener('click', async function (e) {
        e.preventDefault();
        divForTable.style.visibility = "hidden";
        rightArrowClicked += 1;
        let howManyWeeksToAdd = setHowManyWeeksToAdd(rightArrowClicked, leftArrowClicked);
        let weekStartEnd = setMondayAndSaturdayForThisWeek(howManyWeeksToAdd);
        divForTable.style.visibility = "visible";
        displayUpperInfo(divForWeekData, weekStartEnd, howManyWeeksToAdd);
        setWeekdaysDates(weekStartEnd, filePrefix);
        await displayWeekTimetable(weekStartEnd, document.querySelectorAll(`.${filePrefix}-week-day-indicator`),
        `${filePrefix}-timetable-`, teacherId);
    });

    let buttonDisplayPreviousWeek = id(`${filePrefix}-previous-week-button`);
    buttonDisplayPreviousWeek.addEventListener('click', async function (e) {
        e.preventDefault();
        divForTable.style.visibility = "hidden";
        leftArrowClicked += 1;
        let howManyWeeksToAdd = setHowManyWeeksToAdd(rightArrowClicked, leftArrowClicked);
        let weekStartEnd = setMondayAndSaturdayForThisWeek(howManyWeeksToAdd);
        divForTable.style.visibility = "visible";
        displayUpperInfo(divForWeekData, weekStartEnd, howManyWeeksToAdd);
        setWeekdaysDates(weekStartEnd, filePrefix);
        await displayWeekTimetable(weekStartEnd, document.querySelectorAll(`.${filePrefix}-week-day-indicator`),
        `${filePrefix}-timetable-`, teacherId);
    });

    return [rightArrowClicked, leftArrowClicked]



}


function setWeekdaysDates(weekStartEnd, filePrefix) {

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










async function redirectToIndexIfUserIsNotLoggedInTeacher() {
    let userIsLoggedAndTeacher = await checkIfUserIsLoggedInTeacher();
    if (!userIsLoggedAndTeacher) {
        alert("Sesja wygasła. Zaloguj się ponownie");
        window.location.href = "/index.html";
    }
}
async function checkIfUserIsLoggedInTeacher() {
    if (!checkIfUserIsTeacher()) {
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
function checkIfUserIsTeacher() {
    if (localStorage.getItem("loggedInRole") == teacherRoleId) return true;
    return false;
}
