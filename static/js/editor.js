let traitsList = [];
let mainImageBase64 = '';
const DRAFT_KEY = 'test_draft'; // Ключ для сохранения черновика
let testId, editKey;

// Обработка изображения
document.getElementById('mainImage').addEventListener('change', function (e) {
    handleImageUpload(e.target);
});

// Загрузка данных теста при открытии страницы
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    testId = urlParams.get('testId');
    editKey = urlParams.get('editKey');

    if (!testId || !editKey) {
        showError('Не указан ID теста или ключ редактирования в URL');
        return;
    }

    try {
        const response = await fetch(`/get-test-data?testId=${testId}&editKey=${editKey}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка загрузки теста');
        }

        const testData = await response.json();
        populateForm(testData);
        setupCopyLinkButton(testId, editKey);
    } catch (error) {
        showError(error.message);
    }
});

// Заполнение формы данными теста
function populateForm(testData) {
    // Заполняем заголовок
    document.getElementById('testTitle').value = testData.title;

    // Основное изображение
    if (testData.image) {
        mainImageBase64 = testData.image;
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
    traitsList = testData.traits || [];
    const traitsDiv = document.getElementById('traits');
    traitsDiv.innerHTML = '';
    traitsList.forEach(traitName => {
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
    if (traitsList.length < 2) return showError('Добавьте минимум 2 характеристики!');

    const questions = Array.from(document.querySelectorAll('.question'));
    if (!questions.length) return showError('Добавьте минимум 1 вопрос!');

    const testData = {
        title,
        image: mainImageBase64,
        traits: traitsList,
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

    fetch(`/edit-test?testId=${testId}&editKey=${editKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error) });
        }
        return response.json();
    })
    .then(data => {
        showError('Тест успешно обновлен!');
    })
    .catch(error => {
        showError('Ошибка сохранения: ' + error.message);
    });
}

// Функция для копирования ссылки
function setupCopyLinkButton(testId, editKey) {
    const copyBtn = document.getElementById('copyLinkBtn');
    const btnText = copyBtn.querySelector('.btn-text');
    const originalText = btnText.textContent;

    // Формируем ссылку
    const baseUrl = window.location.origin;
    const editLink = `${baseUrl}/test-editor?testId=${testId}&editKey=${editKey}`;

    // Показываем кнопку
    copyBtn.hidden = false;

    // Обработчик клика
    copyBtn.onclick = async () => {
        try {
            await navigator.clipboard.writeText(editLink);
            btnText.textContent = "Скопировано!";

            // Возвращаем оригинальный текст через 2 секунды
            setTimeout(() => {
                btnText.textContent = originalText;
            }, 2000);
        } catch (err) {
            showError('Не удалось скопировать ссылку: ' + err.message);
        }
    };
}

function handleImageUpload(input) {
    const file = input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showError('Пожалуйста, выберите изображение!');
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        const container = input.closest('.image-upload');
        let previewContainer = container.querySelector('.image-preview-container');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.className = 'image-preview-container';
            container.appendChild(previewContainer);
        }
        let preview = previewContainer.querySelector('.image-preview');
        if (!preview) {
            preview = document.createElement('img');
            preview.className = 'image-preview';
            previewContainer.appendChild(preview);
        }
        preview.src = e.target.result;
        preview.style.display = 'block';
        if (input.id === 'mainImage') {
            mainImageBase64 = e.target.result;
        }
        addRemoveButton(previewContainer, input);
    };
    reader.readAsDataURL(file);
}

