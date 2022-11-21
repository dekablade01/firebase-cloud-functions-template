# Firebase Cloud Function Template
Cloud Functions for Firebase is a serverless framework that lets you automatically run backend code in response to events triggered by Firebase features and HTTPS requests. Your JavaScript or TypeScript code is stored in Google's cloud and runs in a managed environment. There's no need to manage and scale your own servers.

## Firebase Cloud Function limitation
Referring to the Firebase [Organize Functions](https://firebase.google.com/docs/functions/organize-functions) documentation, it says that there are several ways to distribute multiple functions.

### Mono and Multiple repositories
For the [`mono-repo`](https://firebase.google.com/docs/functions/organize-functions#managing_multiple_source_packages_monorepo) and [`multiple-repo`](https://firebase.google.com/docs/functions/organize-functions#managing_multiple_repositories) approaches, we have to maintain multiple `package.json` files. Codes are independent to each other so they cannot be reused normally. We have to call via Firebase SDK. 
```
### Mono Repository
$  tree .
├── firebase.json
├── teamA
│   ├── index.js
│   └── package.json
└── teamB
    ├── index.js
    └── package.json

### Multiple Repositories
$  tree .
├── repoA
│   ├── firebase.json
│   └── functions
│       ├── index.js
│       └── package.json
└── repoB
    ├── firebase.json
    └── functions
        ├── index.js
        └── package.json
```

### Functions in multiple files and Group Functions
For the [`Functions in multiple files`](https://firebase.google.com/docs/functions/organize-functions#write_functions_in_multiple_files) and [`Group Functions`](https://firebase.google.com/docs/functions/organize-functions#group_functions), the code can be reused, but it's hard to and we need only one `package.json`. But it's hard to maintain the function exporting in the `index.js` manually.

```js
const foo = require('./foo');
const bar = require('./bar');

exports.foo = foo.foo;
exports.bar = bar.bar;
```

### Use a Web Framework
For [`Use a Web Framework`](https://firebase.google.com/docs/hosting/functions#use_a_web_framework), this is the most familiar approach. But all the functions are hidden behind the `/app` path becuase we export the express app. So we will only able to see the `/app` path on the firebase dashboard.

```js
const functions = require('firebase-functions');
const express = require('express');
const app = express();
```

## What does this template help? 
It's kind of an improvement of the `Functions in multiple files and Group Functions` with an additional feature in intercepting the request before executing something for to produce the response. For example `Checking for the API Key` or `Checking for the Authorization Header`.

It does not requires extra configurations in the `package.json` or `firebase.json`. When the main `index.js` receives the call, the intercepters take the request and reject if the request does not follows the basic requirements of the intercepters. If it does, the request will be send to it's path executer like `/user` or `/item`. 

```
$  tree .
└── functions
   ├── firebase.json
   ├── index.js
   ├── Helpers
   │   └── RequestIntercepter
   │       ├── APIKeyRequestIntercepter
   │       └── TokenRequestIntercepter
   └── paths
        ├── user
        │   ├── index.js            # routes request to one of the scripts below. 
        │   ├── get_user.js
        │   ├── create_user.js
        │   ├── delete_user.js
        │   └── update_user.js
        └── item
            ├── index.js
            └── get_item.js
```

Normally, we have to export the path in the main `index.js` manually. So the firebase cloud function can see the available paths and shows them on the Firebase dashboard. But this template automatically exports those paths. It checks for directories in the `/paths` directory, and exports them in the `index.js`

For the any directories under `/paths` but starts with `_` (has _ as a prefix), they will not be exported for the firebase cloud function. 

```js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fs = require('fs');

let APIKeyRequestIntercepter = require("./Helpers/RequestIntercepter/APIKeyRequestIntercepter")
let TokenRequestIntercepter = require("./Helpers/RequestIntercepter/TokenRequestIntercepter")

admin.initializeApp()

let __PATH__ = "./paths/"
let requestIntercepters = [new APIKeyRequestIntercepter(), new TokenRequestIntercepter()]

fs.readdirSync(__PATH__, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name)
    .filter((name) => !name.startsWith("_"))
    .map((path) => {
        return {
            key: path,
            value: functions.https.onRequest(async (req, res) => {
                const service = require(__PATH__ + path)
                let _function = async (promise, intercepter) => promise.then(async req => await intercepter.intercept(req))
                let promise =  new Promise((res, rej) => res(req))
                requestIntercepters.reduce(_function, promise)
                    .then(req => service.onRequest(req, res))
                    .catch(e => res.json(e))
            })
        }
    })
    .forEach((item) =>  exports[item.key] = item.value)
```