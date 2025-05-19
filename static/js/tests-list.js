// document.addEventListener("DOMContentLoaded", function () {
//     const ajaxList = document.querySelector('.ajax-list')
//
//     fetch('/tests')
//         .then(response => response.json())
//         .then(data => {
//             if (data.length === 0) {
//                 ajaxList.innerHTML = "<p>Нет доступных тестов</p>";
//                 return;
//             }
//
//             data.forEach(test => createTestLink(test, ajaxList));
//         })
//         .catch(error => {
//             console.error("Ошибка загрузки тестов:", error);
//             ajaxList.innerHTML = "<p>Не удалось загрузить тесты</p>";
//         });
// });
//
// function createTestLink(test, ajaxList) {
//     const itemContainer = document.createElement('div');
//     itemContainer.className = "test-list__item-container";
//
//     const link = document.createElement("a");
//     link.href = `/tests/${test.id}`;
//     link.className = "test-list__test";
//
//     const text = document.createElement("span");
//     text.className = "test-list__text";
//
//     const title = document.createElement("span");
//     title.className = "test-list__title";
//     title.textContent = test.name;
//
//     ajaxList.appendChild(itemContainer);
//     itemContainer.appendChild(link);
//     link.appendChild(text);
//     text.appendChild(title);
// }