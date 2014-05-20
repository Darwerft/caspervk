// ### Import Libraries ###
#include <SPI.h>
#include <Ethernet.h>

// Start Ethernet client library
EthernetClient client;

// Sæt pins op
int statusPIN  = 7;
int lysPIN     = 6;
int standbyPIN = 5;
int varmePIN   = 4;

// Disse bools holder information om lyset/standby/varmen var slukket eller tændt sidst vi tjekkede
// Vi vil nemlig kun sende noget, hvis den nye værdi vi får fra serveren er anderledes
boolean lysOld     = false;
boolean standbyOld = false;
boolean varmeOld   = false;

boolean lysNew, standbyNew, varmeNew;

// ### Setup ###
void setup() {
    // Åben seriel port 9600. Bruges til at sende information til computeren (Til debug)
    Serial.begin(9600);
    
    // Send besked, så vi ved om det virker
    Serial.println("Initialiserer..");
    
    // Sæt pins op
    pinMode(statusPIN, OUTPUT);
    pinMode(lysPIN, OUTPUT);
    pinMode(standbyPIN, OUTPUT);
    pinMode(varmePIN, OUTPUT);
    
    // ### Opsætning af ethernet ###
    // Mac adressen findes bag på Ethernet Shield, skrivs i hexadecimal.
    byte mac[] = {0x90, 0xA2, 0xDA, 0x00, 0xEA, 0x0A};
    
    // Start ethernet connection - Vi burde selv få en IP-adresse af routeren
    // Funktionen returner 1 hvis succesfuld, og 0 hvis der sker en fejl
    if (Ethernet.begin(mac) == 0) {
        Serial.println("DHCP ERROR: Kunne ikke fa en IP adresse af routeren!");
    } else {
        Serial.print("Forbundet! Lokal IP-adresse: ");
        Serial.println(Ethernet.localIP());
    }
    
    // Vent 3 sekunder
    delay(3000);
    Serial.println("Initialisering fuldfort!");
}

void loop () {
    // ### Tilslutning til server ###
    Serial.println("Tilslutter..");
    
    // Hvis der blev forbundet til serveren
    if (client.connect("teknologi.caspervk.com", 80) > 0) {
        Serial.println("Tilsluttet!");
        Serial.println("Status ON");
        digitalWrite(statusPIN, HIGH);
        
        // Send HTTP GET request til server
        client.println("GET /data/hvaderstatus HTTP/1.0");
        client.println("HOST: teknologi.caspervk.com");
        client.println("Connection: close");
        client.println();
        
        String string = client.readStringUntil('!');
        
        if (string.indexOf("lys") >=0) {
          lysNew = true;
        } else {
          lysNew = false;
        }
        if (string.indexOf("standby") >=0) {
          standbyNew = true;
        } else {
          standbyNew = false;
        }
        if (string.indexOf("varme") >=0) {
          varmeNew = true;
        } else {
          varmeNew = false;
        }
        
        // ########################
        // Læs fra HTML dokumentet, og send evt. til kredsløbet hvis den nye værdi er anderledes fra den gamle
        
        // Lys
        
        // Log til serial
        Serial.print("lysNew: ");
        Serial.println(lysNew);
        Serial.print("lysOld: ");
        Serial.println(lysOld);
        
        // Hvis lysNew er ændret i forhold til den gamle værdi (lysOld)
        // Så sender vi et signal i 5 sekunder
        if (lysNew != lysOld) {
            Serial.println("lysNew != lysOld.. Sender lys signal!");
            digitalWrite(lysPIN, HIGH);
            delay(2000);
            digitalWrite(lysPIN, LOW);
            
            // Sæt lysOld til lysNew, så vi ikke sender igen, før den ændrer sig igen.
            lysOld = lysNew;
        }
        delay(1000);
        
        // Standby
        // Log til serial
        Serial.print("standbyNew: ");
        Serial.println(standbyNew);
        Serial.print("standbyOld: ");
        Serial.println(standbyOld);
        
        // Hvis standbyNew er ændret i forhold til den gamle værdi (standbyOld)
        // Så sender vi et signal i 5 sekunder
        if (standbyNew != standbyOld) {
            Serial.println("standbyNew != standbyOld.. Sender standby signal!");
            digitalWrite(standbyPIN, HIGH);
            delay(2000);
            digitalWrite(standbyPIN, LOW);
            
            // Sæt standbyOld til standbyNew, så vi ikke sender igen, før den ændrer sig igen.
            standbyOld = standbyNew;
        }
        delay(1000);
        
        // Varme
        // Log til serial
        Serial.print("varmeNew: ");
        Serial.println(varmeNew);
        Serial.print("varmeOld: ");
        Serial.println(varmeOld);
        
        // Hvis varmeNew er ændret i forhold til den gamle værdi (varmeOld)
        // Så sender vi et signal i 5 sekunder
        if (varmeNew != varmeOld) {
            Serial.println("varmeNew != varmeOld.. Sender varme signal!");
            digitalWrite(varmePIN, HIGH);
            delay(2000);
            digitalWrite(varmePIN, LOW);
            
            // Sæt varmeOld til varmeNew, så vi ikke sender igen, før den ændrer sig igen.
            varmeOld = varmeNew;
        }
  } else {
    // Hvis der ikke kunne oprettes forbindelse til serveren
    Serial.println("Kunne ikke oprette forbindelse til serveren!");
    Serial.println("Status OFF");
    digitalWrite(statusPIN, LOW);
  }
  client.stop();
  
  // Check igen om 10 sekunder
  Serial.println("Venter 10 sekunder..");
  delay(10000);
}
