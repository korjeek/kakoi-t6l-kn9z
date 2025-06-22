export function showError(msg) {
    const ed = document.getElementById('error-messages');
    ed.innerHTML = msg;
    ed.hidden = false;
}