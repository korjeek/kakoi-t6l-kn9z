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

//GoGa
document.addEventListener("DOMContentLoaded", function () {
    const quizList = document.getElementById("quizList");

    fetch('/tests')
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                quizList.innerHTML = "<p>Нет доступных тестов</p>";
                return;
            }

            data.forEach(test => {
                console.log(test)
                const link = document.createElement("a");
                link.href = `/tests/${test.id}`;
                link.textContent = test.name;
                link.className = "quiz-link";

                const description = document.createElement("p");

                const div = document.createElement("div");
                div.className = "quiz-item";
                div.appendChild(link);
                div.appendChild(description);

                quizList.appendChild(div);
            });
        })
        .catch(error => {
            console.error("Ошибка загрузки тестов:", error);
            quizList.innerHTML = "<p>Не удалось загрузить тесты</p>";
        });
});
//GoGa