import {state} from "./state.js";

export function runTest() {
    console.log(state)
    if (state.testId) {
        window.location.href = `/test-runner?testId=${state.testId}`;
    }
}