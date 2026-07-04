import React from 'react';
import '../App.css';

export default function Sidebar({
    clearSearchHistory,
    searchHistoryOpen,
    updateSearchHistoryOpen,
    updateSearchTerm,
    search,
    searchHistory
}) {
    const clearHistory = () => {
        clearSearchHistory([]);
        localStorage.clear();
    };

    const handleCloseHistory = () => {
        updateSearchHistoryOpen(!searchHistoryOpen);
    };

    const handleHistoryClick = (e) => {
        const text = e.target.innerText;
        updateSearchHistoryOpen(false);
        updateSearchTerm(text);
        search(text);
    };

    const renderedHistory = searchHistory
        .slice()
        .reverse()
        .map((item) => (
            <li key={item} className="Search-History-Item" onClick={handleHistoryClick}>
                {item}
            </li>
        ));

    return (
        <div className={searchHistoryOpen ? 'Sidebar-Container Sidebar-Open' : 'Sidebar-Container Sidebar-Closed'}>
            <div className="Sidebar">
                <h3>Search History:</h3>
                <button className="Sidebar-Clear-Button" onClick={clearHistory}>
                    Clear History
                </button>
                <button className="Sidebar-Close-Button" onClick={handleCloseHistory}>
                    Close History
                </button>
                <hr />
                <ul>
                    {renderedHistory}
                </ul>
            </div>
        </div>
    );
}