let currentTest = null;
let currentQuestion = 0;
let scores = {};
// TODO заменить /index на /
async function loadTest() {
    const configDataElement = document.getElementById('config-data');
    const testId = configDataElement.dataset.testId;
    currentTest = await fetch(`/tests/${testId}`).then(response => response.json()) || [];
    if (!currentTest) {
        alert('Тест не найден! Сначала создайте тест.');
        window.location.href = '/test-creator';
        return;
    }

    // Загрузка основной картинки
    if (currentTest.image) {
        document.getElementById('mainTestImage').src = currentTest.image;
    }

    currentTest.traits.forEach(trait => scores[trait] = 0);
    showQuestion(0);
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

    if (currentQuestion < currentTest.questions.length) {
        showQuestion(currentQuestion);
    } else {
        showResult();
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
    window.location.reload();
}

window.onload = loadTest;