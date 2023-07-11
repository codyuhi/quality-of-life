import React from 'react';
import 'App.css';

export default class Content extends React.Component {
    index = -1;
    setSearchTerm = (e) => {
        this.props.updateSearchTerm((searchTerm) => e.target.value)
    }
    checkEnterPressed = (e) => {
        if (e.keyCode === 13) {
            this.props.search()
        }
    }
    getCityInfo = (index) => {
        this.index = index;
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
                <button onClick={this.props.search}>Search</button>
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
        let countryString = '';
        let alternateNames = '';
        if (this.props.activeCity) {
            let counter = 1;
            while (this.props.activeCity._links[`city:admin${counter}_division`]) {
                countryString += this.props.activeCity._links[`city:admin${counter}_division`].name + ', ';
                counter++;
            }
            countryString += this.props.activeCity._links['city:country'].name;
            if (this.index !== -1) {
                for (let i = 0; i < this.props.cityList._embedded['city:search-results'][this.index].matching_alternate_names.length; i++) {
                    if (i !== 0) {
                        alternateNames += ', ';
                    }
                    alternateNames += this.props.cityList._embedded['city:search-results'][this.index].matching_alternate_names[i].name;
                }
            }
        }

        const cityImg = (
            <div className="City-Image-Container">
                {
                    this.props.cityImg ?
                        <img className="City-Image"
                            src={this.props.cityImg.photos[0].image.mobile}
                            alt={`City by ${this.props.cityImg.photos[0].attribution.photographer} taken from ${this.props.cityImg.photos[0].attribution.source} under the ${this.props.cityImg.photos[0].attribution.license} license`} />
                        : <p className="Red">No Advanced Data or Images on File for {this.props.activeCity ? this.props.activeCity.name : 'This City'} <i className="fa fa-frown-o"></i></p>
                }
            </div>
        );

        const generateRating = (number) => {
            number /= 2;
            const stars = [];
            // Generate full-star ratings
            for (let i = 1; i <= number; i++) {
                stars.push(<i className="fa fa-star dark"></i>)
            }
            // Generate half-star ratings
            if (number % 1 !== 0) {
                stars.push(<i className="fa fa-star-half-o dark"></i>)
                number = Math.ceil(number)
            }
            // For the remainder of the out of five rating, generate an empty star
            for (let j = 0; j < (5 - number); j++) {
                stars.push(<i className="fa fa-star-o dark"></i>)
            }
            const rating = (
                <div className="Rating-Container">
                    <p className="Rating">
                        {stars}
                    </p>
                </div>
            );
            return rating
        }

        let advancedCityDetails = [];
        if (this.props.urbanCityDetails) {
            this.props.urbanCityDetails.categories.forEach((category) => {
                advancedCityDetails.push(<hr />)
                advancedCityDetails.push(<h3>{category.label}</h3>);
                for (let i = 0; i < category.data.length; i++) {
                    advancedCityDetails.push(<p>{`${category.data[i].label}: ${category.data[i].type === 'currency_dollar' ?
                        `$${category.data[i].currency_dollar_value}` :
                        category.data[i].type === 'percent' ?
                            `${(category.data[i].percent_value * 100).toFixed(2)}%` :
                            category.data[i].type === 'float' ?
                                typeof (category.data[i].float_value) === 'number' ?
                                    (category.data[i].float_value).toFixed(2) :
                                    category.data[i].float_value :
                                category.data[i].type === 'string' ?
                                    category.data[i].string_value :
                                    category.data[i].type === 'int' ?
                                        category.data[i].int_value :
                                        ''
                        }`}</p>)
                }
            })
        }

        const advancedCityData = (
            this.props.advancedCityData ?
                <div className="Advanced-City-Container">
                    <div className="Advanced-City-Column-Container">
                        <div className="Advanced-City-Column">
                            <p>Housing:&nbsp;{generateRating(this.props.advancedCityData.categories[0].score_out_of_10)}</p>
                            <p>Startups:&nbsp;{generateRating(this.props.advancedCityData.categories[2].score_out_of_10)}</p>
                            <p>Travel Connectivity:&nbsp;{generateRating(this.props.advancedCityData.categories[4].score_out_of_10)}</p>
                            <p>Business Freedom:&nbsp;{generateRating(this.props.advancedCityData.categories[6].score_out_of_10)}</p>
                            <p>Healthcare:&nbsp;{generateRating(this.props.advancedCityData.categories[8].score_out_of_10)}</p>
                            <p>Environmental Quality:&nbsp;{generateRating(this.props.advancedCityData.categories[10].score_out_of_10)}</p>
                            <p>Taxation:&nbsp;{generateRating(this.props.advancedCityData.categories[12].score_out_of_10)}</p>
                        </div>
                        <div className="Advanced-City-Column">
                            <p>Cost of Living:&nbsp;{generateRating(this.props.advancedCityData.categories[1].score_out_of_10)}</p>
                            <p>Venture Capital:&nbsp;{generateRating(this.props.advancedCityData.categories[3].score_out_of_10)}</p>
                            <p>Commute:&nbsp;{generateRating(this.props.advancedCityData.categories[5].score_out_of_10)}</p>
                            <p>Safety:&nbsp;{generateRating(this.props.advancedCityData.categories[7].score_out_of_10)}</p>
                            <p>Education:&nbsp;{generateRating(this.props.advancedCityData.categories[9].score_out_of_10)}</p>
                            <p>Economy:&nbsp;{generateRating(this.props.advancedCityData.categories[11].score_out_of_10)}</p>
                            <p>Internet Access:&nbsp;{generateRating(this.props.advancedCityData.categories[13].score_out_of_10)}</p>
                        </div>
                    </div>
                    <div className="Advanced-City-Details">
                        {advancedCityDetails}
                    </div>
                </div> :
                ''
        );

        const activeCity = (
            this.props.activeCity ? <div className="Active-City-Container">
                {cityImg}
                <h1>{JSON.stringify(this.props.activeCity.name).substring(1, this.props.activeCity.name.length + 1)}</h1>
                <div className="Active-City-Column-Container">
                    <div className="Active-City-Column">
                        <p>
                            <i className="fa fa-globe"></i> {countryString ? countryString : 'No data on file'}
                        </p>
                        <p>
                            <i className="fa fa-clock-o"></i> Timezone: {
                                this.props.activeCity._links['city:timezone'] ?
                                    JSON.stringify(this.props.activeCity._links['city:timezone'].name)
                                        .substring(1, this.props.activeCity._links['city:timezone'].name.length + 1) :
                                    <span className="Red">No Data on File</span>}
                        </p>
                        <p>
                            <i className="fa fa-building-o"></i> Urban Area: {
                                this.props.activeCity._links['city:urban_area'] ?
                                    JSON.stringify(this.props.activeCity._links['city:urban_area'].name)
                                        .substring(1, this.props.activeCity._links['city:urban_area'].name.length + 1) :
                                    <span className="Red">No Urban Area Data on File</span>
                            }
                        </p>
                    </div>
                    <div className="Active-City-Column">
                        <p>
                            <i className="fa fa-id-badge"></i> Alternate Names: {
                                alternateNames ? alternateNames : <span className="Red">No Alternate Names on File</span>
                            }
                        </p>
                        <p>
                            <i className="fa fa-map-marker"></i> Latitude: {this.props.activeCity.location.latlon.latitude}° N, Longitude: {this.props.activeCity.location.latlon.longitude}° E
                        </p>
                        <p>
                            <i className="fa fa-users"></i> Population: {new Intl.NumberFormat('en-US').format(this.props.activeCity.population)}
                        </p>
                    </div>
                </div>
                {advancedCityData ? advancedCityData : ''}
            </div> :
                hero
        );



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
                    <p className={this.props.activeError ? "Error-Display-Active" : "Error-Display-Inactive"}>{this.props.activeError}</p>
                    <p className="Footer">&copy; Copyright Cody Uhi 2021</p>
                </div>
            </div>
        )
    }
}