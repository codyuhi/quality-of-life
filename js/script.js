/**
 * This listener executes its code when the page is finished loading
 * It will create event listeners for the search input boxes when the user types stuff in there
 * It will also populate the search history with the content that is in localstorage
 */
window.addEventListener('load', function () {
    const searchForm = document.getElementById('search-text');
    searchForm.addEventListener('keyup', (event) => { searchListenerFunction(event, 'searchForm') });
    const mainContentSearchForm = document.getElementById('main-content-search-text');
    mainContentSearchForm.addEventListener('keyup', (event) => { searchListenerFunction(event, 'mainContentSearchForm') });
    populateSearchHistory();
});

window.onresize = (event) => {
    document.getElementById('sidebar-container').style.width === '250px' ?
        openSideBar() : closeSideBar();
    document.getElementById('footer-container').style.width = '100vw';
}

/**
 * This code block sets up an event listener for the Enter key on the search input
 * If the user presses the Enter key, this code block will call the search function
 * This allows the user to press enter in addition to pressing the search button
 * It also syncs the user's input to be consistent across both search boxes
 */
function searchListenerFunction(event, form) {
    let code;
    // These if statements allow for the key code to be accessed with cross-browser support
    if (event.keyCode !== undefined) {
        code = event.keyCode;
    } else if (event.keyIdentifier !== undefined) {
        code = event.keyIdentifier;
    } else if (event.key !== undefined) {
        code = event.key;
    }
    // The Enter key's keycode is 13, 
    // so if the user pressed the enter key, call the search function
    if (code === 13) {
        search();
    } else if (form === 'searchForm') {
        // If the listener was triggered by the search form in the navbar, set the main search form to the navbar content
        document.getElementById('main-content-search-text').value = document.getElementById('search-text').value;
    } else if (form === 'mainContentSearchForm') {
        // If the listener was triggered by the search form in the main content, set the navbar search form to the main content
        document.getElementById('search-text').value = document.getElementById('main-content-search-text').value;
    }
}

/**
 * This function performs the search functionality/logic to query all the endpoints that are required to support search functionality
 * The endpoints that are hit in the search process are (atleast 3):
 *  - Endpoint 1
 *  - Endpoint 2
 *  - Endpoint 3
 */
async function search(entry) {
    populateErrorMessage();
    closeSideBar();
    let searchText;
    entry ? searchText = entry : searchText = document.getElementById('search-text').value;
    if (!searchText) {
        clearContent();
        populateErrorMessage('Please enter something in the search box ');
        return;
    }

    try {
        await getCityList(searchText);
        document.getElementById('searchbar-content-container').style.display = 'none';
        document.getElementById('results-content-container').style.display = 'flex';
        console.log('middle height', document.getElementById('middle-container').offsetHeight);
        console.log('results height', document.getElementById('results-content-container').offsetHeight)
        if (document.getElementById('middle-container').clientHeight < document.getElementById('results-content-container').clientHeight) {
            document.getElementById('middle-container').style.height = '100%';
            document.getElementById('results-city-list').style.height = '100%';
        } else {
            document.getElementById('middle-container').style.height = '90vh';
            document.getElementById('results-city-list').style.removeProperty('height');
        }
        document.getElementById('footer-container').style.height = '100px';
        updateSearchHistory(searchText);
    } catch (err) {
        populateErrorMessage(err);
    }
    if ((isMobile() || isTablet()) && document.getElementById('nav-toggler').getAttribute('aria-expanded') === 'true') {
        document.getElementById('nav-toggler').click();
    }
}

function getCityList(value) {
    const url = `https://api.teleport.org/api/cities/?search=${value}&limit=10`;
    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((json) => {
            if (json.count < 1) {
                throw `No cities found with the name "${value}"`;
            }
            localStorage.queryResponse = JSON.stringify(json);
            const resultsCityList = document.getElementById('results-city-list');
            resultsCityList.innerHTML = '';
            for (let i = 0; i < json._embedded['city:search-results'].length; i++) {
                const city = json._embedded['city:search-results'][i];
                const btn = document.createElement('button');
                const text = document.createTextNode(city.matching_full_name);
                btn.appendChild(text);
                btn.classList.add('btn');
                btn.classList.add('my-2');
                btn.classList.add('my-sm-0');
                btn.classList.add('city-list-button');
                btn.onclick = function () { getCityInfo(city._links['city:item'].href) }
                resultsCityList.appendChild(btn);
                console.log(city.matching_full_name);
                console.log(i);
            }
        })
        .catch((err) => {
            clearContent();
            populateErrorMessage(err);
        });
}

