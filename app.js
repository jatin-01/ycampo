let express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	mongoose = require('mongoose'),
	methodOverride = require('method-override'),
	Camp = require('./models/campground'),
	seedDB = require('./seed'),
	Comment = require('./models/comment'),
	passport = require('passport'),
	LocalStrategy = require('passport-local'),
	Blog = require('./models/blog'),
	User = require('./models/user'),
	Review = require('./models/review'),
	flash = require('connect-flash');
require('dotenv').config();
//connecting to db
mongoose.connect('mongodb://localhost/ycampo_app', {
	useUnifiedTopology: true,
	useNewUrlParser: true,
	useCreateIndex: true,
	useFindAndModify: false
});
// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')('process.env.STRIPE_SECRET_KEY');

// seedDB();
app.use(flash());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(
	require('express-session')({
		secret: 'My favorite website',
		resave: false,
		saveUninitialized: false
	})
);
app.use(methodOverride('_method'));

//telling express to use passport
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
//session data encode , read , decode
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//to pass req.user to every template
app.use(function(req, res, next) {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash('error');
	res.locals.success = req.flash('success');
	next();
});
//checkout route
app.get('/ycampo/checkout', isLoggedIn, (req, res) => {
	if (req.user.isPaid) {
		req.flash('success', 'You have already completed the registration fee..');
		return res.redirect('/ycampo/');
	}
	res.render('checkout', { amount: 2000 * 100 });
});
//pay post route
app.post('/pay', isLoggedIn, async (req, res) => {
	const { paymentMethodId, items, currency } = req.body;

	const amount = 2000 * 100;

	try {
		// Create new PaymentIntent with a PaymentMethod ID from the client.
		const intent = await stripe.paymentIntents.create({
			amount,
			currency,
			payment_method: paymentMethodId,
			error_on_requires_action: true,
			confirm: true
		});

		console.log('💰 Payment received!');
		// The payment is complete and the money has been moved
		// You can add any post-payment code here (e.g. shipping, fulfillment, etc)
		req.user.isPaid = true;
		await req.user.save();

		// Send the client secret to the client to use in the demo
		res.send({ clientSecret: intent.client_secret });
	} catch (e) {
		// Handle "hard declines" e.g. insufficient funds, expired card, card authentication etc
		// See https://stripe.com/docs/declines/codes for more
		if (e.code === 'authentication_required') {
			res.send({
				error: 'This card requires authentication in order to proceeded. Please use a different card.'
			});
		} else {
			res.send({ error: e.message });
		}
	}
});
//home route
app.get('/', (req, res) => {
	res.render('landing');
});
//Index Route
app.get('/ycampo', (req, res) => {
	if (req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Camp.find({ title: regex }, (err, camp) => {
			if (err) {
				req.flash('error', 'Campground not found');
				console.log(err);
			} else {
				Blog.find({ title: regex }, (err, blogs) => {
					if (err) {
						console.log(err);
					} else {
						let noMatch;
						let present = true;
						if (camp.length == 0) {
							noMatch = 'No such campground is found , please try with correct campground name..!!!';
						}
						res.render('index', {
							camp: camp,
							currentUser: req.user,
							noMatch: noMatch,
							blogs: blogs,
							present: present
						});
					}
				});
			}
		});
	} else {
		present = false;
		Blog.find({}, function(err, blogs) {
			if (err) {
				console.log(err);
			} else {
				Camp.find({}, (err, camp) => {
					if (err) {
						req.flash('error', 'Campground not found');
						console.log(err);
					} else {
						var noMatch;
						res.render('index', {
							camp: camp,
							currentUser: req.user,
							noMatch: noMatch,
							blogs: blogs,
							present: present
						});
					}
				});
			}
		});
	}
});
//activity campground route
app.get('/ycampo/camp/act/:state', function(req, res) {
	let ThisState = req.params.state;
	ThisState = ThisState.toUpperCase();
	// console.log(ThisState);
	Camp.find({}, (err, camp) => {
		if (err) {
			req.flash('error', 'Campground not found');
			console.log(err);
		} else {
			res.render('activity', { camp: camp, ThisState: ThisState });
		}
	});
});
//activity campground route
app.post('/ycampo/camp/act/:state', function(req, res) {
	let cost = req.body.cost;
	// console.log(cost);
	let ThisState = req.params.state.toUpperCase();
	let present = true;
	Camp.find({}, (err, camp) => {
		if (err) {
			req.flash('error', 'Campground not found');
			console.log(err);
		} else {
			res.render('activity', { camp: camp, ThisState: ThisState, present: present, cost: cost });
		}
	});
});
//state campground route
app.get('/ycampo/camp/:state', function(req, res) {
	let ThisState = req.params.state;
	ThisState = ThisState.toUpperCase();
	// console.log(ThisState);
	Camp.find({}, (err, camp) => {
		if (err) {
			req.flash('error', 'Campground not found');
			console.log(err);
		} else {
			res.render('state', { camp: camp, ThisState: ThisState });
		}
	});
});
// state campground route
app.post('/ycampo/camp/:state', function(req, res) {
	let cost = req.body.cost;
	// console.log(cost);
	let ThisState = req.params.state;
	let present = true;
	Camp.find({}, (err, camp) => {
		if (err) {
			req.flash('error', 'Campground not found');
			console.log(err);
		} else {
			res.render('state', { camp: camp, ThisState: ThisState, present: present, cost: cost });
		}
	});
});
//new Route
app.get('/ycampo/new', isUserPaid, isLoggedIn, (req, res) => {
	if (req.query.paid) res.locals.success = 'payment is done now you are good to go.... ';
	res.render('new');
});

