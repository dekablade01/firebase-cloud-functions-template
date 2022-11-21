var RequestIntercepting = require("./RequestIntercepting")

module.exports = class APIKeyRequestIntercepter extends RequestIntercepting { 
    async intercept(req) { 
        return new Promise((resolve, reject) => { 
            if (this.isValid(req)) { 
                return resolve(req)
            } 
            return reject({"error": "No api key"})
        })
    }

    isValid(req) { 
        // return req.headers["x-api-key"] != null
        return true
    }
}