import { contentData } from './data.js';

// --- State ---
const state = {
    lang: 'ru',
    currentId: 1
};

// --- DOM Elements ---
const dom = {
    sidebarTitle: document.getElementById('ui-title'),
    menuList: document.getElementById('menuList'),
    contentTitle: document.getElementById('current-section-title'),
    contentBody: document.getElementById('content-body'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    clearBtn: document.getElementById('clearBtn'),
    langButtons: document.querySelectorAll('.lang-btn')
};

// --- Initialization ---
function init() {
    setupEventListeners();
    renderApp();
}

// --- Rendering ---
function renderApp() {
    updateStaticText();
    renderMenu();
    loadSection();
}

function updateStaticText() {
    dom.sidebarTitle.textContent = contentData[state.lang].title;
    document.title = contentData[state.lang].title;
    
    // Update active lang button
    dom.langButtons.forEach(btn => {
        if (btn.dataset.lang === state.lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function renderMenu() {
    dom.menuList.innerHTML = '';
    
    contentData[state.lang].sections.forEach(section => {
        const li = document.createElement('li');
        li.textContent = section.title;
        
        if (section.id === state.currentId) {
            li.classList.add('active');
        }
        
        li.addEventListener('click', () => {
            state.currentId = section.id;
            renderMenu(); // Re-render to update active class
            loadSection();
            // On mobile, close sidebar logic could go here if implemented
        });
        
        dom.menuList.appendChild(li);
    });
}

function loadSection(highlightText = '') {
    const section = contentData[state.lang].sections.find(x => x.id === state.currentId);
    if (!section) return;

    dom.contentTitle.textContent = section.title;
    
    let content = processContentImages(section);
    
    if (highlightText) {
        content = applyHighlight(content, highlightText);
    }

    dom.contentBody.innerHTML = content;

    // Scroll to highlight if exists
    if (highlightText) {
        setTimeout(() => {
            const mark = document.querySelector('.highlight');
            if (mark) {
                mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    } else {
        // Reset scroll position when loading new section
        dom.contentBody.parentElement.scrollTop = 0;
    }
}

// --- Helpers ---

function processContentImages(section) {
    let content = section.content;
    
    // Replace [Image X] placeholders
    if (section.images && section.images.length > 0) {
        section.images.forEach((url, index) => {
            const placeholder = `[Image ${index + 1}]`;
            const imgHtml = `<img src="${url}" class="content-img" alt="${section.title} фото ${index + 1}" loading="lazy">`;
            content = content.replace(placeholder, imgHtml);
        });
    }

    // Replace remaining placeholders with gray boxes
    content = content.replace(/\[Image \d+\]/g, '<div class="img-placeholder">Фотография отсутствует</div>');
    
    return content;
}

function applyHighlight(htmlContent, text) {
    // Simple regex replace. Note: in a production app, use a text-node walker 
    // to avoid breaking HTML tags. For this specific content, regex is acceptable.
    const regex = new RegExp(`(${text})`, 'gi');
    return htmlContent.replace(regex, '<mark class="highlight">$1</mark>');
}

// --- Search Logic ---

// Debounce function to limit search execution frequency
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

const performSearch = debounce((query) => {
    dom.clearBtn.style.display = query ? 'block' : 'none';
    
    if (query.length < 2) {
        dom.searchResults.style.display = 'none';
        return;
    }

    const hits = [];
    const sections = contentData[state.lang].sections;
    
    sections.forEach(s => {
        // Strip HTML tags for searching purely in text
        const textOnly = s.content.replace(/<[^>]*>/g, ' ');
        const lowerText = textOnly.toLowerCase();
        
        if (lowerText.includes(query)) {
            const index = lowerText.indexOf(query);
            // Create a small snippet around the found text
            const start = Math.max(0, index - 30);
            const end = Math.min(textOnly.length, index + 50);
            const snippet = "..." + textOnly.substring(start, end) + "...";
            
            hits.push({
                id: s.id,
                title: s.title,
                snippet: snippet
            });
        }
    });

    displaySearchResults(hits, query);
}, 300); // 300ms delay

function displaySearchResults(hits, query) {
    if (hits.length > 0) {
        dom.searchResults.innerHTML = hits.slice(0, 7).map(h => `
            <div class="search-item" data-id="${h.id}">
                <b>${h.title}</b>
                <small>${h.snippet}</small>
            </div>
        `).join('');
        dom.searchResults.style.display = 'block';
    } else {
        dom.searchResults.style.display = 'none';
    }
}

// --- Event Listeners ---

function setupEventListeners() {
    // Search Input
    dom.searchInput.addEventListener('input', (e) => {
        performSearch(e.target.value.toLowerCase().trim());
    });

    // Clear Search Button
    dom.clearBtn.addEventListener('click', () => {
        dom.searchInput.value = '';
        dom.searchResults.style.display = 'none';
        dom.clearBtn.style.display = 'none';
        loadSection(); // Reload current section without highlight
    });

    // Language Switcher
    dom.langButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const newLang = e.target.dataset.lang;
            if (state.lang !== newLang) {
                state.lang = newLang;
                // Try to keep current ID if exists in new lang, else reset to 1
                const exists = contentData[newLang].sections.some(s => s.id === state.currentId);
                if (!exists) state.currentId = 1;
                renderApp();
            }
        });
    });

    // Handle clicks on Search Results (Event Delegation)
    dom.searchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.search-item');
        if (item) {
            const id = parseInt(item.dataset.id);
            state.currentId = id;
            dom.searchResults.style.display = 'none';
            renderMenu();
            loadSection(dom.searchInput.value.toLowerCase().trim());
        }
    });

    // Close search results when clicking outside
    window.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            dom.searchResults.style.display = 'none';
        }
    });
}

// Start the app
document.addEventListener('DOMContentLoaded', init);