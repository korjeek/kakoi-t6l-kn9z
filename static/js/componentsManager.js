import { handleImageUpload } from "./handleImageManager.js";
import { scheduleAutoSave } from "./autoSaveManager.js";
import { updateTraitOptions } from "./traitOptionsManager.js"
import { createMultiDropdown } from "./multiDropDown.js";


export function addTrait() {
    const traitsDiv = document.getElementById('traits');
    const newTrait = document.createElement('div');
    newTrait.className = 'trait';
    newTrait.innerHTML = `
      <input type="text" placeholder="Имя характеристики" class="trait-name form-input">
      <button class="btn btn-danger" onclick="removeElement(this)">
        <span>×</span> Удалить
      </button>`;
    traitsDiv.appendChild(newTrait);
    const inp = newTrait.querySelector('.trait-name');
    inp.addEventListener('input', () => {
        clearTimeout(inp.timeout);
        inp.timeout = setTimeout(updateTraitOptions, 300);
    });
    updateTraitOptions();
    scheduleAutoSave();
}

export function addQuestion() {
    const questionsDiv = document.getElementById('questions');
    const newQ = document.createElement('div');
    newQ.className = 'question';
    newQ.innerHTML = `
      <div class="image-upload">
        <label class="file-upload">
          <input type="file" class="question-image" accept="image/*">
        </label>
      </div>
      <input type="text" placeholder="Текст вопроса" class="question-text form-input">
      <div class="answers">
        <div class="answer">
          <input type="text" placeholder="Ответ" class="answer-text form-input">
          <div class="multi-dropdown answer-dropdown"></div>
        </div>
      </div>
      <div class="answer-actions">
        <button class="btn btn-icon" onclick="addAnswer(this)">
          <span>+</span> Ответ
        </button>
        <button class="btn btn-danger" onclick="removeElement(this)">
          <span>×</span> Удалить вопрос
        </button>
      </div>`;
    const imgInp = newQ.querySelector('.question-image');
    imgInp.addEventListener('change', e => handleImageUpload(e.target));
    questionsDiv.appendChild(newQ);
    const ddContainer = newQ.querySelector('.answer-dropdown');
    createMultiDropdown(ddContainer);
    updateTraitOptions();
    scheduleAutoSave();
}

export function addAnswer(btn) {
    const answersDiv = btn.parentElement.previousElementSibling;
    const newAns = document.createElement('div');
    newAns.className = 'answer';
    newAns.innerHTML = `
      <input type="text" placeholder="Ответ" class="answer-text form-input">
      <div class="multi-dropdown answer-dropdown"></div>
      <button class="btn btn-danger" onclick="removeElement(this)">
        <span>×</span> Удалить ответ
      </button>`;
    answersDiv.appendChild(newAns);
    const ddContainer = newAns.querySelector('.answer-dropdown');
    createMultiDropdown(ddContainer);
    updateTraitOptions();
    scheduleAutoSave();
}

export function removeElement(btn) {
    const el = btn.closest('.trait, .question, .answer');
    if (el) {
        el.remove();
        updateTraitOptions();
    }
    scheduleAutoSave();
}