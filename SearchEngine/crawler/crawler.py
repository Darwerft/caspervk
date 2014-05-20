#!/usr/bin/python
# -*- coding: utf-8 -*-

"""
Web-crawler for search engine.
Crawl webpages and add them to databse.
"""

############# Imports #############
import requests                                      # Requests library         Used to download webpages                     http://docs.python-requests.org/en/latest/
import re                                            # Regex library            Used to find patterns in text                 Included in Python
from bs4 import BeautifulSoup                        # BeautifulSoup library    Used to extract data from HTML                http://www.crummy.com/software/BeautifulSoup/
from elasticsearch import Elasticsearch              # ElasticSearch            Python lib/API for ElasticSearch DB server    https://github.com/elasticsearch/elasticsearch-py
import sqlite3                                       # SQLite3 library          Used to "connect" to queue.db                 Included in Python
from urllib.parse import urljoin,urlparse            # urllib functions         Used to work with URLs                        Included in Python


############# Setup #############
print("Search-Crawler v0.1 by Caspervk")

## Setup SQLite3
sql = sqlite3.connect('../queue.db')
cursor = sql.cursor()

## Setup ElasticSearch
# Start Elasticsearch client, connects to localhost:9200 by default
es = Elasticsearch()

# List of websites we dont want to index
# IMPORTANT! Seriously! Its IMPOSSIBLE to get off reddit/facebook once you enter..
banned = {"www.reddit.com", "www.facebook.com", "ssl.reddit.com"}

############# Functions #############
def get_page(url):
    """
    Arguments: url - The URL of the webpage you want to index.
    This function retrieves information about a webpage.
    """
    
    # Get the webpage
    response = requests.get(url)
    
    # Use UTF-8 encoding on the response
    response.encoding = 'utf-8'
    
    # Convert the HTML text to a soup object using BeautifulSoup
    # BeautifulSoup converts the HTML to an object, which is easier to work with in Python.
    soup = BeautifulSoup(response.text)

    ### URL ###
    # Sometimes webpages redirect us around, this will make sure our URL will be the ACTUAL URL of the page
    aURL = response.url

    ### Title ###
    title = soup.title.string

    ### Description ###
    # Get the description of the page from the meta tag
    # If none available; set the desc to an error message
    try:
        desc = soup.find("meta", {"name":"description"})['content']
    except:
        desc = "A description for this site is not available."

    ### Clean HTML ###
    # Remove all <script> and <style> tags
    for tag in soup.find_all(['script', 'style']):
        tag.extract()

    # Remove divs with common id's we dont want
    for ID in ["header", "head", "navbar", "navigation", "menu", "menubar", "sidebar", "footer", "foot"]:
        try:
            soup.find("div", {"id": ID}).extract()
        except:
            continue

    ### Body Text ###
    # Find all text strings in body
    strings = soup.body.stripped_strings
    # Add them together to a single string, using space as a seperator
    text = " ".join(strings)

    ### Links ###
    # Find all <a> tags and add them to links set
    links = set()

    for tag in soup.find_all('a'):
        # Get the href value of the <a> tag
        link = tag.get('href')
        
        # Skip if href value is empty
        if link is None:
            continue
                    
        # Parse URL using urllib urlparse, this will split the URL up into parts
        parsed = urlparse(link)
        
        # If link is relative (e.g. /about)
        if not parsed.netloc:
            # Add relative link to current domain
            currDomain = "{0.scheme}://{0.netloc}".format(urlparse(aURL))
            
            # Actual absolute link
            link = currDomain + link
            
            # Parse this new link
            parsed = urlparse(link)
        
        # Skip link if website is "banned"
        if parsed.netloc in banned:
            continue
        
        # Put the parts together to create a link with all the extra stuff removed
        link = "{0.scheme}://{0.netloc}{0.path}".format(parsed)
        
        # Add the link to the 'links' set
        links.add(link)

        # Remove the <a> tag from the soup object, since we won't need it anymore
        tag.extract()
        
    return aURL, title, desc, text, links


def add_to_database(url, title, description, content):
    """
    This function adds the webpage to the ElasticSearch database
    """
    es.index(
        index='webpages',
        doc_type='webpage',
        body={
            "url" : url,
            "title" : title,
            "description" : description,
            "content" : content
        }
    )


def index(url):
    print("Indexing: " + str(url))
    
    # Get the webpage
    aURL, title, description, content, links = get_page(url)
    
    # Add the webpage to the database
    add_to_database(aURL, title, description, content)
    
    # Add the links from the webpage to the queue database
    
    for link in links:
        cursor.execute('INSERT INTO queue (url) VALUES (?)', (link,))
    # Save the queue database
    sql.commit()


############# Loop #############
# Infinite loop that gets a URL from the queue db, indexes it, and adds it to the database
while True:
    # Get a URL from the queue
    try:
        # Get the URL from the queue with the lowest ID (oldest) and highest priority
        id, url = cursor.execute("SELECT id, url FROM queue WHERE priority=(SELECT MAX(priority) FROM queue) ORDER BY id LIMIT 1").fetchone()
        
        # Remove the URL from the queue
        cursor.execute("DELETE FROM queue WHERE id=?", (id,))
        
        # Save the queue database
        sql.commit()
    except:
        print("Queue empty!")
        # Queue is empty, we might aswell just try indexing reddit.com/r/worldnews to get some new webpages..
        index("http://www.reddit.com/r/worldnews/")
        continue

    # Try indexing the URL
    try:
        index(url)
    except:
        print("Failed!")
