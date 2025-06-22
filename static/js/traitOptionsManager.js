import {state} from "./state.js";
import {showError} from "./showErrorManager.js";
import {refreshMultiDropdown} from "./multiDropDown.js";

export function updateTraitOptions() {
    state.traitsList = Array.from(document.querySelectorAll('.trait-name'))
        .map(input => input.value.trim()).filter(name => name);
    const unique = [...new Set(state.traitsList)];
    if (unique.length !== state.traitsList.length) {
        showError('Характеристики должны быть уникальными!');
        return;
    }
 
    document.querySelectorAll('.multi-dropdown').forEach(dd => {
        refreshMultiDropdown(dd);
    });
}