document.addEventListener('DOMContentLoaded', function() {
    const fileList = document.getElementById('file-list');

    if (fileList) {
        fetch('/files')
            .then(response => response.json())
            .then(data => {
                data.files.forEach(file => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<a href="/download/${file}">${file}</a>`;
                    fileList.appendChild(listItem);
                });
            })
            .catch(error => console.error('Error fetching files:', error));
    }
});