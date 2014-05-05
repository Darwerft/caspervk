// ############################## SETUP ##############################
var legacyRecordBackgroundFileSelected;
var legacyRecordMillingFileSelected;
var arr_info = [ "usr_name",
                "usr_company",
                "usr_email",
                "usr_phone",
                "usr_maxSpindelSpeed",
                "usr_processSpindelSpeed",
                "usr_radDepth",
                "usr_AxialDepth",
                "usr_feedRate",
                "usr_cuttingEdgeLength",
                "usr_toolOverhang",
                "usr_numberOfCuttingEdges",
                "usr_knifeType",
                "usr_material",
                ];
                
navigator.getUserMedia  = navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia; // This allows us to use "navigator.getUserMedia" regardless of browser support

// ############################## ON-LOAD ##############################                          
$(document).ready(function() { // Function called when page ready
    console.log("\u00A9 Copyright Theis Nielsen & Casper V. Kristensen, 2013-1014. All rights reserved."); // Copyright info
    console.log("Script.JS loaded!"); // Debug info
    loadOptions(); // load options data from localStorage
    
    // Switch the buttons, depending on browser support
    if (navigator.getUserMedia) { // If the browser supports GetUserMedia
        console.log("GetUserMedia is supported! -- Using Javascript recording"); // Debug info
        document.getElementById('GoodPhoneButtons').style.display = '';
        document.getElementById('BadPhoneButtons').style.display = 'none';
    } else { // If it doesn't show the legacy buttons
        console.log("GetUserMedia is NOT supported! -- Using legacy record buttons"); // Debug info
        document.getElementById('BadPhoneButtons').style.display = '';
        document.getElementById('GoodPhoneButtons').style.display = 'none';
    }
    
    // Legacy buttons
    $("#legacyRecordBackground").change(function() {
        console.log("File changed: legacyRecordBackground!"); // Debug info
        $("#legacyRecordBackgroundDiv").css('background', 'limegreen');
        legacyRecordBackgroundFileSelected = 1; // If we have selected a file, set var to 1
        checkFileSelected();
    });

    $("#legacyRecordMilling").change(function() {
        console.log("File changed: legacyRecordMilling!"); // Debug info
        $("#legacyRecordMillingDiv").css('background', 'limegreen');
        legacyRecordMillingFileSelected = 1; // If we have selected a file, set var to 1
        checkFileSelected();
    });
    
    function checkFileSelected() { // Function to check if we have selected files in both inputs
        if(legacyRecordBackgroundFileSelected + legacyRecordMillingFileSelected == 2) {
            $('#uploadButton').button('enable'); // Enable uploadButton if we have selected files in both inputs
        }
    }
    // iPhone Simulate
    $("#SimulateIphoneflip").change(function() {
        if ($("#SimulateIphoneflip").val() == 0) {
            console.log("GetUserMedia is supported! -- Using Javascript recording"); // Debug info
            document.getElementById('GoodPhoneButtons').style.display = '';
            document.getElementById('BadPhoneButtons').style.display = 'none';
        } else { // If it doesn't show the legacy buttons
            console.log("GetUserMedia is NOT supported! -- Using legacy record buttons"); // Debug info
            document.getElementById('BadPhoneButtons').style.display = '';
            document.getElementById('GoodPhoneButtons').style.display = 'none';
        }
    });
});

// ############################## OPTIONS SAVE/LOAD ##############################
function saveOptions() { // Function to save options data to localStorage
    for (i = 0; i<14; i++) {
        localStorage.setItem(arr_info[i], document.getElementById(arr_info[i]).value);
    };
    console.log("Options saved!"); // Debug info
}

function loadOptions() { // Function to load options data from localStorage
    // Check if text fields in "options" menu is null, if not load from localStorage
    for (i = 0; i<14; i++) {
        if (document.getElementById(arr_info[i]).value != null) {
            document.getElementById(arr_info[i]).value = localStorage.getItem(arr_info[i]);
        };
    };
    console.log("Options loaded!"); // Debug info
}

// ############################## JS RECORDING ##############################
function RecordButton(button) {
    if (button.id == "goodBackgroundNoiseButton") { // This if block detects what button you pressed
        console.log("goodBackgroundNoiseButton pressed!"); // Debug info
        barToChange = "goodRecordBackgroundProgressBar";
        recordTime = 5000;
        goodBackgroundNoiseButtonHasBeenPressed = 1;
    } else if (button.id == "goodMillingNoiseButton"){
        console.log("goodMillingNoiseButton pressed!"); // Debug info
        barToChange = "goodmillingNoiseButtonProgressBar";
        recordTime = 15000;
        goodMillingNoiseButtonHasBeenPressed = 1;
    }
    // Start the recording, wait recordTime, stop the recording
    console.log("JS Recording started!"); // Debug info
    // record.stop();
    setTimeout(function() {
        console.log("JS Recording Stopped!"); // Debug info
        // record.stop();
        
        if (goodBackgroundNoiseButtonHasBeenPressed + goodMillingNoiseButtonHasBeenPressed == 2) { // Check if we have recorded both
            $('#uploadButton').button('enable'); // Enable uploadButton if we have recorded both
        }
    }, recordTime);
    $('#' + barToChange).width('100%');
    
    // Do something with the recorded data
}

// ############################## UPLOADING ##############################

function uploadToServer(){
    console.log("Preparing upload data.."); // Debug info
    $('#UploadProgressStatus').html('Uploading..');
    $('#uploadPopupDialog').popup('open', { transition: "pop" }); // Open dialog

    var form = document.getElementById('form');
    var formData = new FormData(form); // Create form with data from the HTML form
    
    var file = document.getElementById("legacyRecordBackground");
    var file1 = document.getElementById("legacyRecordMilling");

    formData.append("file", file.files[0]); // Append the files, into the formData
    formData.append("file1", file1.files[0]);

    console.log("Uploading using AJAX.."); // Debug info
    $.ajax({ // POST using AJAX
        type: 'POST',
        url: 'php/upload.php',
        data: formData,
        processData: false,
        contentType: false,

        success: function(){
            console.log("Upload success!"); // Debug info
            $('#UploadProgressStatus').html('Success!');
        },
        error: function(){
            $('#UploadProgressStatus').html('Error! :(');
            console.log("Upload: error!"); // Debug info
        },
        complete: function(){
            console.log("Upload complete!"); // Debug info
            setTimeout(function () {
                $('#uploadPopupDialog').popup('close', { transition: "pop" });
            }, 1500);
        }

    });
}
