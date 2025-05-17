// Глобальное хранилище тегов
let globalTags = new Set();

// Добавление нового тега
function addNewTag() {
    const input = document.getElementById('newTagInput');
    const tagText = input.value.trim();

    if (!tagText) return;

    if (!globalTags.has(tagText)) {
        globalTags.add(tagText);
        renderTags();
        input.value = '';
        updateAllTagDropdowns(); // Обновляем все выпадающие списки
    } else {
        alert('Такой тег уже существует!');
    }
}

// Удаление тега
function removeTag(tag) {
    globalTags.delete(tag);
    renderTags();
    removeTagFromAllAnswers(tag); // Удаляем тег из всех ответов
    updateAllTagDropdowns(); // Обновляем списки
}

// Отрисовка тегов в секции создания
function renderTags() {
    const container = document.getElementById('tagsContainer');
    container.innerHTML = Array.from(globalTags).map(tag => `
        <div class="tag-item">
            ${tag}
            <span class="tag-remove" onclick="removeTag('${tag}')">×</span>
        </div>
    `).join('');
}

// Добавление нового вопроса
function addQuestion() {
    if (globalTags.size === 0) {
        alert('Сначала добавьте теги!');
        return;
    }

    const container = document.getElementById('questionsContainer');
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question';
    questionDiv.innerHTML = `
        <div class="question-header">
            <h4>Вопрос <span class="question-number"></span></h4>
            <button type="button" class="delete-question" onclick="deleteQuestion(this)">×</button>
        </div>
        <input type="text" class="question-text" placeholder="Текст вопроса" required>
        <div class="answers"></div>
        <button type="button" class="add-answer-btn" onclick="addAnswer(this)">Добавить вариант</button>
    `;

    container.appendChild(questionDiv);
    updateQuestionNumbers();
}

// Удаление вопроса
function deleteQuestion(button) {
    button.closest('.question').remove();
    updateQuestionNumbers();
}

// Добавление нового ответа
function addAnswer(button) {
    const answersDiv = button.parentElement.querySelector('.answers');
    const answerDiv = document.createElement('div');
    answerDiv.className = 'answer';
    answerDiv.innerHTML = `
        <div class="answer-content">
            <input type="text" placeholder="Вариант ответа" required>
            <div class="tag-selector">
                <div class="selected-tags" onclick="toggleTagDropdown(this)">
                    <input type="text" class="tag-input" placeholder="Выберите теги..." readonly>
                </div>
                <div class="tags-dropdown"></div>
            </div>
            <button type="button" class="delete-answer" onclick="deleteAnswer(this)">×</button>
        </div>
    `;

    // Заполняем выпадающий список
    const dropdown = answerDiv.querySelector('.tags-dropdown');
    Array.from(globalTags).forEach(tag => {
        const option = document.createElement('div');
        option.className = 'tag-option';
        option.textContent = tag;
        option.onclick = () => selectTag(tag, answerDiv);
        dropdown.appendChild(option);
    });

    answersDiv.appendChild(answerDiv);
    validateAnswer(answerDiv);
}

// Выбор тега для ответа
function selectTag(tag, answerDiv) {
    const selectedTags = answerDiv.querySelector('.selected-tags');

    if (!selectedTags.querySelector(`[data-tag="${tag}"]`)) {
        const chip = document.createElement('div');
        chip.className = 'tag-chip';
        chip.dataset.tag = tag;
        chip.innerHTML = `
            ${tag}
            <span class="tag-chip-remove" onclick="removeSelectedTag(this)">×</span>
        `;
        selectedTags.insertBefore(chip, selectedTags.querySelector('.tag-input'));
    }

    validateAnswer(answerDiv);
    closeAllDropdowns();
}

// Удаление выбранного тега
function removeSelectedTag(element) {
    element.closest('.tag-chip').remove();
    validateAnswer(element.closest('.answer'));
}

// Валидация ответа
function validateAnswer(answerDiv) {
    const tags = answerDiv.querySelectorAll('.tag-chip');
    const isValid = tags.length > 0;
    answerDiv.querySelector('input[type="text"]').setCustomValidity(
        isValid ? '' : 'Выберите хотя бы один тег'
    );
}

// Обновление всех выпадающих списков
function updateAllTagDropdowns() {
    document.querySelectorAll('.tags-dropdown').forEach(dropdown => {
        dropdown.innerHTML = Array.from(globalTags).map(tag =>
            `<div class="tag-option">${tag}</div>`
        ).join('');

        // Перепривязываем обработчики
        dropdown.querySelectorAll('.tag-option').forEach(option => {
            option.onclick = () => selectTag(option.textContent, option.closest('.answer'));
        });
    });
}

// Удаление тега из всех ответов
function removeTagFromAllAnswers(tag) {
    document.querySelectorAll(`.tag-chip[data-tag="${tag}"]`).forEach(chip => chip.remove());
    document.querySelectorAll('.answer').forEach(validateAnswer);
}

// Обновление номеров вопросов
function updateQuestionNumbers() {
    document.querySelectorAll('.question').forEach((question, index) => {
        question.querySelector('.question-number').textContent = index + 1;
    })}