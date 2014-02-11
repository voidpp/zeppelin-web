About
-

This is a web based client for [Zeppelin](https://github.com/giszo/zeppelin) audio player.

Supported browsers
-

This client is written in 2014 not 1990, so please use a modern, HTML5 capable browser.

Requirements
-

- [Zeppelin](https://github.com/giszo/zeppelin) with jsonrpc-remote, http-server and file-server plugins.
- Python with [pyScss lib](https://github.com/Kronuz/pyScss/)

Install notes
-

- Configure the Zeppelin plugins:
 - jsonrpc-remote path to such as /jsonrpc
 - http-server port eg 8080
 - file-server document-root to this wwwroot directory
- Run css.py after git clone and each pull
- The Zeppelin will serve the files for this client so just open the url of Zeppelin in a web browser.

