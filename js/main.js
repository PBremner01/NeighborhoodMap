//***********************************************************************************************************
//   Udacity Neighborhood Map project
//     by Philip Bremner
//     02/27/2018
//***********************************************************************************************************

// These are the locations that will be shown to the user.
/*jshint esversion: 6 */

"use strict()";

var locations = [
  { id: 0, title: "Park Ave Penthouse", location: { lat: 40.7713024, lng: -73.9632393 }, marker },
  { id: 1, title: "Chelsea Loft", location: { lat: 40.7444883, lng: -73.9949465 }, marker },
  { id: 2, title: "Union Square Open Floor Plan", location: { lat: 40.7347062, lng: -73.9895759 }, marker },
  { id: 3, title: "East Village Hip Studio", location: { lat: 40.7281777, lng: -73.984377 }, marker },
  { id: 4, title: "The Museum of Modern Art", location: { lat: 40.7614367, lng: -73.9798103 }, marker },
  { id: 5, title: "Broadway Theatre", location: { lat: 40.7632245, lng: -73.98275 }, marker }
];

// Global variables
var marker, infowindow, currentLoc = "";
var map, FSClientID, FSClientSecret;
var markers = [];

var Loc = function (data) {
    this.title = data.title;
    this.location = data.location;
    this.id = data.id;
};


