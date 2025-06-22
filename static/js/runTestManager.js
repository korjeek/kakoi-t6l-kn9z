import {state} from "./state.js";

export function runTest() {
    if (state.testId) {
        window.location.href = `/test-runner?testId=${state.testId}`;
    }
}