//create Route
app.post('/ycampo', isLoggedIn, isUserPaid, (req, res) => {
	let title = req.body.title,
		img1 = req.body.img1,
		img2 = req.body.img2,
		img3 = req.body.img3,
		desc = req.body.desc,
		state = req.body.state.toUpperCase(),
		city = req.body.city,
		known = req.body.known.toUpperCase(),
		otherActivities = req.body.otherActivities.toUpperCase(),
		activity = req.body.activity.map((e) => e.toUpperCase()),
		checkbox = req.body.checkbox.value.map((e) => e.toUpperCase()),
		price = req.body.price;
	let author = {
		id: req.user._id,
		username: req.user.username
	};
	// console.log(activity);
	// console.log(checkbox);
	Camp.create(
		{
			title: title,
			img1: img1,
			img2: img2,
			img3: img3,
			desc: desc,
			state: state,
			city: city,
			known: known,
			activity: activity,
			otherActivities: otherActivities,
			author: author,
			checkbox: checkbox,
			price: price
		},
		(err, data) => {
			if (err) {
				console.log(err);
			} else {
				res.redirect('/ycampo');
				// console.log(data);
			}
		}
	);
	// console.log(req.user);
});

//BLOG index Route
app.get('/ycampo/blog', (req, res) => {
	Blog.find({}, (err, items) => {
		if (err) {
			console.log(err);
		} else {
			res.render('blogIndex', { items: items });
		}
	});
});
//BLOG new Route
app.get('/ycampo/blog/new', isLoggedIn, (req, res) => {
	res.render('blogNew');
});
//BLOG create Route
app.post('/ycampo/blog', isLoggedIn, (req, res) => {
	let titleB = req.body.titleB,
		imgB = req.body.imgB,
		descB = req.body.descB;

	Blog.create(
		{
			titleB: titleB,
			descB: descB,
			imgB: imgB
		},
		(err, data) => {
			if (err) {
				console.log(err);
			} else {
				res.redirect('/ycampo/blog');
			}
		}
	);
});
//Blog show route
app.get('/ycampo/blog/:id', (req, res) => {
	Blog.findById(req.params.id, function(err, foundBlog) {
		if (err) {
			req.flash('error', 'Something went Wrong , Blog not found');
			console.log(err);
		} else {
			res.render('blogShow', { blog: foundBlog });
		}
	});
});
//EDIT CAMPGROUND
app.get('/ycampo/:id/edit', checkAuthorization, isUserPaid, function(req, res) {
	Camp.findById(req.params.id, function(err, foundCampground) {
		if (err) {
			console.log(err);
		} else {
			res.render('editForm', { campground: foundCampground });
		}
	});
});
//update campground
app.put('/ycampo/:id', checkAuthorization, function(req, res) {
	let title = req.body.title,
		img1 = req.body.img1,
		img2 = req.body.img2,
		img3 = req.body.img3,
		desc = req.body.desc,
		state = req.body.state.toUpperCase(),
		city = req.body.city,
		known = req.body.known,
		activity = req.body.activity.map((e) => e.toUpperCase()),
		price = req.body.price;
	let author = {
		id: req.user._id,
		username: req.user.username
	};
	let data = {
		title: title,
		img1: img1,
		img2: img2,
		img3: img3,
		desc: desc,
		state: state,
		city: city,
		known: known,
		activity: activity,
		author: author,
		price: price
	};
	Camp.findByIdAndUpdate(req.params.id, data, function(err, foundCampground) {
		if (err) {
			console.log(err);
		} else {
			res.redirect('/ycampo/' + req.params.id);
		}
	});
});
//delete campground
app.delete('/ycampo/:id', checkAuthorization, function(req, res) {
	Camp.findById(req.params.id, function(err, campground) {
		if (err) {
			res.redirect('/ycampo');
		} else {
			// deletes all comments associated with the campground
			Comment.remove({ _id: { $in: campground.comments } }, function(err) {
				if (err) {
					console.log(err);
					return res.redirect('/ycampo');
				}
				// deletes all reviews associated with the campground
				Review.remove({ _id: { $in: campground.reviews } }, function(err) {
					if (err) {
						console.log(err);
						return res.redirect('/ycampo');
					}
					//  delete the campground
					campground.remove();
					req.flash('success', 'Campground deleted successfully!');
					res.redirect('/ycampo');
				});
			});
		}
	});
});
// campground show Route
app.get('/ycampo/:id', (req, res) => {
	Camp.findById(req.params.id)
		.populate('comments')
		.populate({
			path: 'reviews',
			options: { sort: { createdAt: -1 } }
		})
		.exec(function(err, data) {
			if (err) {
				console.log(err);
			} else {
				// console.log(data);
				res.render('show', { data: data });
			}
		});
});
// Booking route
app.post('/ycampo/:id/booking', function(req, res) {
	let booking = [
		{ qnty: req.body.qty },
		{
			numberOfPeople: {
				nop1: req.body.nop,
				nop2: req.body.nop2
			}
		},
		{
			guide1: req.body.guide,
			guide2: req.body.guide2
		}
	];
	Camp.findById(req.params.id, function(err, foundCampground) {
		if (err) {
			console.log(err);
		} else {
			console.log(booking);
			console.log(foundCampground);
			res.render('booking', { booking: booking, camp: foundCampground });
		}
	});
});

