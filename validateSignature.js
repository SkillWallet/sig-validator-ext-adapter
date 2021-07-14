const { Validator } = require('@chainlink/external-adapter')
const { default: axios } = require('axios')
var eccryptoJS = require('eccrypto-js');


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
    pubKey: ['pubKey', 'publicKey'],
    signature: ['sig', 'signature'],
    getNonceUrl: ['getNonceUrl', 'getNonce'],
    deleteNonceUrl: ['deleteNonceUrl', 'delNonceUrl'],
    endpoint: false
}

const validateSignature = async (input, callback) => {
    console.log('chainlink adapter called');
    // The Validator helps you validate the Chainlink request data
    const validator = new Validator(callback, input, customParams)
    const jobRunID = validator.validated.id;
    const pubKey = validator.validated.data.pubKey;
    const signature = validator.validated.data.signature;
    const getNonceUrl = validator.validated.data.getNonceUrl;
    const deleteNonceUrl = validator.validated.data.deleteNonceUrl;
    console.log('validation passed');

    function hexToBytes(hex) {
        for (var bytes = [], c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
    }

    const signatureBytes = hexToBytes(signature);
    const buf = Buffer.from(signatureBytes);
    console.log('signature parsed to bytes');

    const noncesResp = await axios.get(getNonceUrl)
    console.log('fetched nonces');
    console.log(noncesResp);

    const nonces = noncesResp.data.nonces;
    console.log(nonces);
    let foundValidNonce = false;
    for (const nonce of nonces) {
        console.log(nonce);
        const msg = eccryptoJS.utf8ToBuffer(nonce.toString());
        const hash = await eccryptoJS.sha256(msg);
        const pub = eccryptoJS.recover(hash, buf);
        const recoveredHexPub = pub.toString('hex');
        const hashedRecoveredPub = eccryptoJS.keccak256(Buffer.from(recoveredHexPub));

        if (pubKey === eccryptoJS.bufferToHex(hashedRecoveredPub)) {
            foundValidNonce = true;
            console.log('found valid nonce');
            break;
        }
        console.log('did not find valid nonce');

    }
    // TODO: fix & uncomment
    if (foundValidNonce && deleteNonceUrl)
        await axios.delete(deleteNonceUrl);

    const response = {
        jobRunID: jobRunID,
        data: { isValid: foundValidNonce },
        result: foundValidNonce,
        statusCode: 200
    }

    callback(200, response);
}

// This is a wrapper to allow the function to work with
// GCP Functions
exports.gcpservice = (req, res) => {
    validateSignature(req.body, (statusCode, data) => {
        res.status(statusCode).send(data)
    })
}

// This is a wrapper to allow the function to work with
// AWS Lambda
exports.handler = (event, context, callback) => {
    validateSignature(event, (statusCode, data) => {
        callback(null, data)
    })
}

// This is a wrapper to allow the function to work with
// newer AWS Lambda implementations
exports.handlerv2 = (event, context, callback) => {
    validateSignature(JSON.parse(event.body), (statusCode, data) => {
        callback(null, {
            statusCode: statusCode,
            body: JSON.stringify(data),
            isBase64Encoded: false
        })
    })
}

// This allows the function to be exported for testing
// or for running in express
module.exports.validateSignature = validateSignature