// Knockout MVVM functionality
var ViewModel = function () {
    var self = this;

    //Load the filter domain list
    self.filterLoc = ko.observableArray([]);
    locations.forEach(function (loc) {
        self.filterLoc.push(loc.title);
    });
    // Applies to the filter
    this.selectedLocs = ko.observable([]);

    //Creates an empty array to hold location objects
    this.locationsList = ko.observableArray([]);
    locations.forEach(function (locItem) {
        self.locationsList.push(new Loc(locItem));
        self.id = locItem.id;
    });

    //this.currentLoc = ko.observable(this.locationsList()[0]);
    this.GetCurrentLocID = function () {
        self.id();
    };

    this.populateFSInfoWindow = function (item) {

        for (var i = 0; i < markers.length; i++) {
            markers[i].setAnimation(null);
        }

        var lv_id = item.id.valueOf();
        //currentLoc = lv_id();
        currentLoc = lv_id;
        ShowInfoWindow();
        toggleBounce();
    };

    this.filterLocations = function () {

        var lv_index = locations.length - 1;
        var lv_found = 0;

        hideListings();
        this.locationsList.removeAll();
        locations.forEach(function (locItem) {
            self.locationsList.push(new Loc(locItem));
        });

        //Need to adjust the deletion index for decrementing 
        for (var i = lv_index; i >= 0; i--) {
            var ls_location = this.locationsList()[i];
            lv_found = 0;
            for (var j = 0; j < this.selectedLocs().length; j++) {
                if (ls_location.title == this.selectedLocs()[j]) {
                    lv_found = 1;
                    break;
                }
            }
            if (lv_found != 1) {
                this.locationsList.remove(ls_location);
                locations[i].marker = null;
            }
        }

        showListings();

    };

    this.clearFilter = function () {
        this.selectedLocs([]);
        this.locationsList.removeAll();
        for (var i = 0; i < locations.length; i++) {
            locations[i].marker = markers[i];
            this.locationsList.push(new Loc(locations[i]));
        }
        showListings();
    };
};

    // This function will loop through the markers array and display them all.
    function showListings() {
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < locations.length; i++) {
            if (locations[i].marker !== null) {
                locations[i].marker.setMap(map);
                bounds.extend(locations[i].marker.position);
            }
        }
        map.fitBounds(bounds);
    }

    function hideListings() {
        for (var i = 0; i < markers.length; i++) {
            locations[i].marker = markers[i];
            markers[i].setMap(null);
        }
    }

    function toggleBounce(id) {
        var lv_id;
        if (typeof (this.id) === "undefined") {
            lv_id = marker.id;
        }
        else {
            lv_id = this.id;
        }

        //var lv_id = currentLoc;
        marker = markers[lv_id];

        for (var i = 0; i < markers.length; i++) {
            markers[i].setAnimation(null);
        }

        marker.setAnimation(google.maps.Animation.BOUNCE);
    }

    // Show the Foursquares InfoWindow
    function ShowInfoWindow() {
        var lv_id;
        
        if (currentLoc === "") {
            lv_id = marker.id;     //Retrieved from the Google Maps section marker click
        }
        else {
            lv_id = currentLoc;    //Retrieved from the Item List View click
        }

        currentLoc = "";

        marker = markers[lv_id];

        if (infowindow.marker != marker) {
            infowindow.setContent('');
            infowindow.marker = marker;
            // Foursquare API Client
            FSClientID = "1HVOEC0WVYEJYFSBFX3PZE4VY1AGF5YMHI00XE5V0XPPJUMK";
            FSClientSecret = "G4FKX4UYK5EKACFCI43NEY5JDPSI2PRXHQBLWX3UPG2RUTMM";
            // URL for Foursquare API
            var apiUrl = 'https://api.foursquare.com/v2/venues/search?ll=' +
                locations[lv_id].location.lat + ',' + locations[lv_id].location.lng + '&client_id=' + FSClientID +
                '&client_secret=' + FSClientSecret + '&query=' + marker.title +
                '&v=20170708' + '&m=foursquare';
            // Foursquare API
            $.getJSON(apiUrl).done(function (marker) {

                if (marker.response.venues.length > 0) {
                    var response = marker.response.venues[0];
                    self.street = response.location.formattedAddress[0];
                    self.city = response.location.formattedAddress[1];
                    self.zip = response.location.formattedAddress[3];
                    self.country = response.location.formattedAddress[4];
                    self.htmlContent = 'Foursquare Info:  ' + '<p class="iw_address">' + response.name + '</p>';
                    self.htmlContentFoursquare =
                    '<h6 class="iw_address_title"> Address: </h6>' +
                    '<p class="iw_address">' + self.street + '</p>' +
                    '<p class="iw_address">' + self.city + '</p>';

                    infowindow.setContent(self.htmlContent + self.htmlContentFoursquare);
                } else {
                    infowindow.setContent('<h5> Sorry, no Foursquare data to present.</h5>');
                }


            }).fail(function () {
                // Send alert
                alert(
                    "There was an issue loading the Foursquare API. Please refresh your page to try again."
                );
            });

            self.htmlContent = '<div>' + '<h4 class="iw_title">' + marker.title +
                '</h4>';

            infowindow.open(map, marker);

            infowindow.addListener('closeclick', function () {
                infowindow.marker = null;
            });
        }

    }

    // Google map initialization
    function initMap() {
        // Constructor creates a new map - only center and zoom are required.
        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 40.7413549, lng: -73.9980244 },
            zoom: 18,
            mapTypeControl: false
        });

        infowindow = new google.maps.InfoWindow();
        var bounds = new google.maps.LatLngBounds();

        // The following group uses the location array to create an array of markers on initialize.
        for (var i = 0; i < locations.length; i++) {
            // Get the position from the location array.
            var position = locations[i].location;
            var title = locations[i].title;
            // Create a marker per location, and put into markers array.
            locations[i].marker = new google.maps.Marker({
                position: position,
                title: title,
                animation: google.maps.Animation.DROP,
                id: i
            });
            // Push the marker to our array of markers.
            markers.push(locations[i].marker);
            //Add marker bouncing animation
            markers[i].addListener('click', self.toggleBounce);
            // Create an onclick event to open an infowindow at each marker.
            markers[i].addListener('click', self.ShowInfoWindow);
            bounds.extend(markers[i].position);
        }
        // Extend the boundaries of the map for each marker
        map.fitBounds(bounds);

        // Responsive map by resizing window 
        google.maps.event.addDomListener(window, "resize", function () {
            var center = map.getCenter();
            google.maps.event.trigger(map, "resize");
            map.setCenter(center);
        });

        showListings();

    }

    function googleError() {

        alert("Warning:  Google Maps error occurred.");
    }

function startApp() {
    ko.applyBindings(new ViewModel());
    initMap();
}


