const Author = require('../models/author')
const Book = require('../models/book')
const { body, validationResult } = require('express-validator')
const async = require('async')

const author_list = (req, res) => {
    Author.find()
        .sort([['family_name', 'ascending']])
        .exec(function(err, list_authors) {
            if(err) {
                console.log(err)
                return
            }
            res.render('author_list', { title: 'Author List', author_list: list_authors})
        })
}

const author_detail = (req, res) => {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
                .exec(callback)
        },
        author_books: function(callback) {
            Book.find({'author': req.params.id}, 'title summary')
                .exec(callback)
        }
    }, function(err, resolves) {
        if(err) {
            console.log(err)
            return
        }
        if(resolves.author == null) {
            console.log(new Error('Author not found'))
            return
        }
        res.render('author_detail', { title: 'Author Detail', author: resolves.author, author_books: resolves.author_books})
    })
    
}

const author_create_get = (req, res) => {
    res.render('author_form', {title: 'Create Author', errors: undefined, author: undefined})
}

const author_create_post = [
    body('first_name').trim().isLength({ min: 1 }).escape().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').trim().isLength({ min: 1 }).escape().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601().toDate(),
    (req, res) => {

        const errors = validationResult(req)

        if(!errors.isEmpty()) {
            res.render('author_form', {title: 'Create Author', author: req.body, errors: errors.array()})
            return
        } else {
            const author = new Author({
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
            })
            author.save(function(err) {
                if(err) {
                    console.log(err)
                    return
                }
                res.redirect(author.url)
            })
        }
    }
]

const author_delete_get = (req, res) => {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback)
        },
        author_books: function(callback) {
            Book.find({'author': req.params.id}).exec(callback)
        }
    }, function(err, responses) {
        if(err) {
            console.log(err)
            return
        }
        if(responses.author === null) {
            res.redirect('/catalog/authors')
        }

        res.render('author_delete', {title: 'Delete Author', author: responses.author, author_books: responses.author_books})
    }) 
}
const author_delete_post = (req, res) => {
    async.parallel({
        author: function(callback) {
            Author.findById(req.body.authorid).exec(callback)
        },
        author_books: function(callback) {
            Book.find({'author': req.body.authorid}).exec(callback)
        }
    }, function(err, responses) {
        if(err) {
            console.log(err)
            return
        }
        if(responses.author_books.length > 0) {
            res.render('author_delete', {title: 'Delete Author', author: responses.author, author_books: responses.author_books})
            return
        } else {
            Author.findByIdAndDelete(req.body.authorid, function(err) {
                if(err) {
                    console.log(err)
                    return
                }
                res.redirect('/catalog/authors')
            })
        }
    })
}
const author_update_get = (req, res) => {
    Author.findById(req.params.id)
        .then(author => {
            res.render('author_form', {title: 'Author Update', author, errors: undefined})
        })
}
const author_update_post = (req, res) => {
    body('first_name', 'First name must not be empty.').trim().isLength({min:1}).escape(),
    body('family_name', 'Family name must not be empty.').trim().isLength({min:1}).escape(),
    body('date_of_birth', 'Invalid date of birth').optional({checkFalsy: true}).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({checkFalsy: true}).isISO8601().toDate(),

    (req, res, next) => {
        
        const errors = validationResult(req)

        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id
        })

        if(!errors.isEmpty()) {
            Author.findById(req.params.id)
                .then(author => {
                    res.render('author_form', {title: 'Author Update', author, errors: errors.array()})
                })
        } else {
            Author.findByIdAndUpdate(req.params.id, author, {useFindAndModify: false}, function(err, result) {
                if(err) {
                    console.log(err)
                    return
                }
                res.redirect(result.url)
            })
        }
    }
}

module.exports = {
    author_list,
    author_detail,
    author_create_get,
    author_create_post,
    author_delete_get,
    author_delete_post,
    author_update_get,
    author_update_post
}