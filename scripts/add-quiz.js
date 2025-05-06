function addQuestion() {
    const container = document.getElementById('questionsContainer');
    const questionId = container.children.length + 1;

    const questionDiv = document.createElement('div');
    questionDiv.className = 'question';
    questionDiv.innerHTML = `
        <h4>Вопрос ${questionId}</h4>
        <input type="text" placeholder="Текст вопроса" required>
        <div class="answers"></div>
        <button type="button" onclick="addAnswer(this)">Добавить вариант</button>
    `;
    container.appendChild(questionDiv);
}

function addAnswer(button) {
    const answersDiv = button.parentElement.querySelector('.answers');
    const answerInput = document.createElement('input');
    answerInput.type = 'text';
    answerInput.placeholder = 'Вариант ответа';
    answerInput.required = true;
    answersDiv.appendChild(answerInput);
}