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