import React from 'react';
import 'App.css';

export default class Content extends React.Component {
    setSearchTerm = () => {
        this.props.updateSearchTerm((searchTerm) => 'Content button clicked')
    }
    render() {
        return (
            <div className="Content-Container">
                <div className="Content center">
                    <h1>Content</h1>
                    <p>{this.props.searchTerm}</p>
                    {this.props.cityList ? <p>{JSON.stringify(this.props.cityList)}</p> : <p>No City List</p>}
                    <button onClick={this.setSearchTerm}>Change search term</button>
                </div>
            </div>
        )
    }
}