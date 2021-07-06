const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const AuthorSchema = new Schema(
    {
        first_name: {type: String, required: true, max: 100},
        family_name: {type: String, required: true, max: 100},
        date_of_birth: {type: Date},
        date_of_death: {type: Date},
    }
);

// Виртуальное свойство для полного имени автора
AuthorSchema
    .virtual('name')
    .get(function () {
        return this.family_name + ' ' + this.first_name;
    });

AuthorSchema
    .virtual('dob')
    .get(function() {
        if(!this.date_of_birth) return '*'
        return this.date_of_birth.toLocaleDateString(
            'en-gb',
            {
                year: 'numeric',
                month: 'long',
                timeZone: 'utc'
            }
        )
    })

AuthorSchema
    .virtual('dod')
    .get(function() {
        if(!this.date_of_death) return '*'
        return this.date_of_death.toLocaleDateString(
            'en-gb',
            {
                year: 'numeric',
                month: 'long',
                timeZone: 'utc'
            }
        )
    })
AuthorSchema.virtual('lifespan').get(function() {
    return this.dob + ' - ' + this.dod
})
AuthorSchema
    .virtual('dob_form')
    .get(function() {
        if(!this.date_of_birth) return ''
        const year = this.date_of_birth.getFullYear()
        const month = (this.date_of_birth.getMonth()+1).toString().length === 1 ? '0' + (this.date_of_birth.getMonth()+1) : this.date_of_birth.getMonth()+1
        const day = this.date_of_birth.getDate().toString().length === 1 ? '0'+ this.date_of_birth.getDate() : this.date_of_birth.getDate()
        return year+'-'+month+'-'+day
    })
AuthorSchema
    .virtual('dod_form')
    .get(function() {
        if(!this.date_of_death) return ''
        const year = this.date_of_death.getFullYear()
        const month = (this.date_of_death.getMonth()+1).toString().length === 1 ? '0' + (this.date_of_death.getMonth()+1) : this.date_of_death.getMonth()+1
        const day = this.date_of_death.getDate().toString().length === 1 ? '0'+ this.date_of_death.getDate() : this.date_of_death.getDate()
        return year+'-'+month+'-'+day
    })
// Виртуальное свойство - URL автора
AuthorSchema
    .virtual('url')
    .get(function () {
        return '/catalog/author/' + this._id;
    });

//Export model
module.exports = mongoose.model('Author', AuthorSchema);