const app = require('./src/app')
const connect = require('./src/models/connection')
require('dotenv').config()

connect()

module.exports = app