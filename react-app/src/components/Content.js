import React from 'react';
import 'App.css';

export default class Content extends React.Component {
    setSearchTerm = (e) => {
        this.props.updateSearchTerm((searchTerm) => e.target.value)
    }
    checkEnterPressed = (e) => {
        if (e.keyCode === 13) {
            this.props.search()
        }
    }
    getCityInfo = (index) => {
        this.props.getCityInfo(this.props.cityList._embedded['city:search-results'][index]._links['city:item'].href)
    }
    render() {
        const hero = (
            <div className="Hero-Container">
                <h1><i className="fa fa-heartbeat"> </i> Quality of Life</h1>
                <p>This application allows you to see several metrics regarding a city's quality of living.</p>
                <p>Use the search bar below or at the top to search for a city that you would like more information about.</p>
                <input
                    autoFocus
                    text="text"
                    value={this.props.searchTerm}
                    onChange={this.setSearchTerm}
                    placeholder="Search"
                    onKeyDown={this.checkEnterPressed}></input>
                <button>Search</button>
            </div>
        );
        const cityListDivs = [];
        if (this.props.cityList) {
            for (let i = 0; i < this.props.cityList._embedded['city:search-results'].length; i++) {
                cityListDivs.push(
                    <div key={'city-list-' + i.toString()} className="City-List-Item" onClick={this.getCityInfo.bind(this, i)}>
                        {this.props.cityList._embedded['city:search-results'][i].matching_full_name}
                    </div>
                )
            }
        }
        const cityList = (
            <div className="City-List-Container">
                <h1>Select the Desired City:</h1>
                <div className="List-Container">
                    {cityListDivs}
                </div>
            </div>
        );
        const activeCity = (
            this.props.activeCity ?
                <p>{JSON.stringify(this.props.activeCity)}</p> :
                <p>No City Selected</p>
        );

        // const cityImg = (
        //     this.props.cityImg ?
        //         <p>{JSON.stringify(this.props.cityImg)}</p> :
        //         <p>There is no city img</p>
        // );

        // const advancedCityData = (
        //     this.props.advancedCityData ?
        //         <p>{JSON.stringify(this.props.advancedCityData)}</p> :
        //         <p>No Advanced City Data on file</p>
        // );

        return (
            <div className="Content-Container">
                <div className="Content center">
                    {
                        this.props.cityList ?
                            this.props.activeCity ?
                                activeCity :
                                cityList :
                            hero
                    }
                </div>
            </div>
        )
    }
}