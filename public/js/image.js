document
    .getElementById('file-input')
    .addEventListener('change', function (event) {
        changeImage(event);
    });

function changeImage(event) {
    const [file] = event.target.files;
    if (file) {
        document.getElementById('logoPreview').src = URL.createObjectURL(file);
    }
}
