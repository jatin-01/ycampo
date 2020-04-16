let mongoose = require('mongoose');
//making Schema
let ycampoSchema = new mongoose.Schema({
	title: String,
	img1: String,
	img2: String,
	img3: String,
	desc: String,
	state: String,
	city: String,
	known: String,
	activity: {},
	otherActivities: String,
	price: Number,
	checkbox: {},
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Comment'
		}
	],
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		},
		username: String
	},
	reviews: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Review'
		}
	],
	rating: {
		type: Number,
		default: 0
	}
});
// mongoose model
let Camp = mongoose.model('Camp', ycampoSchema);
module.exports = Camp;
