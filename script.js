document.addEventListener('DOMContentLoaded', function() {
    const rssUrlInput = document.getElementById('rssUrl');
    const loadRssButton = document.getElementById('loadRss');
    const publicationList = document.getElementById('publicationList');
    const editor = document.getElementById('editor');
    const linkNoteButton = document.getElementById('linkNote');
    const bookmarkNoteButton = document.getElementById('bookmarkNote');
    const saveMarkdownButton = document.getElementById('saveFile');
    const saveJsonButton = document.getElementById('loadFile');

    const addRssSourceButton = document.getElementById('addRssSource');

    addRssSourceButton.addEventListener('click', addRssSource);
    loadRssButton.addEventListener('click', loadRssFeeds);
    saveMarkdownButton.addEventListener('click', saveFile);
    saveJsonButton.addEventListener('click', loadFile);

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
            listItem.innerHTML = `
                <strong>${feedTitle}:</strong> ${publication.title}
                <input type="radio" name="selectedPublication" value="${publication.description}" data-feedTitle="${feedTitle}" data-rssUrl="${rssUrl}" data-listItemIndex="${publicationList.children.length}" >
            `;
            publicationList.appendChild(listItem);
        });
    }

    function addSelectedToEditor() {
        const selectedPublications = document.querySelectorAll('.publicationCheckbox:checked');
        selectedPublications.forEach(checkbox => {
            const feedTitle = checkbox.dataset.feedTitle;
            const rssUrl = checkbox.dataset.rssUrl;
            const content = checkbox.dataset.content;
            const link = checkbox.dataset.link;
            const currentDate = new Date().toLocaleDateString();
            const currentTime = new Date().toLocaleTimeString();
            const cleanContent = removeHtmlTags(content);
            editor.value += `\n\n--- From ${feedTitle} - Published on ${currentDate} at ${currentTime} ---\n${cleanContent}\nSource URL: ${rssUrl}\nFull Article: ${link}\n\n`;
        });
    }

    function openPublication(publication, feedTitle, rssUrl, listItem) {
        const currentDate = new Date().toLocaleDateString();
        const currentTime = new Date().toLocaleTimeString();
        const content = publication.description;
        const cleanContent = removeHtmlTags(content);
        editor.value += `\n\n--- From ${feedTitle} - Published on ${currentDate} at ${currentTime} ---\n${cleanContent}\nSource URL: ${rssUrl}\n\n`;

        // Add event listener to the publication list to handle radio button selection
        publicationList.addEventListener('change', function(event) {
            if (event.target && event.target.name === 'selectedPublication') {
                const selectedPublication = event.target;
                const feedTitle = selectedPublication.dataset.feedTitle;
                const rssUrl = selectedPublication.dataset.rssUrl;
                const content = selectedPublication.value;
                const currentDate = new Date().toLocaleDateString();
                const currentTime = new Date().toLocaleTimeString();
                const cleanContent = removeHtmlTags(content);
                editor.value += `\n\n--- From ${feedTitle} - Published on ${currentDate} at ${currentTime} ---\n${cleanContent}\nSource URL: ${rssUrl}\n\n`;

                // Remove highlight from previously selected item
                const selectedItems = document.querySelectorAll('.rss-list li.selected');
                selectedItems.forEach(item => item.classList.remove('selected'));

                // Highlight the selected list item
                const listItemIndex = event.target.dataset.listItemIndex;
                const listItem = publicationList.children[listItemIndex];
                listItem.classList.add('selected');
            }
        });
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
