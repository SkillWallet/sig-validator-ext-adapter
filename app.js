const createRandomStringRequest = require('./createRandomString').createRandomStringRequest
const validateSignature = require('./validateSignature').validateSignature

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.EA_PORT || 8080

app.use(bodyParser.json())

app.post('/createRandomString', (req, res) => {
  console.log('POST Data: ', req.body)
  createRandomStringRequest(req.body, (status, result) => {
    console.log('Result: ', result)
    res.status(status).json(result)
  })
})


app.post('/validateSignature', (req, res) => {
  console.log('POST Data: ', req.body)
  validateSignature(req.body, (status, result) => {
    console.log('Result: ', result)
    res.status(status).json(result)
  })
})

app.listen(port, () => console.log(`Listening on port ${port}!`))
