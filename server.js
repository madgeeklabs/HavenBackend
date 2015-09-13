var MongoClient = require('mongodb').MongoClient
, assert = require('assert');
var HTTP_PORT = 8080;

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var braintree = require("braintree");
var gateway = braintree.connect({
    environment:  braintree.Environment.Sandbox,
    merchantId:   'r9tpr7tdrnqxtfjn',
    publicKey:    'wjh8jm6dxnp2254m',
    privateKey:   '5cdb18e2e2cd4db2727989c269523027'
});

var url = 'mongodb://localhost:27017/haven';
// Use connect method to connect to the Serverv

MongoClient.connect(url, function(err, db) {

	if (err) console.log("DB NOT RUNING");

	var express = require('express');
    var app = express();

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded());
	app.use(cookieParser());

    var allowCrossDomain = function(req, res, next) {
        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Origin, Accept');
        next();
    };

    app.use(allowCrossDomain);

    app.get("/hi", function (req, res) {
    	res.send('hola hola');
    });

    //PAYMENT ENDPOINT
	app.get("/payments/client_token", function (req, res) {
	  gateway.clientToken.generate({}, function (err, response) {
	    //console.log('token requested ' + response.clientToken, typeof(response.clientToken));
            res.send(response.clientToken);
	  });
	});

	app.post("/payments/payment-methods", function (req, res) {
                  var nonce = req.body.payment_method_nonce;

		console.log('processing payment');
		console.log('-------------------');

	  	var sumCart = {};
	  	var total = 0;

	    gateway.transaction.sale({
	      amount: '10',
	      paymentMethodNonce: nonce,
	      }, 
	      function (err, result) {
	        if (err) {
	          res.sendStatus(500);
	          console.log(result);
	        } else {
                    res.redirect('http://192.168.1.45:3000/thankyou.html');

	          console.log('transaction OK');
	        }
	    });
	});

	app.get("/api/videos", function (req, res) {
		var collection = db.collection('users');

		collection.find({}).toArray(function(err, docs) {
			res.send(docs);
		});
	});

	app.get("/api/user/:id", function (req, res) {
		var userId = req.params.id;
		console.log('requested user with id: ' + userId);

		var collection = db.collection('users');

		collection.findOne({uniqueId : userId}, function (err, result) {
			if (err) console.log(err);
			
			res.send(result);
			console.log(result);
		});
		// res.send("ok")
	});

	app.post("/api/registration", function (req, res) {
		// console.log(req.body);
		var user = req.body;

		console.log(user);

		var collection = db.collection('users');
  		// Insert some documents
  		collection.remove({ uniqueId : user.uniqueId }, function(err, result) {
		    console.log("Removed the document");
		    console.log(result);
		});

		collection.insert(user, function(err, result) {
		    console.log("Inserted documents into the document collection");
		    console.log(result);
		});

		res.send("OK");
	});

	app.listen(HTTP_PORT);
	console.log('Listening http on port ' + HTTP_PORT);
});

