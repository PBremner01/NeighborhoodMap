/* jshint -W100 */
/*jshint esversion: 6 */ 
var locations = [
  { id: 0, title: "Park Ave Penthouse", location: { lat: 40.7713024, lng: -73.9632393 }, marker },
  { id: 1, title: "Chelsea Loft", location: { lat: 40.7444883, lng: -73.9949465 }, marker },
  { id: 2, title: "Union Square Open Floor Plan", location: { lat: 40.7347062, lng: -73.9895759 }, marker },
  { id: 3, title: "East Village Hip Studio", location: { lat: 40.7281777, lng: -73.984377 }, marker },
  { id: 4, title: "TriBeCa Artsy Bachelor Pad", location: { lat: 40.7195264, lng: -74.0089934 }, marker },
  { id: 5, title: "Chinatown Homey Space", location: { lat: 40.7180628, lng: -73.9961237 }, marker }
];

// Global variables
var marker, infowindow, currentLoc = "";
var map, FSClientID, FSClientSecret;
var markers = [];

var Loc = function (data) {
    this.title = ko.observable(data.title);
    this.location = ko.observable(data.location);
    this.id = ko.observable(data.id).valueOf();
};

// Knockout MVVM functionality
var ViewModel = function () {
    var self = this;
    self.title = ko.observable('');
    self.id = ko.observable('');

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

    this.filterLocations = function () {
        var lv_index = this.locationsList().length - 1;
        var lv_found = 0;

        this.hideListings();
        this.locationsList.removeAll();
        locations.forEach(function (locItem) {
            self.locationsList.push(new Loc(locItem));
        });

        //Need to adjust the deletion index for decrementing 
        for (i = lv_index; i >= 0; i--) {
            var ls_location = this.locationsList()[i];
            lv_found = 0;
            for (j = 0; j < this.selectedLocs().length; j++) {
                if (ls_location.title() == this.selectedLocs()[j]) {
                    lv_found = 1;
                    break;
                }
            }
            if (lv_found != 1) {
                this.locationsList.remove(ls_location);
                locations[i].marker = null;
            }
        }

        this.showListings();

    };

    this.clearFilter = function () {
        this.selectedLocs([]);
        this.locationsList.removeAll();
        for (i = 0; i < locations.length; i++) {
            locations[i].marker = markers[i];
            this.locationsList.push(new Loc(locations[i]));
        }
        this.showListings();
    };

    // This function will loop through the markers array and display them all.
    this.showListings = function () {
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < locations.length; i++) {
            if (locations[i].marker !== null) {
                locations[i].marker.setMap(map);
                bounds.extend(locations[i].marker.position);
            }
        }
        map.fitBounds(bounds);
    };

    this.hideListings = function () {
        for (var i = 0; i < markers.length; i++) {
            locations[i].marker = markers[i];
            markers[i].setMap(null);
        }
    };

    // Initiates the Foursquares InfoWindow from clicking on the location listing
    this.populateFSInfoWindow = function (item) {
        var lv_id = item.id.valueOf();
        currentLoc = lv_id();
        self.ShowInfoWindow();
    };


    this.toggleBounce = function () {

        marker = markers[this.id];
        for (i = 0; i < markers.length; i++) {
            markers[i].setAnimation(null);
        }

        //if (marker.getAnimation() != null) {
        //    marker.setAnimation(null);
        //} else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        //}
    };

    // Show the Foursquares InfoWindow
    this.ShowInfoWindow = function () {

        if (typeof this.id == "undefined") {
            return;
        }

        if (currentLoc === "") {
            currentLoc = this.id;
        }

        var lv_id = currentLoc;
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
                    self.htmlContent = 'Foursquare Info';
                    self.htmlContentFoursquare =
                    '<h6 class="iw_address_title"> Address: </h6>' +
                    '<p class="iw_address">' + self.street + '</p>' +
                    '<p class="iw_address">' + self.city + '</p>' +
                    '<p class="iw_address">' + self.zip + '</p>' +
                    '<p class="iw_address">' + self.country +
                    '</p>' + '</div>' + '</div>';

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

            this.htmlContent = '<div>' + '<h4 class="iw_title">' + marker.title +
                '</h4>';

            infowindow.open(map, marker);

            infowindow.addListener('closeclick', function () {
                infowindow.marker = null;
            });
        }

    };


    // Google map initialization
    this.initMap = function () {
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


        this.showListings();

    };



    this.initMap();

};

function startApp() {
    ko.applyBindings(new ViewModel());
}
