let get_sample = require('./get_sample')

function onRequest(req, res) {
    switch (req.method) {
        case "POST":        break
        case "GET":         return get_sample(req, res)
        default:            return res.json({"aaa": "bbb"})
    }
}

module.exports = {onRequest};