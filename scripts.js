import { authors, books, BOOKS_PER_PAGE, genres } from './data.js';

let page = 1;
let matches = books;

// Utility Functions
/**
 * Creates HTML elements within the specified tag, class, attributes, and innerHTML.
 * @param {string} tag - HTML tag for the element.
 * @param {string} className -  Class name for the element.
 * @param {Object} [attributes={}] - Attributes to set on the element.
 * @param {string} [innerHTML=''] - InnerHTML to set on the element.
 * @returns {HTMLElement} The created HTML element.
 */

const createElement = (tag, className, attributes = {}, innerHTML = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }
    element.innerHTML = innerHTML;
    return element;
};

/**
 * Updates the theme colors based on the provided theme.
 */
const updateTheme = (theme) => {
    if (theme === 'night') {
        document.documentElement.style.setProperty('--color-dark', '255, 255, 255');
        document.documentElement.style.setProperty('--color-light', '10, 10, 20');
    } else {
        document.documentElement.style.setProperty('--color-dark', '10, 10, 20');
        document.documentElement.style.setProperty('--color-light', '255, 255, 255');
    }
};
/**
 * Creating dropdown options from provided data.
 */
const createOptions = (data, defaultOptionText) => {
    const fragment = document.createDocumentFragment();
    const firstElement = createElement('option', '', { value: 'any' }, defaultOptionText);
    fragment.appendChild(firstElement);
    for (const [id, name] of Object.entries(data)) {
        const option = createElement('option', '', { value: id }, name);
        fragment.appendChild(option);
    }
    return fragment;
};
/**
 * Updating the show more button based on the current state.
 */
const updateButton = (button, disabled, remaining) => {
    button.disabled = disabled;
    button.innerHTML = `
        <span>Show more</span>
        <span class="list__remaining"> (${remaining > 0 ? remaining : 0})</span>
    `;
};

/**
 * Rendering a list of books into the specified container.
 */
const renderBooks = (booksList, container) => {
    const fragment = document.createDocumentFragment();
    for (const { author, id, image, title } of booksList) {
        const element = createElement('button', 'preview', { 'data-preview': id }, `
            <img class="preview__image" src="${image}" />
            <div class="preview__info">
                <h3 class="preview__title">${title}</h3>
                <div class="preview__author">${authors[author]}</div>
            </div>
        `);
        fragment.appendChild(element);
    }
    container.innerHTML = '';
    container.appendChild(fragment);
};

// Initialization
const init = () => {
    // Render books preview
    renderBooks(matches.slice(0, BOOKS_PER_PAGE), document.querySelector('[data-list-items]'));

    // Populating genre and author dropdowns
    document.querySelector('[data-search-genres]').appendChild(createOptions(genres, 'All Genres'));
    document.querySelector('[data-search-authors]').appendChild(createOptions(authors, 'All Authors'));

    // Setting the theme  
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.querySelector('[data-settings-theme]').value = prefersDarkMode ? 'night' : 'day';
    updateTheme(prefersDarkMode ? 'night' : 'day');

    // Update button
    const remainingBooks = books.length - BOOKS_PER_PAGE;
    updateButton(document.querySelector('[data-list-button]'), remainingBooks < 1, remainingBooks);

    // Event Listeners
    document.querySelector('[data-search-cancel]').addEventListener('click', () => document.querySelector('[data-search-overlay]').open = false);
    document.querySelector('[data-settings-cancel]').addEventListener('click', () => document.querySelector('[data-settings-overlay]').open = false);
    document.querySelector('[data-header-search]').addEventListener('click', () => {
        document.querySelector('[data-search-overlay]').open = true;
        document.querySelector('[data-search-title]').focus();
    });
    document.querySelector('[data-header-settings]').addEventListener('click', () => document.querySelector('[data-settings-overlay]').open = true);
    document.querySelector('[data-list-close]').addEventListener('click', () => document.querySelector('[data-list-active]').open = false);

    document.querySelector('[data-settings-form]').addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const { theme } = Object.fromEntries(formData);
        updateTheme(theme);
        document.querySelector('[data-settings-overlay]').open = false;
    });

    document.querySelector('[data-search-form]').addEventListener('submit', handleSearch);
    document.querySelector('[data-list-button]').addEventListener('click', loadMoreBooks);
    document.querySelector('[data-list-items]').addEventListener('click', handleBookClick);
};
/**
 * Handles search form submission, applies filters, and updates book list.
 */
const handleSearch = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const filters = Object.fromEntries(formData);
    matches = books.filter(book => {
        const genreMatch = filters.genre === 'any' || book.genres.includes(filters.genre);
        return (filters.title.trim() === '' || book.title.toLowerCase().includes(filters.title.toLowerCase())) &&
               (filters.author === 'any' || book.author === filters.author) &&
               genreMatch;
    });
    page = 1;
    renderBooks(matches.slice(0, BOOKS_PER_PAGE), document.querySelector('[data-list-items]'));
    updateButton(document.querySelector('[data-list-button]'), (matches.length - (page * BOOKS_PER_PAGE)) < 1, matches.length - (page * BOOKS_PER_PAGE));
    document.querySelector('[data-list-message]').classList.toggle('list__message_show', matches.length < 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('[data-search-overlay]').open = false;
};

/**
 * Allows us to load more books and update the view accordingly.
 */
const loadMoreBooks = () => {
    const start = page * BOOKS_PER_PAGE;
    const end = (page + 1) * BOOKS_PER_PAGE;
    renderBooks(matches.slice(start, end), document.querySelector('[data-list-items]'));
    page += 1;
    const remainingBooks = matches.length - (page * BOOKS_PER_PAGE);
    updateButton(document.querySelector('[data-list-button]'), remainingBooks < 1, remainingBooks);
};

/**
 * Handles click events on book elements to show detailed view.
 */
const handleBookClick = (event) => {
    const pathArray = Array.from(event.path || event.composedPath());
    const clickedElement = pathArray.find(node => node?.dataset?.preview);
    if (clickedElement) {
        const activeBook = books.find(book => book.id === clickedElement.dataset.preview);
        if (activeBook) {
            document.querySelector('[data-list-active]').open = true;
            document.querySelector('[data-list-blur]').src = activeBook.image;
            document.querySelector('[data-list-image]').src = activeBook.image;
            document.querySelector('[data-list-title]').innerText = activeBook.title;
            document.querySelector('[data-list-subtitle]').innerText = `${authors[activeBook.author]} (${new Date(activeBook.published).getFullYear()})`;
            document.querySelector('[data-list-description]').innerText = activeBook.description;
        }
    }
};

// Initialize the application
init();
