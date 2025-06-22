import { state } from "./state.js";

export function addRemoveButton(container, input) {
    const existing = container.querySelector('.remove-image-btn');
    if (existing) existing.remove();
    const btn = document.createElement('button');
    btn.className = 'remove-image-btn';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 
          6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 
          13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>`;
    btn.onclick = () => {
        input.value = '';
        container.remove();
        if (input.id === 'mainImage') state.mainImageBase64 = '';
    };
    container.appendChild(btn);
}