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

const uiText = {
    ru: {
        htmlLang: 'ru',
        menuToggleAria: 'Переключить меню',
        menuToggleTitle: 'Свернуть/развернуть меню',
        searchPlaceholder: 'Поиск по тексту...',
        clearSearchAria: 'Очистить поиск',
        loadingTitle: 'Загрузка...',
        versionLabel: 'Версия',
        searchMinChars: 'Введите хотя бы 3 символа',
        searchNoResults: 'Совпадений не найдено',
        missingPhoto: 'Фотография отсутствует',
        modalImageAlt: 'Увеличенное изображение',
        modalPrevAria: 'Предыдущее изображение',
        modalNextAria: 'Следующее изображение',
        modalCloseAria: 'Закрыть изображение',
        photoAltSuffix: 'фото'
    },
    en: {
        htmlLang: 'en',
        menuToggleAria: 'Toggle menu',
        menuToggleTitle: 'Collapse/expand menu',
        searchPlaceholder: 'Search in text...',
        clearSearchAria: 'Clear search',
        loadingTitle: 'Loading...',
        versionLabel: 'Version',
        searchMinChars: 'Enter at least 3 characters',
        searchNoResults: 'No matches found',
        missingPhoto: 'Photo is missing',
        modalImageAlt: 'Enlarged image',
        modalPrevAria: 'Previous image',
        modalNextAria: 'Next image',
        modalCloseAria: 'Close image',
        photoAltSuffix: 'photo'
    },
    pt: {
        htmlLang: 'pt',
        menuToggleAria: 'Alternar menu',
        menuToggleTitle: 'Recolher/expandir menu',
        searchPlaceholder: 'Pesquisar no texto...',
        clearSearchAria: 'Limpar pesquisa',
        loadingTitle: 'A carregar...',
        versionLabel: 'Versao',
        searchMinChars: 'Introduza pelo menos 3 caracteres',
        searchNoResults: 'Nenhuma correspondencia encontrada',
        missingPhoto: 'Fotografia em falta',
        modalImageAlt: 'Imagem ampliada',
        modalPrevAria: 'Imagem anterior',
        modalNextAria: 'Imagem seguinte',
        modalCloseAria: 'Fechar imagem',
        photoAltSuffix: 'foto'
    }
};

function getUiText() {
    return uiText[state.lang] || uiText.ru;
}

// --- State ---
const isMobile = () => window.innerWidth <= 768;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const savedLang = localStorage.getItem('appLang');

function detectBrowserLang() {
    const browserLanguages = Array.isArray(navigator.languages) && navigator.languages.length
        ? navigator.languages
        : [navigator.language || navigator.userLanguage || ''];

    const normalized = browserLanguages
        .filter(Boolean)
        .map(lang => lang.toLowerCase());

    for (const lang of normalized) {
        if (lang.startsWith('pt')) return 'pt';
        if (lang.startsWith('en')) return 'en';
        if (lang.startsWith('ru')) return 'ru';
    }

    return 'ru';
}

const initialLang = (savedLang === 'ru' || savedLang === 'en' || savedLang === 'pt') ? savedLang : detectBrowserLang();

const state = {
    lang: initialLang,
    currentId: 1,
    // Desktop: expanded by default (collapsed = false), unless explicitly set in localStorage
    // Mobile: sidebarCollapsed not used (uses sidebarExpanded instead)
    sidebarCollapsed: !isMobile() && (localStorage.getItem('sidebarCollapsed') === 'true'),
    sidebarExpanded: false, // For mobile overlay state
    // Image navigation state
    currentPageImages: [], // Array of image elements from current page
    currentImageIndex: -1,  // Current image index in the array
    // Swipe navigation state
    swipeStartX: 0,
    swipeStartY: 0,
    swipeCurrentX: 0,
    swipeActivePointerId: null,
    swipeInProgress: false,
    initialViewportContent: '',
    searchViewportLocked: false,
    wasMobileViewport: isMobile()
};

const SWIPE_THRESHOLD_PX = 50;
const SWIPE_MAX_VERTICAL_DRIFT_PX = 80;
const MODAL_MIN_SCALE = 1;
const MODAL_MAX_SCALE = 4;
const DOUBLE_TAP_THRESHOLD_MS = 280;

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
    modalClose: document.getElementById('modalClose'),
    modalPrev: document.getElementById('modalPrev'),
    modalNext: document.getElementById('modalNext')
};

