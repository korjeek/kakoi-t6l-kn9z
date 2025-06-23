async function loadTests() {
    const testsGrid = document.getElementById('testsGrid');
    const savedTests = await fetch('/tests').then(response => response.json()) || [];

    if(savedTests.length === 0) {
        testsGrid.innerHTML = `
                    <div class="empty-state">
                        <h3>Тестов пока нет</h3>
                        <p>Создайте свой первый тест!</p>
                        <a href="/test-creator" class="btn btn-primary">Создать тест</a>
                    </div>
                `;
        return;
    }

    testsGrid.innerHTML = savedTests.map(test => `
                <div class="test-card">
                    ${test.image ?
        `<img src="${test.image}" class="test-image" alt="${test.title}">` :
        '<div style="height: 200px; background: #eee"></div>'}
                    <div class="test-content">
                        <h3 class="test-title">${test.title}</h3>
                        <div class="test-actions">
                            <button class="btn btn-primary"
                                    onclick="location.href='/test-runner?testId=${test.id}'">
                                Пройти тест
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
}

function deleteTest(index) {
    const savedTests = JSON.parse(localStorage.getItem('savedTests')) || [];
    savedTests.splice(index, 1);
    localStorage.setItem('savedTests', JSON.stringify(savedTests));
    loadTests();
}

window.onload = loadTests;