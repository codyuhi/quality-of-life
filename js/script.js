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
 * This function performs the search functionality/logic to query the first endpoint that is featured in this app
 *  - Endpoint 1: GET list of cities by city name (more detail in the getCityList function)
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
    document.getElementById('loading-indicator').style.display = 'block';

    try {
        await getCityList(searchText);
        document.getElementById('searchbar-content-container').style.display = 'none';
        document.getElementById('results-content').style.display = 'none';
        document.getElementById('loading-indicator').style.display = 'none';
        document.getElementById('results-content-container').style.display = 'flex';
        document.getElementById('results-city-list').innerHTML = '';
        document.getElementById('adv-urban-area-detail-container').innerHTML = '';
        document.getElementById('location-image').innerHTML = '';
        document.getElementById('results-city-list-container').style.display = 'flex';
        document.getElementById('middle-container').style.height = '90vh';
        document.getElementById('results-city-list').style.removeProperty('height');
        document.getElementById('footer-container').style.height = '100px';
        updateSearchHistory(searchText);
    } catch (err) {
        document.getElementById('loading-indicator').style.display = 'none';
        populateErrorMessage(err);
    }
    if ((isMobile() || isTablet()) && document.getElementById('nav-toggler').getAttribute('aria-expanded') === 'true') {
        document.getElementById('nav-toggler').click();
    }
}

/**
 * This 
 * @param {string} value 
 */
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
                btn.onclick = function () { getCityInfo(city._links['city:item'].href, i) }
                resultsCityList.appendChild(btn);
            }
        })
        .catch((err) => {
            clearContent();
            populateErrorMessage(err);
        });
}

async function getCityInfo(cityURL, index) {
    fetch(cityURL)
        .then((response) => {
            return response.json();
        })
        .then((json) => {
            const cachedCity = JSON.parse(localStorage.queryResponse)._embedded['city:search-results'][index];
            document.getElementById('results-city-list-container').style.display = 'none';
            document.getElementById('results-content').style.display = 'block';
            document.getElementById('location-name').innerHTML = `<h2>${json.name}</h2>`;
            let counter = 1;
            let countryString = '';
            while (json._links[`city:admin${counter}_division`]) {
                countryString += json._links[`city:admin${counter}_division`].name + ', ';
                counter++;
            }
            countryString += json._links['city:country'].name;
            document.getElementById('country-info').innerHTML = countryString ? `<p><i class="fa fa-globe dark"></i> ${countryString}</p>` : '';
            document.getElementById('timezone-info').innerHTML = json._links['city:timezone'] ? `<p><i class="fa fa-clock-o dark"></i> Timezone: ${json._links['city:timezone'].name}</p>` : '';
            if (json._links['city:urban_area']) {
                document.getElementById('urban-area-info').innerHTML = `<p><i class="fa fa-building-o dark"></i> Urban Area: ${json._links['city:urban_area'].name}</p>`;
                document.getElementById('missing-urban-area-message').style.display = 'none';
            } else {
                document.getElementById('urban-area-info').innerHTML = '';
                document.getElementById('missing-urban-area-message').style.display = 'block';
            }
            let altNames = '';
            for (let i = 0; i < cachedCity.matching_alternate_names.length; i++) {
                if (i !== 0) {
                    altNames += ', ';
                }
                altNames += cachedCity.matching_alternate_names[i].name;
            }
            document.getElementById('alternate-names-info').innerHTML = altNames ? `<p><i class="fa fa-id-badge dark"></i> Alternate Names: ${altNames}</p>` : '';
            document.getElementById('latitude-longitude-info').innerHTML = json.location ? `<p><i class="fa fa-map-marker dark"></i> Latitude: ${json.location.latlon.latitude}, Longitude: ${json.location.latlon.longitude}</p>` : '';
            document.getElementById('population').innerHTML = json.population ? `<p><i class="fa fa-users dark"></i> Population: ${json.population}</p>` : '';
            if (json._links['city:urban_area']) {
                getUrbanAreaImg(json._links['city:urban_area'].href);
                getAdvCityInfo(json._links['city:urban_area'].href);
                document.getElementById('adv-location-info-container').style.display = 'flex';
            } else {
                document.getElementById('adv-location-info-container').style.display = 'none';
            }
        })
        .catch((err) => {
            clearContent();
            populateErrorMessage(err);
        });
}

