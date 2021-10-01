import React from 'react';
import 'App.css';

export default class Content extends React.Component {
    setSearchTerm = () => {
        this.props.updateSearchTerm((searchTerm) => 'Content button clicked')
    }
    getCityInfo = () => {
        this.props.getCityInfo(this.props.cityList._embedded['city:search-results'][0]._links['city:item'].href)
    }
    render() {
        return (
            <div className="Content-Container">
                <div className="Content center">
                    <h1>Content</h1>
                    <p>{this.props.searchTerm}</p>
                    {this.props.cityList ? <p>{JSON.stringify(this.props.cityList)}</p> : <p>No City List</p>}
                    {this.props.activeCity ? <p>{JSON.stringify(this.props.activeCity)}</p> : <p>No City Selected</p>}
                    <button onClick={this.setSearchTerm}>Change search term</button>
                    <button onClick={this.getCityInfo}>Get data for first city</button>
                </div>
            </div>
        )
    }
}