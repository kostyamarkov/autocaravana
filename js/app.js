import { contentData } from './data.js';
import { VERSION } from './version.js';

// --- Icon mapping by section ID ---
const sectionIcons = {
    1: 'general_info.png',
    2: 'before_journey.png',
    3: 'windows.png',
    4: 'kitchen.png',
    5: 'fridge.png',
    6: 'electricity.png',
    7: 'water.png',
    8: 'shower.png',
    9: 'toilet.png',
    10: 'heating.png',
    11: 'sleeping_area.png',
    12: 'sleeping_area_additional.png',
    13: 'dinning_area.png',
    14: 'accessories_and_exterior.png',
    15: 'parking_and_sleeping.png',
    16: 'safety.png',
    17: 'return.png'
};

// --- State ---
const isMobile = () => window.innerWidth <= 768;

const state = {
    lang: 'ru',
    currentId: 1,
    // Default to collapsed (true) on desktop unless explicitly set to expanded (false) in localStorage
    sidebarCollapsed: isMobile() ? true : (localStorage.getItem('sidebarCollapsed') === 'false' ? false : true),
    sidebarExpanded: false // For mobile overlay state
};

// --- DOM Elements ---
const dom = {
    layout: document.querySelector('.layout'),
    sidebarTitle: document.getElementById('ui-title'),
    sidebar: document.getElementById('sidebar'),
    menuToggleBtn: document.getElementById('menuToggleBtn'),
    menuList: document.getElementById('menuList'),
    contentTitle: document.getElementById('current-section-title'),
    contentBody: document.getElementById('content-body'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    clearBtn: document.getElementById('clearBtn'),
    langButtons: document.querySelectorAll('.lang-btn'),
    imageModal: document.getElementById('imageModal'),
    modalImage: document.getElementById('modalImage'),
    modalClose: document.getElementById('modalClose')
};

// --- Initialization ---
function init() {
    applyInitialState();
    setupEventListeners();
    renderApp();
}

function applyInitialState() {
    if (isMobile()) {
        // On mobile: menu starts as collapsed (70px), not expanded
        state.sidebarExpanded = false;
        dom.sidebar.classList.remove('expanded');
    } else {
        // On desktop: apply saved state
        if (state.sidebarCollapsed) {
            dom.sidebar.classList.add('collapsed');
        } else {
            dom.sidebar.classList.remove('collapsed');
        }
    }
}

// --- Sidebar Toggle ---
function applyMobileState() {
    if (state.sidebarExpanded) {
        dom.sidebar.classList.add('expanded');
        dom.layout.classList.add('menu-open');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    } else {
        dom.sidebar.classList.remove('expanded');
        dom.layout.classList.remove('menu-open');
        document.body.style.overflow = 'auto';
    }
}

function applyCollapsedState() {
    if (state.sidebarCollapsed) {
        dom.sidebar.classList.add('collapsed');
    } else {
        dom.sidebar.classList.remove('collapsed');
    }
    updateMenuTooltips();
}

function updateMenuTooltips() {
    // Show title only when sidebar is collapsed
    const menuItems = dom.menuList.querySelectorAll('li:not(.menu-version)');
    menuItems.forEach(item => {
        if (state.sidebarCollapsed) {
            item.setAttribute('title', item.dataset.sectionTitle);
        } else {
            item.removeAttribute('title');
        }
    });
}

function toggleSidebar() {
    if (isMobile()) {
        // On mobile: toggle expanded state (overlay)
        state.sidebarExpanded = !state.sidebarExpanded;
        applyMobileState();
    } else {
        // On desktop: toggle collapsed state
        state.sidebarCollapsed = !state.sidebarCollapsed;
        localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed ? 'true' : 'false');
        applyCollapsedState();
        updateMenuTooltips();
    }
}

