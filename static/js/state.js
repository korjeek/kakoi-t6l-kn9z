export const state = {
    traitsList: [],
    mainImageBase64: '',
    testId: null,
    editKey: null,
    saveTimeout: null
};

export function clearState() {
    state.traitsList = [];
    state.mainImageBase64 = '';
    state.testId = null;
    state.editKey = null;
    state.saveTimeout = null;
}