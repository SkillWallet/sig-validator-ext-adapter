const { Requester, Validator } = require('@chainlink/external-adapter')
const { default: axios } = require('axios')
var eccryptoJS = require('eccrypto-js');
var EC = require('elliptic').ec;
var ec = new EC('p256');

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
  // The Validator helps you validate the Chainlink request data
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id;
  const pubKey = validator.validated.data.pubKey;
  const signature = validator.validated.data.signature;
  const getNonceUrl = validator.validated.data.getNonceUrl;
  const deleteNonceUrl = validator.validated.data.deleteNonceUrl;

  const noncesResp = await axios.get(getNonceUrl)
  console.log('fetched nonces');

  try {
    const nonces = noncesResp.data.nonces;
    let validNonce = '';
    console.log(nonces);
    let foundValidNonce = false;
    for (const nonce of nonces) {
      console.log(nonce);
      const msg = Buffer.from(nonce.toString());
      const hash = await eccryptoJS.sha256(msg);
      const public = ec.keyFromPublic(pubKey, 'hex');
      const isVerified = public.verify(hash, signature)

      if (isVerified) {
        foundValidNonce = true;
        validNonce = nonce;
        console.log('found valid nonce');
        break;
      }
      console.log('did not find valid nonce');

    }
    // TODO: fix & uncomment
    if (foundValidNonce && deleteNonceUrl)
      await axios.delete(deleteNonceUrl + `&nonce=${validNonce}`);

    callback(200, {
      jobRunID,
      data: {
        isValid: foundValidNonce
      }
    });

  } catch (error) {
    callback(500, {
      jobRunID,
      data: {
        isValid: false
      }
    })
  };
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
