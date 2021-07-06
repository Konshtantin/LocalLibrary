const express = require('express')
const logger = require('morgan')
const mongoose = require('mongoose')
const path = require('path')
const index = require('./routers/index')
const catalog = require('./routers/catalog')
const compression = require('compression')
const helmet = require('helmet')

const app = express()

// register helmet for protection
app.use(helmet())

// Database connect
const dev_db_url = 'mongodb+srv://Anonymous:A4QIA5JJ400AUyuX@node-library.uelbc.mongodb.net/Library?retryWrites=true&w=majority'
const mongoDB = process.env.MONGODB_URI || dev_db_url;
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(result => app.listen(3000))
    .catch(err => console.log(err))

// register view engine
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(express.urlencoded({extended: true}))

// register morgan logger
app.use(logger('dev'))

// register compression
app.use(compression())

// register public files
app.use(express.static('./public'))


app.use('/', index)
app.use('/catalog', catalog)

app.use((req, res) => {
    res.render('404', {title: 'Not Found'})
})


