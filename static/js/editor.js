import {state, clearState} from './state.js';
import {handleImageUpload} from "./handleImageManager.js";
import {addTrait, addAnswer, addQuestion, removeElement} from "./componentsManager.js";
import {showError} from "./showErrorManager.js";
import {clearDraft, loadDraft} from "./draftManager.js";
import {scheduleAutoSave} from "./autoSaveManager.js";
import {runTest} from "./runTestManager.js";
import {parsingTestToLoad, parsingTestToSafe} from "./testParsing.js";
import {DRAFT_KEY} from "./constants.js";

clearState();
window.addTrait = addTrait;
window.addQuestion = addQuestion;
window.saveTest = saveTest;
window.clearDraft = clearDraft;
window.addAnswer = addAnswer;
window.removeElement = removeElement;
window.runTest = runTest;

document.getElementById('mainImage').addEventListener('change', function (e) {
    handleImageUpload(e.target);
});


document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    state.testId = urlParams.get('testId');
    state.editKey = urlParams.get('editKey');
    if (!state.testId || !state.editKey) {
        showError('Не указан ID теста или ключ редактирования в URL');
        return;
    }
    
    const loaded = loadDraft();
    if (!loaded) {
        try {
            const response = await fetch(`/get-test-to-edit?testId=${state.testId}&editKey=${state.editKey}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка загрузки теста');
            }

            const testData = await response.json();
            parsingTestToLoad(testData.title, testData.image, testData.traits, testData.questions)
        } catch (error) {
            showError(error.message);
        }
    }

    document.getElementById('testTitle').addEventListener('input', scheduleAutoSave);
    document.querySelector('#traits').addEventListener('input', scheduleAutoSave);
    document.querySelector('#questions').addEventListener('input', scheduleAutoSave);
});


function saveTest() {
    const errDiv = document.getElementById('error-messages');
    errDiv.innerHTML = '';
    errDiv.hidden = true;

    const testData = parsingTestToSafe();
    fetch(`/edit-test?testId=${state.testId}&editKey=${state.editKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
    })
        .then(response => {
            console.log(response)
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error)
                });
            }
            return response.json();
        })
        .then(data => {
            state.testId = data['id'];
            localStorage.removeItem(DRAFT_KEY);
            showError('Тест успешно обновлен!');
        })
        .catch(error => {
            showError('Ошибка сохранения: ' + error.message);
        });
}