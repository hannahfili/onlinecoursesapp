import * as exports from './general-script.js'; 
Object.entries(exports).forEach(([name, exported]) => window[name] = exported);
window.onload = (async function () {
    await addSectionDisplayManager();
})
async function addSectionDisplayManager(moduleId = localStorage.getItem("moduleIdToAddSectionTo")) {
    await exports.redirectToIndexIfUserIsNotLoggedInAtAll();
    let errorContainer = id("add-section-display-modules-errors");
    let moduleElementResponse = await getParticularModuleData(moduleId);
    if (moduleElementResponse == null) {
        errorContainer.textContent = "Problem z połączeniem z serwerem";
        return;
    }

    let moduleElementJson = await moduleElementResponse.json();

    let moduleElement = moduleElementJson.data;
    // console.log(moduleElement["name"]);


    let pageNameEl = id("add-section-page-name");
    pageNameEl.textContent = `Moduł: ${moduleElement["name"]}`;

    
    let newSectionId=await getLastSectionId();
    if(newSectionId==-1){
        errorContainer.textContent="Problem z serwerem - nie uda się dodać sekcji";
        return;
    }
    console.log("last section id: ", newSectionId);
    newSectionId+=1;
    let newSectionOrderNumber=await getLastSectionAssignedToThisModuleIdOrOrderNumber(moduleId, "order_number");
    console.log("last section order number: ",newSectionOrderNumber );
    newSectionOrderNumber=newSectionOrderNumber+1;
    console.log("newSectionOrderNumber",newSectionOrderNumber );
    // let thisModulesLastSectionOrderNumber = await getLastSectionAssignedToThisModuleIdOrOrderNumber(moduleId, "order_number");
    // thisModulesLastSectionOrderNumber > 0 ? newSectionOrderNumber = thisModulesLastSectionOrderNumber + 1 : newSectionOrderNumber = 0;

    await enableToAddManyFileAndTextElements(moduleId, newSectionId, newSectionOrderNumber, errorContainer);
}
async function enableToAddManyFileAndTextElements(moduleId, newSectionId, newSectionOrderNumber, errorContainer) {

    
    let buttonToAddTextElement = id("add-section-add-text-element-button");
    let buttonToAddFileElement = id("add-section-add-file-element-button");
    let submitButton = id("add-section-submit");
    let elementId = 1;
    let selects = document.querySelectorAll(".add-section-add-text-element-selects");

    let filesInputs = document.querySelectorAll(".add-section-add-file-element-input");
    // console.log(selects.length);

    buttonToAddTextElement.addEventListener('click', function (e) {
        e.preventDefault();
        let textDivsForInput = document.querySelectorAll(".add-section-add-text-element-div-for-input");
        let selects = document.querySelectorAll(".add-section-add-text-element-selects");
        if (textDivsForInput.length == 0 && selects.length < 10) {
            displayOptionToAddTextElement(newSectionId, true, errorContainer);
            updateAllSelects();
        }
    });
    buttonToAddFileElement.addEventListener('click', function (e) {
        e.preventDefault();
        let filesInputs = document.querySelectorAll(".add-section-add-file-element-input");
        let selects = document.querySelectorAll(".add-section-add-text-element-selects");
        if (filesInputs.length == 0 && selects.length < 10) {
            displayOptionToAddFileElement(true, errorContainer);
            updateAllSelects();
        }
    });
    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        let sectionNameValue = id("add-section-name").value;
        if(sectionNameValue==""){
            errorContainer.textContent="Podaj nazwę sekcji!";
            return;
        }
        console.log(sectionNameValue);
        await addSectionManager(errorContainer, sectionNameValue, newSectionId, moduleId, newSectionOrderNumber);
    })
}
function displayOptionToAddFileElement(firstFileInput, errorContainer) {
    errorContainer.textContent = '';
    let filesInputs = document.querySelectorAll(".add-section-add-file-element-input");
    let lastFileInputsIdNumber = getLastSelectNumberOrLastFileInputNumber(filesInputs);

    let divToStoreFileInput = document.createElement('div');
    divToStoreFileInput.setAttribute('id', `add-section-add-file-element-div-${lastFileInputsIdNumber + 1}`);
    divToStoreFileInput.setAttribute('class', `add-section-add-file-element-div-for-file-input`);

    let containerForFileInput = id("add-section-add-file-element-display");

    let selects = document.querySelectorAll(".add-section-add-text-element-selects");
    // console.log(selects);
    let lastSelectNumber = getLastSelectNumberOrLastFileInputNumber(selects);
    let selectForElementOrderNumber = document.createElement('select');
    selectForElementOrderNumber.setAttribute('id', `add-section-select-${lastSelectNumber + 1}`);
    selectForElementOrderNumber.setAttribute('class', `add-section-add-text-element-selects`);

    let inputFilePlace = document.createElement('input');
    inputFilePlace.setAttribute('id', `add-section-add-file-element-input-${lastFileInputsIdNumber + 1}`);
    inputFilePlace.setAttribute('type', 'file');
    inputFilePlace.setAttribute('class', 'add-section-add-file-element-input');

    let buttonToAddAnotherFile;

    if (firstFileInput) {
        buttonToAddAnotherFile = document.createElement("button");
        buttonToAddAnotherFile.setAttribute("id", `add-section-button-to-add-another-select-${lastFileInputsIdNumber + 1}`);
        buttonToAddAnotherFile.setAttribute("class", "btn btn-success");
        buttonToAddAnotherFile.textContent = "[+] dodaj kolejny";
        buttonToAddAnotherFile.addEventListener('click', function (e) {
            e.preventDefault();
            let selects = document.querySelectorAll(".add-section-add-text-element-selects");
            if (selects.length < 10) {
                displayOptionToAddFileElement(false, errorContainer);
                updateAllSelects();
            }
            else {
                errorContainer.textContent = "Nie można dodać więcej niż 10 elementów jednocześnie";
            }

        });
    }
    let buttonToDeleteFileElement = document.createElement("button");
    buttonToDeleteFileElement.setAttribute("id", `add-section-button-to-delete-file-element-${lastFileInputsIdNumber + 1}`);
    buttonToDeleteFileElement.setAttribute("class", "btn btn-danger");
    buttonToDeleteFileElement.textContent = "X";
    buttonToDeleteFileElement.addEventListener('click', function (e) {
        e.preventDefault();
        // console.log(buttonToDeleteFileElement.getAttribute("id"));
        deleteOptionToAddTextOrFileElement(buttonToDeleteFileElement.getAttribute("id"), "file");
        updateAllSelects();
        errorContainer.textContent = '';

    });
    divToStoreFileInput.appendChild(selectForElementOrderNumber);
    divToStoreFileInput.appendChild(inputFilePlace);

    divToStoreFileInput.appendChild(buttonToDeleteFileElement);
    if (buttonToAddAnotherFile) divToStoreFileInput.appendChild(buttonToAddAnotherFile);
    containerForFileInput.appendChild(divToStoreFileInput);
}
function displayOptionToAddTextElement(newSectionId, firstSelect, errorContainer) {
    errorContainer.textContent = '';
    let selects = document.querySelectorAll(".add-section-add-text-element-selects");
    let lastSelectNumber = getLastSelectNumberOrLastFileInputNumber(selects);
    let divToStoreInput = document.createElement('div');
    divToStoreInput.setAttribute('id', `add-section-add-text-element-div-${lastSelectNumber + 1}`);
    divToStoreInput.setAttribute('class', `add-section-add-text-element-div-for-input`);

    let selectForElementOrderNumber = document.createElement('select');
    selectForElementOrderNumber.setAttribute('id', `add-section-select-${lastSelectNumber + 1}`);
    selectForElementOrderNumber.setAttribute('class', `add-section-add-text-element-selects`);


    let containerForInput = id("add-section-add-text-element-display");
    let inputPlace = document.createElement("textarea");
    // inputPlace.setAttribute("type", "textArea");
    inputPlace.setAttribute("required", "");
    inputPlace.setAttribute("placeholder", "Element tekstowy...");
    inputPlace.setAttribute('id', `add-section-text-input-${lastSelectNumber + 1}`);

    let buttonToAddAnotherSelect;
    if (firstSelect) {
        buttonToAddAnotherSelect = document.createElement("button");
        buttonToAddAnotherSelect.setAttribute("id", `add-section-button-to-add-another-select-${lastSelectNumber + 1}`);
        buttonToAddAnotherSelect.setAttribute("class", "btn btn-success");
        buttonToAddAnotherSelect.textContent = "[+] dodaj kolejny";
        buttonToAddAnotherSelect.addEventListener('click', function (e) {
            e.preventDefault();
            let selects = document.querySelectorAll(".add-section-add-text-element-selects");
            if (selects.length < 10) {
                displayOptionToAddTextElement(newSectionId, false, errorContainer);
                updateAllSelects();
            }
            else {
                errorContainer.textContent = "Nie można dodać więcej niż 10 ELE jednocześnie";
            }

        });
    }
    let buttonToDeleteTextElement = document.createElement("button");
    buttonToDeleteTextElement.setAttribute("id", `add-section-button-to-delete-text-element-${lastSelectNumber + 1}`);
    buttonToDeleteTextElement.setAttribute("class", "btn btn-danger");
    buttonToDeleteTextElement.textContent = "X";
    buttonToDeleteTextElement.addEventListener('click', function (e) {
        e.preventDefault();
        // console.log(buttonToDeleteTextElement.getAttribute("id"));
        deleteOptionToAddTextOrFileElement(buttonToDeleteTextElement.getAttribute("id"), "text");
        updateAllSelects();
        errorContainer.textContent = '';


    });

    divToStoreInput.appendChild(selectForElementOrderNumber);
    divToStoreInput.appendChild(inputPlace);

    divToStoreInput.appendChild(buttonToDeleteTextElement);
    if (buttonToAddAnotherSelect) divToStoreInput.appendChild(buttonToAddAnotherSelect);
    containerForInput.appendChild(divToStoreInput);
}
function getLastSelectNumberOrLastFileInputNumber(elementsToLookFor) {
    let elementsValues = [...elementsToLookFor].map(element => Number(String(element.id).match(/\d+/g)));
    // console.log(elementsValues);
    let maxNumber = 0;
    for (let i = 0; i < elementsValues.length; i++) {
        if (elementsValues[i] > maxNumber) {
            maxNumber = Number(elementsValues[i]);
        }
    }
    // console.log(maxNumber);
    return maxNumber;
}
function deleteOptionToAddTextOrFileElement(buttonIdWithText, textOrFile) {
    var buttonPureId = Number(String(buttonIdWithText).match(/\d+/g));
    // console.log(buttonPureId);
    if (textOrFile == "text") {
        id(`add-section-add-text-element-div-${buttonPureId}`).remove();
    }
    if (textOrFile == "file") {
        id(`add-section-add-file-element-div-${buttonPureId}`).remove();
    }

    updateAllSelects();
}
Element.prototype.remove = function () {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function () {
    for (var i = this.length - 1; i >= 0; i--) {
        if (this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}
function updateAllSelects() {
    let selects = document.querySelectorAll(".add-section-add-text-element-selects");
    // console.log(selects);
    selects.forEach(function (select) {
        select.innerHTML = '';
        // <option value="" disabled selected>Select your option</option>
        let option = document.createElement('option');
        option.setAttribute('value', "");
        option.setAttribute('disabled', '');
        option.setAttribute('selected', '');
        select.appendChild(option);
        option.textContent = "Ustal kolejność";
        for (let i = 1; i <= selects.length; i++) {
            let option = document.createElement('option');
            option.setAttribute('value', i);
            option.textContent = i;
            select.appendChild(option);
        }

    });

}

async function addSectionManager(errorContainer, sectionName, newSectionId, moduleId, sectionOrderNumber){
    let allFilesDivs = document.querySelectorAll(`.add-section-add-file-element-div-for-file-input`);
    let allTextsDivs = document.querySelectorAll(".add-section-add-text-element-div-for-input");
    
    console.log(allFilesDivs);
    console.log(allTextsDivs);

    let selectsValidated=validateSelects(allFilesDivs, allTextsDivs);
    if (!selectsValidated) {
        errorContainer.textContent = "Niepoprawna kolejność - każdy element musi mieć unikatowy numer porządkowy!";
        return false;
    }
    errorContainer.textContent = '';
    let elementsToAddToSection = getOrderNumbersAndValuesFromInputs(allFilesDivs, allTextsDivs);
    let createdSection= await createEmptySection(newSectionId, sectionName, moduleId, sectionOrderNumber);
    if(createdSection){
        let elementsAddedIncorrectly= await addElementsToSection(elementsToAddToSection, newSectionId);
        if(!elementsAddedIncorrectly) alert('Pomyślnie dodano sekcję wraz z wszystkimi plikami');
        window.location = "course-details.html";
    }
    else{
        errorContainer.textContent = "Nie udało się dodać sekcji";
    }  
}
async function createEmptySection(sectionId, sectionName, moduleId, sectionOrderNumber, loggedInUserId=localStorage.getItem("loggedInUserId")){
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    console.log("create empty section: order number:", sectionOrderNumber);
    let dataToPost={
        "id": sectionId,
        "user_created": loggedInUserId,
        "module": moduleId,
        "name": sectionName,
        "order_number": sectionOrderNumber,
        "activity_status": "active"
    };
    let dataToPostJson=JSON.stringify(dataToPost);
    try {

        response = await fetch(`${appAddress}/items/Sections`, {
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
    // console.log(response.statusText);
    if (errorOccured || responseNotOkayFound) return false;
    return true;
}
async function addElementsToSection(elementsDictionary, newSectionId){
    let errorContainer=id("add-section-form-errors");
    let errorOccured=false;
    for(let key in elementsDictionary){
        let element=elementsDictionary[key];
        let elementType=element["type"];
        let resultOfAdditionFile=true;
        let resultOfAdditionText=true;

        if(elementType=="text"){
            resultOfAdditionText=await addTextElementManager(element, newSectionId);
        }
        else if(elementType=="file"){
            resultOfAdditionFile=await addFileElementManager(element, newSectionId);
        }
        if(resultOfAdditionFile==false) {
            let textNodeToDisplayErrorAtAddingFile=document.createTextNode(`Wystąpił problem przy dodawaniu pliku o nazwie: ${element.name}`);
            errorOccured=true;
            errorContainer.appendChild(textNodeToDisplayErrorAtAddingFile);
        }
        if(resultOfAdditionText==false) {
            let textNodeToDisplayErrorAtAddingText=document.createTextNode(`Wystąpił problem przy dodawaniu tekstu o początkowej treści: ${element.value.substring(20)}...`);
            errorOccured=true;
            errorContainer.appendChild(textNodeToDisplayErrorAtAddingText);
        }
    }
    return errorOccured;
}
async function addTextElementManager(element, sectionId, userCreated=localStorage.getItem("loggedInUserId")){
    //DODAC ID UZYTKOWNIKA!!!
    let valuesToAddTextElement={
        "order_number": element["order_number"],
        "content": element["value"],
        "user_created": userCreated,
        "section": sectionId
    }
    let valuesJson=JSON.stringify(valuesToAddTextElement);
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    try {

        response = await fetch(`${appAddress}/items/Text_elements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`
            },
            body: valuesJson
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


function getOrderNumbersAndValuesFromInputs(allFilesDivs, allTextsDivs) {
    let allOrderNumbersAndInputValues = [];
    allFilesDivs.forEach(function (div) {
        let children = div.children;
        let selectsChildren = [...children].filter((element) => element.tagName == "SELECT");
        let fileInputChildren = [...children].filter((element) => element.tagName == "INPUT");
        // console.log(selectsChildren);
        // console.log(fileInputChildren);
        let filesData={};
        if(fileInputChildren[0].files.length==1){
            filesData["order_number"]=selectsChildren[0].value;
            filesData["value"]=fileInputChildren[0].files[0];
            filesData["file_name"]=fileInputChildren[0].files[0].name;
            filesData["type"]="file";
            allOrderNumbersAndInputValues.push(filesData);
        }
        
    });
    allTextsDivs.forEach(function (div) {
        let children = div.children;
        let selectsChildren = [...children].filter((element) => element.tagName == "SELECT");
        let textInputChildren = [...children].filter((element) => element.tagName == "TEXTAREA");
        let textData={};
        if(textInputChildren[0].value!=''){
            textData["order_number"]=selectsChildren[0].value;
            textData["value"]=textInputChildren[0].value;
            textData["type"]="text";
            allOrderNumbersAndInputValues.push(textData);
        }
        
    });
    return allOrderNumbersAndInputValues;
}
function validateSelects(allFilesDivs, allTextsDivs) {
    // let f = [...elementsToLookFor].map(element => Number(String(element.id).match(/\d+/g)));
    let allSelectsValues = [];
    allFilesDivs.forEach(function (div) {
        let children = div.children;
        let selectsChildren = [...children].filter((element) => element.tagName == "SELECT");
        let selectsValues = [...selectsChildren].map(child => Number(child.value));
        allSelectsValues.push.apply(allSelectsValues, selectsValues);
    });
    allTextsDivs.forEach(function (div) {
        let children = div.children;
        let selectsChildren = [...children].filter((element) => element.tagName == "SELECT");
        let selectsValues = [...selectsChildren].map(child => Number(child.value));
        allSelectsValues.push.apply(allSelectsValues, selectsValues);
    });
    let selectedOptionsOccurMoreThanOnce = checkIfElementOccursInArrayMoreThanOnce(allSelectsValues);
    let zeroOccursInSelectsOrder=checkIfZeroOccursInArray(allSelectsValues);
    if(zeroOccursInSelectsOrder) console.log("NIENUMERY")

    if(selectedOptionsOccurMoreThanOnce || zeroOccursInSelectsOrder) return false;
    return true;
}
function checkIfZeroOccursInArray(array){
    for(let i=0; i<array.length; i++){
        console.log(array[i]);
        if(array[i]==0) {console.log("trafiony!");
        return true;}
    }
}
async function getLastSectionAssignedToThisModuleIdOrOrderNumber(moduleId, valueToLookFor) {
    let sectionsAssignedToThisModule = await getSectionsAssignedToTheModule(moduleId);
    let maxNumber = 0;
    for (let i = 0; i < sectionsAssignedToThisModule.length; i++) {
        console.log(sectionsAssignedToThisModule[i]);
        if (Number(sectionsAssignedToThisModule[i][valueToLookFor]) > maxNumber) {
            maxNumber = Number(sectionsAssignedToThisModule[i][valueToLookFor]);
        }
    }
    return maxNumber;

}
async function getLastSectionId(){
    let allSections=await getAllSections();
    if(!allSections.ok) return -1;
    let allSectionsJson=await allSections.json();
    let allSectionsData=allSectionsJson.data;
    let maxNumber = 0;
    for (let i = 0; i < allSectionsData.length; i++) {
        if (Number(allSectionsData[i]["id"]) > maxNumber) {
            maxNumber = Number(allSectionsData[i]["id"]);
        }
    }
    return maxNumber;

}
async function getParticularModuleData(moduleId) {
    let response;
    let errorOccured = false;
    let responseNotOkayFound = false;
    try {

        response = await fetch(`${appAddress}/items/Modules/${moduleId}`, {
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