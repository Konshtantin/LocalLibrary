const Book = require('../models/book')
const Author = require('../models/author')
const Genre = require('../models/genre')
const BookInstance = require('../models/bookinstance')
const { body, validationResult } = require('express-validator')

const async = require('async')


const index = (req, res) => {
    async.parallel({
        book_count: (callback) => {
            Book.countDocuments(callback)
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments(callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({'status':'Available'}, callback);
        },
        author_count: function(callback) {
            Author.countDocuments(callback);
        },
        genre_count: function(callback) {
            Genre.countDocuments(callback);
        }
    }, function(err, results) {
        res.render('index', {title: 'Home', error: err, data: results})
    })
}

const book_list = (req, res) => {
    Book.find({}, 'title author')
        .populate('author')
        .exec(function (err, book_list) {
            if(err) {
                console.log(err)
                return
            } 
            res.render('book_list', {title: 'Book List', book_list})
        })
}

const book_detail = (req, res, next) => {
    async.parallel({
        book: function(callback) {
            console.log(req.params.id)
            Book.findById(req.params.id)
                .populate('genre')
                .populate('author')
                .exec(callback)
        },
        book_instance: function(callback) {
            BookInstance.find({'book' : req.params.id})
                .exec(callback)
        }
    }, function(err, responses) {
        if(err) {
            console.log(err)
            return
        }
        if(responses.book == null) {
            throw new Error('Book not found')
        }
        res.render('book_detail', {title: responses.book.title, book: responses.book, book_instances: responses.book_instance})
    })
}

const book_create_get = (req, res) => {
    async.parallel({
        authors: function(callback) {
            Author.find(callback)
        },
        genres: function(callback) {
            Genre.find(callback)
        }
    }, function(err, responses) {
        if(err) {
            console.log(err)
            return
        }
        res.render('book_form', { title: 'Create Book', authors: responses.authors, genres: responses.genres, book: undefined, errors: undefined})
    })
}

const book_create_post = [
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)) {
            if(typeof req.body.genre === undefined){
                req.body.genre = []
            } else {
                req.body.genre = new Array(req.body.genre)
            }
        }
        next()
    },

    body('title', 'Title must not be empty.').trim().isLength({min: 1}).escape(),
    body('author', 'Author must not be empty').trim().isLength({min: 1}).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({min: 1}).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({min: 1}).escape(),
    body('genre.*').escape(),

    (req, res, next) => {
        const errors = validationResult(req)

        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
        })

        if(!errors.isEmpty()) {
            async.parallel({
                authors: function(callback) {
                    Author.find(callback)
                },
                genres: function(callback) {
                    Genre.find(callback)
                }
            }, function(err, resolves) {
                if(err){
                    console.log(err)
                    return
                }
                for (let i = 0; i < resolves.genres.length; i++) {
                    if(book.genre.indexOf(resolves.genres[i]._id > -1)) {
                        resolves.genres[i].checked = 'true'
                    }
                }
                res.render('book_form', {title: 'Create Book', authors: responses.authors, genres: responses.genres, errors: errors.array()})
            })
            return
        }
        else {
            book.save(function(err) {
                if(err) {
                    console.log(err)
                    return
                }
                res.redirect(book.url)
            })
        }
    }
]

const book_delete_get = (req, res) => {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback)
        },
        bookinstances: function(callback) {
            BookInstance.find({'book': req.params.id})
                .exec(callback)
        }
    }, function(err, results) {
        if(err) {
            console.log(err)
            return
        }
        if(results.book === null) {
            console.log(new Error('Book not found | GET'))
            return
        } 
        res.render('book_delete', {title: 'Delete Book', book: results.book, bookinstances: results.bookinstances})
    })
}

const book_delete_post = (req, res) => {
    async.parallel({
        book: function(callback) {
            Book.findById(req.body.bookid)
                .populate('author')
                .populate('genre')
                .exec(callback)
        },
        bookinstances: function(callback) {
            BookInstance.find({'book': req.body.bookid})
                .exec(callback)
        }
    }, function(err, results) {
        if(err) {
            console.log(err)
            return
        }
        if(results.bookinstances.length > 0) {
            res.render('book_delete', {title: 'Delete Book', book: results.book, bookinstances: results.bookinstances})
            return
        } else {
            Book.findByIdAndDelete(req.body.bookid, function(err) {
                if(err) {
                    console.log(err)
                    return
                }
                res.redirect('/catalog/books')
            })
        }

    })
}

const book_update_get = (req, res) => {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback)
        },
        authors: function(callback) {
            Author.find(callback)
        },
        genres: function(callback) {
            Genre.find(callback)
        }
    }, function(err, results) {
        if(err) {
            console.log(err)
            return
        } 
        if(results.book === null) {
            console.log(new Error('Book not found'))
            res.status(404).redirect('/catalog/books')
        }
        res.render('book_form', {title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book, errors: undefined})
    })
}

const book_update_post = [
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)) {
            if(typeof req.body.genre === 'undefined'){
                req.body.genre = []
            } else {
                req.body.genre = [req.body.genre]
            }
        }
        next()
    },

    // Validate and sanitize fields
    body('title', 'Title must not be empty.').trim().isLength({min:1}).escape(),
    body('author', 'Author must not be empty.').trim().isLength({min:1}).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({min:1}).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({min:1}).escape(),
    body('genre.*').escape(),

    (req, res, next) => {

        const errors = validationResult(req)

        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre,
            _id: req.params.id 
        })
        if(!errors.isEmpty()) {
            async.parallel({
                authors: function(callback) {
                    Author.find(callback)
                },
                genres: function(callback) {
                    Genre.find(callback)
                }
            }, function(err, results) {
                if(err) {
                    console.log(err)
                    return
                }

                // Mark our selected Genres as checked
                for(let i = 0; i < results.genres.length; i++) {
                    if(book.gerne.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = true
                    }
                }
                res.render('book_form', {title: 'Update Book', author: results.author, genres: results.genres, book, errors: errors.array()})
            })
            return
        } else {
            Book.findByIdAndUpdate(req.params.id, book, {useFindAndModify: false}, function(err, thebook) {
                if(err) {
                    console.log(err)
                    return
                }
                res.redirect(thebook.url)
            })
        }

    }

]

module.exports = {
    index,
    book_list,
    book_detail,
    book_create_get,
    book_create_post,
    book_delete_get,
    book_delete_post,
    book_update_get,
    book_update_post
}