let mongoose = require('mongoose');
//making Schema
let blogSchema = new mongoose.Schema({
	titleB: String,
	imgB: {},
	descB: String,
	date: { type: Date, content: Date.now() }
});
// mongoose model
let Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;
