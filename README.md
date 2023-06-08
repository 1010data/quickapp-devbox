
# quickserve

This directory contains the start on a development tool for 1010data quickapps.

## quick start

- install [node.js](https://nodejs.org/en)
- install the dependencies (`ws`, `chokidar`, etc) with:

      cd /path/to/quickserve
      npm install

- run the dev server with this command:

      cd /path/to/quickserve
      node quickserve.js quickapp.xml

- visit http://localhost:8080/
- fill out the form to log into a 1010 environment.
- quickserve uploads `quickapp.xml` via API2.
- an iframe appears, with the quickapp displayed.
- edit and save the message in `quickapp.xml`
- the xml is re-uploaded and the iframe is refreshed.
