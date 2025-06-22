import { state } from "./state.js";
import { DRAFT_KEY } from "./constants.js";
import { updateAutosaveStatus } from "./autoSaveManager.js";
import {parsingTestToLoad} from "./testParsing.js";

export function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    document.getElementById('testTitle').value = '';
    document.getElementById('mainImage').value = '';
    state.mainImageBase64 = '';
    const imagePreviews = document.querySelectorAll('.image-preview-container');
    imagePreviews.forEach(preview => preview.remove());
    state.traitsList = [];
    document.getElementById('traits').innerHTML = '';
    document.getElementById('questions').innerHTML = '';
    updateAutosaveStatus('Черновик очищен', true);
}

export function loadDraft() {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (!draft) return false;

    parsingTestToLoad(draft.title, draft.mainImageBase64, draft.traits, draft.questions)
    return true;
}