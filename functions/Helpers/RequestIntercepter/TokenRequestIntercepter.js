var RequestIntercepting = require("./RequestIntercepting")

module.exports = class TokenRequestIntercepter extends RequestIntercepting { 
    async intercept(req) { 
        return new Promise((resolve, reject) => { 
            if (this.isValid(req)) { 
                return resolve(req)
            } 
            return reject({"error": "No user token"})
        })
    }

    isValid(req) { 
        // return req.headers["Authorization"] != null
        return true
    }
}