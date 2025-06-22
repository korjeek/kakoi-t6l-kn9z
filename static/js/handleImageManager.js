import { state } from "./state.js";
import { addRemoveButton } from "./closeImageManager.js"
import {showError} from "./showErrorManager.js";

export function handleImageUpload(input) {
    const file = input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showError('Пожалуйста, выберите изображение!');
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        const container = input.closest('.image-upload');
        let previewContainer = container.querySelector('.image-preview-container');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.className = 'image-preview-container';
            container.appendChild(previewContainer);
        }
        let preview = previewContainer.querySelector('.image-preview');
        if (!preview) {
            preview = document.createElement('img');
            preview.className = 'image-preview';
            previewContainer.appendChild(preview);
        }
        preview.src = e.target.result;
        preview.style.display = 'block';
        if (input.id === 'mainImage') {
            state.mainImageBase64 = e.target.result;
        }
        addRemoveButton(previewContainer, input);
    };
    reader.readAsDataURL(file);
}