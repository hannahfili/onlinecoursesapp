import * as exports from "./general-script.js";
Object.entries(exports).forEach(
	([name, exported]) => (window[name] = exported)
);
window.onload = async function () {
	// redirectToIndexIfUserIsNotLoggedInAdmin();
	await redirectToIndexIfUserIsNotLoggedInAtAll();
	await displayCourseExtensiveDetails();
};
async function displayCourseExtensiveDetails(
	courseId = localStorage.getItem("courseIdToShowDetails")
) {
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

	let pageTitle = id("courses-all-modules-sections-page-title");
	let errorContainer = id("courses-all-modules-sections-error-message");

	let mainMenuButton = id("courses-all-modules-sections-main-menu-button");
	mainMenuButton.addEventListener("click", function (e) {
		e.preventDefault();
		if (adminLoggedIn) window.location = "adminPanel.html";
		else if (teacherLoggedIn) window.location = "teacherPanel.html";
		else if (studentLoggedIn) window.location = "studentPanel.html";
	});

	let courseDetails = await getCourseDetails(courseId, errorContainer);
	if (courseDetails == null) return;

	let courseDetailsJson = await courseDetails.json();
	let course = courseDetailsJson.data;

	let courseTitle = course["name"];
	let courseTitleElement = document.createTextNode(`${courseTitle}`);
	pageTitle.appendChild(courseTitleElement);

	let modulesContainer = id("courses-all-modules-sections-courses-modules");
	let addModuleDiv = id("courses-all-modules-sections-add-module-div");

	let buttonToEditCourse = id("courses-all-modules-sections-edit-course");
	if (studentLoggedIn) buttonToEditCourse.style.visibility = "hidden";
	buttonToEditCourse.addEventListener("click", function (e) {
		e.preventDefault();
		localStorage.setItem("courseIdEdit", courseId);
		window.location = "editCourse.html";
	});

	let buttonToAddModule = id("courses-all-modules-sections-add-module");

	if (studentLoggedIn) buttonToAddModule.style.visibility = "hidden";
	buttonToAddModule.addEventListener("click", async function (e) {
		e.preventDefault();
		await addModuleManager(courseId, true, addModuleDiv);
	});
	await displayTeachers(course);
	let modulesToDisplay = await displayManyModules(course);

	if (!studentLoggedIn) {
		let buttonToSubmitOrderChange = document.createElement("button");
		buttonToSubmitOrderChange.setAttribute(
			"id",
			`course-all-modules-sections-button-to-submit-order-change`
		);
		buttonToSubmitOrderChange.textContent =
			"Zatwierdź zmianę kolejności modułów";
		if (modulesToDisplay == 1)
			modulesContainer.appendChild(buttonToSubmitOrderChange);

		buttonToSubmitOrderChange.addEventListener("click", async function (e) {
			e.preventDefault();
			let orderNumbersChangedCorrectly =
				await changeOrderNumbersToThoseFromSelects(modulesContainer);
			if (orderNumbersChangedCorrectly) {
				alert("Zapisano zmianę kolejności modułów");
				window.location.reload();
			} else {
			}
		});
	}
}
async function changeOrderNumbersToThoseFromSelects(mainContaner) {
	let changingOrderNumberErrorContainer = document.createElement("div");
	changingOrderNumberErrorContainer.setAttribute(
		"id",
		"course-all-modules-sections-changing-order-number-error-container"
	);
	changingOrderNumberErrorContainer.setAttribute("class", "error");
	mainContaner.appendChild(changingOrderNumberErrorContainer);

	let selectsElements = document.querySelectorAll(
		".course-all-modules-sections-module-order-selects"
	);
	let selectElementsIdAndOrderNumbers = [];
	[...selectsElements].forEach(function (select) {
		let selectData = {
			id: String(select.getAttribute("id")).substring(42),
			order_number: select.value,
		};
		selectElementsIdAndOrderNumbers.push(selectData);
	});
	console.log(selectElementsIdAndOrderNumbers);
	let selectsValues = [...selectsElements].map((select) =>
		Number(select.value)
	);

	let selectedValuesOccurMoreThanOnce =
		checkIfElementOccursInArrayMoreThanOnce(selectsValues);
	if (selectedValuesOccurMoreThanOnce) {
		changingOrderNumberErrorContainer.textContent =
			"Każdy element musi mieć niepowtarzalny numer porządkowy!";
		return false;
	}
	changingOrderNumberErrorContainer.textContent = "";
	let orderNumbersChangedCorrectly = await changleModulesOrderNumbers(
		selectElementsIdAndOrderNumbers
	);
	if (!orderNumbersChangedCorrectly)
		changingOrderNumberErrorContainer.textContent =
			"Błąd serwera. Nie zmieniono kolejności modułów lub zmieniono częściowo";
	return orderNumbersChangedCorrectly;
	console.log(selectsValues);
	console.log(selectsIds);
}
async function changleModulesOrderNumbers(selectsArrayOfDicts) {
	let errorInUpdateOccured = false;
	for (let i = 0; i < selectsArrayOfDicts.length; i++) {
		let updated = await editModule(
			selectsArrayOfDicts[i]["id"],
			"order_number",
			selectsArrayOfDicts[i]["order_number"]
		);
		if (!updated) errorInUpdateOccured = true;
	}
	if (errorInUpdateOccured) return false;
	return true;
}
async function displayTeachers(courseJsonData) {
	let divForDisplayingTeachers = id(
		"courses-all-modules-sections-courses-teachers"
	);
	let teachers = await getTeachersDataToDisplay(courseJsonData["teacher"]);
	for (let i in teachers) {
		let text = document.createTextNode(`${teachers[i]}`);
		divForDisplayingTeachers.appendChild(text);
		let comma = document.createTextNode(", ");
		// console.log(i);
		if (i != teachers.length - 1)
			divForDisplayingTeachers.appendChild(comma);
	}
}
async function changeOrderNumbers(modulesDictionary) {
	let orderNumbers = Object.keys(modulesDictionary).map((element) =>
		Number(element)
	);
	orderNumbers.sort(function (a, b) {
		return a > b ? 1 : -1;
	});
	let newOrderNumbers = [];
	let numbersAreNotInOrder = false;
	for (let i = 1; i < orderNumbers.length; i++) {
		if (orderNumbers[i - 1] != orderNumbers[i] - 1) {
			numbersAreNotInOrder = true;
			break;
		}
	}
	if (!numbersAreNotInOrder) return orderNumbers;

	for (let i = 1; i <= orderNumbers.length; i++) {
		newOrderNumbers.push(i);
	}
	let arrayOfModulesOrderNumbersAndIds = [];
	for (let key in modulesDictionary) {
		let data = {
			old_order_number: modulesDictionary[key]["order_number"],
			module_id: modulesDictionary[key]["id"],
		};
		arrayOfModulesOrderNumbersAndIds.push(data);
		console.log(data);
	}
	console.log(arrayOfModulesOrderNumbersAndIds);
	arrayOfModulesOrderNumbersAndIds.sort(function (a, b) {
		return a.old_order_number - b.old_order_number;
	});
	for (let i = 0; i < arrayOfModulesOrderNumbersAndIds.length; i++) {
		arrayOfModulesOrderNumbersAndIds[i]["new_order_number"] =
			newOrderNumbers[i];
		await editModule(
			arrayOfModulesOrderNumbersAndIds[i]["module_id"],
			"order_number",
			arrayOfModulesOrderNumbersAndIds[i]["new_order_number"]
		);
	}
	window.location.reload();

	return newOrderNumbers;
}
async function displayManyModules(course) {
	let modulesContainer = id("courses-all-modules-sections-courses-modules");
	let containerForError = id("courses-all-modules-sections-error-message");
	let courseId = course["id"];
	let modulesAssignedToThisCourse = await getModulesAssignedToThisCourse(
		courseId
	);
	let newOrderNumbers = await changeOrderNumbers(modulesAssignedToThisCourse);
	// console.log(newOrderNumbers);

	// console.log(newOrderNumbers);
	if (modulesAssignedToThisCourse == null) {
		containerForError.textContent = "Wystąpił problem z ładowaniem modułów";
		return -1;
	} else if (Object.keys(modulesAssignedToThisCourse).length == 0) {
		let info = document.createTextNode("Nie dodano jeszcze żadnego modułu");
		modulesContainer.appendChild(info);
		return 0;
	}
	for (let key in modulesAssignedToThisCourse) {
		// console.log(modulesAssignedToThisCourse[key]);
		await displayOneModule(
			modulesAssignedToThisCourse[key],
			modulesContainer,
			newOrderNumbers
		);
	}
	return 1;
}
async function displayOneModule(
	moduleDict,
	allModulesContainer,
	newOrderNumbers
) {
	let adminLoggedIn = false;
	let teacherLoggedIn = false;
	let studentLoggedIn = false;
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

	let mainContainerForModule = document.createElement("div");
	mainContainerForModule.setAttribute(
		"id",
		`course-all-modules-sections-module-${moduleDict["id"]}`
	);
	mainContainerForModule.setAttribute(
		"class",
		`course-all-modules-sections-modules-main-containers`
	);
	mainContainerForModule.style.backgroundColor = "skyblue";
	mainContainerForModule.style.width = "100%";
	mainContainerForModule.style.margin = "2em";

	if (!studentLoggedIn) {
		let selectOrderWithDefaultOrderValueFromDb =
			document.createElement("select");
		selectOrderWithDefaultOrderValueFromDb.setAttribute(
			"id",
			`course-all-modules-sections-module-select-${moduleDict["id"]}`
		);
		selectOrderWithDefaultOrderValueFromDb.setAttribute(
			"class",
			`course-all-modules-sections-module-order-selects`
		);

		let option;
		for (let i = 0; i < newOrderNumbers.length; i++) {
			option = document.createElement("option");
			option.setAttribute(
				"id",
				`course-all-modules-sections-module-select-${moduleDict["id"]}-option-${newOrderNumbers[i]}`
			);
			option.setAttribute("value", newOrderNumbers[i]);
			if (option.value == moduleDict["order_number"]) {
				option.setAttribute("selected", "selected");
			}
			option.textContent = newOrderNumbers[i];
			selectOrderWithDefaultOrderValueFromDb.appendChild(option);
		}

		mainContainerForModule.appendChild(
			selectOrderWithDefaultOrderValueFromDb
		);
	}

	let nameTextNode = document.createTextNode("Nazwa modułu:");
	mainContainerForModule.appendChild(nameTextNode);

	let moduleNameElement = document.createElement("div");
	moduleNameElement.setAttribute(
		"id",
		`course-all-modules-sections-module-${moduleDict["id"]}-name`
	);
	moduleNameElement.textContent = moduleDict["name"];
	mainContainerForModule.appendChild(moduleNameElement);

	let descriptionTextNode = document.createTextNode("Opis:");
	mainContainerForModule.appendChild(descriptionTextNode);

	let moduleDescriptionElement = document.createElement("div");
	moduleDescriptionElement.setAttribute(
		"id",
		`course-all-modules-sections-module-${moduleDict["id"]}-description`
	);
	moduleDescriptionElement.textContent =
		moduleDict["description"] != ""
			? moduleDict["description"]
			: "brak opisu";

	mainContainerForModule.appendChild(moduleDescriptionElement);

	if (!studentLoggedIn) {
		let divForButtonToChangeModuleNameOrDescription =
			document.createElement("div");
		divForButtonToChangeModuleNameOrDescription.setAttribute(
			"id",
			`course-all-modules-sections-module-${moduleDict["id"]}-div-for-button`
		);

		let buttonToChangeModuleNameOrDescription =
			document.createElement("button");
		buttonToChangeModuleNameOrDescription.setAttribute(
			"id",
			`course-all-modules-sections-button-to-edit-module-${moduleDict["id"]}`
		);
		buttonToChangeModuleNameOrDescription.textContent =
			"Zmień nazwę lub opis modułu";
		buttonToChangeModuleNameOrDescription.style.margin = "1em";
		buttonToChangeModuleNameOrDescription.style.borderRadius = "5px";
		buttonToChangeModuleNameOrDescription.style.padding = ".3em";
		buttonToChangeModuleNameOrDescription.style.color = "white";
		buttonToChangeModuleNameOrDescription.style.border = "none";
		buttonToChangeModuleNameOrDescription.style.backgroundColor =
			"DodgerBlue";
		divForButtonToChangeModuleNameOrDescription.appendChild(
			buttonToChangeModuleNameOrDescription
		);
		mainContainerForModule.appendChild(
			divForButtonToChangeModuleNameOrDescription
		);

		let buttonToAddSectionToModule = document.createElement("button");
		buttonToAddSectionToModule.setAttribute(
			"id",
			`course-all-modules-sections-button-to-add-section-to-module-number-${moduleDict["id"]}`
		);
		buttonToAddSectionToModule.textContent = "Dodaj sekcję do modułu";
		buttonToAddSectionToModule.addEventListener("click", function (e) {
			e.preventDefault();
			localStorage.setItem("moduleIdToAddSectionTo", moduleDict["id"]);
			window.location = "add-section.html";
		});
		buttonToAddSectionToModule.style.margin = "1em";
		buttonToAddSectionToModule.style.borderRadius = "5px";
		buttonToAddSectionToModule.style.padding = ".3em";
		buttonToAddSectionToModule.style.color = "white";
		buttonToAddSectionToModule.style.border = "none";
		buttonToAddSectionToModule.style.backgroundColor = "DodgerBlue";

		mainContainerForModule.appendChild(buttonToAddSectionToModule);

		let buttonToDeleteModule = document.createElement("button");
		buttonToDeleteModule.setAttribute(
			"id",
			`course-all-modules-sections-button-to-delete-module-${moduleDict["id"]}`
		);
		buttonToDeleteModule.setAttribute(
			"class",
			"course-all-modules-sections-button-to-delete-modules btn btn-danger"
		);
		buttonToDeleteModule.textContent = "X Usuń moduł";
		buttonToDeleteModule.addEventListener("click", async function (e) {
			e.preventDefault();
			let confirmed = confirm("Czy na pewno chcesz usunąć ten moduł?");
			if (confirmed) {
				let deleted = await deleteModule(moduleDict.id);
				if (deleted) {
					alert("Pomyślnie usunięto moduł");
					window.location.reload();
				} else {
					alert("BŁĄD SERWERA! Nie udało się usunąć modułu");
				}
			}
		});

		mainContainerForModule.appendChild(buttonToDeleteModule);

		let editModuleErrorContainer = document.createElement("div");
		editModuleErrorContainer.setAttribute(
			"id",
			`course-all-modules-sections-module-${moduleDict["id"]}-error-container`
		);
		editModuleErrorContainer.setAttribute("class", `error`);
		mainContainerForModule.appendChild(editModuleErrorContainer);

		buttonToChangeModuleNameOrDescription.addEventListener(
			"click",
			async function (e) {
				e.preventDefault();
				let editModuleDiv = id(
					`course-all-modules-sections-module-${moduleDict["id"]}-edit-div`
				);
				if (!editModuleDiv) {
					await editModuleManager(
						moduleDict,
						divForButtonToChangeModuleNameOrDescription
					);
				}
			}
		);
	}

	let displaySections = await displayModuleSections(
		moduleDict["id"],
		mainContainerForModule,
		studentLoggedIn
	);

	allModulesContainer.appendChild(mainContainerForModule);
}
async function deleteModule(moduleId) {
	let response;
	let responseNotOkayFound = false;
	let errorOccured = false;
	try {
		response = await fetch(`${appAddress}/items/Modules/${moduleId}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("access_token")}`,
			},
		});
		if (!response.ok) responseNotOkayFound = true;
	} catch (err) {
		console.error(`${err}`);
		errorOccured = true;
	}
	if (responseNotOkayFound || errorOccured) return false;
	return true;
}
async function displayModuleSections(
	moduleId,
	mainContainerForModule,
	studentLoggedIn
) {
	let errorContainerForDisplayingSections = document.createElement("div");
	errorContainerForDisplayingSections.setAttribute(
		"id",
		`course-all-modules-sections-module-${moduleId}-sections-display-error-div`
	);
	errorContainerForDisplayingSections.setAttribute("class", "error");
	mainContainerForModule.appendChild(errorContainerForDisplayingSections);

	let sectionsAssignedToThisModule = await getSectionsAssignedToTheModule(
		moduleId,
		errorContainerForDisplayingSections
	);

	console.log("MODULE: ", moduleId);
	console.log(sectionsAssignedToThisModule);
	let containerForAllModuleSections = document.createElement("div");
	containerForAllModuleSections.setAttribute(
		"id",
		`course-all-modules-sections-module-${moduleId}-all-sections-div`
	);
	containerForAllModuleSections.setAttribute(
		"class",
		"course-all-modules-sections-modules-all-sections-div"
	);
	for (let i = 0; i < sectionsAssignedToThisModule.length; i++) {
		await displaySectionElements(
			sectionsAssignedToThisModule[i],
			errorContainerForDisplayingSections,
			containerForAllModuleSections,
			studentLoggedIn
		);
	}
	mainContainerForModule.appendChild(containerForAllModuleSections);
	return true;
}
function getLastElementOrderNumber(elementsAssignedToThisSection) {
	let maxNumber = 0;
	for (let i = 0; i < elementsAssignedToThisSection.length; i++) {
		console.log(
			"order number: ",
			elementsAssignedToThisSection[i]["order_number"]
		);
		if (
			Number(elementsAssignedToThisSection[i]["order_number"]) > maxNumber
		) {
			maxNumber = Number(
				elementsAssignedToThisSection[i]["order_number"]
			);
		}
	}
	return maxNumber;
}
async function displaySectionElements(
	sectionDict,
	errorContainerForDisplayingSections,
	allSectionsDiv,
	studentLoggedIn
) {
	let elementsAssignedToThisSection = await getElementsAssignedToThisSection(
		sectionDict["id"],
		errorContainerForDisplayingSections
	);
	elementsAssignedToThisSection.sort(function (a, b) {
		return a["order_number"] > b["order_number"] ? 1 : -1;
	});
	let lastElementOrderNumber = getLastElementOrderNumber(
		elementsAssignedToThisSection
	);
	let newElementOrderNumber = lastElementOrderNumber + 1;
	// console.log(lastElementOrderNumber);
	let sectionMainContainer = document.createElement("div");
	sectionMainContainer.setAttribute(
		"id",
		`course-all-modules-sections-section-${sectionDict["id"]}-main-container`
	);
	sectionMainContainer.setAttribute(
		"class",
		`course-all-modules-sections-section-main-containers`
	);

	let sectionNameElement = document.createElement("div");
	sectionNameElement.setAttribute(
		"id",
		`course-all-modules-sections-section-${sectionDict["id"]}-name-div`
	);
	sectionNameElement.setAttribute(
		"class",
		`course-all-modules-sections-section-name-divs`
	);
	sectionNameElement.textContent = `Nazwa sekcji: ${sectionDict["name"]}`;
	sectionMainContainer.appendChild(sectionNameElement);

	if (!studentLoggedIn) {
		let deleteSectionButton = document.createElement("button");
		deleteSectionButton.setAttribute(
			"id",
			`course-all-modules-sections-section-${sectionDict["id"]}-button-to-delete-section`
		);
		deleteSectionButton.setAttribute(
			"class",
			`course-all-modules-sections-section-buttons-to-delete-section btn btn-danger`
		);
		deleteSectionButton.textContent = "X usuń sekcję";
		sectionMainContainer.appendChild(deleteSectionButton);
		deleteSectionButton.addEventListener("click", async function (e) {
			e.preventDefault();
			let confirmed = window.confirm(
				`Czy na pewno chcesz usunąć sekcję ${sectionDict["name"]}?`
			);
			if (confirmed) {
				let elementDeletedCorrectly = await deleteSection(
					sectionDict["id"]
				);
				if (elementDeletedCorrectly) {
					alert("Usunięto sekcje");
					window.location.reload();
				} else alert("BŁĄD! Nie udało się usunąć sekcji");
			}
		});

		let divForInputs = document.createElement("div");
		divForInputs.setAttribute(
			"id",
			`course-all-modules-sections-section-${sectionDict["id"]}-div-for-inputs`
		);
		divForInputs.setAttribute(
			"class",
			`course-all-modules-sections-section-divs-for-inputs`
		);
		sectionMainContainer.appendChild(divForInputs);

		let addSectionTextElementButton = document.createElement("button");
		addSectionTextElementButton.setAttribute(
			"id",
			`course-all-modules-sections-section-${sectionDict["id"]}-button-to-add-text-element`
		);
		addSectionTextElementButton.setAttribute(
			"class",
			`course-all-modules-sections-section-buttons-to-add-text-elements`
		);
		addSectionTextElementButton.textContent = "Dodaj tekst";
		sectionMainContainer.appendChild(addSectionTextElementButton);
		addSectionTextElementButton.addEventListener(
			"click",
			async function (e) {
				e.preventDefault();
				let inputTextPlace = id(
					"course-all-modules-sections-add-text-element-input"
				);
				if (!inputTextPlace) {
					await addTextElementToSection(
						sectionDict["id"],
						divForInputs,
						newElementOrderNumber
					);
				}
			}
		);
		let addSectionFileElementButton = document.createElement("button");
		addSectionFileElementButton.setAttribute(
			"id",
			`course-all-modules-sections-section-${sectionDict["id"]}-button-to-add-file-element`
		);
		addSectionFileElementButton.setAttribute(
			"class",
			`course-all-modules-sections-section-buttons-to-add-file-elements`
		);
		addSectionFileElementButton.textContent = "Dodaj plik";
		sectionMainContainer.appendChild(addSectionFileElementButton);
		addSectionFileElementButton.addEventListener(
			"click",
			async function (e) {
				e.preventDefault();
				let inputFilePlace = id(
					"course-all-modules-sections-add-file-element-input"
				);
				if (!inputFilePlace) {
					await addFileElementToSection(
						sectionDict["id"],
						divForInputs,
						newElementOrderNumber
					);
				}
			}
		);
	}
	// console.log(elementsAssignedToThisSection);
	for (let i = 0; i < elementsAssignedToThisSection.length; i++) {
		let element = elementsAssignedToThisSection[i];
		let elementType = element.hasOwnProperty("content") ? "text" : "file";

		let elementMainContainer = document.createElement("div");
		elementMainContainer.setAttribute(
			"id",
			`course-all-modules-sections-section-${element["section"]}-${elementType}-element-${element["id"]}-main-container`
		);
		elementMainContainer.setAttribute(
			"class",
			`course-all-modules-sections-section-elements-containers`
		);
		// elementMainContainer.textContent=element["id"]+elementType+element["section"];

		let elementContentDiv = document.createElement("div");
		elementContentDiv.setAttribute(
			"id",
			`course-all-modules-sections-section-${element["section"]}-${elementType}-element-${element["id"]}-content`
		);
		elementContentDiv.setAttribute(
			"class",
			`course-all-modules-sections-section-elements-content`
		);
		elementMainContainer.appendChild(elementContentDiv);

		await displayElementBasedOnItsType(element, elementContentDiv);
		if (elementType == "file") {
			let aHrefToDownloadFile = document.createElement("a");
			aHrefToDownloadFile.setAttribute(
				"id",
				`course-all-modules-sections-section-${element["section"]}-${elementType}-element-${element["id"]}-button-to-download`
			);
			aHrefToDownloadFile.setAttribute(
				"class",
				`course-all-modules-sections-section-elements-download-file btn btn-warning`
			);
			aHrefToDownloadFile.setAttribute(
				"href",
				`${appAddress}/assets/${element["file"]}?download`
			);
			aHrefToDownloadFile.setAttribute("target", `_blank`);
			aHrefToDownloadFile.textContent = "Pobierz plik";
			elementMainContainer.appendChild(aHrefToDownloadFile);
		}

		if (!studentLoggedIn) {
			let buttonToDeleteSectionElement = document.createElement("button");
			buttonToDeleteSectionElement.setAttribute(
				"id",
				`course-all-modules-sections-section-${element["section"]}-${elementType}-element-${element["id"]}-button-to-delete`
			);
			buttonToDeleteSectionElement.setAttribute(
				"class",
				`course-all-modules-sections-section-elements-delete-buttons btn btn-danger`
			);
			buttonToDeleteSectionElement.textContent = "X usuń element";
			buttonToDeleteSectionElement.addEventListener(
				"click",
				async function (e) {
					e.preventDefault();
					let confirmed = window.confirm(
						`Czy na pewno chcesz usunąć ten element?`
					);
					if (confirmed) {
						let elementDeletedCorrectly =
							await deleteSectionElementManager(
								element["id"],
								elementType
							);
						if (elementDeletedCorrectly) {
							alert("Usunięto element");
							window.location.reload();
						} else alert("Nie udało się usunąć elementu");
					}
				}
			);

			elementMainContainer.appendChild(buttonToDeleteSectionElement);
		}

		sectionMainContainer.appendChild(elementMainContainer);
	}
	allSectionsDiv.appendChild(sectionMainContainer);
}
async function downloadFile(fileId) {
	let response;
	let errorOccured = false;
	let responseNotOkayFound = false;
	try {
		response = await fetch(`${appAddress}/items/Text_elements/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("access_token")}`,
			},
			body: dataToPostJson,
		});
		if (!response.ok) responseNotOkayFound = true;
	} catch (err) {
		console.error(`${err}`);
		errorOccured = true;
	}
	if (errorOccured || responseNotOkayFound) return false;
	return true;
}
async function addTextElementToSection(
	sectionId,
	containerDivForInput,
	orderNumberForNewElement
) {
	let divForInputPlace = document.createElement("div");
	divForInputPlace.setAttribute(
		"id",
		`course-all-modules-sections-add-text-element-div-for-input`
	);
	divForInputPlace.setAttribute(
		"class",
		"course-all-modules-sections-add-text-element-divs-for-inputs"
	);
	containerDivForInput.appendChild(divForInputPlace);

	let inputTextPlace = document.createElement("textarea");
	inputTextPlace.setAttribute("required", "");
	inputTextPlace.setAttribute("placeholder", "Element tekstowy...");
	inputTextPlace.setAttribute(
		"id",
		`course-all-modules-sections-add-text-element-input`
	);
	inputTextPlace.setAttribute(
		"class",
		"course-all-modules-sections-add-text-element-inputs"
	);
	divForInputPlace.appendChild(inputTextPlace);

	let buttonToSaveText = document.createElement("button");
	buttonToSaveText.setAttribute(
		"id",
		"course-all-modules-sections-add-text-element-submit-button"
	);
	buttonToSaveText.setAttribute("class", "btn btn-success");
	buttonToSaveText.textContent = "Zapisz element";
	divForInputPlace.appendChild(buttonToSaveText);

	buttonToSaveText.addEventListener("click", async function (e) {
		e.preventDefault();
		let textAddedCorrectly = await addTextElementToDatabase(
			sectionId,
			orderNumberForNewElement,
			inputTextPlace.value
		);
		if (textAddedCorrectly) {
			alert("Pomyślnie dodano tekst");
			document.location.reload();
		} else {
			alert("Nie udało się dodać tekstu");
		}
	});

	let buttonToRemoveInputPlace = document.createElement("button");
	buttonToRemoveInputPlace.setAttribute(
		"id",
		"course-all-modules-sections-add-text-element-remove-input-place-button"
	);
	buttonToRemoveInputPlace.setAttribute("class", "btn btn-danger");
	buttonToRemoveInputPlace.textContent = "X";
	divForInputPlace.appendChild(buttonToRemoveInputPlace);

	buttonToRemoveInputPlace.addEventListener("click", function (e) {
		e.preventDefault();
		buttonToRemoveInputPlace.parentElement.remove();
	});
}
async function addTextElementToDatabase(
	sectionId,
	orderNumberForNewElement,
	textInput
) {
	let dataToPost = {
		section: sectionId,
		order_number: orderNumberForNewElement,
		content: textInput,
		user_created: localStorage.getItem("loggedInUserId"),
	};
	let dataToPostJson = JSON.stringify(dataToPost);

	let response;
	let errorOccured = false;
	let responseNotOkayFound = false;
	try {
		response = await fetch(`${appAddress}/items/Text_elements/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("access_token")}`,
			},
			body: dataToPostJson,
		});
		if (!response.ok) responseNotOkayFound = true;
	} catch (err) {
		console.error(`${err}`);
		errorOccured = true;
	}
	if (errorOccured || responseNotOkayFound) return false;
	return true;
}
async function addFileElementToSection(
	sectionId,
	containerDivForInput,
	orderNumberForNewElement
) {
	let divForInputPlace = document.createElement("div");
	divForInputPlace.setAttribute(
		"id",
		`course-all-modules-sections-add-file-element-div-for-input`
	);
	divForInputPlace.setAttribute(
		"class",
		"course-all-modules-sections-add-file-element-divs-for-inputs"
	);
	containerDivForInput.appendChild(divForInputPlace);

	let inputFilePlace = document.createElement("input");
	inputFilePlace.setAttribute(
		"id",
		`course-all-modules-sections-add-file-element-input`
	);
	inputFilePlace.setAttribute("type", "file");
	inputFilePlace.setAttribute(
		"class",
		"course-all-modules-sections-add-file-element-inputs"
	);
	divForInputPlace.appendChild(inputFilePlace);

	let buttonToSaveFile = document.createElement("button");
	buttonToSaveFile.setAttribute(
		"id",
		"course-all-modules-sections-add-file-element-submit-button"
	);
	buttonToSaveFile.setAttribute("class", "btn btn-success");
	buttonToSaveFile.textContent = "Zapisz plik";
	divForInputPlace.appendChild(buttonToSaveFile);

	buttonToSaveFile.addEventListener("click", async function (e) {
		e.preventDefault();
		let fileData = {
			value: inputFilePlace.files[0],
			order_number: orderNumberForNewElement,
			file_name: inputFilePlace.files[0].name,
		};
		let fileAddedCorrectly = await addFileElementManager(
			fileData,
			sectionId
		);
		if (fileAddedCorrectly) {
			alert("Pomyślnie dodano plik");
			document.location.reload();
		} else {
			alert("Nie udało się dodać pliku");
		}
	});

	let buttonToRemoveInputPlace = document.createElement("button");
	buttonToRemoveInputPlace.setAttribute(
		"id",
		"course-all-modules-sections-add-file-element-remove-input-place-button"
	);
	buttonToRemoveInputPlace.setAttribute("class", "btn btn-danger");
	buttonToRemoveInputPlace.textContent = "X";
	divForInputPlace.appendChild(buttonToRemoveInputPlace);

	buttonToRemoveInputPlace.addEventListener("click", function (e) {
		e.preventDefault();
		buttonToRemoveInputPlace.parentElement.remove();
	});
}
async function deleteSection(sectionId) {
	let response;
	let errorOccured = false;
	let responseNotOkayFound = false;
	try {
		response = await fetch(`${appAddress}/items/Sections/${sectionId}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("access_token")}`,
			},
		});
		if (!response.ok) responseNotOkayFound = true;
	} catch (err) {
		console.error(`${err}`);
		errorOccured = true;
	}
	if (errorOccured || responseNotOkayFound) return false;
	return true;
}
async function deleteSectionElementManager(elementId, elementType) {
	let collectionName = "";
	if (elementType == "text") collectionName = "Text_elements";
	else collectionName = "File_elements";

	let response;
	let errorOccured = false;
	let responseNotOkayFound = false;
	try {
		response = await fetch(
			`${appAddress}/items/${collectionName}/${elementId}`,
			{
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem(
						"access_token"
					)}`,
				},
			}
		);
		if (!response.ok) responseNotOkayFound = true;
	} catch (err) {
		console.error(`${err}`);
		errorOccured = true;
	}
	if (errorOccured || responseNotOkayFound) return false;
	return true;
}

async function displayElementBasedOnItsType(element, elementContentDiv) {
	console.log(element);

	if (element["content"]) {
		elementContentDiv.textContent = element["content"];
		return;
	}
	let contentNameDiv = document.createElement("div");
	contentNameDiv.setAttribute(
		"id",
		`course-all-modules-sections-section-${element["section"]}-element-${element["id"]}-content-name-div`
	);
	contentNameDiv.setAttribute(
		"class",
		`course-all-modules-sections-section-elements-content-name-divs`
	);

	let fileInfo = await getFileInfo(element["file"]);

	console.log(fileInfo);
	let imgElement = document.createElement("img");
	if (String(fileInfo["type"]).substring(0, 5) == "image") {
		imgElement.setAttribute(
			"src",
			`${appAddress}/assets/${element["file"]}?key=actual-size`
		);
		elementContentDiv.appendChild(imgElement);
	} else {
		setImgSourceBasedOnFileTypeAndAddItToProperContainer(
			imgElement,
			fileInfo["type"],
			elementContentDiv
		);
	}
	contentNameDiv.textContent = fileInfo["filename_download"];
	elementContentDiv.appendChild(contentNameDiv);

	// <img src='https://3qyn4234.directus.app/assets/3c875c57-ee55-4496-8f8b-f25fbf615dfb?key=actual-size'></img>

	//pobierz info o pliku z /files
	// sprawdź typ pliku
	// jeżeli typ pliku zaczyna się od "image" - weź thumbnail pliku
	// jeżeli nie to wyświetl odpowiednią ikonkę zależną od typu pliku
	// zrób przycisk "pobierz plik"
}
function setImgSourceBasedOnFileTypeAndAddItToProperContainer(
	imgElement,
	fileType,
	elementContentDiv
) {
	let iconSource = "";
	switch (fileType) {
		case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": //pliki docx
			iconSource = "95a56f70-b9b1-4246-a9ed-ab101cebaefc";

			break;
		case "audio/wav":
			iconSource = "245259ac-f488-4a2b-a667-4a8fb0c05671";
			break;
		case "text/csv":
			iconSource = "f285ed11-5d46-4e55-aae8-689a5a6881c1";
			break;
		case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": //pliki excel
			iconSource = "eacc702d-9b83-42c9-a8c9-156b5e053faf";
			break;
		case "audio/mpeg": //pliki mp3
			iconSource = "d3b79c9e-7b05-45ef-ae4f-cf24870465dd";
			break;
		case "text/plain": //pliki txt
			iconSource = "640e9248-2ba6-4577-a2cb-ad2a22665829";
			break;
		case "application/pdf": //pliki pdf
			iconSource = "1509b86c-40a1-44f4-9d1a-8f33193ea428";
			break;
		case "application/vnd.openxmlformats-officedocument.presentationml.presentation": //pliki pptx
			iconSource = "87643c74-4a1c-49fe-a07f-9b344a1ac24e";
			break;
		default: //inne
			iconSource = "e0ab86b9-c4d9-4ffc-bad5-d3a845ce3991";
			break;
	}
	imgElement.setAttribute(
		"src",
		`${appAddress}/assets/${iconSource}?key=icon-size`
	);
	imgElement.setAttribute("width", `128`);
	imgElement.setAttribute("height", `128`);
	elementContentDiv.appendChild(imgElement);
}
async function getFileInfo(fileId) {
	let response;
	let errorOccured = false;
	let responseNotOkayFound = false;
	try {
		response = await fetch(`${appAddress}/files/${fileId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("access_token")}`,
			},
		});
		if (!response.ok) responseNotOkayFound = true;
	} catch (err) {
		console.error(`${err}`);
		errorOccured = true;
	}
	// console.log(response.statusText);
	if (errorOccured || responseNotOkayFound) return null;
	let responseJson = await response.json();
	let data = responseJson.data;
	return data;
}
async function getElementsAssignedToThisSection(sectionId, containerForError) {
	// console.log(sectionId);
	let allFileElements = await getParticularElements("File_elements");
	let allTextElements = await getParticularElements("Text_elements");

	if (allFileElements == null || allTextElements == null) {
		containerForError.textContent =
			"Wystąpił problem z pobraniem elementów należących do modułu";
		return null;
	}
	let allFileElementsJson = await allFileElements.json();
	let fileData = allFileElementsJson.data;

	let allTextElementsJson = await allTextElements.json();
	let textData = allTextElementsJson.data;

	// console.log(allFileElementsJson);
	// console.log(fileData);
	// console.log(allTextElementsJson);
	// console.log(textData);

	if (fileData.length === 0 && textData.length === 0) return [];

	let elementsAssignedToThisSection = [];
	for (let i = 0; i < fileData.length; i++) {
		let item = fileData[i];
		// console.log(item);
		if (item["section"] == sectionId)
			elementsAssignedToThisSection.push(item);
	}
	for (let i = 0; i < textData.length; i++) {
		let item = textData[i];
		if (item["section"] == sectionId)
			elementsAssignedToThisSection.push(item);
	}
	// console.log(elementsAssignedToThisSection);

	return elementsAssignedToThisSection;
}
async function getParticularElements(whichElements) {
	let response;
	let errorOccured = false;
	let responseNotOkayFound = false;
	try {
		response = await fetch(`${appAddress}/items/${whichElements}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("access_token")}`,
			},
		});
		if (!response.ok) responseNotOkayFound = true;
	} catch (err) {
		console.error(`${err}`);
		errorOccured = true;
	}
	// console.log(response.statusText);
	if (errorOccured || responseNotOkayFound) return null;
	return response;
}
async function editModuleManager(moduleDict, mainContainerForModule) {
	let editModuleDiv = document.createElement("div");
	editModuleDiv.setAttribute(
		"id",
		`course-all-modules-sections-module-${moduleDict["id"]}-edit-div`
	);

	mainContainerForModule.appendChild(editModuleDiv);

	let labelForNameInput = document.createElement("label");
	labelForNameInput.setAttribute(
		"for",
		"course-all-modules-sections-module-name-input"
	);
	labelForNameInput.textContent = "Nazwa modułu";

	let moduleNameInput = document.createElement("input");
	moduleNameInput.setAttribute(
		"id",
		"course-all-modules-sections-module-name-input"
	);
	moduleNameInput.setAttribute("placeholder", `${moduleDict["name"]}`);

	let labelForDescriptionInput = document.createElement("label");
	labelForDescriptionInput.setAttribute(
		"for",
		"course-all-modules-sections-module-description-input"
	);
	labelForDescriptionInput.textContent = "Opis modułu";

	let moduleDescriptionInput = document.createElement("input");
	moduleDescriptionInput.setAttribute(
		"id",
		"course-all-modules-sections-module-description-input"
	);
	moduleDescriptionInput.setAttribute(
		"placeholder",
		`${String(moduleDict["description"]).substring(0, 25)}...`
	);

	let submitButton = document.createElement("button");
	submitButton.setAttribute(
		"id",
		"course-all-modules-sections-edit-module-submit-button"
	);
	submitButton.textContent = "Zapisz zmiany";

	let buttonDeteleOptionToEditModule = document.createElement("button");
	buttonDeteleOptionToEditModule.setAttribute(
		"id",
		"course-all-modules-sections-edit-module-button-detele-option-to-edit-module"
	);
	buttonDeteleOptionToEditModule.setAttribute("class", "btn btn-danger");
	buttonDeteleOptionToEditModule.textContent = "X";

	editModuleDiv.appendChild(labelForNameInput);
	editModuleDiv.appendChild(moduleNameInput);
	editModuleDiv.appendChild(labelForDescriptionInput);
	editModuleDiv.appendChild(moduleDescriptionInput);
	editModuleDiv.appendChild(submitButton);
	editModuleDiv.appendChild(buttonDeteleOptionToEditModule);

	buttonDeteleOptionToEditModule.addEventListener("click", function (e) {
		e.preventDefault();
		buttonDeteleOptionToEditModule.parentElement.remove();
	});

	submitButton.addEventListener("click", async function (e) {
		e.preventDefault();
		let moduleEdittedSuccessfully =
			await editModuleNameOrDesrciptionInDatabase(
				moduleDict["id"],
				moduleNameInput.value,
				moduleDescriptionInput.value,
				moduleDict
			);
		console.log(moduleEdittedSuccessfully);
		if (
			moduleEdittedSuccessfully["nameEditted"] == false ||
			moduleEdittedSuccessfully["descriptionEdited"] == false
		) {
			alert("Wystąpił błąd przy edycji modułu");
		} else {
			alert("Pomyślnie edytowano moduł");
			location.reload();
		}
	});
}
async function editModuleNameOrDesrciptionInDatabase(
	moduleId,
	newName,
	newDescription,
	moduleDict
) {
	let nameEdittedSuccessfully = null;
	let descriptionEdittedSuccessfully = null;
	if (newName != moduleDict["name"] && newName != "") {
		nameEdittedSuccessfully = await editModule(moduleId, "name", newName);
	}
	if (newDescription != moduleDict["description"] && newDescription != "") {
		descriptionEdittedSuccessfully = await editModule(
			moduleId,
			"description",
			newDescription
		);
	}
	return {
		nameEditted: nameEdittedSuccessfully,
		descriptionEdited: descriptionEdittedSuccessfully,
	};
}
async function editModule(moduleId, fieldName, fieldValue) {
	console.log(moduleId);
	console.log(fieldName);
	console.log(fieldValue);
	let response;
	let responseNotOkayFound = false;
	let errorOccured = false;
	try {
		response = await fetch(`${appAddress}/items/Modules/${moduleId}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("access_token")}`,
			},
			body: `{
                "${fieldName}": "${fieldValue}"
            }`,
		});
		if (!response.ok) responseNotOkayFound = true;
	} catch (err) {
		errorOccured = true;
		console.error(`${err}`);
	}
	if (responseNotOkayFound || errorOccured) return false;
	return true;
}
