import {state} from "./state.js";
import {addRemoveButton} from "./closeImageManager.js";
import {updateTraitOptions} from "./traitOptionsManager.js";
import {createMultiDropdown, updateButtonText} from "./multiDropDown.js";
import {showError} from "./showErrorManager.js";
import {handleImageUpload} from "./handleImageManager.js";

export function parsingTestToLoad(title, image, traits, questions){
    document.getElementById('testTitle').value = title || '';
    if (image) {
        state.mainImageBase64 = image;
        const container = document.getElementById('mainImage').closest('.image-upload');
        const preview = document.createElement('img');
        preview.className = 'image-preview';
        preview.src = image;
        preview.style.display = 'block';

        const previewContainer = document.createElement('div');
        previewContainer.className = 'image-preview-container';
        previewContainer.appendChild(preview);
        container.appendChild(previewContainer);
        addRemoveButton(previewContainer, document.getElementById('mainImage'));
    }
    
    state.traitsList = traits || [];
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
    
    const questionsDiv = document.getElementById('questions');
    questionsDiv.innerHTML = '';
    questions.forEach(qData => {
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

        const imgInp = newQ.querySelector('.question-image');
        imgInp.addEventListener('change', e => handleImageUpload(e.target));
        
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
            
            const ddContainer = newAns.querySelector('.answer-dropdown');
            createMultiDropdown(ddContainer);

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

export function parsingTestToSafe(){
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
    
    return testData;
}