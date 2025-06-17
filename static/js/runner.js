let currentTest = null;
let currentQuestion = 0;
let scores = {};

// Загрузка состояния из localStorage
// Загрузка состояния из localStorage с обработкой ошибок
function loadState() {
    try {
        const savedState = localStorage.getItem('testProgress');
        if (savedState) {
            // Проверяем, что данные являются валидным JSON
            if (savedState.startsWith('{') || savedState.startsWith('[')) {
                return JSON.parse(savedState);
            }
            console.warn('Некорректные данные в localStorage:', savedState);
        }
    } catch (e) {
        console.error('Ошибка при загрузке состояния:', e);
        clearState();
    }
    return null;
}

// Обновлённая функция loadTest
async function loadTest() {
    // Загружаем состояние с обработкой ошибок
    const savedState = loadState();

    const configDataElement = document.getElementById('config-data');
    const testId = configDataElement.dataset.testId;

    // Проверяем сохранённое состояние
    if (savedState && savedState.testId && savedState.testId === testId) {
        currentQuestion = savedState.currentQuestion || 0;
        scores = savedState.scores || {};
    } else {
        // Если тест другой или состояние невалидно - сбрасываем
        clearState();
        currentQuestion = 0;
        scores = {};
    }

    // Загрузка теста с обработкой ошибок
    try {
        const response = await fetch(`/tests/${testId}`);
        if (!response.ok) throw new Error('Тест не найден');

        currentTest = await response.json();
        if (!currentTest || !currentTest.questions) {
            throw new Error('Неверный формат теста');
        }

        // Инициализация scores для новых черт
        currentTest.traits.forEach(trait => {
            scores[trait] = scores[trait] || 0;
        });

        // Загрузка изображения
        if (currentTest.image) {
            document.getElementById('mainTestImage').src = currentTest.image;
        }

        showQuestion(currentQuestion);
    } catch (error) {
        console.error('Ошибка загрузки теста:', error);
        alert('Произошла ошибка при загрузке теста. Попробуйте позже.');
        window.location.href = '/test-creator';
    }
}

// Сохранение состояния с проверками
function saveState() {
    try {
        const configDataElement = document.getElementById('config-data');
        if (!configDataElement) return;

        const state = {
            currentQuestion,
            scores,
            testId: configDataElement.dataset.testId
        };
        localStorage.setItem('testProgress', JSON.stringify(state));
    } catch (e) {
        console.error('Ошибка при сохранении состояния:', e);
    }
}

// Очистка состояния
function clearState() {
    localStorage.removeItem('testProgress');
}



function showQuestion(index) {
    const questions = currentTest.questions[index];
    document.getElementById('test-title').textContent = currentTest.title;

    let imageHTML = '';
    if (questions.image) {
        imageHTML = `<img src="${questions.image}" class="question-image">`;
    }

    const answersHTML = questions.answers.map(answer => `
      <div class="answer-option" onclick="selectAnswer('${answer.traits}')">
        ${answer.text}
      </div>
    `).join('');

    document.getElementById('questions-container').innerHTML = `
      <div class="question-card">
        ${imageHTML}
        <h3>Вопрос ${index + 1} из ${currentTest.questions.length}</h3>
        <p>${questions.text}</p>
        <div>${answersHTML}</div>
      </div>
    `;
}

function selectAnswer(traitsString) {
    const traitsArray = traitsString.split(',').map(trait => trait.trim());

    traitsArray.forEach(trait => {
        scores[trait] = (scores[trait] || 0) + 1;
    });

    currentQuestion++;
    saveState(); // Сохраняем состояние после каждого ответа

    if (currentQuestion < currentTest.questions.length) {
        showQuestion(currentQuestion);
    } else {
        showResult();
        clearState(); // Очищаем после завершения теста
    }
}

function showResult() {
    let maxScore = 0;
    let resultTraits = [];

    for (const [trait, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            resultTraits = [trait];
        } else if (score === maxScore) {
            resultTraits.push(trait);
        }
    }

    const randomIndex = Math.floor(Math.random() * resultTraits.length);
    const result = resultTraits[randomIndex];

    // Скрываем вопросы и показываем результат
    const testContent = document.querySelector('.test-content');
    const resultElement = document.getElementById('result');

    if (testContent) testContent.style.display = 'none';
    if (resultElement) {
        resultElement.style.display = 'block';
        document.getElementById('result-text').textContent = result;
    }
}

function restartTest() {
    clearState();
    window.location.reload();
}

window.onload = loadTest;