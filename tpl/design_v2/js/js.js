/* 
 * This file is part of CitizenAir.
 * CitizenAir is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * CitizenAir is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with CitizenAir.  If not, see <http://www.gnu.org/licenses/>.
 */

// ========
// Settings
// ========
var tiles_provider = 'http://c.tile.stamen.com/toner-lite/{z}/{x}/{y}.jpg' // Stamen Toner

var colors = Array();
colors['highest'] = 'black';
colors['high'] = 'red';
colors['medium'] = 'orange';
colors['low'] = 'green';

var fillColors = Array();
fillColors['highest'] = '#111';
fillColors['high'] = '#f03';
fillColors['medium'] = '#F88017';
fillColors['low'] = '#3f3';

// =========
// Functions
// =========
if (!Date.now) {
    Date.now = function() { return new Date().getTime(); };
}

// Function to animate left panel
function toggleLegend(immediate) {
    var tmp, tmp2;
    if(window.l.style.marginLeft != '0px') {
        if(immediate) {
            tmp = window.l.style.transition;
            window.l.style.transition = 'none';
            tmp2 = window.map_element.style.transition;
            window.map.style.transition = 'none';
        }
        window.l.style.marginLeft = '0px';
        if(live === false) {
            window.map_element.style.marginLeft = '0';
        }
        window.location = '#legend';
        if(immediate) {
            window.l.style.transition = tmp;
            window.map_element.style.transition = tmp2;
        }
    }
    else {
        if(immediate) {
            tmp = window.l.style.transition;
            window.l.style.transition = 'none';
            tmp2 = window.map_element.style.transition;
            window.map_element.style.transition = 'none';
        }
        window.l.style.marginLeft = -Math.max(window.l.querySelector('div.overflow_container').offsetWidth, window.l.querySelector('div.overflow_container').clientWidth || 0)+'px';
        if(live === false) {
            window.map_element.style.marginLeft = 0;
        }
        window.location = '#';
        if(immediate) {
            window.l.style.transition = tmp;
            window.map_element.style.transition = tmp2;
        }
    }
}

// Handle geolocation errors
function geolocErrorFunction(error) {
    switch(error.code) {
        case error.TIMEOUT:
            //Restart with a greater timeout
            navigator.geolocation.getCurrentPosition(successFunction, errorFunction, {enableHighAccuracy:true,  maximumAge:0, timeout:20000});
            break;

        case error.PERMISSION_DENIED:
            console.log("L'application n'a pas l'autorisation d'utiliser les ressources de geolocalisation.");
            break;

        case error.POSITION_UNAVAILABLE:
            alert("Erreur : La position n'a pu être déterminée.");
            break;

        default:
            alert("Erreur "+error.code+" : "+error.message);
            break;
    }
}


// Set map view on geolocation
function geolocSuccessFunction(position) {
    window.map.setView([position.coords.latitude, position.coords.longitude], 18);
}

// Get a relative date from timestamp
function relativeDate(time) {
    // Takes an ISO time and returns a string representing how
    // long ago the date represents.
    /*
     * JavaScript Pretty Date
     * Copyright (c) 2011 John Resig (ejohn.org)
     * Licensed under the MIT and GPL licenses.
     * http://ejohn.org/files/pretty.js
     */
    // Translated in French
    var diff = (new Date().getTime() - time * 1000) / 1000;
    var day_diff = Math.floor(diff / 86400);
    var date = new Date(time*1000);
    var month = date.getMonth() + 1;
    if(month < 10) {
        month = '0' + month;
    }
    var day = date.getDay();
    if(day < 10) {
        day = '0' + day;
    }
    var hours = date.getHours();
    if(hours < 10) {
        hours = '0' + hours;
    }
    var mins = date.getMinutes();
    if(mins < 10) {
        mins = '0' + mins;
    }

    if ( isNaN(day_diff) || day_diff < 0)
        return;

    return day_diff == 0 && (
            diff < 60 && "à l'instant" ||
            diff < 120 && "il y a 1&nbsp;minute" ||
            diff < 3600 && "il y a " + Math.floor( diff / 60 ) + "&nbsp;minutes" ||
            diff < 7200 && "il y a 1&nbsp;heure" ||
            diff < 86400 && "il y a " + Math.floor( diff / 3600 ) + "&nbsp;heures") ||
            'le '+ day +'/'+month+'/'+date.getFullYear()+' à '+ hours +':'+ mins;
}

// Get point opacity
function getOpacity(time, start_decrease, fully_gone) {
    now = Math.floor(Date.now() / 1000);
    if(now - time < start_decrease) {
        return 1;
    }
    else if(now - time < fully_gone) {
        return (fully_gone - (now - time)) / (fully_gone - start_decrease) * 0.85 + 0.15;
    }
    else {
        return 0.15;
    }
}

