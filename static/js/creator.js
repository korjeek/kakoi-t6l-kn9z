let traitsList = [];
let mainImageBase64 = '';
const DRAFT_KEY = 'test_draft'; // Ключ для сохранения черновика
let currentTestId = null;
// Обработка изображения
document.getElementById('mainImage').addEventListener('change', function (e) {
    handleImageUpload(e.target);
});

// Автосохранение с дебаунсингом
let saveTimeout;
function scheduleAutoSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveDraft, 1000);
}

function clearDraft() {
        localStorage.removeItem(DRAFT_KEY);
        document.getElementById('testTitle').value = '';
        document.getElementById('mainImage').value = '';
        mainImageBase64 = '';
        const imagePreviews = document.querySelectorAll('.image-preview-container');
        imagePreviews.forEach(preview => preview.remove());
        traitsList = [];
        document.getElementById('traits').innerHTML = '';
        document.getElementById('questions').innerHTML = '';
        updateAutosaveStatus('Черновик очищен', true);
}

function updateAutosaveStatus(message, isSuccess = false) {
    const status = document.getElementById('autosave-status');
    if (!status) return;

    status.textContent = message;
    status.classList.remove('saving');

    if (isSuccess) {
        status.classList.add('success');
        setTimeout(() => status.classList.remove('success'), 3000);
    }
}

// Сохранение черновика
function saveDraft() {
    const draft = {
        title: document.getElementById('testTitle').value,
        mainImageBase64: mainImageBase64,
        traits: traitsList,
        questions: []
    };

    document.querySelectorAll('.question').forEach(qEl => {
        const q = {
            text: qEl.querySelector('.question-text').value,
            image: (qEl.querySelector('.image-preview')?.src || ''),
            answers: []
        };

        qEl.querySelectorAll('.answer').forEach(ansEl => {
            const ansText = ansEl.querySelector('.answer-text').value;
            const multiDropdown = ansEl.querySelector('.multi-dropdown');
            const selectedTraits = Array.from(multiDropdown.querySelectorAll('.multi-dropdown__item.selected'))
                .map(item => item.getAttribute('data-value'));

            q.answers.push({
                text: ansText,
                traits: selectedTraits
            });
        });

        draft.questions.push(q);
    });

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

// Загрузка черновика
function loadDraft() {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (!draft) return false;

    // Восстановление основного изображения
    if (draft.mainImageBase64) {
        mainImageBase64 = draft.mainImageBase64;
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
    traitsList = draft.traits || [];
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
                <button class="btn btn-secondary" onclick="addAnswer(this)">
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

// Вспомогательная функция для обновления текста в дропдауне
function updateButtonText(wrapper) {
    const selectedDisplay = wrapper.querySelector('.multi-dropdown__selected');
    const chosen = wrapper._selectedTags;
    selectedDisplay.textContent = chosen.length ? chosen.join(', ') : 'Выберите характеристику';
}

// Загрузка черновика при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const afterSave = document.getElementById('afterSaveActions');

    // Устанавливаем начальное состояние
    afterSave.classList.add('fade-out');
    afterSave.style.display = 'none';

    const loaded = loadDraft();
    if (loaded) {
        console.log('Черновик восстановлен');
        document.getElementById('saveTestBtn').classList.remove('fade-out');
    }

    // Инициализация слушателей для автосохранения
    document.getElementById('testTitle').addEventListener('input', scheduleAutoSave);
    document.querySelector('#traits').addEventListener('input', scheduleAutoSave);
    document.querySelector('#questions').addEventListener('input', scheduleAutoSave);
});

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

function addRemoveButton(container, input) {
    const existing = container.querySelector('.remove-image-btn');
    if (existing) existing.remove();
    const btn = document.createElement('button');
    btn.className = 'remove-image-btn';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 
          6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 
          13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>`;
    btn.onclick = () => {
        input.value = '';
        container.remove();
        if (input.id === 'mainImage') mainImageBase64 = '';
    };
    container.appendChild(btn);
}

function updateTraitOptions() {
    traitsList = Array.from(document.querySelectorAll('.trait-name'))
        .map(input => input.value.trim()).filter(name => name);
    const unique = [...new Set(traitsList)];
    if (unique.length !== traitsList.length) {
        showError('Характеристики должны быть уникальными!');
        return;
    }
    // Перерисовать каждую мультиселект-обёртку
    document.querySelectorAll('.multi-dropdown').forEach(dd => {
        refreshMultiDropdown(dd);
    });
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

function saveTest() {
    const errDiv = document.getElementById('error-messages');
    errDiv.innerHTML = '';

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
            currentTestId = data['id']

            updateAutosaveStatus('Тест сохранен! Ссылка для редактирования готова', true)
        })
        .catch(error => {
            alert(`Непредвиденная ошибка: ${error}, пишите Олегу tg: @korjeeeek`)
        });
}

function showError(msg) {
    const ed = document.getElementById('error-messages');
    ed.innerHTML = msg;
    ed.hidden = false;
    throw new Error(msg);
}

// =========================
// Реализация мульти-дропдауна
// =========================
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

//-----------------------------------------
// Добавим глобальные переменные для сохранения ID теста и ключа редактирования
// let currentTestId = null;
// let currentEditKey = null;

// Функция для переключения между режимами кнопок
function toggleSaveButtons(showAfterSave = false) {
    const saveBtn = document.getElementById('saveTestBtn');
    const afterSave = document.getElementById('afterSaveActions');
    const actionsContainer = document.querySelector('.actions');

    // Добавляем контейнеру класс для управления высотой
    actionsContainer.classList.add('has-transitions');

    if (showAfterSave) {
        // Начало анимации скрытия
        saveBtn.classList.add('fade-out');

        // Задержка для анимации
        setTimeout(() => {
            saveBtn.style.display = 'none';

            // Показываем новые кнопки
            afterSave.style.display = 'flex';

            // Запускаем анимацию появления
            setTimeout(() => {
                afterSave.classList.remove('fade-out');
                afterSave.classList.add('fade-in');
            }, 50);
        }, 400);
    } else {
        // Анимация скрытия новых кнопок
        afterSave.classList.remove('fade-in');
        afterSave.classList.add('fade-out');

        setTimeout(() => {
            afterSave.style.display = 'none';

            // Показываем кнопку сохранения
            saveBtn.style.display = 'flex';

            // Запускаем анимацию появления
            setTimeout(() => {
                saveBtn.classList.remove('fade-out');
            }, 50);
        }, 400);
    }
}

// Функция для копирования ссылки
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

// Функция для перехода к прохождению теста
function runTest() {
    if (currentTestId) {
        window.location.href = `/test-runner?testId=${currentTestId}`;
    }
}