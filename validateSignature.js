const { Validator } = require('@chainlink/external-adapter')
const { default: axios } = require('axios')
var EC = require('elliptic').ec;
var keccak256 = require('keccak256');

// Create and initialize EC context
// (better do it once and reuse it)
var ec = new EC('secp256k1');

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

const validateSignature = (input, callback) => {
    // The Validator helps you validate the Chainlink request data
    const validator = new Validator(callback, input, customParams)
    const jobRunID = validator.validated.id;
    const pubKey = validator.validated.data.pubKey;
    const action = validator.validated.data.action;
    const tokenId = validator.validated.data.tokenId;
    const signature = validator.validated.data.signature;
    const recoveryParam = validator.validated.data.recoveryParam;

    function hexToBytes(hex) {
        for (var bytes = [], c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
    }

    const signatureBytes = hexToBytes(signature);

    const noncesResp = await axios.get(`http://localhost:3005/api/skillwallet/${tokenId}/nonces?action=${action}`)
    let foundValidNonce = false;
    noncesResp.data.nonces.forEach(nonce => {
        const bufferNonce = Buffer.from(nonce);
        const recoveredObj = ec.recoverPubKey(bufferNonce, signatureBytes, recoveryParam);
        const recoveredKey = ec.keyFromPublic(recoveredObj, 'hex');
        const hexRecoveredKey = recoveredKey.getPublic('hex');
        const hashedRecoveredPubKey = keccak256(hexRecoveredKey).toString('hex');
        if (hashedRecoveredPubKey === pubKey) {
            foundValidNonce = true;
            break;
        }
    });

    if (foundValidNonce) {
        const deleteRes = await axios.delete(`http://localhost:3005/api/skillwallet/${tokenId}/nonces?action=${action}`);
        if (deleteRes.status === 200) {
            //return success?
        } else {
            // return error
        }
    } else {
        isValid = true;
        // return error
    }



    const response = {
        jobRunID: jobRunID,
        data: { tokenId, isValid: foundValidNonce },
        result: foundValidNonce,
        statusCode: 200
    }

    callback(200, response);
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