function addTrait() {
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

function addQuestion() {
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
        <button class="btn btn-secondary" onclick="addAnswer(this)">
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

function addAnswer(btn) {
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

function removeElement(btn) {
    const el = btn.closest('.trait, .question, .answer');
    if (el) {
        el.remove();
        updateTraitOptions();
    }
    scheduleAutoSave();
}

function createMultiDropdown(container) {
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'multi-dropdown';
    // Храним выбранные теги в этом объекте
    wrapper._selectedTags = [];

    const button = document.createElement('div');
    button.className = 'multi-dropdown__button';
    button.tabIndex = 0;

    const selectedDisplay = document.createElement('span');
    selectedDisplay.className = 'multi-dropdown__selected';
    selectedDisplay.textContent = 'Выберите характеристику';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Поиск';
    searchInput.className = 'multi-dropdown__search';

    const arrow = document.createElement('span');
    arrow.className = 'multi-dropdown__arrow';
    arrow.innerHTML = '&#9654;';

    button.appendChild(selectedDisplay);
    button.appendChild(searchInput);
    button.appendChild(arrow);

    const list = document.createElement('div');
    list.className = 'multi-dropdown__list';
    list.style.display = 'none';

    wrapper.appendChild(button);
    wrapper.appendChild(list);
    container.appendChild(wrapper);

    // Напишем populateList как метод для этого wrapper
    wrapper._populateList = () => {
        list.innerHTML = '';
        const filter = searchInput.value.trim().toLowerCase();
        const toShow = traitsList.filter(tag => tag.toLowerCase().includes(filter));
        toShow.forEach(tag => {
            const item = document.createElement('div');
            item.className = 'multi-dropdown__item';
            item.setAttribute('data-value', tag);

            const checkmark = document.createElement('span');
            checkmark.className = 'checkmark';
            item.appendChild(checkmark);

            const label = document.createElement('span');
            label.className = 'item-label';
            label.textContent = tag;
            item.appendChild(label);

            if (wrapper._selectedTags.includes(tag)) {
                item.classList.add('selected');
            }

            item.addEventListener('click', e => {
                e.stopPropagation();
                if (item.classList.contains('selected')) {
                    item.classList.remove('selected');
                    wrapper._selectedTags = wrapper._selectedTags.filter(t => t !== tag);
                } else {
                    item.classList.add('selected');
                    wrapper._selectedTags.push(tag);
                }
                updateButtonText();
                scheduleAutoSave();
            });

            list.appendChild(item);
        });
    };

    function updateButtonText() {
        const chosen = wrapper._selectedTags;
        if (!chosen.length) {
            selectedDisplay.textContent = 'Выберите характеристику';
        } else {
            selectedDisplay.textContent = chosen.join(', ');
        }
    }

    function toggleDropdown() {
        const isOpen = list.style.display === 'block';
        if (isOpen) {
            list.style.display = 'none';
            searchInput.style.display = 'none';
            arrow.classList.remove('open');
            selectedDisplay.style.display = 'inline';
            searchInput.value = '';
        } else {
            list.style.display = 'block';
            searchInput.style.display = 'block';
            arrow.classList.add('open');
            selectedDisplay.style.display = 'none';
            searchInput.focus();
            wrapper._populateList();
        }
    }

    button.addEventListener('click', e => {
        e.stopPropagation();
        toggleDropdown();
    });
    button.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown();
        }
    });
    searchInput.addEventListener('input', wrapper._populateList);
    document.addEventListener('click', () => {
        if (list.style.display === 'block') toggleDropdown();
    });

    // Инициализировать
    updateButtonText();
    wrapper._populateList();
}

function refreshMultiDropdown(container) {
    // container может быть либо обёртка `.multi-dropdown`, либо обёртка внешнего div
    let wrapper = container;
    if (!wrapper.classList.contains('multi-dropdown')) {
        wrapper = container.querySelector('.multi-dropdown');
    }
    if (!wrapper) return;
    // если открыт, обновляем фильтрованный список
    const list = wrapper.querySelector('.multi-dropdown__list');
    const searchInput = wrapper.querySelector('.multi-dropdown__search');
    if (list.style.display === 'block') {
        wrapper._populateList();
    }
}

function showError(msg) {
    const ed = document.getElementById('error-messages');
    ed.innerHTML = msg;
    ed.hidden = false
}