// Fit the map to the markers
function fitBounds() {
    if(!window.block_fitBounds) {
        window.map.invalidateSize();
        window.map.fitBounds((new L.featureGroup(window.markers)).getBounds().pad(0,5));
    }
    window.block_fitBounds = false;
}

// Get GET parameters in the URL
function params() {
    var t = location.search.substring(1).split('&');
    var params = [];

    for (var i=0; i < t.length; i++) {
        var x = t[i].split('=');
        params[x[0]] = x[1];
    }
    return params;
}

// Return string with first character in upper case
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// ==========
// AJAX query
// ==========
var xhr;
try {  
    xhr = new XMLHttpRequest();
}
catch (e) {
    try {   
        xhr = new ActiveXObject('Msxml2.XMLHTTP');
    }
    catch (e2) {
        try {  
            xhr = new ActiveXObject('Microsoft.XMLHTTP');
        }
        catch (e3) {  
            xhr = false;
        }
    }
}

function ajaxQuery() {
    if(window.xhr == false) {
        alert("Une erreur a été rencontrée pendant la récupération des mesures. Veuillez réessayer.");
    }
    else {
        window.xhr.onreadystatechange = function() {
            if(window.xhr.readyState == 4) {
                if(window.xhr.status == 200) {
                    ajaxResponse(window.xhr.responseText);
                }
            }
        };
    }

    if(live === false) {
        window.xhr.open("GET", "api.php?do=get&visu=1",  true);
        window.xhr.send();
    }
    else if(live !== '') {
        window.xhr.open("GET", "api.php?do=get&visu=1&sensor="+live,  true);
        window.xhr.send();
    }
}

function ajaxResponse(response) {
    var measures = JSON.parse(response);

    if(measures.length != 0) {
        window.timeline.clearGraph();
        if(window.live === false) {
            // Plot data
            for(var index = 0; index < window.markers.length; index++) {
                window.map.removeLayer(window.markers[marker]);
            }
            for(var index = 0; index < measures.length; index++) {
                var marker = L.circle([measures[index].latitude, measures[index].longitude], measures[index].spatial_validity / 2, {
                    color: colors[measures[index].level],
                    fillColor: fillColors[measures[index].level],
                    fillOpacity: getOpacity(measures[index].timestamp, measures[index].start_decrease, measures[index].fully_gone)
                });
                marker.addTo(window.map);
                marker.bindPopup("Mesure effectuée " + relativeDate(measures[index].timestamp) + ".<br/>" + measures[index].type_name + " : " + measures[index].value + measures[index].unit + "<br/>Capteur : " + measures[index].sensor + "<br/><a href='?lat="+measures[index].latitude+"&amp;long="+measures[index].longitude+"'>Permalink</a>");
                window.markers.push(marker);
                window.max_radius.push(measures[index].spatial_validity/2);
            }
            fitBounds(measures);
        }
        else if(live !== '') {
            document.getElementsByClassName('live')[0].innerHTML = '<p>' + measures[0].value + " " + measures[0].unit + ',<br/>' + relativeDate(measures[0].timestamp) + '</p>';
        }

        for(var index = 0; index < Math.min(measures.length, 100); index++) { // Afficher les 100 dernières mesures au plus sur la timeline
            if(!window.timeline.hasGraph(measures[index].sensor)) {
                window.timeline.addGraph(measures[index].sensor, measures[index].color);
            }

            window.timeline.addPoints(measures[index].sensor, {'x': measures[index].timestamp, 'y': measures[index].value, 'label': capitalize(relativeDate(measures[index].timestamp).replace('&nbsp;', ' '))+' : '+measures[index].value+' '+measures[index].unit, 'click': (function(arg) { return function() { window.map.setView([arg.latitude, arg.longitude], 18); }; })(measures[index])});
        }
        if(measures.length > 1) {
            window.timeline.draw();
        }
    }
}

// ===============
// Responsive menu
// ===============
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function responsiveMenu() {
    if(document.getElementById('menu-list').style.marginTop != '0px') {
        document.getElementById('menu-list').style.transition = 'margin-top 1s linear';
        document.getElementById('menu-list').style.marginTop = '0';
    }
    else {
        document.getElementById('menu-list').style.marginTop = '-100vh';
    }
    return false;
}

// ==============
// Initialisation
// ==============

var markers = new Array();
var max_radius = new Array();
var live = false;
var latitude = 48.86222;
var longitude = 2.35083;
var block_fitBounds = false;

