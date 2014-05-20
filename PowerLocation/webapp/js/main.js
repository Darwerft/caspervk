var map;
var marker;

// Document ready
$(document).ready(function() {
    console.log("Document ready!");
    
    // Load ting fra localStorage
    // GPS switch
    if (!localStorage.useGPS) {
        localStorage.useGPS = "false";
    }
    
    // Få information omkring vores hjemmeadresse og afstande fra server
    $.getJSON("/data/getaddressndistance", function(response) {
        // Smid det ind i options, så det altid er up-to-date i forhold til serverens værdier
        // Adress
        $("#set-home-info-text").html(response.address);
        // Afstande
        $("#set-lys-distance").val(response.dist_lys);
        $("#set-standby-distance").val(response.dist_standby);
        $("#set-varme-distance").val(response.dist_varme);
    });
    
    // Afstande (i options)
    $("#set-lys-distance").val(localStorage.lysDistance);
    $("#set-standby-distance").val(localStorage.standbyDistance);
    $("#set-varme-distance").val(localStorage.varmeDistance);
    
    // ### EVENTS ###
    // Event: On GPSswitch change
    $("[name='GPSswitch']").on('switchChange.bootstrapSwitch', function (event, state) {
        localStorage.useGPS = state;
        console.log("GPS " + localStorage.useGPS);
    });
    
    // Event: Enter knap i "Indtast hjemmeadresse" feltet
    $('#set-home-input').keydown(function(event){
        // Enter har keyCode 13
        if(event.keyCode==13){
            // Simuler click på "Find min adresse" knappen
           $('#set-home-find-button').trigger('click');
        }
    });
    
    // Event: "Find min adresse" knappen i options
    $('#set-home-find-button').click(function() {
        var address = $("#set-home-input").val();
        geocoder.geocode({'address': address}, function(results, status) {
            // Hvis google kan finde adressen
            if (status == google.maps.GeocoderStatus.OK) {
                console.log(results);
                var lat = results[0].geometry.location.k;
                var lon = results[0].geometry.location.A;
                var formatted_address = "<b>" + results[0].formatted_address + "</b><br>Latitude: " + lat + "<br>Longitude: " + lon
                
                // Send koordinaterne og adressen til hjemmeadressen til serveren
                $.get("/data/sethouse", {lat: lat, lon: lon, address: formatted_address}).done(function(response) {
                    console.log("Set home address - Server Response: " + response);
                    // Vis adressen til brugeren
                    $("#set-home-info-text").html(formatted_address + "<br><br>Server Response: " + response);
                });
            } else {
                // Hvis vi ikke kan finde adressen viser vi en error
                console.log("ERROR: Geocode failed, reason: " + status);
                $("#set-home-info-text").html("Kunne ikke finde adressen.<br>Error code: " + status);
            }
        });
    });
    
    // Event: "Gem afstande" knap i options
    $('#set-distance-save-button').click(function() {
        var lys         = $("#set-lys-distance").val();
        var standby     = $("#set-standby-distance").val();
        var varme       = $("#set-varme-distance").val();
        
        // Send de nye afstande til serveren
        $.get("/data/setafstande", {lys: lys , standby: standby, varme: varme}).done(function(response) {
            console.log("Sendt afstande til server! Response: " + response);
            $("#set-dist-info-text").html("Sendt afstande til server!<br>Server Response: " + response);
        });
    });
    
    // Sæt GPS Switch til localStorage value
    $("[name='GPSswitch']").bootstrapSwitch('state', JSON.parse(localStorage.useGPS));
    $("[name='GPSswitch']").bootstrapSwitch('labelText', 'GPS');
    
    // ### GOOGLE MAPS ###
    // Setup geocoder
    geocoder = new google.maps.Geocoder();
    
    var mapOptions = {
        center: new google.maps.LatLng(55.7200, 12.5700),
        disableDefaultUI: true,
        zoom: 10
    };
    
    map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
    
    // Lav marker på kortet
    marker = new google.maps.Marker({
        position: new google.maps.LatLng(55.7200, 12.5700),
        map: map,
        zIndex: 1
    });
    
    // Start location watching
    var watch = navigator.geolocation.watchPosition(updateMap, watchError, {timeout: 15000, maximumAge: 0, enableHighAccuracy: JSON.parse(localStorage.useGPS)});
    
    // ### UPDATE STATUS ###
    // Opdater status af lys, standby og varme hvert 30. sekund
    function updateStatus() {
        $.get("/data/hvaderstatus").done(function(response) {
            console.log("HvadErStatus Response: " + response);
            // Find ud af hvilke ting der er tændt/slukket
            // LYS
            // Hvis lyset skal være tændt
            if (response.indexOf("lys") >= 0) {
                // Fjern "label-danger" class og tilføj "label-success"
                $("#status-lys").removeClass("label-danger").addClass("label-success");
                // Sæt teksten til "on"
                $("#status-lys").html("On");
            } else {
                // Hvis lyset skal være slukket
                // Fjern "label-success" class og tilføj "label-danger"
                $("#status-lys").removeClass("label-success").addClass("label-danger");
                // Sæt teksten til "off"
                $("#status-lys").html("Off");
            }
            // STANDBY
            // Hvis standby skal være tændt
            if (response.indexOf("standby") >= 0) {
                // Fjern "label-danger" class og tilføj "label-success"
                $("#status-standby").removeClass("label-danger").addClass("label-success");
                // Sæt teksten til "on"
                $("#status-standby").html("On");
            } else {
                // Hvis standby skal være slukket
                // Fjern "label-success" class og tilføj "label-danger"
                $("#status-standby").removeClass("label-success").addClass("label-danger");
                // Sæt teksten til "off"
                $("#status-standby").html("Off");
            }
            // VARME
            // Hvis varme skal være tændt
            if (response.indexOf("varme") >= 0) {
                // Fjern "label-danger" class og tilføj "label-success"
                $("#status-varme").removeClass("label-danger").addClass("label-success");
                // Sæt teksten til "on"
                $("#status-varme").html("On");
            } else {
                // Hvis varme skal være slukket
                // Fjern "label-success" class og tilføj "label-danger"
                $("#status-varme").removeClass("label-success").addClass("label-danger");
                // Sæt teksten til "off"
                $("#status-varme").html("Off");
            }
        });
    }
    
    // Sæt funktionen til at køre hvert 30. sekund
    setInterval(updateStatus, 30000);
    // Kør funktionen nu (så vi ikke skal vente 30 sekunder for første update)
    updateStatus();
});


// ### LOCATION STUFF ###
function updateMap(location) {
    // Få koordinater fra sensor (GPS eller wifi)
    var lat = location.coords.latitude;
    var lon = location.coords.longitude;
    var acu = location.coords.accuracy;
    
    var pos = new google.maps.LatLng(lat, lon);
    
    // Centrer kortet på vores position
    map.setCenter(pos);
    
    // Lav en lille pil på vores position
    marker.setPosition(pos)
    console.log("lat:" + lat + " lon: " + lon + " acu: " +acu);
    
    // Send koordinaterne til serveren
    $.get("/data/hererjeg", {lat: lat, lon: lon}).done(function(response) {
        console.log("Sendt koordinator til server! Response: " + response);
    });
}

function watchError() {
    console.log("ERROR GETTING LOCATION!");
}