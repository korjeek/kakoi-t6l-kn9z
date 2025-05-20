let traitsList = [];
let mainImageBase64 = '';

// Обработка изображения
document.getElementById('mainImage').addEventListener('change', function (e) {
    handleImageUpload(e.target);
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
    const existing = container.querySelector('.remove-image');
    if (existing) existing.remove();
    const btn = document.createElement('button');
    btn.className = 'remove-image';
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
}

function removeElement(btn) {
    const el = btn.closest('.trait, .question, .answer');
    if (el) {
        el.remove();
        updateTraitOptions();
    }
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
            console.log(data)
            window.location.href = `/test-runner?testId=${data['id']}`;
        })
        .catch(error => {
            alert(`Непредвиденная ошибка: ${error}, пишите Олегу tg: @korjeeeek`)
        });
}

function showError(msg) {
    const ed = document.getElementById('error-messages');
    ed.innerHTML = msg;
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