Set route handler for railway-routes generated routes and Chungking
controllers.

# Install

    npm install daobao;

# Usage 

```javascript 
var controllers = require('../controllers')
  , handler = require('daobao').assignHandler(controllers)
  , map = new require('railway-routes').Map(app, handler);
```
