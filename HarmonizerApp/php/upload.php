<?php
if(isset($_POST["usr_name"])) { // Only do stuff if we receive data from the website
    echo("Data received!");
    
    // ############################## SETUP ##############################
    date_default_timezone_set('Europe/Copenhagen'); // The server is shite, better make sure me use the correct timezone
    require_once('PHPMailer/class.phpmailer.php'); // Import the PHPMailer script
    
    // Load info from the forms
    $usr_name                   = $_POST["usr_name"];
    $usr_company                = $_POST["usr_company"];
    $usr_email                  = $_POST["usr_email"];
    $usr_phone                  = $_POST["usr_phone"];
    
    $usr_maxSpindelSpeed        = $_POST["usr_maxSpindelSpeed"];
    $usr_processSpindelSpeed    = $_POST["usr_processSpindelSpeed"];
    $usr_radDepth               = $_POST["usr_radDepth"];
    $usr_AxialDepth             = $_POST["usr_AxialDepth"];
    $usr_feedRate               = $_POST["usr_feedRate"];
    
    $usr_cuttingEdgeLength      = $_POST["usr_cuttingEdgeLength"];
    $usr_toolOverhang           = $_POST["usr_toolOverhang"];
    $usr_numberOfCuttingEdges   = $_POST["usr_numberOfCuttingEdges"];
    $usr_knifeType              = $_POST["usr_knifeType"];
    
    $usr_material               = $_POST["usr_material"];
    
    
    // ############################## PROCESS SOUND FILES ##############################
    // We want to store the sound files in 'uploads/{user_email}/{currentTime}/{randomMD5}/'
    // Generate random MD5 hash:
    $randMD5 = md5(mt_rand());
    $currentTime = date("Y-m-d-H-i-s");
    
    $dirname = 'uploads/'.$usr_name.'/'.$currentTime.'/'.$randMD5; //the directory we want to write our clips in
    //check if the directory has already been created
    if(!is_dir($dirname)){
        mkdir ($dirname, 0757, true); // Else we create it
    }
    
    // Get the file extension of the files
    $extFile = end(explode(".", $_FILES["file"]["name"]));
    $extFile1 = end(explode(".", $_FILES["file1"]["name"]));
    
    // Move the files to 'uploads/{user_email}/{currentTime}/{randomMD5}/'
    $BGNoiseFilePath    = $dirname.'/bgNoise.'.$extFile;        // This is the path for the background-noise sound file
    $MillNoiseFilePath  = $dirname.'/millingNoise.'.$extFile1;  // This is the path for the milling-noise sound file
    // Do the actual move
    move_uploaded_file($_FILES["file"]["tmp_name"], $BGNoiseFilePath); // Move background-noise file
    move_uploaded_file($_FILES["file1"]["tmp_name"], $MillNoiseFilePath); // Move milling noise file
    
    // Convert the uploaded file using ffmpeg
    //exec("ffmpeg -i video.mkv -acodec pcm_s16le -ac 2 audio.wav");
    
    
    // ############################## COMPOSE MAIL ##############################
    // Insert info into email
    $email = new PHPMailer();
    $email->From      = 'YOUR@EMAIL.com';                                   // email "from" address
    $email->FromName  = 'YOURNAME';                                         // email "from" name
    $email->Subject   = 'Harmonize Me Please';                              // email subject
    $email->Body      = 'Please return results to email: "'.$usr_email.'"'; // email body text
    $email->AddAddress( 'SENDTO@ADDRESS.com' );                              // email send-to address
    $email->CharSet   = 'UTF-8';                                            // Char encoding
    
    // Create the info.txt file
    $txtContent =
'"name"                  : "'.$usr_name.'"
"company"               : "'.$usr_company.'"
"email"                 : "'.$usr_email.'"
"phone"                 : "'.$usr_phone.'"

"maxSpindelSpeed"       : "'.$usr_maxSpindelSpeed.'"
"processSpindelSpeed"   : "'.$usr_processSpindelSpeed.'"
"radDepth"              : "'.$usr_radDepth.'"
"AxialDepth"            : "'.$usr_AxialDepth.'"
"feedRate"              : "'.$usr_feedRate.'"

"cuttingEdgeLength"     : "'.$usr_cuttingEdgeLength.'"
"toolOverhang"          : "'.$usr_toolOverhang.'"
"numberOfCuttingEdges"  : "'.$usr_numberOfCuttingEdges.'"
"knifeType"             : "'.$usr_knifeType.'"

"material"              : "'.$usr_material.'"';
        
    // Attach info.txt file to the mail
    $email->AddStringAttachment($txtContent,"info.txt","base64","text/plain");
    
    // Attach sound files
    $email->AddAttachment($BGNoiseFilePath);    // Attach background-noise    
    $email->AddAttachment($MillNoiseFilePath);  // Attach milling-noise sound file

    // Send the mail
    return $email->Send();
    
    
    // ############################## CLEAN-UP ##############################
    // The mail has been sent, and it is now safe to delete the dir containing the uploaded (and converted) files
    //exec('rm -rf '.$dirname.'/'); // This is totally unsafe
    
} else { // Throw an error if we dont get any POST data
    echo("ERROR: Didn't recieve any data!");
}
?>