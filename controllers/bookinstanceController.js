const Book = require('../models/book')
const Author = require('../models/author')
const Genre = require('../models/genre')
const BookInstance = require('../models/bookinstance')

const async = require('async')
const { body, validationResult } = require('express-validator')

const bookinstance_list = (req, res) => {
    BookInstance.find()
        .populate('book')
        .exec((err, list_bookinstances) => {
            if(err) {
                console.log(err)
                return
            }
            res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: list_bookinstances})
        })
}
const bookinstance_detail = (req, res) => {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function(err, bookinstance) {
            if(err) {
                console.log(err)
                return
            }
            if(bookinstance == null) {
                console.log(new Error('Book copy not found'))
                return
            }
            res.render('bookinstance_detail', {title: 'Copy'+bookinstance.book.title, bookinstance})
        })
}
const bookinstance_create_get = (req, res) => {
    Book.find({}, 'title')
        .exec(function(err, books) {
            if(err) {
                console.log(err)
                return
            }
            res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, bookinstance: undefined, errors: undefined})
        })
}
const bookinstance_create_post = [
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

    (req, res, next) => {
        const errors = validationResult(req)

        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        })

        if(!errors.isEmpty()) {
            Book.find({}, 'title')
                .exec(function(err, books) {
                    if(err) {
                        console.log(err)
                        return
                    }
                    res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance})
                })
            return
        }  else {
            bookinstance.save(function (err){
                if(err) {
                    console.log(err)
                    return
                }
                res.redirect(bookinstance.url)
            })
        }
    }
]
const bookinstance_delete_get = (req, res) => {
    BookInstance.findById(req.params.id)
        .populate('book')
        .then(result => {
            if(result === null) {
                console.log(new Error('BookInstance not found!'))
                return
            }
            res.render('bookinstance_delete', {title: 'Delete BookInstance', bookinstance: result})
        })
}
const bookinstance_delete_post = (req, res) => {
    BookInstance.findByIdAndDelete(req.body.bid)
        .then(result => {
            res.redirect('/catalog/bookinstances')
        })
}
const bookinstance_update_get = (req, res) => {
    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id)
                .populate('book')
                .exec(callback)
        },
        books: function(callback) {
            Book.find().exec(callback)
        }
    }, function(err, results) {
        if(err) {
            console.log(err)
            return
        }
        if(results.bookinstance === null) {
            console.log(new Error('BookInstance not found'))
            return
        }
        res.render('bookinstance_form', {title: 'Update BookInstance', bookinstance: results.bookinstance, book_list: results.books, errors: undefined})
    })
}
const bookinstance_update_post = [
    body('book', 'Book must be specified').trim().isLength({min:1}).escape(),
    body('imprint', 'Imprint must not be empty').trim().isLength({min:1}).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601().toDate(),

    (req, res, next) => {
        const errors = validationResult(req)

        const bookinstance = new BookInstance({
            title: req.body.title,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
        })
        if(!errors.isEmpty()) {
            Book.find()
                .then(books => {
                    res.render('bookinstance_form', {title: 'BookInstance Update', book_list: books, errors: errors.array()})
                })
        } else {
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {useFindAndModify: true}, function(err, instance) {
                if(err) {
                    console.log(err)
                    return
                }
                res.redirect(instance.url)
            })
        }
    }
]

module.exports = {
    bookinstance_list,
    bookinstance_detail,
    bookinstance_create_get,
    bookinstance_create_post,
    bookinstance_delete_get,
    bookinstance_delete_post,
    bookinstance_update_get,
    bookinstance_update_post
}