// --- Rendering ---
function renderApp() {
    updateStaticText();
    renderMenu();
    loadSection();
    
    // Apply correct style based on screen size
    if (isMobile()) {
        // On mobile: remove collapsed class, use expanded state instead
        dom.sidebar.classList.remove('collapsed');
        applyMobileState();
    } else {
        // On desktop: remove expanded class, use collapsed state instead
        dom.sidebar.classList.remove('expanded');
        dom.layout.classList.remove('menu-open');
        applyCollapsedState();
    }
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
        
        // Create icon element
        const icon = document.createElement('img');
        icon.src = `pictures/icons/${sectionIcons[section.id]}`;
        icon.className = 'menu-icon';
        icon.alt = section.title;
        
        // Create text element
        const text = document.createElement('span');
        text.textContent = section.title;
        
        // Append icon and text to list item
        li.appendChild(icon);
        li.appendChild(text);
        li.dataset.sectionTitle = section.title; // Store title in data attribute
        
        if (section.id === state.currentId) {
            li.classList.add('active');
        }
        
        li.addEventListener('click', () => {
            state.currentId = section.id;
            renderMenu(); // Re-render to update active class
            loadSection();
            
            // On mobile, close sidebar after selection
            if (isMobile() && state.sidebarExpanded) {
                state.sidebarExpanded = false;
                applyMobileState();
            }
        });
        
        dom.menuList.appendChild(li);
    });
    
    // Add version info at the bottom of menu
    const versionItem = document.createElement('li');
    versionItem.classList.add('menu-version');
    versionItem.textContent = `Версия: ${VERSION.full}`;
    dom.menuList.appendChild(versionItem);
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

    // Setup image modal for all images in content
    setupImageModal();

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

// --- Image Modal Functions ---

function openModal(imgSrc) {
    dom.modalImage.src = imgSrc;
    dom.imageModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    dom.imageModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function setupImageModal() {
    // Add click handlers to all images in content
    const images = dom.contentBody.querySelectorAll('.content-image, .content-img');
    images.forEach(img => {
        img.addEventListener('click', (e) => {
            openModal(img.src);
        });
    });
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
    // Menu toggle button
    dom.menuToggleBtn.addEventListener('click', toggleSidebar);
    
    // Close mobile sidebar when clicking on overlay (dark area)
    document.addEventListener('click', (e) => {
        if (isMobile() && state.sidebarExpanded) {
            // If click is not on sidebar or menuToggleBtn, close the menu
            if (!dom.sidebar.contains(e.target) && !dom.menuToggleBtn.contains(e.target)) {
                state.sidebarExpanded = false;
                applyMobileState();
            }
        }
    });

    // Handle scrollbar visibility - show on scroll, hide after scrolling stops
    let scrollTimeout;
    dom.menuList.addEventListener('scroll', () => {
        // Show scrollbar
        dom.menuList.classList.add('scrolling');
        
        // Clear previous timeout
        clearTimeout(scrollTimeout);
        
        // Hide scrollbar after 1 second of no scrolling
        scrollTimeout = setTimeout(() => {
            dom.menuList.classList.remove('scrolling');
        }, 1000);
    }, { passive: true });

    // Close search results when clicking outside
    window.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            dom.searchResults.style.display = 'none';
        }
    });

    // Modal close button
    dom.modalClose.addEventListener('click', closeModal);

    // Close modal when clicking on the dark overlay (outside the image)
    dom.imageModal.addEventListener('click', (e) => {
        // Only close if clicking directly on the modal background, not the image or close button
        if (e.target === dom.imageModal) {
            closeModal();
        }
    });

    // Close modal on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dom.imageModal.classList.contains('active')) {
            closeModal();
        }
    });

    // Handle window resize for mobile/desktop switch
    window.addEventListener('resize', () => {
        if (isMobile()) {
            // Switched to mobile mode - show collapsed menu (70px)
            dom.sidebar.classList.remove('collapsed');
            dom.sidebar.classList.remove('expanded');
            dom.layout.classList.remove('menu-open');
            state.sidebarExpanded = false;
            document.body.style.overflow = 'auto';
        } else {
            // Switched to desktop - apply saved collapsed state
            dom.sidebar.classList.remove('expanded');
            dom.layout.classList.remove('menu-open');
            document.body.style.overflow = 'auto';
            if (state.sidebarCollapsed) {
                dom.sidebar.classList.add('collapsed');
            } else {
                dom.sidebar.classList.remove('collapsed');
            }
        }
    });

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

    // TODO: Реализовать локализацию RU/EN в будущем
    // Language Switcher
    // dom.langButtons.forEach(btn => {
    //     btn.addEventListener('click', (e) => {
    //         const newLang = e.target.dataset.lang;
    //         if (state.lang !== newLang) {
    //             state.lang = newLang;
    //             // Try to keep current ID if exists in new lang, else reset to 1
    //             const exists = contentData[newLang].sections.some(s => s.id === state.currentId);
    //             if (!exists) state.currentId = 1;
    //             renderApp();
    //         }
    //     });
    // });

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
}

// Start the app
document.addEventListener('DOMContentLoaded', init);