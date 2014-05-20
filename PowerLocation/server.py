from bottle import route, run, get, request    # Bottle - Web server
from math import radians, cos, sin, asin, sqrt # Math - Til udregning af distance

# Definer globale vars
distance, lat1, lon1 = 0, 0, 0
dist_lys, dist_standby, dist_varme = 0, 0, 0
# Sæt adressen til en besked til brugeren om, at han ikke har sat en adresse endnu
address = "<b>Du har ikke indtastet en adresse endnu!</b>"

######### BOTTLE STUFF #########

# Function: Modtag hus-koordinater fra mobil, og gem dem til lat1 og lon1
@get('/data/sethouse')
def sethouse():
    # Brug globale variabler i stedet for lokale
    global lat1, lon1, address
    
    lat1 = float(request.query.lat)
    lon1 = float(request.query.lon)
    address = str(request.query.address)

    print('Nye koordinater til hus modtaget!')
    print('Lat: ' + str(lat1))
    print('Lon: ' + str(lon1))
    print('Address: ' + address)

    # Return OK til telefonen
    return 'OK'

    
# Function: Retuner aktuelle address og de afstande som brugeren vil have de forskellige ting slukket/tændt
@route('/data/getaddressndistance')
def getaddressndistance():
    # Brug globale variabler i stedet for lokale
    global address, dist_lys, dist_standby, dist_varme

    return {'address': address, 'dist_lys': dist_lys, 'dist_standby': dist_standby, 'dist_varme': dist_varme}


# Function: Modtag afstand mellem hus/mobil hvor vi slukker for diverse ting.
@get('/data/setafstande')
def setafstande():
    # Brug globale variabler i stedet for lokale
    global dist_lys, dist_standby, dist_varme

    dist_lys      = float(request.query.lys)
    dist_standby  = float(request.query.standby)
    dist_varme    = float(request.query.varme)
    
    print('Nye afstande modtaget!')
    print('Lys: ' + str(dist_lys))
    print('standby: ' + str(dist_standby))
    print('varme: ' + str(dist_varme))
    
    return 'OK'


# Function: Modtag koordinater fra mobiltelefonen, og udregn distancen mellem hus og mobil.
@get('/data/hererjeg')
def hererjeg():
    """
    Vi bruger haversine formlen, der er en formel til at bestemme
    den korteste distance mellem to punkter på en kugle, givet koordinaterne.

    lat1 og lon1 er koordinaterne til huset,
    lat2 og lon2 er koordinaterne til mobiltelefonen.
    """

    # Global vars
    global distance, lat1, lon1
    
    # Koordinater til mobiltelefon
    lat2 = float(request.query.lat)
    lon2 = float(request.query.lon)
    
    # Konverter til radianer
    lon1r, lat1r, lon2r, lat2r = map(radians, [lon1, lat1, lon2, lat2])
    
    # Ind i haversine formlen
    dlon = lon2r - lon1r
    dlat = lat2r - lat1r
    a = sin(dlat/2)**2 + cos(lat1r) * cos(lat2r) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    
    # 6367 = Jordens radius i km
    distance = 6367 * c

    print("Distance mellem hus og telefon: " + str(distance))
    
    # Return OK til telefonen
    return 'OK'


# Function: Retuner aktuelle status (hvad skal være tændt/slukket)
@route('/data/hvaderstatus')
def hvaderstatus():
    # Brug globale variabler i stedet for lokale
    global distance, dist_lys, dist_standby, dist_varme

    status = ''
    # Hvis vi er indenfor den afstand hvor vi vil have lyset tændt
    if (distance < dist_lys):
        status += 'lys '

    # Hvis vi er indenfor den afstand hvor vi vil have standby on
    if (distance < dist_standby):
        status += 'standby '

    # Hvis vi er indenfor den afstand hvor vi vil have varmen tændt
    if (distance < dist_varme):
        status += 'varme'

    status += '!'
        
    return status


# Start bottle server
run(host='', port=31415, debug=True)
