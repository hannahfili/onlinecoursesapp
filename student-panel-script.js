// import * from './general-script.js';
import * as exports from './general-script.js'; 
Object.entries(exports).forEach(([name, exported]) => window[name] = exported);


let leftArrowClicked = 0;
let rightArrowClicked = 0;

window.onload = (async function () {
    await redirectToIndexIfUserIsNotLoggedInStudent();
    let allCoursesPath="admin-courses.html";


    let userInfo = await getUserInfo(localStorage.getItem("loggedInUserId"));
    console.log(userInfo);
    let pageName = id("student-panel-page-name");
    let nameTextNode = document.createTextNode(`${userInfo["email"]}`);
    pageName.appendChild(nameTextNode);

    let profileAccessTimeout = id("student-panel-page-access-timeout");
    let timeLeft = new Date(userInfo.platform_access_timeout).getTime() - new Date().getTime();
    let timeLeftInDays = timeLeft / (1000 * 3600 * 24);


    let accessTimeoutTextNode = document.createTextNode("Masz " + parseInt(timeLeftInDays) + " dni dostępu do platformy");
    profileAccessTimeout.appendChild(accessTimeoutTextNode);

    let divForSettingMeetings = id("student-panel-set-meetings-div");
    let divForTimetable = id("student-panel-week-timetable");
    let divForWeekData = id("student-panel-week-name");
    let divForSelectTeacher = id("student-panel-select-teacher-div");
    let selectTeacherElement = id("student-panel-select-teacher-to-meet");
    let divForDeposits=id("student-panel-my-deposits");
    let divForMyData=id('student-panel-my-account-data-div');
    // let divForShiftForm = id("teacher-panel-shift-form");


    let weekStartEnd = setMondayAndSaturdayForThisWeek();
    // console.log(localStorage.getItem("setMainContainerToShiftForm"));

    if (localStorage.getItem("setMainContainerToSetMeeting") == "true") {
        // divForTable.remove();
        // divForTable.style.visibility="visible";
        divForDeposits.remove();
        divForMyData.remove()
        localStorage.setItem("setMainContainerToSetMeeting", false);
        let rightLeft= await chooseTeacherAndSetMeeting(divForTimetable, divForWeekData, weekStartEnd, divForSelectTeacher, selectTeacherElement,
            "student-panel", rightArrowClicked, leftArrowClicked);
    }
    else if (localStorage.getItem("setMainContainerToDeposits") == "true") {
        divForSettingMeetings.remove();
        divForMyData.remove()
        localStorage.setItem("setMainContainerToDeposits", false);
        await setMainContainerToDeposits("student-panel");
    }
    else if (localStorage.getItem("setMainContainerToMyData") == "true") {
        divForSettingMeetings.remove();
        divForDeposits.remove();
        

        localStorage.setItem("setMainContainerToMyData", false);
        await setMainContainerToMyData("student-panel");
    }


    let buttonToSetMeetingWithTeacher = id("student-panel-set-meeting-button");
    buttonToSetMeetingWithTeacher.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToSetMeeting", true);
        window.location.reload();
    });

    let buttonToDisplayAllMeetings = id("student-panel-all-courses");
    buttonToDisplayAllMeetings.addEventListener('click', async function (e) {
        e.preventDefault();
        window.location=allCoursesPath;
    });

    let buttonMainMenu = id("student-panel-main-menu");
    buttonMainMenu.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToSetMeeting", false);
        window.location = "studentPanel.html";
    });

    let buttonMyDeposits = id("student-panel-check-deposit-button");
    buttonMyDeposits.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToDeposits", true);
        window.location.reload();
    });

    let buttonMyData = id("student-panel-my-account-data");
    buttonMyData.addEventListener('click', async function (e) {
        e.preventDefault();
        localStorage.setItem("setMainContainerToMyData", true);
        window.location.reload();
    });

    let buttonToLogOut = id("student-panel-log-out");
    buttonToLogOut.addEventListener('click', async function (e) {
        e.preventDefault();
        await logOut();
        window.location = "index.html";
    });

});


async function redirectToIndexIfUserIsNotLoggedInStudent() {
    let userIsLoggedAndTeacher = await checkIfUserIsLoggedInStudent();
    if (!userIsLoggedAndTeacher) {
        alert("Sesja wygasła. Zaloguj się ponownie");
        window.location.href = "/index.html";
    }
}
async function checkIfUserIsLoggedInStudent() {
    if (!checkIfUserIsStudent()) {
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
function checkIfUserIsStudent() {
    if (localStorage.getItem("loggedInRole") == studentRoleId) return true;
    return false;
}
