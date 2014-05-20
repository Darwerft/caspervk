Search Engine
========

School project. A simple search engine that crawls the web, processes the pages, and adds them to a database.
The pages are stored in a ElasticSearch database, which provides fulltext search capabilities.

Whenever the crawler crawls a website, all the links (<a> tags) on the page are added to the queue, when the crawler is done it will fetch the next website in the queue.
It is also possible to request your own page to be added to the index on the site, pages added to the queue this way has higher priority in the queue.

##Requirements:
- Tested on Python 3.4
- pip install bottle
- pip install elasticsearch
- pip install beautifulsoup4
- pip install requests

- ElasticSearch server running on localhost
- Google API key for freebase support
- Apache/nginx server, and you need to route calls to /api/ to localhost:31415 to reach the bottle server

- Disk space? I had the service running for a couple of days, and indexed around 107.512 sites. The space of the ElasticSearch index was 952 mb, and the size of the queue (queue.db) was 263 mb with 1.515.106 links in the queue.