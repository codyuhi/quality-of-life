import React from 'react';
import 'App.css';

export default class Navbar extends React.Component {
    setSearchTerm = () => {
        this.props.updateSearchTerm((searchTerm) => 'Navbar button clicked')
    }
    render() {
        return (
            <div className="Navbar-Container">
                <div className="Navbar center">
                    <h1>Navbar</h1>
                    <p>{this.props.searchTerm}</p>
                    <button onClick={this.setSearchTerm}>Change search term</button>
                </div>
            </div>
        )
    }
}