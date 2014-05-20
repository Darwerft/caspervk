Power Location
========

School project. Programming wasn't weighted, so the code is .. not optimal, but it works!

The idea is a system, which monitors a users location (using the web-app) and notifies the web server (the python bottle server).
The server calculates the distance between your house (input on the web-app) and your current location, and determines if your lights/heat/standby products should be turned off.
An Arduino periodically ping the web server for the current status of which components should be turned on/off, and sends a signal over the digital output pins.

Please be aware to change URL's and/or route the /data/ calls to the bottle server (can be done using apache/nginx proxying)

Comments are in Danish - I apologize