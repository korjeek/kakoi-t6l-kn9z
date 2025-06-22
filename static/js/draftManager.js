import { state } from "./state.js";
import { DRAFT_KEY } from "./constants.js";
import { addRemoveButton } from "./closeImageManager.js";
import { updateTraitOptions } from "./traitOptionsManager.js";
import {createMultiDropdown, updateButtonText} from "./multiDropDown.js";
import { updateAutosaveStatus } from "./autoSaveManager.js";

export function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    document.getElementById('testTitle').value = '';
    document.getElementById('mainImage').value = '';
    state.mainImageBase64 = '';
    const imagePreviews = document.querySelectorAll('.image-preview-container');
    imagePreviews.forEach(preview => preview.remove());
    state.traitsList = [];
    document.getElementById('traits').innerHTML = '';
    document.getElementById('questions').innerHTML = '';
    updateAutosaveStatus('Черновик очищен', true);
}

// Загрузка черновика
export function loadDraft() {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (!draft) return false;

    // Восстановление основного изображения
    if (draft.mainImageBase64) {
        state.mainImageBase64 = draft.mainImageBase64;
        const container = document.getElementById('mainImage').closest('.image-upload');
        const preview = document.createElement('img');
        preview.className = 'image-preview';
        preview.src = draft.mainImageBase64;
        preview.style.display = 'block';

        const previewContainer = document.createElement('div');
        previewContainer.className = 'image-preview-container';
        previewContainer.appendChild(preview);
        container.appendChild(previewContainer);
        addRemoveButton(previewContainer, document.getElementById('mainImage'));
    }

    // Восстановление заголовка
    document.getElementById('testTitle').value = draft.title || '';

    // Восстановление характеристик
    state.traitsList = draft.traits || [];
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

    // Восстановление вопросов
    const questionsDiv = document.getElementById('questions');
    questionsDiv.innerHTML = '';
    draft.questions.forEach(qData => {
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
                <button class="btn btn-icon" onclick="addAnswer(this)">
                    <span>+</span> Ответ
                </button>
                <button class="btn btn-danger" onclick="removeElement(this)">
                    <span>×</span> Удалить вопрос
                </button>
            </div>`;

        // Восстановление изображения вопроса
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

            // Восстановление выбранных характеристик
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
    return true;
}