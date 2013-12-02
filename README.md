node-crm  
========  
@author: em3rg3  
@version: v1.0.0  
  
CRM written in Node.js  
  
INSTALLATION  
============  
1. Install packages from package.json
2. Copy config.js.sample to config.js

To enable email registration and verification, change ENABLE_EMAIL_REGISTRATION to true in config.js. 
This will send out verification email during registration.

To start,
node app.js

For development it is recommended to use nodemon package (sudo npm -g install nodemon):
nodemon app.js