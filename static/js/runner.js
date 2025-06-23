let currentTest = null;
let currentQuestion = 0;
let scores = {};

function loadState() {
    try {
        const savedState = localStorage.getItem('testProgress');
        if (savedState) {
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

async function loadTest() {
    const savedState = loadState();

    const configDataElement = document.getElementById('config-data');
    const testId = configDataElement.dataset.testId;
    
    if (savedState && savedState.testId && savedState.testId === testId) {
        currentQuestion = savedState.currentQuestion || 0;
        scores = savedState.scores || {};
    } else {
        clearState();
        currentQuestion = 0;
        scores = {};
    }
    
    try {
        const response = await fetch(`/tests/${testId}`);
        if (!response.ok) throw new Error('Тест не найден');

        currentTest = await response.json();
        if (!currentTest || !currentTest.questions) {
            throw new Error('Неверный формат теста');
        }
        
        currentTest.traits.forEach(trait => {
            scores[trait] = scores[trait] || 0;
        });

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

function clearState() {
    localStorage.removeItem('testProgress');
}

function showQuestion(index) {
    const questions = currentTest.questions[index];
    document.getElementById('test-title').textContent = currentTest.title;
    
    const progress = (index / currentTest.questions.length) * 100;
    document.getElementById('progress').style.width = `${progress}%`;

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
    saveState();

    if (currentQuestion < currentTest.questions.length) {
        showQuestion(currentQuestion);
    } else {
        document.getElementById('progress').style.width = '100%';
        showResult();
        clearState();
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