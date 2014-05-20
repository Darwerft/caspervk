#!/usr/bin/python
# -*- coding: utf-8 -*-

"""
Web-server for search engine.
"""

############# Imports #############
from bottle import route, run, get, request    # Bottle             Web server                                      pip install bottle
from elasticsearch import Elasticsearch        # ElasticSearch      Python lib/API for ElasticSearch DB server      https://github.com/elasticsearch/elasticsearch-py
import requests                                # Requests library   Used to download webpages (For freebase)        pip install requests
import sqlite3                                 # SQLite3 library    Used to "connect" to queue.db                   Included in Python

############# Setup #############
print("Search-Server v0.1 by Caspervk")

# API Key for Freebase
api_key = "ENTER YOUR GOOGLE API KEY HERE"

## Setup SQLite3
sql = sqlite3.connect('../queue.db')
cursor = sql.cursor()

## ElasticSearch
# Start Elasticsearch client, connects to localhost:9200 by default
es = Elasticsearch()


############# Functions #############

## Freebase
def freebase(query):
    """
    This function searches freebase (A online databse with facts about A LOT of things)
    If we are unable to find anything related to the query in freebase, this function will throw an error!
    We will deal with that where we call this function
    """
    # Search Freebase and convert response to json
    search_response = requests.get('https://www.googleapis.com/freebase/v1/search', params={'query': query, 'key': api_key, 'lang': 'en'}, headers={'Connection':'close'}).json()
    
    # Get ID and name of most relevant topic
    mid = search_response['result'][0]['mid']
    name = search_response['result'][0]['name']
    
    # Get data about the topic (using the ID)
    url = 'https://www.googleapis.com/freebase/v1/topic' + mid
    data_response = requests.get(url, params={'key': api_key, 'filter': '/common/topic/description'}, headers={'Connection':'close'}).json()

    # Process the data
    data = data_response['property']['/common/topic/description']['values']
    # Sometimes, there are more than one "data" (e.g. one created by wikipedia, and one created by a 3rd party)
    # We want the one that can provide us with a description, provider name and provider link (We'd like a source)
    # We go through all the results until one fulfills our requirements.
    # If we're unable to find a proper source, this function will throw an error!
    for data in data:
        try:
            description  = data['value']
            provider     = data['citation']['provider']
            provider_url = data['citation']['uri']
            
            return {'name': name, 'description': description, 'provider': provider, 'provider_url': provider_url}
        except:
            continue


############ BOTTLE ############
@get('/api/search')
def search():
    """
    This function searches our ElasticSearch databse for the query, prosesses the data, and return it.
    This functon is called from search.caspervk.com/search?q=example
    The data is returned as a JSON object, which is read by some JavaScript in the client browser
    """
    # Get search request from GET requst
    query = str(request.query.q)
    print('Search query: ' + query)
    
    # Log to file
    try:
        with open("log.txt", "a") as file:
            file.write(query + "\n")
    except:
        print("Error saving log.txt!")
    
    ## Search in the database
    search = es.search(
        index='webpages',
        doc_type='webpage',
        body={
            'size': 25,
            "fields" : ["title", "url", "description"],
            'query': {
                "multi_match" : {
                    "query" : query,
                    "fields" : ["title^3", "url^5", "description^2", "content"]
                }
            },
            "highlight" : {
                "fields" : {
                    "content" : {
                        "pre_tags" : ["<b>"],
                        "post_tags" : ["</b>"],
                        "order": "score",
                        "index_options" : "offsets",
                        "fragment_size" : 220,
                        "number_of_fragments" : 1,
                        "require_field_match" : "false"
                    }
                }
            }
        }
    )

    ## Work through the results
    # Number of hits
    hits = search['hits']['total']

    # No points in continuing if there are no results..
    if hits == 0:
        return {'hits': 0}
    
    # Array containing results
    results = search['hits']['hits']

    cleanResults = list()
    
    # The 'results' array contain a lot of "useless" data,
    # here we work through it, and strip it down to the minimum
    for result in results:
        url = result['fields']['url']
        title = result['fields']['title']

        # If highlighting in the page body is available, set description to the highlighted paragraph
        # If no highlighting available, set the description to the description of the page (from its <meta> tag)
        try:
            description = result['highlight']['content']
        except:
            description = result['fields']['description']

        # Add the search result to the 'cleanResults' list
        cleanResults.append({
                            'url': url,
                            'title': title,
                            'description': description
                            })
    ## Freebase
    # Try searching freebase for topics related to our query
    try:
        fb = freebase(query)
    except:
        # If topic doesnt exist in freebase, set fb = false
        # In the JavaScript, we can easily check if 'freebase == false'
        fb = False
        
    # Construct response
    response = {
                'hits': hits,
                'results': cleanResults,
                'freebase': fb
                }

    return response


@route('/api/stats')
def stats():
    """
    This function returns statistics about the database
    """
    stats = es.indices.stats(
        index='webpages',
        metric=["docs", "store"],
        fields=["count"],
        human='true'
    )
    
    return stats

@get('/api/add')
def add():
    """
    This function receives an URL from the user ("Add Your Site"-button) and adds it to the index queue
    """
    # Get URL from GET request
    site = str(request.query.site)
    
    # Check if URL starts with "http://" if not, add it
    if (site[:7] != "http://") and (site[:8] != "https://"):
        site = "http://" + site
    
    print("Adding site to index queue: " + site)
    
    # Add URL to queue.db
    cursor.execute('INSERT INTO queue (url, priority) VALUES (?, 100)', (site,))
    # Save the queue database
    sql.commit()
    
    
    return 'OK'


# Start server on port 31415
# You will need to set up some proxying in nginx/apache to point calls to /api/ to localhost:31415
run(host='', port=31415, debug=True)
