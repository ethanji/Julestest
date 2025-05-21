document.addEventListener('DOMContentLoaded', function() {
    const rssUrlInput = document.getElementById('rssUrl');
    const loadRssButton = document.getElementById('loadRss');
    const publicationList = document.getElementById('publicationList');
    const editor = document.getElementById('editor');
    const linkNoteButton = document.getElementById('linkNote');
    const bookmarkNoteButton = document.getElementById('bookmarkNote');
    const saveMarkdownButton = document.getElementById('saveFile');
    const saveJsonButton = document.getElementById('loadFile');
    const addToEditorButton = document.getElementById('addToEditor');
    const clearEditorButton = document.getElementById('clearEditorButton');

    const addRssSourceButton = document.getElementById('addRssSource');

    addRssSourceButton.addEventListener('click', addRssSource);
    addToEditorButton.addEventListener('click', addSelectedToEditor);
    loadRssButton.addEventListener('click', loadRssFeeds);
    saveMarkdownButton.addEventListener('click', saveFile);
    saveJsonButton.addEventListener('click', loadFile);
    clearEditorButton.addEventListener('click', clearEditor);

    function addRssSource() {
        const rssInputs = document.getElementById('rssInputs');
        const rssInput = document.createElement('div');
        rssInput.className = 'rss-input';
        rssInput.innerHTML = `
            <label for="rssUrl">RSS Feed URL:</label>
            <input type="url" class="rssUrl" placeholder="Enter RSS Feed URL">
        `;
        rssInputs.appendChild(rssInput);
    }

    async function loadRssFeeds() {
        const rssUrls = Array.from(document.querySelectorAll('.rssUrl')).map(input => input.value);
        publicationList.innerHTML = ''; // Clear previous publications

        for (const rssUrl of rssUrls) {
            try {
                const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
                const data = await response.json();

                if (data.status === 'ok' && data.items) {
                    const feedTitle = data.feed.title || 'Unknown Source';
                    const publications = data.items.slice(0, 5); // Get the 5 most recent
                    displayPublications(publications, feedTitle, rssUrl);
                } else {
                    console.error('Error fetching RSS feed:', data.message);
                    alert(`Failed to load RSS feed from ${rssUrl}. Check the URL.`);
                }
            } catch (error) {
                console.error('Error fetching RSS feed:', error);
                alert(`Failed to load RSS feed from ${rssUrl}. Check the URL.`);
            }
        }
    }

    function displayPublications(publications, feedTitle, rssUrl) {
        publications.forEach(publication => {
            const listItem = document.createElement('li');
            // Assuming publication.link exists. If not, this will be 'undefined' but won't break.
            const link = publication.link || ''; 
            listItem.innerHTML = `
                <strong>${feedTitle}:</strong> ${publication.title}
                <input type="radio" name="selectedPublication" value="${publication.description}" data-feedTitle="${feedTitle}" data-rssUrl="${rssUrl}" data-link="${link}" data-listItemIndex="${publicationList.children.length}" >
            `;
            publicationList.appendChild(listItem);
        });
    }

    function removeHtmlTags(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    }

    function addSelectedToEditor() {
        const selectedPublication = document.querySelector('input[name="selectedPublication"]:checked');
        if (selectedPublication) {
            const feedTitle = selectedPublication.dataset.feedtitle; // Note: dataset properties are auto-lowercased
            const rssUrl = selectedPublication.dataset.rssurl;     // Note: dataset properties are auto-lowercased
            const content = selectedPublication.value;
            const link = selectedPublication.dataset.link;
            const currentDate = new Date().toLocaleDateString();
            const currentTime = new Date().toLocaleTimeString();
            
            const cleanContent = removeHtmlTags(content);
            
            editor.value += `\n\n--- From ${feedTitle} - Published on ${currentDate} at ${currentTime} ---\n${cleanContent}\nSource URL: ${rssUrl}\nFull Article: ${link}\n\n`;
        } else {
            alert("Please select a publication to add.");
        }
    }

    function clearEditor() {
        editor.value = '';
    }

    function saveFile() {
        const data = {
            rssUrl: rssUrlInput.value,
            editorContent: editor.value
        };
        const json = JSON.stringify(data);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rss-notes.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function loadFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = function(event) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = function(event) {
                const data = JSON.parse(event.target.result);
                rssUrlInput.value = data.rssUrl;
                editor.value = data.editorContent;
                loadRssFeed();
            }
            reader.readAsText(file);
        }
        input.click();
    }
});