async function getAdvCityInfo(urbanAreaUrl) {
    const url = urbanAreaUrl + 'scores';
    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((json) => {
            document.getElementById('housing-rating').innerHTML = '';
            document.getElementById('housing-rating').appendChild(generateRating(json.categories[0].score_out_of_10, 'Housing'));
            document.getElementById('startups-rating').innerHTML = '';
            document.getElementById('startups-rating').appendChild(generateRating(json.categories[2].score_out_of_10, 'Startups'));
            document.getElementById('travel-connectivity-rating').innerHTML = '';
            document.getElementById('travel-connectivity-rating').appendChild(generateRating(json.categories[4].score_out_of_10, 'Travel Connectivity'));
            document.getElementById('business-freedom-rating').innerHTML = '';
            document.getElementById('business-freedom-rating').appendChild(generateRating(json.categories[6].score_out_of_10, 'Business Freedom'));
            document.getElementById('healthcare-rating').innerHTML = '';
            document.getElementById('healthcare-rating').appendChild(generateRating(json.categories[8].score_out_of_10, 'Healthcare'));
            document.getElementById('environmental-quality-rating').innerHTML = '';
            document.getElementById('environmental-quality-rating').appendChild(generateRating(json.categories[10].score_out_of_10, 'Environmental Quality'));
            document.getElementById('taxation-rating').innerHTML = '';
            document.getElementById('taxation-rating').appendChild(generateRating(json.categories[12].score_out_of_10, 'Taxation'));
            document.getElementById('cost-of-living-rating').innerHTML = '';
            document.getElementById('cost-of-living-rating').appendChild(generateRating(json.categories[1].score_out_of_10, 'Cost of Living'));
            document.getElementById('venture-capital-rating').innerHTML = '';
            document.getElementById('venture-capital-rating').appendChild(generateRating(json.categories[3].score_out_of_10, 'Venture Capital'));
            document.getElementById('commute-rating').innerHTML = '';
            document.getElementById('commute-rating').appendChild(generateRating(json.categories[5].score_out_of_10, 'Commute'));
            document.getElementById('safety-rating').innerHTML = '';
            document.getElementById('safety-rating').appendChild(generateRating(json.categories[7].score_out_of_10, 'Safety'));
            document.getElementById('education-rating').innerHTML = '';
            document.getElementById('education-rating').appendChild(generateRating(json.categories[9].score_out_of_10, 'Education'));
            document.getElementById('economy-rating').innerHTML = '';
            document.getElementById('economy-rating').appendChild(generateRating(json.categories[11].score_out_of_10, 'Economy'));
            document.getElementById('internet-access').innerHTML = '';
            document.getElementById('internet-access').appendChild(generateRating(json.categories[13].score_out_of_10, 'Internet Access'));
            getUrbanAreaDetails(urbanAreaUrl);
        })
        .catch((err) => {
            clearContent();
            populateErrorMessage(err);
        })
}

async function getUrbanAreaDetails(urbanAreaUrl) {
    const url = urbanAreaUrl + 'details';
    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((json) => {
            const urbanAreaDetailContainer = document.getElementById('adv-urban-area-detail-container');
            json.categories.forEach((category) => {
                const div = document.createElement('div');
                const h3 = document.createElement('h3');
                h3.appendChild(document.createTextNode(category.label));
                h3.classList.add('urban-area-category-label');
                div.appendChild(h3);
                for (let i = 0; i < category.data.length; i++) {
                    const childDiv = document.createElement('div');
                    // childDiv.classList.add('flex-row');
                    const p = document.createElement('p');
                    let text = category.data[i].label + ': ';
                    if (category.data[i].type === 'currency_dollar') {
                        text += `$${category.data[i].currency_dollar_value}`;
                    } else if (category.data[i].type === 'percent') {
                        text += `${(category.data[i].percent_value * 100).toFixed(2)}%`;
                    } else if (category.data[i].type === 'float') {
                        if (typeof (category.data[i].float_value) === 'number') {
                            text += (category.data[i].float_value).toFixed(2);
                        } else {
                            text += category.data[i].float_value
                        }
                    } else if (category.data[i].type === 'string') {
                        text += category.data[i].string_value;
                    } else if (category.data[i].type === 'int') {
                        text += category.data[i].int_value;
                    } else {
                        continue;
                    }
                    p.appendChild(document.createTextNode(text));
                    div.appendChild(p);
                }
                document.getElementById('adv-urban-area-detail-container').appendChild(div);
            });
        })
        .catch((err) => {
            clearContent();
            populateErrorMessage(err);
        })
}

function getUrbanAreaImg(urbanAreaUrl) {
    const url = urbanAreaUrl + 'images';
    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((json) => {
            if(json.photos && json.photos.length < 1) {
                return;
            }
            const img = document.createElement('img');
            img.src = json.photos[0].image.mobile;
            img.alt = `Photo of the city by ${json.photos[0].attribution.photographer} taken from ${json.photos[0].attribution.source} under the ${json.photos[0].attribution.license} license`;
            img.id = 'city-img';
            document.getElementById('location-image').appendChild(img);
        })
        .catch((err) => {
            clearContent();
            populateErrorMessage(err);
        })
}

function generateRating(number, ratingName) {
    number /= 2;
    const div = document.createElement('div');
    div.classList.add('rating-div');
    const ratingNameDiv = document.createElement('p');
    ratingNameDiv.classList.add('rating-name');
    ratingNameDiv.appendChild(document.createTextNode(`${ratingName}: `));
    for (let i = 1; i <= number; i++) {
        const star = document.createElement('i');
        star.classList.add('fa', 'fa-star', 'dark');
        ratingNameDiv.appendChild(star);
    }
    if (number % 1 !== 0) {
        const halfStar = document.createElement('i');
        halfStar.classList.add('fa', 'fa-star-half-o', 'dark');
        ratingNameDiv.appendChild(halfStar);
        number = Math.ceil(number);
    }
    for (let j = 0; j < (5 - number); j++) {
        const emptyStar = document.createElement('i');
        emptyStar.classList.add('fa', 'fa-star-o', 'dark');
        ratingNameDiv.appendChild(emptyStar);
    }
    div.appendChild(ratingNameDiv);
    return div;
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
        errElement.style.display = 'block';
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
        populateErrorMessage();
        return;
    }
    document.getElementById('results-content-container').style.display = 'none';
    document.getElementById('results-content').style.display = 'none';
    document.getElementById('searchbar-content-container').style.display = 'block';
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