state.modalScale = MODAL_MIN_SCALE;
state.modalTranslateX = 0;
state.modalTranslateY = 0;
state.modalPinchStartDistance = 0;
state.modalPinchStartScale = MODAL_MIN_SCALE;
state.modalPanStartX = 0;
state.modalPanStartY = 0;
state.modalPanBaseX = 0;
state.modalPanBaseY = 0;
state.modalIsPanning = false;
state.modalLastTapTime = 0;
state.modalLastTapX = 0;
state.modalLastTapY = 0;
state.modalActivePointers = new Map();

// --- Initialization ---
function init() {
    applyIPhoneNativeTopScrollMode();
    updateAppViewportHeight();
    applyInitialState();
    setupEventListeners();
    renderApp();
}

function applyIPhoneNativeTopScrollMode() {
    document.documentElement.classList.remove('ios-native-scroll');
    document.body.classList.remove('ios-native-scroll');
}

function updateAppViewportHeight() {
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${viewportHeight}px`);
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
    } else {
        dom.sidebar.classList.remove('expanded');
        dom.layout.classList.remove('menu-open');
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
    const ui = getUiText();

    dom.sidebarTitle.textContent = contentData[state.lang].title;
    document.title = contentData[state.lang].title;
    document.documentElement.lang = ui.htmlLang;

    dom.menuToggleBtn.setAttribute('aria-label', ui.menuToggleAria);
    dom.menuToggleBtn.setAttribute('title', ui.menuToggleTitle);
    dom.searchInput.setAttribute('placeholder', ui.searchPlaceholder);
    dom.clearBtn.setAttribute('aria-label', ui.clearSearchAria);

    if (!dom.contentTitle.textContent || dom.contentTitle.textContent.trim() === '' || dom.contentTitle.textContent.trim() === 'Загрузка...' || dom.contentTitle.textContent.trim() === 'Loading...') {
        dom.contentTitle.textContent = ui.loadingTitle;
    }

    dom.modalImage.setAttribute('alt', ui.modalImageAlt);
    dom.modalPrev.setAttribute('aria-label', ui.modalPrevAria);
    dom.modalNext.setAttribute('aria-label', ui.modalNextAria);
    dom.modalClose.setAttribute('aria-label', ui.modalCloseAria);
    
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
    versionItem.textContent = `${getUiText().versionLabel}: ${VERSION.full}`;
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
    const ui = getUiText();
    let content = section.content;
    
    // Replace [Image X] placeholders
    if (section.images && section.images.length > 0) {
        section.images.forEach((url, index) => {
            const placeholder = `[Image ${index + 1}]`;
            const imgHtml = `<img src="${url}" class="content-img" alt="${section.title} ${ui.photoAltSuffix} ${index + 1}" loading="lazy">`;
            content = content.replace(placeholder, imgHtml);
        });
    }

    // Replace remaining placeholders with gray boxes
    content = content.replace(/\[Image \d+\]/g, `<div class="img-placeholder">${ui.missingPhoto}</div>`);
    
    return content;
}

function applyHighlight(htmlContent, text) {
    // Simple regex replace. Note: in a production app, use a text-node walker 
    // to avoid breaking HTML tags. For this specific content, regex is acceptable.
    const regex = new RegExp(`(${text})`, 'gi');
    return htmlContent.replace(regex, '<mark class="highlight">$1</mark>');
}

// --- Image Modal Functions ---

function openModal(imageIndex) {
    if (imageIndex < 0 || imageIndex >= state.currentPageImages.length) return;
    
    state.currentImageIndex = imageIndex;
    const imgSrc = state.currentPageImages[imageIndex].src;
    
    dom.modalImage.src = imgSrc;
    resetModalZoom();
    dom.imageModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    updateNavigationButtons();
}

function closeModal() {
    dom.imageModal.classList.remove('active');
    state.currentImageIndex = -1;
    resetModalZoom();
    document.body.style.overflow = '';
}

function navigateImage(direction) {
    const newIndex = state.currentImageIndex + direction;
    if (newIndex >= 0 && newIndex < state.currentPageImages.length) {
        openModal(newIndex);
    }
}

function updateNavigationButtons() {
    const totalImages = state.currentPageImages.length;
    const currentIndex = state.currentImageIndex;
    
    // Hide both arrows if only one image or no images
    if (totalImages <= 1) {
        dom.modalPrev.classList.add('hidden');
        dom.modalNext.classList.add('hidden');
        return;
    }
    
    // Show/hide previous arrow
    if (currentIndex <= 0) {
        dom.modalPrev.classList.add('hidden');
    } else {
        dom.modalPrev.classList.remove('hidden');
    }
    
    // Show/hide next arrow
    if (currentIndex >= totalImages - 1) {
        dom.modalNext.classList.add('hidden');
    } else {
        dom.modalNext.classList.remove('hidden');
    }
}

function resetSwipeState() {
    state.swipeStartX = 0;
    state.swipeStartY = 0;
    state.swipeCurrentX = 0;
    state.swipeActivePointerId = null;
    state.swipeInProgress = false;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getDistanceBetweenPoints(pointA, pointB) {
    const deltaX = pointA.x - pointB.x;
    const deltaY = pointA.y - pointB.y;
    return Math.hypot(deltaX, deltaY);
}

function normalizeModalTranslate() {
    if (state.modalScale <= MODAL_MIN_SCALE) {
        state.modalTranslateX = 0;
        state.modalTranslateY = 0;
        return;
    }

    const imageWidth = dom.modalImage.clientWidth;
    const imageHeight = dom.modalImage.clientHeight;
    const maxTranslateX = Math.max(0, (imageWidth * state.modalScale - imageWidth) / 2);
    const maxTranslateY = Math.max(0, (imageHeight * state.modalScale - imageHeight) / 2);

    state.modalTranslateX = clamp(state.modalTranslateX, -maxTranslateX, maxTranslateX);
    state.modalTranslateY = clamp(state.modalTranslateY, -maxTranslateY, maxTranslateY);
}

function applyModalZoomTransform() {
    normalizeModalTranslate();
    dom.modalImage.style.transform = `translate3d(${state.modalTranslateX}px, ${state.modalTranslateY}px, 0) scale(${state.modalScale})`;
}

function resetModalZoom() {
    state.modalScale = MODAL_MIN_SCALE;
    state.modalTranslateX = 0;
    state.modalTranslateY = 0;
    state.modalPinchStartDistance = 0;
    state.modalPinchStartScale = MODAL_MIN_SCALE;
    state.modalPanStartX = 0;
    state.modalPanStartY = 0;
    state.modalPanBaseX = 0;
    state.modalPanBaseY = 0;
    state.modalIsPanning = false;
    state.modalLastTapTime = 0;
    state.modalLastTapX = 0;
    state.modalLastTapY = 0;
    state.modalActivePointers.clear();
    resetSwipeState();
    applyModalZoomTransform();
}

function toggleModalZoomByDoubleTap(clientX, clientY) {
    const now = Date.now();
    const deltaTime = now - state.modalLastTapTime;
    const deltaX = Math.abs(clientX - state.modalLastTapX);
    const deltaY = Math.abs(clientY - state.modalLastTapY);
    const isDoubleTap = deltaTime <= DOUBLE_TAP_THRESHOLD_MS && deltaX < 30 && deltaY < 30;

    state.modalLastTapTime = now;
    state.modalLastTapX = clientX;
    state.modalLastTapY = clientY;

    if (!isDoubleTap) return;

    if (state.modalScale > MODAL_MIN_SCALE) {
        resetModalZoom();
        return;
    }

    state.modalScale = 2;
    state.modalTranslateX = 0;
    state.modalTranslateY = 0;
    applyModalZoomTransform();
}

function getViewportMeta() {
    return document.querySelector('meta[name="viewport"]');
}

function lockViewportForSearch() {
    if (!isIOS()) return;

    const viewportMeta = getViewportMeta();
    if (!viewportMeta || state.searchViewportLocked) return;

    if (!state.initialViewportContent) {
        state.initialViewportContent = viewportMeta.getAttribute('content') || 'width=device-width, initial-scale=1.0';
    }

    viewportMeta.setAttribute('content', `${state.initialViewportContent}, maximum-scale=1`);
    state.searchViewportLocked = true;
}

function restoreViewportAfterSearch() {
    if (!isIOS()) return;

    const viewportMeta = getViewportMeta();
    if (!viewportMeta) return;

    if (document.activeElement === dom.searchInput) {
        dom.searchInput.blur();
    }

    if (state.searchViewportLocked) {
        viewportMeta.setAttribute('content', state.initialViewportContent || 'width=device-width, initial-scale=1.0');
        state.searchViewportLocked = false;
    }
}

function startSwipeTracking(startX, startY, pointerId = null) {
    state.swipeStartX = startX;
    state.swipeStartY = startY;
    state.swipeCurrentX = startX;
    state.swipeActivePointerId = pointerId;
    state.swipeInProgress = true;
}

function updateSwipeTracking(currentX) {
    if (!state.swipeInProgress) return;
    state.swipeCurrentX = currentX;
}

function finishSwipeTracking(endX, endY) {
    if (!state.swipeInProgress || state.currentPageImages.length <= 1) {
        resetSwipeState();
        return;
    }

    const deltaX = endX - state.swipeStartX;
    const deltaY = Math.abs(endY - state.swipeStartY);
    const isHorizontalSwipe = Math.abs(deltaX) >= SWIPE_THRESHOLD_PX && deltaY <= SWIPE_MAX_VERTICAL_DRIFT_PX;

    if (isHorizontalSwipe) {
        if (deltaX < 0) {
            navigateImage(1);
        } else {
            navigateImage(-1);
        }
    }

    resetSwipeState();
}

function setupModalSwipe() {
    const supportsPointer = 'PointerEvent' in window;

    if (supportsPointer) {
        dom.modalImage.addEventListener('pointerdown', (e) => {
            if (!dom.imageModal.classList.contains('active')) return;
            if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;

            state.modalActivePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (state.modalActivePointers.size === 2) {
                const pointers = Array.from(state.modalActivePointers.values());
                state.modalPinchStartDistance = getDistanceBetweenPoints(pointers[0], pointers[1]);
                state.modalPinchStartScale = state.modalScale;
                state.modalIsPanning = false;
                resetSwipeState();
                return;
            }

            toggleModalZoomByDoubleTap(e.clientX, e.clientY);

            if (state.modalScale > MODAL_MIN_SCALE) {
                state.modalIsPanning = true;
                state.modalPanStartX = e.clientX;
                state.modalPanStartY = e.clientY;
                state.modalPanBaseX = state.modalTranslateX;
                state.modalPanBaseY = state.modalTranslateY;
                return;
            }

            startSwipeTracking(e.clientX, e.clientY, e.pointerId);
            dom.modalImage.setPointerCapture(e.pointerId);
        });

        dom.modalImage.addEventListener('pointermove', (e) => {
            if (!state.modalActivePointers.has(e.pointerId)) return;
            state.modalActivePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (state.modalActivePointers.size === 2) {
                const pointers = Array.from(state.modalActivePointers.values());
                const distance = getDistanceBetweenPoints(pointers[0], pointers[1]);
                if (state.modalPinchStartDistance > 0) {
                    state.modalScale = clamp(
                        state.modalPinchStartScale * (distance / state.modalPinchStartDistance),
                        MODAL_MIN_SCALE,
                        MODAL_MAX_SCALE
                    );

                    if (state.modalScale === MODAL_MIN_SCALE) {
                        state.modalTranslateX = 0;
                        state.modalTranslateY = 0;
                    }

                    applyModalZoomTransform();
                }
                return;
            }

            if (state.modalScale > MODAL_MIN_SCALE && state.modalIsPanning) {
                const deltaX = e.clientX - state.modalPanStartX;
                const deltaY = e.clientY - state.modalPanStartY;
                state.modalTranslateX = state.modalPanBaseX + deltaX;
                state.modalTranslateY = state.modalPanBaseY + deltaY;
                applyModalZoomTransform();
                return;
            }

            if (!state.swipeInProgress) return;
            if (state.swipeActivePointerId !== e.pointerId) return;

            updateSwipeTracking(e.clientX);
        });

        dom.modalImage.addEventListener('pointerup', (e) => {
            state.modalActivePointers.delete(e.pointerId);

            if (state.modalActivePointers.size < 2) {
                state.modalPinchStartDistance = 0;
            }

            if (state.modalScale > MODAL_MIN_SCALE) {
                state.modalIsPanning = false;
                return;
            }

            if (!state.swipeInProgress) return;
            if (state.swipeActivePointerId !== e.pointerId) return;

            finishSwipeTracking(e.clientX, e.clientY);
        });

        dom.modalImage.addEventListener('pointercancel', (e) => {
            state.modalActivePointers.delete(e.pointerId);
            if (state.modalActivePointers.size < 2) {
                state.modalPinchStartDistance = 0;
            }
            state.modalIsPanning = false;
            resetSwipeState();
        });

        return;
    }

    dom.modalImage.addEventListener('touchstart', (e) => {
        if (!dom.imageModal.classList.contains('active')) return;
        if (e.touches.length === 2) {
            const first = e.touches[0];
            const second = e.touches[1];
            state.modalPinchStartDistance = getDistanceBetweenPoints(
                { x: first.clientX, y: first.clientY },
                { x: second.clientX, y: second.clientY }
            );
            state.modalPinchStartScale = state.modalScale;
            state.modalIsPanning = false;
            resetSwipeState();
            return;
        }

        if (e.touches.length !== 1) return;

        const touch = e.touches[0];
        toggleModalZoomByDoubleTap(touch.clientX, touch.clientY);

        if (state.modalScale > MODAL_MIN_SCALE) {
            state.modalIsPanning = true;
            state.modalPanStartX = touch.clientX;
            state.modalPanStartY = touch.clientY;
            state.modalPanBaseX = state.modalTranslateX;
            state.modalPanBaseY = state.modalTranslateY;
            return;
        }

        startSwipeTracking(touch.clientX, touch.clientY);
    }, { passive: true });

    dom.modalImage.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            const first = e.touches[0];
            const second = e.touches[1];
            const distance = getDistanceBetweenPoints(
                { x: first.clientX, y: first.clientY },
                { x: second.clientX, y: second.clientY }
            );

            if (state.modalPinchStartDistance > 0) {
                state.modalScale = clamp(
                    state.modalPinchStartScale * (distance / state.modalPinchStartDistance),
                    MODAL_MIN_SCALE,
                    MODAL_MAX_SCALE
                );

                if (state.modalScale === MODAL_MIN_SCALE) {
                    state.modalTranslateX = 0;
                    state.modalTranslateY = 0;
                }

                applyModalZoomTransform();
            }
            return;
        }

        if (e.touches.length !== 1) return;

        const touch = e.touches[0];

        if (state.modalScale > MODAL_MIN_SCALE && state.modalIsPanning) {
            const deltaX = touch.clientX - state.modalPanStartX;
            const deltaY = touch.clientY - state.modalPanStartY;
            state.modalTranslateX = state.modalPanBaseX + deltaX;
            state.modalTranslateY = state.modalPanBaseY + deltaY;
            applyModalZoomTransform();
            return;
        }

        if (!state.swipeInProgress) return;
        updateSwipeTracking(touch.clientX);
    }, { passive: true });

    dom.modalImage.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            state.modalPinchStartDistance = 0;
        }

        if (state.modalScale > MODAL_MIN_SCALE) {
            state.modalIsPanning = false;
            return;
        }

        if (!state.swipeInProgress) return;

        const touch = e.changedTouches[0];
        finishSwipeTracking(touch.clientX, touch.clientY);
    }, { passive: true });

    dom.modalImage.addEventListener('touchcancel', () => {
        state.modalPinchStartDistance = 0;
        state.modalIsPanning = false;
        resetSwipeState();
    }, { passive: true });
}

function setupImageModal() {
    // Collect all images from current page
    const images = dom.contentBody.querySelectorAll('.content-image, .content-img');
    state.currentPageImages = Array.from(images);
    
    // Add click handlers to all images in content
    images.forEach((img, index) => {
        img.addEventListener('click', (e) => {
            openModal(index);
        });
    });
}

// --- Search Logic ---

// Debounce function to limit search execution frequency
function debounce(func, wait) {
    let timeout;
    const debounced = function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };

    debounced.cancel = function() {
        clearTimeout(timeout);
    };

    return debounced;
}

const performSearch = debounce((query) => {
    const ui = getUiText();
    dom.clearBtn.style.display = query ? 'block' : 'none';
    
    if (query.length < 3) {
        displaySearchMessage(ui.searchMinChars);
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

function displaySearchMessage(message) {
    dom.searchResults.innerHTML = `<div class="search-message">${message}</div>`;
    dom.searchResults.style.display = 'block';
}

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
        displaySearchMessage(getUiText().searchNoResults);
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

    // Close search results when clicking outside
    window.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            dom.searchResults.style.display = 'none';
            restoreViewportAfterSearch();
        }
    });

    // Modal close button
    dom.modalClose.addEventListener('click', closeModal);

    // Modal navigation buttons
    dom.modalPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateImage(-1);
    });

    dom.modalNext.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateImage(1);
    });

    // Modal swipe navigation (touch/pen)
    setupModalSwipe();

    // Close modal when clicking on the dark overlay (outside the image)
    dom.imageModal.addEventListener('click', (e) => {
        // Only close if clicking directly on the modal background, not the image or close button
        if (e.target === dom.imageModal) {
            closeModal();
        }
    });

    // Close modal on Escape key, navigate with arrow keys
    window.addEventListener('keydown', (e) => {
        if (dom.imageModal.classList.contains('active')) {
            if (e.key === 'Escape') {
                closeModal();
            } else if (state.currentPageImages.length > 1) {
                // Only allow arrow navigation if there's more than one image
                if (e.key === 'ArrowLeft') {
                    navigateImage(-1);
                } else if (e.key === 'ArrowRight') {
                    navigateImage(1);
                }
            }
        }
    });

    // Handle window resize for mobile/desktop switch
    window.addEventListener('resize', () => {
        applyIPhoneNativeTopScrollMode();
        updateAppViewportHeight();

        const nowMobile = isMobile();
        const switchedToMobile = nowMobile && !state.wasMobileViewport;
        const switchedToDesktop = !nowMobile && state.wasMobileViewport;

        if (switchedToMobile) {
            // Switched to mobile mode - show collapsed menu (70px)
            dom.sidebar.classList.remove('collapsed');
            dom.sidebar.classList.remove('expanded');
            dom.layout.classList.remove('menu-open');
            state.sidebarExpanded = false;
        } else if (switchedToDesktop) {
            // Switched to desktop - apply saved collapsed state
            dom.sidebar.classList.remove('expanded');
            dom.layout.classList.remove('menu-open');
            if (state.sidebarCollapsed) {
                dom.sidebar.classList.add('collapsed');
            } else {
                dom.sidebar.classList.remove('collapsed');
            }
        }

        state.wasMobileViewport = nowMobile;
    });

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateAppViewportHeight);
    }

    // Search Input
    dom.searchInput.addEventListener('input', (e) => {
        performSearch(e.target.value.toLowerCase().trim());
    });

    dom.searchInput.addEventListener('focus', () => {
        lockViewportForSearch();
    });

    dom.searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (document.activeElement !== dom.searchInput) {
                restoreViewportAfterSearch();
            }
        }, 0);
    });

    // Clear Search Button
    dom.clearBtn.addEventListener('click', () => {
        performSearch.cancel();
        dom.searchInput.value = '';
        dom.searchResults.style.display = 'none';
        dom.clearBtn.style.display = 'none';
        restoreViewportAfterSearch();
        loadSection(); // Reload current section without highlight
    });

    // Language Switcher
    dom.langButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const newLang = e.target.dataset.lang;
            if (!contentData[newLang]) return;
            if (state.lang !== newLang) {
                state.lang = newLang;
                localStorage.setItem('appLang', newLang);
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
            performSearch.cancel();
            const id = parseInt(item.dataset.id);
            const selectedQuery = dom.searchInput.value.toLowerCase().trim();
            state.currentId = id;
            dom.searchInput.value = '';
            dom.clearBtn.style.display = 'none';
            dom.searchResults.style.display = 'none';
            restoreViewportAfterSearch();
            renderMenu();
            loadSection(selectedQuery);

            // On mobile, close sidebar after selecting search result
            if (isMobile() && state.sidebarExpanded) {
                state.sidebarExpanded = false;
                applyMobileState();
            }
        }
    });
}

// Start the app
document.addEventListener('DOMContentLoaded', init);