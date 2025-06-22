import { state, clearState } from './state.js';
import { addRemoveButton } from "./closeImageManager.js";
import { handleImageUpload } from "./handleImageManager.js";
import { addTrait, addAnswer, addQuestion, removeElement } from "./componentsManager.js";
import { createMultiDropdown, updateButtonText } from "./multiDropDown.js";
import { showError } from "./showErrorManager.js";
import { updateTraitOptions } from "./traitOptionsManager.js";
import { clearDraft, loadDraft } from "./draftManager.js";
import { scheduleAutoSave } from "./autoSaveManager.js";
import {runTest} from "./runTestManager.js";

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

    try {
        const response = await fetch(`/get-test-to-edit?testId=${state.testId}&editKey=${state.editKey}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка загрузки теста');
        }

        const testData = await response.json();
        populateForm(testData);
    } catch (error) {
        showError(error.message);
    }
});

function populateForm(testData) {
    // Заполняем заголовок
    document.getElementById('testTitle').value = testData.title;

    // Основное изображение
    if (testData.image) {
        state.mainImageBase64 = testData.image;
        const container = document.getElementById('mainImage').closest('.image-upload');
        const preview = document.createElement('img');
        preview.className = 'image-preview';
        preview.src = testData.image;
        preview.style.display = 'block';

        const previewContainer = document.createElement('div');
        previewContainer.className = 'image-preview-container';
        previewContainer.appendChild(preview);
        container.appendChild(previewContainer);
        addRemoveButton(previewContainer, document.getElementById('mainImage'));
    }

    // Характеристики
    state.traitsList = testData.traits || [];
    const traitsDiv = document.getElementById('traits');
    traitsDiv.innerHTML = '';
    state.traitsList.forEach(traitName => {
        const newTrait = document.createElement('div');
        newTrait.className = 'trait';
        newTrait.innerHTML = `
            <input type="text" placeholder="Имя характеристики" 
                   class="trait-name form-input" value="${traitName}">
            <button class="btn btn-danger" onclick="removeElement(this)">
                <span>×</span> Удалить
            </button>`;
        traitsDiv.appendChild(newTrait);

        const inp = newTrait.querySelector('.trait-name');
        inp.addEventListener('input', () => {
            clearTimeout(inp.timeout);
            inp.timeout = setTimeout(updateTraitOptions, 300);
        });
    });

    // Вопросы
    const questionsDiv = document.getElementById('questions');
    questionsDiv.innerHTML = '';
    testData.questions.forEach(qData => {
        const newQ = document.createElement('div');
        newQ.className = 'question';
        newQ.innerHTML = `
            <div class="image-upload">
                <label class="file-upload">
                    <input type="file" class="question-image" accept="image/*">
                </label>
            </div>
            <input type="text" placeholder="Текст вопроса" 
                   class="question-text form-input" value="${qData.text}">
            <div class="answers"></div>
            <div class="answer-actions">
                <button class="btn btn-secondary" onclick="addAnswer(this)">
                    <span>+</span> Ответ
                </button>
                <button class="btn btn-danger" onclick="removeElement(this)">
                    <span>×</span> Удалить вопрос
                </button>
            </div>`;

        // Изображение вопроса
        if (qData.image) {
            const preview = document.createElement('img');
            preview.className = 'image-preview';
            preview.src = qData.image;
            preview.style.display = 'block';

            const previewContainer = document.createElement('div');
            previewContainer.className = 'image-preview-container';
            previewContainer.appendChild(preview);
            newQ.querySelector('.image-upload').appendChild(previewContainer);
            addRemoveButton(previewContainer, newQ.querySelector('.question-image'));
        }

        const answersDiv = newQ.querySelector('.answers');
        qData.answers.forEach(ansData => {
            const newAns = document.createElement('div');
            newAns.className = 'answer';
            newAns.innerHTML = `
                <input type="text" placeholder="Ответ" 
                       class="answer-text form-input" value="${ansData.text}">
                <div class="multi-dropdown answer-dropdown"></div>
                <button class="btn btn-danger" onclick="removeElement(this)">
                    <span>×</span> Удалить ответ
                </button>`;
            answersDiv.appendChild(newAns);

            // Инициализация дропдауна
            const ddContainer = newAns.querySelector('.answer-dropdown');
            createMultiDropdown(ddContainer);

            // Установка выбранных характеристик
            setTimeout(() => {
                const wrapper = ddContainer.querySelector('.multi-dropdown');
                if (wrapper) {
                    wrapper._selectedTags = ansData.traits;
                    wrapper._populateList();
                    updateButtonText(wrapper);
                }
            }, 100);
        });

        questionsDiv.appendChild(newQ);
    });
}


// Сохранение изменений
function saveTest() {
    const errDiv = document.getElementById('error-messages');
    errDiv.innerHTML = '';
    errDiv.hidden = true;

    const title = document.getElementById('testTitle').value;
    if (!title) return showError('Введите название теста!');
    if (state.traitsList.length < 2) return showError('Добавьте минимум 2 характеристики!');

    const questions = Array.from(document.querySelectorAll('.question'));
    if (!questions.length) return showError('Добавьте минимум 1 вопрос!');

    const testData = {
        title,
        image: state.mainImageBase64,
        traits: state.traitsList,
        questions: []
    };

    questions.forEach(qEl => {
        const qObj = {
            text: qEl.querySelector('.question-text').value,
            image: (qEl.querySelector('.image-preview')?.src || ''),
            answers: []
        };

        const answers = qEl.querySelectorAll('.answer');
        answers.forEach(ansEl => {
            const ansText = ansEl.querySelector('.answer-text').value;
            if (!ansText) return showError('Заполните все ответы!');

            const ddEl = ansEl.querySelector('.multi-dropdown');
            const chosen = Array.from(ddEl.querySelectorAll('.multi-dropdown__item.selected'))
                .map(it => it.getAttribute('data-value'));

            if (!chosen.length) return showError('Для всех ответов выберите хотя бы одну характеристику!');
            qObj.answers.push({text: ansText, traits: chosen});
        });

        testData.questions.push(qObj);
    });

    fetch(`/edit-test?testId=${state.testId}&editKey=${state.editKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error)
                });
            }
            return response.json();
        })
        .then(data => {
            showError('Тест успешно обновлен!');
            clearDraft();
        })
        .catch(error => {
            showError('Ошибка сохранения: ' + error.message);
        });
}


document.addEventListener('DOMContentLoaded', () => {
    const loaded = loadDraft();
    if (loaded) {
        console.log('Черновик восстановлен');
    }
    
    document.getElementById('testTitle').addEventListener('input', scheduleAutoSave);
    document.querySelector('#traits').addEventListener('input', scheduleAutoSave);
    document.querySelector('#questions').addEventListener('input', scheduleAutoSave);
});