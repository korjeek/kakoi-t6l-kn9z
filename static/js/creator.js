import {DRAFT_KEY} from './constants.js'
import {state, clearState} from './state.js';
import {handleImageUpload} from "./handleImageManager.js";
import {addTrait, addAnswer, addQuestion, removeElement} from "./componentsManager.js";
import {clearDraft, loadDraft} from "./draftManager.js";
import {scheduleAutoSave, updateAutosaveStatus} from "./autoSaveManager.js";
import {showError} from "./showErrorManager.js";
import {runTest} from "./runTestManager.js";

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

document.addEventListener('DOMContentLoaded', () => {
    const afterSave = document.getElementById('afterSaveActions');

    afterSave.classList.add('fade-out');
    afterSave.style.display = 'none';

    const loaded = loadDraft();
    if (loaded) {
        console.log('Черновик восстановлен');
        document.getElementById('saveTestBtn').classList.remove('fade-out');
    }

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


function toggleSaveButtons(showAfterSave = false) {
    const saveBtn = document.getElementById('saveTestBtn');
    const afterSave = document.getElementById('afterSaveActions');
    const actionsContainer = document.querySelector('.actions');

    actionsContainer.classList.add('has-transitions');

    if (showAfterSave) {
        saveBtn.classList.add('fade-out');
        setTimeout(() => {
            saveBtn.style.display = 'none';
            afterSave.style.display = 'flex';
            setTimeout(() => {
                afterSave.classList.remove('fade-out');
                afterSave.classList.add('fade-in');
            }, 50);
        }, 400);
    } else {
        afterSave.classList.remove('fade-in');
        afterSave.classList.add('fade-out');

        setTimeout(() => {
            afterSave.style.display = 'none';
            saveBtn.style.display = 'flex';
            setTimeout(() => {
                saveBtn.classList.remove('fade-out');
            }, 50);
        }, 400);
    }
}

function setupCopyLinkButton(testId, editKey) {
    const copyBtn = document.getElementById('copyLinkBtn');
    const btnText = copyBtn.querySelector('.btn-text');
    const originalText = btnText.textContent;

    copyBtn.onclick = () => {
        const url = `${window.location.origin}/test-editor?testId=${testId}&editKey=${editKey}`;
        navigator.clipboard.writeText(url).then(() => {
            copyBtn.classList.add('btn-copied');
            btnText.innerHTML = '✓ Скопировано!';

            setTimeout(() => {
                copyBtn.classList.remove('btn-copied')
                btnText.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Ошибка копирования: ', err);
            showError('Не удалось скопировать ссылку');
        });
    };
}