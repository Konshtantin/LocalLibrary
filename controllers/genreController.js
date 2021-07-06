const Genre = require('../models/genre')
const Book = require('../models/book')

const {body, validationResult} = require('express-validator')

const async = require('async')
const genre_list = (req, res) => {
    Genre.find()
        .sort('name')
        .exec(function(err, list_genres) {
            res.render('genre_list', { title: 'Genre List', genre_list: list_genres})
        })
    
}
const genre_detail = (req, res) => {
    async.parallel({
        genre: function(callback){
            Genre.findById(req.params.id)
                .exec(callback)
        },

        genre_books: function(callback) {
            Book.find({'genre': req.params.id})
                .exec(callback)
        }
    }, function(err, resolves) {
        if(err) {
            console.log(err)
            return
        }
        if(resolves.genre == null) {
            throw new Error('Genre not found!')
        }
        res.render('genre_detail', { title: 'Genre Detail', genre: resolves.genre, genre_books: resolves.genre_books})
    })
}
const genre_create_get = (req, res) => {
    res.render('genre_form', { title: 'Create Genre', genre: null, errors: null})
}
const genre_create_post = [
    body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),
    (req, res) => {
        const errors = validationResult(req)

        const genre = new Genre(
            { name: req.body.name }
        )

        if(!errors.isEmpty()) {
            res.render('genre_form', {title: 'Create Genre', genre, errors: errors.array()})
            return
        } else {
            Genre.findOne({'name' : req.body.name})
                .exec(function(err, found_genre) {
                    if(err) {
                        console.log(err)
                        return
                    }
                    if(found_genre) {
                        res.redirect(found_genre.url)
                    }
                    else{
                        genre.save((err) => {
                            if(err) {
                                console.log(err)
                                return
                            }
                            res.redirect(genre.url)
                        })
                    }
                }) 
        }
    } 
]
const genre_delete_get = (req, res) => {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback)
        },
        genre_books: function(callback) {
            Book.find({'genre': req.params.id}).exec(callback)
        }
    }, function(err, results) {
        if(err) {
            console.log(err)
            return
        }
        if(results.genre == null) {
            console.log(new Error('Genre not found!'))
            return
        }
        res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books})
    })
}
const genre_delete_post = (req, res) => {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.body.gid).exec(callback)
        },
        genre_books: function(callback) {
            Book.find({'genre': req.body.gid}).exec(callback)
        }
    }, function(err, results) {
        if(err) {
            console.log(err)
            return
        }
        if(results.genre == null) {
            console.log(new Error('Genre not found!'))
            return
        }
        if(results.genre_books.length > 0) {
            res.render('genre_delete', {title: 'Delete Genre', genre_books: results.genre_books, error: 'Delete following books!'})
            return
        } else{
            Genre.findByIdAndDelete(req.body.gid, function(err) {
                if(err) {
                    console.log(err)
                    return
                }
                res.redirect('/catalog/genres')
            })
        }
        
    })
}
const genre_update_get = (req, res) => {
    Genre.findById(req.params.id)
        .then(genre => {
            res.render('genre_form', {title: 'Update Genre', genre, errors: undefined})
        })
}
const genre_update_post = [
    body('name', 'Name must not be empty').trim().isLength({min: 1}).escape(),

    (req, res, next) => {
        const errors = validationResult(req)

        const genre = new Genre({
            name: req.body.name,
            _id: req.params.id
        })

        if(!errors.isEmpty()) {
            Genre.findById(req.params.id)
                .then(genre => {
                    res.render('genre_form', {title: 'Update Genre', genre, errors: errors.array()})
                })
            return
        } else {
            Genre.findByIdAndUpdate(req.params.id, genre, {useFindAndModify:false}, function(err, newgenre) {
                res.redirect(newgenre.url)
            })
        }
    }
]

module.exports = {
    genre_list,
    genre_detail,
    genre_create_get,
    genre_create_post,
    genre_delete_get,
    genre_delete_post,
    genre_update_get,
    genre_update_post
}