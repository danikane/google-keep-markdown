const activeNoteSelector = '[contenteditable="true"]:not([aria-label]), .markdown-active, .markdown-active-title';

chrome.storage.local.get(['markdownActive'], function (result) {
    setTimeout(updatePreview, 1000, result.markdownActive);
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.command === 'updatePreview') {
        updatePreview(request.markdownActive)
    }
});

const observer = new MutationObserver(mutations => {

    const newActiveNote = mutations.some(mutation =>
        Array.from(mutation.addedNodes).some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches(activeNoteSelector) || node.querySelector(activeNoteSelector))
        )
    );

    chrome.storage.local.get(['markdownActive'], function (result) {
        if (result.markdownActive && newActiveNote) {
            setTimeout(updatePreview, 100, true);
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

function renderMarkdownToHtml(markdownText) {
    return marked.parse(markdownText);
}

function updatePreview(markdownActive) {

    observer.disconnect();

    const textBoxes = document.querySelectorAll(activeNoteSelector);

    textBoxes.forEach((textBox, index) => {

        if (markdownActive) {

            if (isTitle(textBox)) {
                textBox.classList.add('markdown-active-title');
            }

            textBox.classList.add('markdown-active');
            textBox.dataset.originalHtml = textBox.innerHTML;
            textBox.innerHTML = renderMarkdownToHtml(textBox.innerText);
            textBox.contentEditable = 'false';
        } else {

            if (textBox.dataset.originalHtml) {
                textBox.innerHTML = textBox.dataset.originalHtml;
            }

            textBox.contentEditable = 'true';
            textBox.classList.remove('markdown-active-title');
            textBox.classList.remove('markdown-active');
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function isTitle(elem) {

    let parent = elem.parentElement;

    if (!parent) {
        return false;
    }

    let uncle = parent.nextElementSibling;

    if (!uncle) {
        return false;
    }

    let firstChild = uncle.firstElementChild;

    return firstChild && firstChild.contentEditable === 'true';
}
