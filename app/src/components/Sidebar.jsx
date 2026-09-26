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
        // Remove only the history key; clearing all storage would also wipe the theme preference.
        localStorage.removeItem('history');
    };

    const handleCloseHistory = () => {
        updateSearchHistoryOpen(false);
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
                <i className="fa fa-history" style={{ marginRight: '8px', opacity: 0.6 }}></i>
                <span>{item}</span>
            </li>
        ));

    return (
        <>
            {searchHistoryOpen && (
                <div 
                    className="Sidebar-Backdrop" 
                    onClick={handleCloseHistory}
                    aria-hidden="true"
                />
            )}
            <div className={searchHistoryOpen ? 'Sidebar-Container Sidebar-Open' : 'Sidebar-Container Sidebar-Closed'}>
                <div className="Sidebar">
                    <div className="Sidebar-Header">
                        <h3>Search History</h3>
                        <button 
                            className="Sidebar-Close-Icon-Btn" 
                            onClick={handleCloseHistory}
                            aria-label="Close search history"
                            type="button"
                        >
                            <i className="fa fa-times"></i>
                        </button>
                    </div>
                    <button className="Sidebar-Clear-Button" onClick={clearHistory}>
                        <i className="fa fa-trash-o"></i> Clear History
                    </button>
                    <button className="Sidebar-Close-Button" onClick={handleCloseHistory}>
                        Close History
                    </button>
                    <hr />
                    {renderedHistory.length > 0 ? (
                        <ul>
                            {renderedHistory}
                        </ul>
                    ) : (
                        <p className="Sidebar-Empty">No search history yet.</p>
                    )}
                </div>
            </div>
        </>
    );
}