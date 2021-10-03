import React from 'react';
import 'App.css';

export default class Sidebar extends React.Component {
    clearHistory = () => {
        this.props.clearSearchHistory(() => [])
    }
    updateSearchHistoryOpen = () => {
        if (this.props.searchHistoryOpen) {
            document.getElementsByClassName('Sidebar-Container')[0].classList.add('Sidebar-Closed')
        }
        this.props.updateSearchHistoryOpen(() => !this.props.searchHistoryOpen)
    }
    search = async (e) => {
        await this.props.updateSearchTerm(() => e.target.innerText)
        this.props.search()
    }
    render() {
        const searchHistory = [];
        for (let item of this.props.searchHistory.slice().reverse()) {
            searchHistory.push(<li key={item} className="Search-History-Item" onClick={this.search}>{item}</li>)
        }
        return (
            <div className={this.props.searchHistoryOpen ? 'Sidebar-Container Sidebar-Open' : 'Sidebar-Container Sidebar-Closed'}>
                <div className="Sidebar">
                    <h3>Search History:</h3>
                    <button className="Sidebar-Clear-Button" onClick={this.clearHistory}>Clear History</button>
                    <button className="Sidebar-Close-Button" onClick={this.updateSearchHistoryOpen}>Close History</button>
                    <hr />
                    <ul>
                        {searchHistory}
                    </ul>
                </div>
            </div>
        )
    }
}