// Recompute elements height on window resizing
// TODO : Resize du SVG
var old = window.onresize || function() {};
window.onresize = function() {
    old();

    // Onload not yet called, happens with responsive view in Firefox
    if(typeof(window.m) === 'undefined') {
        window.m = document.getElementById('map');
    }
    if(typeof(window.e) === 'undefined') {
        window.e = document.getElementById("legend");
    }
    if(typeof(window.map_element) === 'undefined') {
        window.map_element = document.getElementById("map");
    }

    window.header_footer_size = Math.max(document.getElementsByTagName('header')[0].offsetHeight, document.getElementsByTagName('header')[0].clientHeight || 0) + Math.max(document.getElementsByTagName('footer')[0].offsetHeight, document.getElementsByTagName('footer')[0].clientHeight || 0);

    window.header_footer_size = Math.max(document.getElementsByTagName('header')[0].offsetHeight, document.getElementsByTagName('header')[0].clientHeight || 0) + Math.max(document.getElementsByTagName('footer')[0].offsetHeight, document.getElementsByTagName('footer')[0].clientHeight || 0);
    window.m.style.height = (Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - window.header_footer_size) + 'px';
    window.map_element.style.height = Math.max(document.getElementById('legend').offsetHeight, document.getElementById('legend').clientHeight || 0) + 'px';
}

// Load the page
old = window.onload || function() {};
window.onload = function() {
    old();

    var parameters = params();
    for(GET in parameters) {
        switch(GET) {
            case 'live':
                window.live = parameters['live'];
                break;

            case 'lat':
                window.latitude = parameters['lat'];
                break;

            case 'long':
                window.longitude = parameters['long'];
                break;
        }
    }

    if(typeof(parameters['lat']) !== 'undefined' && typeof(parameters['long']) !== 'undefined') {
        window.block_fitBounds = true;
    }

    if(window.live === "") {
        // Select sensor page
        document.getElementById('svg_holder').style.display = 'none';
    }

    // Init global vars to go in the DOM tree
    window.m = document.getElementsByTagName('main')[0];
    window.map_element = document.getElementById('map');
    window.l = document.getElementById("legend");

    // Delete "need JS" message
    document.getElementById('need-js').innerHTML = '';

    window.m.style.paddingBottom = '0';
    window.l.style.height = '75%';
    window.l.style.marginLeft = -Math.max(window.l.querySelector('div.overflow_container').offsetWidth, window.l.querySelector('div.overflow_container').clientWidth || 0)+'px';
    window.map_element.style.paddingTop = 0;

    // Init elements height
    window.header_footer_size = Math.max(document.getElementsByTagName('header')[0].offsetHeight, document.getElementsByTagName('header')[0].clientHeight || 0) + Math.max(document.getElementsByTagName('footer')[0].offsetHeight, document.getElementsByTagName('footer')[0].clientHeight || 0);
    window.m.style.height = (Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - window.header_footer_size) + 'px';
    window.map_element.style.height = Math.max(document.getElementById('legend').offsetHeight, document.getElementById('legend').clientHeight || 0) + 'px';

    // Set timeline controls
    document.getElementById('timeline').innerHTML += '<p>Coucou</p>';

    // Init timeline
    window.timeline = new Timeline({'id': 'svg_holder', 'height': (Math.max(window.m.offsetHeight, window.m.clientHeight || 0) - Math.max(window.map_element.offsetHeight, window.map_element.clientHeight || 0) - (Math.max(document.getElementById('timeline').offsetHeight, window.document.getElementById('timeline').clientHeight || 0)))+'px', 'width': '100%', 'grid': 'both', 'x_axis': true, 'rounded': false, 'x_callback': false});
    
    // Toggle legend if neeeded
    if(window.location.hash == '#legend') {
        toggleLegend(true);
    }

    // Set the map if needed
    if(window.live === false) {
        if(!window.block_fitBounds) {
            window.map = L.map('map', { zoomControl: false }).setView([window.latitude, window.longitude], 13);
        }
        else {
            window.map = L.map('map', { zoomControl: false }).setView([window.latitude, window.longitude], 19);
        }
        map.addControl(L.control.zoom({ position: 'topright' }));

        L.tileLayer(window.tiles_provider, {
            maxZoom: 19
        }).addTo(window.map);

        map.on('zoomend', function() {
            // Resize markers on zoom
            var currentZoom = window.map.getZoom();
            for(var marker = 0; marker < window.markers.length; marker++) {
                window.markers[marker].setRadius((window.map.getMaxZoom() - window.map.getZoom()) * 5 + window.max_radius[marker]);
            }
        });
    }

    ajaxQuery();
};

// Auto-refresh
window.setInterval(function() { ajaxQuery(); }, 300000);