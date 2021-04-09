const createRandomStringRequest = require('./createRandomString').createRandomStringRequest
const calculateDitoCreditsRequest = require('./calculateDitoCredits').calculateDitoCreditsRequest

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


app.post('/calculateDitoCredits', (req, res) => {
  console.log('POST Data: ', req.body)
  calculateDitoCreditsRequest(req.body, (status, result) => {
    console.log('Result: ', result)
    res.status(status).json(result)
  })
})

app.listen(port, () => console.log(`Listening on port ${port}!`))