function getCityInfo(cityURL) {
    console.log(cityURL);
}

/**
 * This function updates the search history to include another entry
 */
function updateSearchHistory(newEntry) {
    let searchHistory;
    if (!localStorage.searchHistory) {
        searchHistory = [];
    } else {
        searchHistory = JSON.parse(localStorage.searchHistory);
    }
    searchHistory.unshift(newEntry);
    localStorage.searchHistory = JSON.stringify(searchHistory);
    populateSearchHistory();
}

/**
 * This function clears the search history
 */
function clearHistory() {
    localStorage.removeItem('searchHistory');
    document.getElementById('sidebar-search-history').innerHTML = '';
}

function populateSearchHistory() {
    if (!localStorage.searchHistory) {
        return;
    }
    let searchHistory = JSON.parse(localStorage.searchHistory);
    const ul = document.createElement('ul');
    searchHistory.forEach((item) => {
        const li = document.createElement('li');
        const text = document.createTextNode(item);
        li.appendChild(text);
        li.classList.add('search-entry');
        li.onclick = function () { search(item) }
        ul.appendChild(li);
    });
    document.getElementById('sidebar-search-history').innerHTML = '';
    document.getElementById('sidebar-search-history').appendChild(ul);
}

/**
 * This function populates an error message and can be called on failed API calls to show what went wrong
 */
function populateErrorMessage(err) {
    const errElement = document.getElementById('error-message');
    if (!err) {
        errElement.innerHTML = '';
        errElement.style.display = 'none';
    } else {
        errElement.innerText = `Error: ${err}`;
        errElement.style.display = 'flex';
    }
}

/**
 * This function clears the current search result off the screen and returns the content to be the default search prompt
 */
function clearContent() {
    if ((isMobile() || isTablet()) && document.getElementById('nav-toggler').getAttribute('aria-expanded') === 'true') {
        document.getElementById('nav-toggler').click();
    }
    // If there is no active search result on the screen, don't do anything
    if (document.getElementById('searchbar-content-container').style.display !== 'none') {
        return;
    }
    document.getElementById('results-content-container').style.display = 'none';
    document.getElementById('searchbar-content-container').style.display = 'flex';
    document.getElementById('middle-container').style.height = '90vh';
    document.getElementById('footer-container').style.height = '100px';
}

/**
 * This function closes the sidebar if it's open, and opens the sidebar if it's closed
 */
function toggleSideBar() {
    document.getElementById('sidebar-container').style.width === '250px' ?
        closeSideBar() : openSideBar();
    if (isMobile() || isTablet()) {
        document.getElementById('nav-toggler').click();
    }
}

/**
 * This function opens the sidebar for the user to view search history
 */
function openSideBar() {
    document.getElementById('sidebar-container').style.width = '250px';
    document.getElementById('content-container').style.marginLeft = '250px';
    document.getElementById('content-container').style.width = `${document.getElementById('middle-container').clientWidth - 250}px`;
}

/**
 * This function closes the sidebar for the user to hide search history
 */
function closeSideBar() {
    document.getElementById('sidebar-container').style.width = '0';
    document.getElementById('content-container').style.marginLeft = '0';
    document.getElementById('content-container').style.width = '100vw';
}

/**
 * This code block allows for easy determining of what kind of device the user is using
 */
const mobileMaxPixels = 620;
const desktopMinPixels = 992;
function isMobile() {
    return (window.innerWidth !== undefined) ?
        window.innerWidth < mobileMaxPixels :
        document.documentElement.clientWidth < mobileMaxPixels;
}
function isTablet() {
    return (window.innerWidth !== undefined) ?
        (window.innerWidth >= mobileMaxPixels && window.innerWidth < desktopMinPixels) :
        (document.documentElement.clientWidth >= mobileMaxPixels && document.documentElement.clientWidth < desktopMinPixels);
}
function isPC() {
    return (window.innerWidth !== undefined) ?
        window.innerWidth >= desktopMinPixels :
        document.documentElement.clientWidth >= desktopMinPixels;
}