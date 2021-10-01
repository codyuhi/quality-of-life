import React from 'react';
import 'App.css';

export default class Sidebar extends React.Component {
    clearHistory = () => {

    }
    render() {
        const searchHistory = (
            this.props.searchHistory.length > 0 ?
                <p>{JSON.stringify(this.props.searchHistory)}</p> :
                <p>Nothing here</p>
        );
        return (
            <div className="Sidebar-Container">
                <div className="Sidebar">
                    <h3>Search History:</h3>
                    <button className="Sidebar-Clear-Button" onClick={this.clearHistory}></button>
                    {searchHistory}
                </div>
            </div>
        )
    }
}