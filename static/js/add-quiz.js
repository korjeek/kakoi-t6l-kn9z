// // Глобальное хранилище тегов
// let globalTags = new Set();
//
// // Класс для управления выпадающим списком
// class TagDropdown {
//     constructor(container) {
//         this.container = container;
//         this.dropdown = container.querySelector('.tags-dropdown');
//         this.toggleBtn = container.querySelector('.tag-toggle-btn');
//         this.searchInput = this.dropdown.querySelector('.tag-search');
//         this.optionsContainer = this.dropdown.querySelector('.tag-options-container');
//         this.selectedTags = container.querySelector('.selected-tags');
//         this.answerInput = container.closest('.answer').querySelector('input[type="text"]');
//
//         this.init();
//     }
//
//     init() {
//         this.toggleBtn.addEventListener('click', (e) => this.toggle(e));
//         this.searchInput.addEventListener('input', (e) => this.filterOptions(e));
//         document.addEventListener('click', (e) => this.handleOutsideClick(e));
//         document.addEventListener('keydown', (e) => this.handleKeyPress(e));
//
//         this.renderOptions();
//     }
//
//     toggle(e) {
//         e.stopPropagation();
//         const isOpen = this.dropdown.classList.contains('active');
//
//         TagDropdown.closeAll();
//
//         if (!isOpen) {
//             this.dropdown.classList.add('active');
//             this.toggleBtn.classList.add('active');
//             this.searchInput.value = '';
//             this.searchInput.focus();
//             this.renderOptions();
//         }
//     }
//
//     filterOptions(e) {
//         const query = e.target.value.toLowerCase();
//         this.optionsContainer.querySelectorAll('.tag-option').forEach(option => {
//             option.style.display = option.textContent.toLowerCase().includes(query)
//                 ? 'block'
//                 : 'none';
//         });
//     }
//
//     renderOptions() {
//         this.optionsContainer.innerHTML = Array.from(globalTags)
//             .map(tag => `<div class="tag-option">${tag}</div>`)
//             .join('');
//
//         this.optionsContainer.querySelectorAll('.tag-option').forEach(option => {
//             option.addEventListener('click', () => this.selectTag(option.textContent));
//         });
//     }
//
//     selectTag(tag) {
//         if (![...this.selectedTags.children].some(el => el.textContent === tag)) {
//             const chip = document.createElement('div');
//             chip.className = 'tag-chip';
//             chip.textContent = tag;
//             chip.addEventListener('click', () => this.removeTag(chip));
//             this.selectedTags.appendChild(chip);
//             this.validate();
//         }
//         TagDropdown.closeAll();
//     }
//
//     removeTag(chip) {
//         chip.remove();
//         this.validate();
//     }
//
//     validate() {
//         const isValid = this.selectedTags.children.length > 0;
//         this.answerInput.setCustomValidity(isValid ? '' : 'Выберите хотя бы один тег');
//     }
//
//     static closeAll() {
//         document.querySelectorAll('.tags-dropdown').forEach(d => {
//             d.classList.remove('active');
//             d.parentElement.querySelector('.tag-toggle-btn').classList.remove('active');
//         });
//     }
//
//     handleOutsideClick(e) {
//         if (!this.container.contains(e.target)) {
//             TagDropdown.closeAll();
//         }
//     }
//
//     handleKeyPress(e) {
//         if (e.key === 'Escape') {
//             TagDropdown.closeAll();
//         }
//     }
// }
//
// // Основной объект управления тестами
// const QuizManager = {
//     init() {
//         this.bindEvents();
//         this.renderTags();
//     },
//
//     bindEvents() {
//         document.addEventListener('click', (e) => {
//             if (e.target.classList.contains('add-answer-btn')) this.addAnswer(e.target);
//             if (e.target.classList.contains('delete-answer')) this.deleteAnswer(e.target);
//             if (e.target.classList.contains('delete-question')) this.deleteQuestion(e.target);
//         });
//     },
//
//     addNewTag() {
//         const input = document.getElementById('newTagInput');
//         const tagText = input.value.trim();
//
//         if (!tagText) return;
//
//         if (!globalTags.has(tagText)) {
//             globalTags.add(tagText);
//             this.renderTags();
//             input.value = '';
//             this.updateAllDropdowns();
//         } else {
//             alert('Такой тег уже существует!');
//         }
//     },
//
//     removeTag(tag) {
//         globalTags.delete(tag);
//         this.renderTags();
//         this.removeTagFromAnswers(tag);
//         this.updateAllDropdowns();
//     },
//
//     renderTags() {
//         const container = document.getElementById('tagsContainer');
//         container.innerHTML = Array.from(globalTags).map(tag => `
//       <div class="tag-item">
//         ${tag}
//         <span class="tag-remove" onclick="QuizManager.removeTag('${tag}')">×</span>
//       </div>
//     `).join('');
//     },
//
//     addQuestion() {
//         if (globalTags.size === 0) {
//             alert('Сначала добавьте теги!');
//             return;
//         }
//
//         const container = document.getElementById('questionsContainer');
//         const questionDiv = document.createElement('div');
//         questionDiv.className = 'question';
//         questionDiv.innerHTML = `
//       <div class="question-header">
//         <h4>Вопрос <span class="question-number"></span></h4>
//         <button type="button" class="delete-question">×</button>
//       </div>
//       <input type="text" class="question-text" placeholder="Текст вопроса" required>
//       <div class="answers"></div>
//       <button type="button" class="add-answer-btn">Добавить вариант</button>
//     `;
//
//         container.appendChild(questionDiv);
//         this.updateQuestionNumbers();
//     },
//
//     addAnswer(button) {
//         const answersDiv = button.parentElement.querySelector('.answers');
//         const answerDiv = document.createElement('div');
//         answerDiv.className = 'answer';
//         answerDiv.innerHTML = `
//       <div class="answer-content">
//         <input type="text" placeholder="Вариант ответа" required>
//         <div class="tag-selector">
//           <button type="button" class="tag-toggle-btn">Выбрать теги</button>
//           <div class="selected-tags"></div>
//           <div class="tags-dropdown">
//             <input type="text" class="tag-search" placeholder="Поиск тегов...">
//             <div class="tag-options-container"></div>
//           </div>
//         </div>
//         <button type="button" class="delete-answer">×</button>
//       </div>
//     `;
//
//         new TagDropdown(answerDiv.querySelector('.tag-selector'));
//         answersDiv.appendChild(answerDiv);
//     },
//
//     deleteAnswer(button) {
//         button.closest('.answer').remove();
//     },
//
//     deleteQuestion(button) {
//         button.closest('.question').remove();
//         this.updateQuestionNumbers();
//     },
//
//     updateQuestionNumbers() {
//         document.querySelectorAll('.question').forEach((question, index) => {
//             question.querySelector('.question-number').textContent = index + 1;
//         });
//     },
//
//     updateAllDropdowns() {
//         document.querySelectorAll('.tag-selector').forEach(container => {
//             new TagDropdown(container);
//         });
//     },
//
//     removeTagFromAnswers(tag) {
//         document.querySelectorAll('.tag-chip').forEach(chip => {
//             if (chip.textContent === tag) chip.remove();
//         });
//     }
// };
//
// // Инициализация приложения
// document.addEventListener('DOMContentLoaded', () => {
//     QuizManager.init();
// });
//
// // Глобальные обработчики
// window.addNewTag = () => QuizManager.addNewTag();
// window.addQuestion = () => QuizManager.addQuestion();