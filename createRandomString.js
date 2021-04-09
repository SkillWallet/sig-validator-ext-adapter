const { Requester, Validator } = require('@chainlink/external-adapter')
const crypto = require("crypto");

// Define custom error scenarios for the API.
// Return true for the adapter to retry.
const customError = (data) => {
    if (data.Response === 'Error') return true
    return false
}

// Define custom parameters to be used by the adapter.
// Extra parameters can be stated in the extra object,
// with a Boolean value indicating whether or not they
// should be required.
const customParams = {
    user: ['user', 'address', 'owner'],
    endpoint: false
}

const createRandomStringRequest = (input, callback) => {
    // The Validator helps you validate the Chainlink request data
    const validator = new Validator(callback, input, customParams)
    const jobRunID = validator.validated.id
    const user =   validator.validated.data.user

    const randomHash = crypto.randomBytes(6).toString('hex')

    const response = {
        jobRunID: jobRunID,
        data: {user: user, result: randomHash},
        result: randomHash,
        statusCode: 200
    }

    callback(200, response);

}

// This is a wrapper to allow the function to work with
// GCP Functions
exports.gcpservice = (req, res) => {
    createRandomStringRequest(req.body, (statusCode, data) => {
        res.status(statusCode).send(data)
    })
}

// This is a wrapper to allow the function to work with
// AWS Lambda
exports.handler = (event, context, callback) => {
    createRandomStringRequest(event, (statusCode, data) => {
        callback(null, data)
    })
}

// This is a wrapper to allow the function to work with
// newer AWS Lambda implementations
exports.handlerv2 = (event, context, callback) => {
    createRandomStringRequest(JSON.parse(event.body), (statusCode, data) => {
        callback(null, {
            statusCode: statusCode,
            body: JSON.stringify(data),
            isBase64Encoded: false
        })
    })
}

// This allows the function to be exported for testing
// or for running in express
module.exports.createRandomStringRequest = createRandomStringRequest