//comment Form
app.get('/ycampo/:id/comment/new', isLoggedIn, (req, res) => {
	Camp.findById(req.params.id, (err, foundCampground) => {
		if (err) {
			console.log(err);
		} else {
			res.render('cnew', { campground: foundCampground });
		}
	});
});
//register form Sign Up
app.get('/register', function(req, res) {
	res.render('register');
});
//register post
app.post('/register', function(req, res) {
	// console.log(req.body.username);
	let newUser = new User({ username: req.body.username });
	User.register(newUser, req.body.password, function(err, user) {
		if (err) {
			req.flash('error', err.message);
			return res.redirect('register');
		}
		req.flash('success', 'Successfully registered as - ' + req.body.username);
		passport.authenticate('local')(req, res, function() {
			res.redirect('/ycampo');
		});
	});
});
//User login route
app.get('/login', function(req, res) {
	res.render('login');
});
app.post('/login', passport.authenticate('local', { successRedirect: '/ycampo', failureRedirect: '/login' }), function(
	req,
	res
) {});
//logout
app.get('/logout', function(req, res) {
	req.logout();
	req.flash('success', 'Successfully logged out');
	res.redirect('/ycampo');
});
//middleware
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	if (req['headers']['content-type'] === 'application/json') {
		return res.send({ error: 'Need to login first' });
	}
	req.flash('error', 'You must have to Login');
	res.redirect('/login');
}
function checkAuthorization(req, res, next) {
	if (req.isAuthenticated()) {
		Camp.findById(req.params.id, function(err, foundCampground) {
			if (err) {
				console.log(err);
				res.redirect('back');
			} else {
				if (foundCampground.author.id.equals(req.user._id)) {
					next();
				} else {
					req.flash('error', 'You dont have permision to do this');
					res.redirect('/ycampo/' + req.params.id);
				}
			}
		});
	} else {
		req.flash('error', 'Login first');
		res.redirect('/ycampo');
	}
}
function checkReviewOwnership(req, res, next) {
	if (req.isAuthenticated()) {
		Review.findById(req.params.review_id, function(err, foundReview) {
			if (err || !foundReview) {
				res.redirect('back');
			} else {
				// does user own the comment?
				if (foundReview.author.id.equals(req.user._id)) {
					next();
				} else {
					req.flash('error', "You don't have permission to do that");
					res.redirect('back');
				}
			}
		});
	} else {
		req.flash('error', 'You need to be logged in to do that');
		res.redirect('back');
	}
}

