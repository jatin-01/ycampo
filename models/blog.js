let mongoose = require('mongoose');
//making Schema
let blogSchema = new mongoose.Schema(
	{
		titleB: String,
		imgB: {},
		descB: String,
		date: { type: Date, content: Date.now() }
	},
	{
		// if timestamps are set to true, mongoose assigns createdAt and updatedAt fields to your schema, the type assigned is Date.
		timestamps: true
	}
);
// mongoose model
let Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;
