const { Requester, Validator } = require('@chainlink/external-adapter')

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

const calculateDitoCreditsRequest = (input, callback) => {
    // The Validator helps you validate the Chainlink request data
    const validator = new Validator(callback, input, customParams)
    const jobRunID = validator.validated.id
    const user = validator.validated.data.user

    const ditoCredits = 2006;

    const response = {
        jobRunID: jobRunID,
        data: {user: user, result: ditoCredits},
        result: ditoCredits,
        statusCode: 200
    }

    callback(200, response);

    // TODO: Implement this later
    // const url = `https://dito.io/calculateDitoCredits/${user}`
    //
    // // This is where you would add method and headers
    // // you can add method like GET or POST and add it to the config
    // // The default is GET requests
    // // method = 'get'
    // // headers = 'headers.....'
    // const config = {
    //     url,
    // }
    //
    // // The Requester allows API calls be retry in case of timeout
    // // or connection failure
    // Requester.request(config, customError)
    //     .then(response => {
    //         // It's common practice to store the desired value at the top-level
    //         // result key. This allows different adapters to be compatible with
    //         // one another.
    //         console.log("Requester response", response)
    //         response.data.result = response.result
    //         callback(response.status, Requester.success(jobRunID, response))
    //     })
    //     .catch(error => {
    //         callback(500, Requester.errored(jobRunID, error))
    //     })


}

// This is a wrapper to allow the function to work with
// GCP Functions
exports.gcpservice = (req, res) => {
    calculateDitoCreditsRequest(req.body, (statusCode, data) => {
        res.status(statusCode).send(data)
    })
}

// This is a wrapper to allow the function to work with
// AWS Lambda
exports.handler = (event, context, callback) => {
    calculateDitoCreditsRequest(event, (statusCode, data) => {
        callback(null, data)
    })
}

// This is a wrapper to allow the function to work with
// newer AWS Lambda implementations
exports.handlerv2 = (event, context, callback) => {
    calculateDitoCreditsRequest(JSON.parse(event.body), (statusCode, data) => {
        callback(null, {
            statusCode: statusCode,
            body: JSON.stringify(data),
            isBase64Encoded: false
        })
    })
}

// This allows the function to be exported for testing
// or for running in express
module.exports.calculateDitoCreditsRequest = calculateDitoCreditsRequest
