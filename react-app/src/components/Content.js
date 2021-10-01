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
        const cityList = (
            this.props.cityList ?
                <p>{JSON.stringify(this.props.cityList)}</p> :
                <p>No City List</p>);
        const activeCity = (
            this.props.activeCity ?
                <p>{JSON.stringify(this.props.activeCity)}</p> :
                <p>No City Selected</p>
        );

        const cityImg = (
            this.props.cityImg ?
                <p>{JSON.stringify(this.props.cityImg)}</p> :
                <p>There is no city img</p>
        );

        const advancedCityData = (
            this.props.advancedCityData ?
                <p>{JSON.stringify(this.props.advancedCityData)}</p> :
                <p>No Advanced City Data on file</p>
        );

        return (
            <div className="Content-Container">
                <div className="Content center">
                    <h1>Content</h1>
                    <p>{this.props.searchTerm}</p>
                    <h2>City List:</h2>
                    {cityList}
                    <h2>City Data:</h2>
                    {activeCity}
                    <h2>City Image:</h2>
                    {cityImg}
                    <h2>Advanced City Data</h2>
                    {advancedCityData}
                    <button onClick={this.setSearchTerm}>Change search term</button>
                    <button onClick={this.getCityInfo}>Get data for first city</button>
                </div>
            </div>
        )
    }
}