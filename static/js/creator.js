import { DRAFT_KEY } from './constants.js'
import { state, clearState } from './state.js';
import { handleImageUpload } from "./handleImageManager.js";
import { addTrait, addAnswer, addQuestion, removeElement } from "./componentsManager.js";
import { clearDraft, loadDraft } from "./draftManager.js";
import {scheduleAutoSave, updateAutosaveStatus} from "./autoSaveManager.js";
import { showError } from "./showErrorManager.js";

clearState();
window.addTrait = addTrait;
window.addQuestion = addQuestion;
window.saveTest = saveTest;
window.clearDraft = clearDraft;
window.runTest = runTest;
window.addAnswer = addAnswer;
window.removeElement = removeElement;


document.getElementById('mainImage').addEventListener('change', function (e) {
    handleImageUpload(e.target);
});

// Автосохранение с дебаунсингом


// Вспомогательная функция для обновления текста в дропдауне


// Загрузка черновика при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const loaded = loadDraft();
    if (loaded) {
        console.log('Черновик восстановлен');
    }

    // Инициализация слушателей для автосохранения
    document.getElementById('testTitle').addEventListener('input', scheduleAutoSave);
    document.querySelector('#traits').addEventListener('input', scheduleAutoSave);
    document.querySelector('#questions').addEventListener('input', scheduleAutoSave);
});



function saveTest() {
    const errDiv = document.getElementById('error-messages');
    errDiv.innerHTML = '';

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

    fetch('/create-test', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
    })
        .then(response => response.json())
        .then(data => {
            localStorage.removeItem(DRAFT_KEY);

            toggleSaveButtons(true);
            setupCopyLinkButton(data['id'], data['edit_key']);
            state.currentTestId = data['id']

            updateAutosaveStatus('Тест сохранен! Ссылка для редактирования готова', true)
        })
        .catch(error => {
            alert(`Непредвиденная ошибка: ${error}, пишите Олегу tg: @korjeeeek`)
        });
}


// Функция для переключения между режимами кнопок
function toggleSaveButtons(showAfterSave = false) {
    document.getElementById('saveTestBtn').style.display = showAfterSave ? 'none' : 'block';
    document.getElementById('afterSaveActions').style.display = showAfterSave ? 'flex' : 'none';
}

// Функция для копирования ссылки
function setupCopyLinkButton(testId, editKey) {
    const copyBtn = document.getElementById('copyLinkBtn');
    const btnText = copyBtn.querySelector('.btn-text');
    const originalText = btnText.textContent;

    copyBtn.onclick = () => {
        const url = `${window.location.origin}/test-editor?testId=${testId}&editKey=${editKey}`;
        navigator.clipboard.writeText(url).then(() => {
            btnText.textContent = 'Скопировано!';
            setTimeout(() => {
                btnText.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Ошибка копирования: ', err);
            showError('Не удалось скопировать ссылку');
        });
    };
}

// Функция для перехода к прохождению теста
function runTest() {
    if (state.currentTestId) {
        window.location.href = `/test-runner?testId=${state.currentTestId}`;
    }
}