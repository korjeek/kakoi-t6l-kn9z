import {state} from "./state.js";
import {DRAFT_KEY} from "./constants.js";

export function scheduleAutoSave() {
    clearTimeout(state.saveTimeout);
    state.saveTimeout = setTimeout(saveDraft, 1000);
}

export function updateAutosaveStatus(message, isSuccess = false) {
    const status = document.getElementById('autosave-status');
    if (!status) return;

    status.textContent = message;
    status.classList.remove('saving');

    if (isSuccess) {
        status.classList.add('success');
        setTimeout(() => status.classList.remove('success'), 3000);
    }
}


export function saveDraft() {
    const draft = {
        title: document.getElementById('testTitle').value,
        mainImageBase64: state.mainImageBase64,
        traits: state.traitsList,
        questions: []
    };

    document.querySelectorAll('.question').forEach(qEl => {
        const q = {
            text: qEl.querySelector('.question-text').value,
            image: (qEl.querySelector('.image-preview')?.src || ''),
            answers: []
        };

        qEl.querySelectorAll('.answer').forEach(ansEl => {
            const ansText = ansEl.querySelector('.answer-text').value;
            const multiDropdown = ansEl.querySelector('.multi-dropdown');
            const selectedTraits = Array.from(multiDropdown.querySelectorAll('.multi-dropdown__item.selected'))
                .map(item => item.getAttribute('data-value'));

            q.answers.push({
                text: ansText,
                traits: selectedTraits
            });
        });

        draft.questions.push(q);
    });

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}