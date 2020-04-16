let mongoose = require('mongoose'),
	Camp = require('./models/campground'),
	Comment = require('./models/comment'),
	data = [
		{
			title: 'One',
			img1:
				'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1868&q=80',
			img2:
				'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1868&q=80',
			img3:
				'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1868&q=80',
			desc: 'Good one',
			state: 'Punjab',
			city: 'Jalandhar',
			known: 'Punjabi Food',
			activity: 'Nothing'
		},
		{
			title: 'Two',
			img1:
				'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1868&q=80',
			img2:
				'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1868&q=80',
			img3:
				'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1868&q=80',
			desc: 'Good one',
			state: 'Himachal',
			city: 'Hamirpur',
			known: 'Beautiful scenery',
			activity: 'treking , swimming'
		}
	];
function seedDB() {
	Camp.deleteMany((err) => {
		if (err) {
			console.log('Error found');
		} else {
			console.log('Campground Removed');
			// 			data.forEach(function(seed) {
			// 				Camp.create(seed, (err, data) => {
			// 					if (err) {
			// 						console.log(err);
			// 					} else {
			// 						console.log('campground Created !!');
			// 						Comment.create(
			// 							{
			// 								text: 'Hello This place is nice ..!!',
			// 								author: 'Rocky'
			// 							},
			// 							function(err, comment) {
			// 								if (err) {
			// 									console.log(err);
			// 								} else {
			// 									data.comments.push(comment);
			// 									data.save();
			// 								}
			// 							}
			// 						);
			// 					}
			// 				});
			// 			});
		}
	});
}
module.exports = seedDB;
