import {state} from "./state.js";
import {scheduleAutoSave} from "./autoSaveManager.js";

export function createMultiDropdown(container) {
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
        const toShow = state.traitsList.filter(tag => tag.toLowerCase().includes(filter));
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
                scheduleAutoSave();
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

export function refreshMultiDropdown(container) {
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

export function updateButtonText(wrapper) {
    const selectedDisplay = wrapper.querySelector('.multi-dropdown__selected');
    const chosen = wrapper._selectedTags;
    selectedDisplay.textContent = chosen.length ? chosen.join(', ') : 'Выберите характеристику';
}