function checkReviewExistence(req, res, next) {
	if (req.isAuthenticated()) {
		Camp.findById(req.params.id).populate('reviews').exec(function(err, foundCampground) {
			if (err || !foundCampground) {
				req.flash('error', 'Campground not found.');
				res.redirect('back');
			} else {
				// check if req.user._id exists in foundCampground.reviews
				var foundUserReview = foundCampground.reviews.some(function(review) {
					return review.author.id.equals(req.user._id);
				});
				if (foundUserReview) {
					req.flash('error', 'You already wrote a review.');
					return res.redirect('/campgrounds/' + foundCampground._id);
				}
				// if the review was not found, go to the next middleware
				next();
			}
		});
	} else {
		req.flash('error', 'You need to login first.');
		res.redirect('back');
	}
}
function isUserPaid(req, res, next) {
	if (req.user.isPaid) return next();
	req.flash('error', 'Please pay registration fee before adding new campground..!!');
	res.redirect('/ycampo/checkout');
}
//comment post
app.post('/ycampo/:id/comment', (req, res) => {
	Camp.findById(req.params.id, (err, foundCampground) => {
		if (err) {
			console.log(err);
		} else {
			Comment.create(req.body.comment, function(err, comment) {
				if (err) {
					console.log(err);
				} else {
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					comment.save();
					foundCampground.comments.push(comment);
					foundCampground.save(function(err, data) {
						if (err) {
							console.log(err);
						} else {
							req.flash('success', 'Comment added successfully');
							res.redirect('/ycampo/' + foundCampground._id);
						}
					});
				}
			});
		}
	});
});
// Reviews Index
app.get('/ycampo/:id/review', function(req, res) {
	Camp.findById(req.params.id)
		.populate({
			path: 'reviews',
			options: { sort: { createdAt: -1 } } // sorting the populated reviews array to show the latest first
		})
		.exec(function(err, campground) {
			if (err || !campground) {
				req.flash('error', err.message);
				return res.redirect('back');
			}
			res.render('reviewIndex', { campground: campground });
		});
});
// Reviews New
app.get('/ycampo/:id/review/new', isLoggedIn, checkReviewExistence, function(req, res) {
	// middleware.checkReviewExistence checks if a user already reviewed the campground, only one review per user is allowed
	Camp.findById(req.params.id, function(err, campground) {
		if (err) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
		res.render('reviewNew', { campground: campground });
	});
});
// Reviews Create
app.post('/ycampo/:id/review', isLoggedIn, checkReviewExistence, function(req, res) {
	//lookup campground using ID
	Camp.findById(req.params.id).populate('reviews').exec(function(err, campground) {
		if (err) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
		Review.create(req.body.review, function(err, review) {
			if (err) {
				req.flash('error', err.message);
				return res.redirect('back');
			}
			//add author username/id and associated campground to the review
			review.author.id = req.user._id;
			review.author.username = req.user.username;
			review.campground = campground;
			//save review
			review.save();
			campground.reviews.push(review);
			// calculate the new average review for the campground
			campground.rating = calculateAverage(campground.reviews);
			//save campground
			campground.save();
			req.flash('success', 'Your review has been successfully added.');
			res.redirect('/ycampo/' + campground._id);
		});
	});
});

// Reviews Edit
app.get('/ycampo/:id/review/:review_id/edit', checkReviewOwnership, function(req, res) {
	Review.findById(req.params.review_id, function(err, foundReview) {
		if (err) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
		res.render('reviewEdit', { campground_id: req.params.id, review: foundReview });
	});
});
// Reviews Update
app.put('/ycampo/:id/review/:review_id', checkReviewOwnership, function(req, res) {
	Review.findByIdAndUpdate(req.params.review_id, req.body.review, { new: true }, function(err, updatedReview) {
		if (err) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
		Camp.findById(req.params.id).populate('reviews').exec(function(err, campground) {
			if (err) {
				req.flash('error', err.message);
				return res.redirect('back');
			}
			// recalculate campground average
			campground.rating = calculateAverage(campground.reviews);
			//save changes
			campground.save();
			req.flash('success', 'Your review was successfully edited.');
			res.redirect('/ycampo/' + campground._id);
		});
	});
});
// Reviews Delete
app.delete('/ycampo/:id/review/:review_id', checkReviewOwnership, function(req, res) {
	Review.findByIdAndRemove(req.params.review_id, function(err) {
		if (err) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
		Camp.findByIdAndUpdate(req.params.id, { $pull: { reviews: req.params.review_id } }, { new: true })
			.populate('reviews')
			.exec(function(err, campground) {
				if (err) {
					req.flash('error', err.message);
					return res.redirect('back');
				}
				// recalculate campground average
				campground.rating = calculateAverage(campground.reviews);
				//save changes
				campground.save();
				req.flash('success', 'Your review was deleted successfully.');
				res.redirect('/ycampo/' + req.params.id);
			});
	});
});
//calculate Reviews star
function calculateAverage(reviews) {
	if (reviews.length === 0) {
		return 0;
	}
	var sum = 0;
	reviews.forEach(function(element) {
		sum += element.rating;
	});
	return sum / reviews.length;
}
// escapeRegex function
function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

app.listen(process.env.PORT || 3000, process.env.IP, (req, res) => {
	console.log('SERVER STARTED ...!!');
});
