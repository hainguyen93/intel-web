var protocol = require('http');
var static = require('node-static');
var util = require('util');
var url = require('url');
var querystring = require('querystring');
var express = require('express');
var app = express();
var mysql = require('mysql');

//formating datetime
var moment = require('moment');
moment().format();

//Stream modules
var server = require('http').createServer(app);
var io = require('socket.io')(server);

//connect to twitter
var Twit = require('twit');
var client = new Twit({
  consumer_key: 'cxIRfQ2TzL9WQyJ4YiWPTuORX',
  consumer_secret: 'z6b86QUgsb52b14vUCcoGk5yTtfFtFNf8YVCdn7BOIQfeimy7y',
  access_token: '707177539538657280-s4EkTfNTNAbe4Va1f5mDv8zOlKqujvP',
  access_token_secret: 'm54POPGHzHBchCaB3KnPuaRLjHcQJngJ7Ea77akOZs0Qp'
});

app.use(express.static('public'));
app.use(express.static(__dirname + '/bower_components'));

//Stream stuff
app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/queryInterface.html');
});
//server.listen(4200);

app.post('/postFile.html', function (req, res, data) {
        var body = '';
        req.on('data', function (data) {
            body += data;            
            if (body.length > 1e6) {
                res.writeHead(413,
                    {'Content-Type': 'text/plain'}).end();
                req.connection.destroy();
            }
        });

        req.on('end', function () {
            var POST = JSON.parse(body); 				
			
			//connect to db			
			var connection = mysql.createConnection(    //globally defined
				{
					host     : 'localhost',
					port     : '3306',
					user     : 'root',
					password : 'hai5193',
					database : 'mydb'
				}
			);
			
			connection.connect(function(err){
				if (err){
					console.error('error connecting: ' + err.stack);
					return;
				}
				console.log('connected as id ' + connection.threadId);
			});					
			
			//array of tweets to respond
			var res_arr = []; 
			var query_id = null;
			var match = -1;  //not match			
			
			//search query to store to Queries table
			var searchQuery = 	createSearchQuery(POST);							
			console.log(searchQuery);  //print out the formatted search query	
			
			var sql = 	'SELECT search_query,query_id '+
						'FROM Queries';
						
			connection.query(sql, function(err,res1){
				if (err) throw err;
				//var match = -1;  //not match
				//var query_id = null;
				var count1 = res1.length;
				//check whether query exists
				for (var indx in res1){
					--count1;				
					match = (res1[indx].search_query).localeCompare(searchQuery);
					if (match==0){ //exactly match
						console.log('query already exists...');	
						query_id = res1[indx].query_id;
						break;
					}
				}				
				
				if (count1 == 0 && match != 0){ //new query
				
					var sqlStat1 = 	'INSERT INTO Queries (created_at,search_query) '+
									'VALUES (?,?)';
									
					var now = moment(Date.now()).format("YYYY-MM-DD h:mm:ss");
					//store new query into database
					connection.query(sqlStat1, [now,searchQuery], function(err, res2) {
						if (err) throw err; 
						query_id = res2.insertId;  //return newly inserted id
						console.log('query stored into database...'); 									
						client.get('search/tweets', {q:searchQuery, count:300}, function(err, data, response) { 
						  if (response.statusCode == 200) {
							var count2 = (data.statuses).length;
							for (var indx in data.statuses) {								
								var tweet= data.statuses[indx];
								res_arr.push(tweet);
								//console.log('on: ' + tweet.created_at + ' : @' + tweet.user.screen_name + ' : ' + tweet.text+'\n\n');
								
								var sqlStat2 = 	'INSERT INTO Tweets (created_at,text,screen_name,latitude,longitude,name,profile_image_url_https) '+
												'VALUES (?,?,?,?,?,?,?)';	
												
								//prepare all the values		
								//created_at time
								var a = (tweet.created_at).toString();
								var time = moment(new Date(Date.parse(a.replace(/( +)/, ' UTC$1')))).format("YYYY-MM-DD h:mm:ss");
								
								//coordinates
								var lng = null;
								var lat = null;
								if (tweet.coordinates) { //not NULL
									lng = tweet.coordinates.coordinates[0];
									lat = tweet.coordinates.coordinates[1];
								}
								
								//profile_image_url_https
								var url = tweet.user.profile_image_url_https;
								
								//text
								var tex = unescape(encodeURIComponent(tweet.text));
								
								//screen_name
								var screen_name = tweet.user.screen_name;
								
								//name
								var name = tweet.user.name;
								
								connection.query(sqlStat2,[time,tex,screen_name,lat,lng,name,url],function(err,res3) {
									if (err) throw err; 
									console.log('tweet added...');
									
									var sqlStat3 = 	'INSERT INTO Queries_Tweets (query_id,tweet_id) '+
													'VALUES ('+query_id+','+res3.insertId+')';
													
									connection.query(sqlStat3, function(err, res4) {
										if (err) throw err; 		
										--count2;
										console.log('two keys added...');
										if (count2 == 0){
											//match = -1; //reset all variables
											//query_id = null;
											//res.json(res_arr);
											console.log('search done!!!');
											res.status(200).json(res_arr);
											connection.end(function(err) {
												console.log('Connection terminated!');
											});										
										}
									});			
								});
							}
						  }
						});										
					});			
				}else if (match == 0){ //query exists...			
					
					//retrieve all stored tweets from database into js array
					//var js_arr = retrieveTweets(query_id);
					//res_arr = JSON.stringify(js_arr);   //convert js array into json array
					
					var sqlStat1 = 'SELECT created_at FROM Queries WHERE query_id='+query_id; 
					connection.query(sqlStat1, function(err, res2){
						if (err) throw err; 					
						
						//prepare search query
						var date = (res2[0].created_at).toString();
						var sinceDate = moment(new Date(Date.parse(date.replace(/( +)/, ' UTC$1')))).format("YYYY-MM-DD");
						searchQuery += ' since:'+sinceDate;   //searchquery since:YYYY-MM-DD
						
						console.log('since: added to query...'+searchQuery);
						
						client.get('search/tweets', {q:searchQuery,count:300}, function(err, data, response) {
						   if (response.statusCode == 200) {							
							var count2 = (data.statuses).length;
							for (var indx in data.statuses) {
								var tweet= data.statuses[indx];
								
								if (!checkDuplicate(tweet.text, connection)){  //tweet already stored			
								
											console.log('tweet already exists');
											//retrieve all stored tweets from database into js array
											var js_arr = [];  //json-like js array
											
											var sql = 	'SELECT tweet_id '+
														'FROM Queries_Tweets '+
														'WHERE query_id=?';
														
											connection.query(sql, [query_id], function(err,tweets_id_list){
												if (err) throw err;
												//console.log(tweets_id_list);
												var count3 = tweets_id_list.length;
												for (var indx in tweets_id_list){													
													var tweet_id = tweets_id_list[indx].tweet_id;
													//console.log(tweet_id);
													/**********/
													var sql = 	'SELECT * '+
																'FROM Tweets '+
																'WHERE tweet_id=?';
													
													connection.query(sql, [tweet_id], function(err, rows){														
														if (err) throw err;			
														//console.log(rows[0]);
														/***/
														js_arr.push(createElement(rows[0])); //add stored tweets to response array
														console.log(js_arr);
														--count3;
														if (count3 == 0){
															console.log('search done!!!');
															res.status(200).json(js_arr);
															//res.json(JSON.stringify(js_arr));
															connection.end(function(err) {
																console.log('Connection terminated!');
															});			
														}
													});
													
												}
											});												
										
								}else{ //new tweet
									console.log('new tweet');
									//add tweet into response array
								//res_arr.push(tweet);
								
								var sqlStat2 = 	'INSERT INTO Tweets (created_at,text,screen_name,latitude,longitude,name,profile_image_url_https) '+
												'VALUES (?,?,?,?,?,?,?)';	
								
								//prepare all the values		
								//created_at time
								var a = (tweet.created_at).toString();
								var time = moment(new Date(Date.parse(a.replace(/( +)/, ' UTC$1')))).format("YYYY-MM-DD h:mm:ss");
								
								//coordinates
								var lng = null;
								var lat = null;
								if (tweet.coordinates) { //not NULL
									lng = tweet.coordinates.coordinates[0];
									lat = tweet.coordinates.coordinates[1];
								}
								
								//profile_image_url_https
								var url = tweet.user.profile_image_url_https;
								
								//text
								var tex = unescape(encodeURIComponent(tweet.text));
								
								//screen_name
								var screen_name = tweet.user.screen_name;
								
								//name
								var name = tweet.user.name;
								
								connection.query(sqlStat2,[time,tex,screen_name,lat,lng,name,url],function(err,res3) {
									if (err) throw err; 
									console.log('tweet added...');
									
									var sqlStat3 = 	'INSERT INTO Queries_Tweets (query_id,tweet_id) '+
													'VALUES ('+query_id+','+res3.insertId+')';
													
									connection.query(sqlStat3, function(err, res4) {
										if (err) throw err; 		
										--count2;
										console.log('two keys added...');
										if (count2 == 0){
											
											//retrieve all stored tweets from database into js array
											var js_arr = [];  //json-like js array
											
											var sql = 	'SELECT tweet_id '+
														'FROM Queries_Tweets '+
														'WHERE query_id=?';
														
											connection.query(sql, [query_id], function(err,tweets_id_list){
												if (err) throw err;
												//console.log(tweets_id_list);
												var count3 = tweets_id_list.length;
												for (var indx in tweets_id_list){													
													var tweet_id = tweets_id_list[indx].tweet_id;
													//console.log(tweet_id);
													/**********/
													var sql = 	'SELECT * '+
																'FROM Tweets '+
																'WHERE tweet_id=?';
													
													connection.query(sql, [tweet_id], function(err, rows){														
														if (err) throw err;			
														//console.log(rows[0]);
														/***/
														js_arr.push(createElement(rows[0])); //add stored tweets to response array
														console.log(js_arr);
														--count3;
														if (count3 == 0){
															console.log('search done!!!');
															res.status(200).json(js_arr);
															//res.json(JSON.stringify(js_arr));
															connection.end(function(err) {
																console.log('Connection terminated!');
															});			
														}
													});
													
												}
											});													
										}
									});			
								});
								}
								/**
								//add tweet into response array
								//res_arr.push(tweet);
								
								var sqlStat2 = 	'INSERT INTO Tweets (created_at,text,screen_name,latitude,longitude,name,profile_image_url_https) '+
												'VALUES (?,?,?,?,?,?,?)';	
								
								//prepare all the values		
								//created_at time
								var a = (tweet.created_at).toString();
								var time = moment(new Date(Date.parse(a.replace(/( +)/, ' UTC$1')))).format("YYYY-MM-DD h:mm:ss");
								
								//coordinates
								var lng = null;
								var lat = null;
								if (tweet.coordinates) { //not NULL
									lng = tweet.coordinates.coordinates[0];
									lat = tweet.coordinates.coordinates[1];
								}
								
								//profile_image_url_https
								var url = tweet.user.profile_image_url_https;
								
								//text
								var tex = unescape(encodeURIComponent(tweet.text));
								
								//screen_name
								var screen_name = tweet.user.screen_name;
								
								//name
								var name = tweet.user.name;
								
								connection.query(sqlStat2,[time,tex,screen_name,lat,lng,name,url],function(err,res3) {
									if (err) throw err; 
									console.log('tweet added...');
									
									var sqlStat3 = 	'INSERT INTO Queries_Tweets (query_id,tweet_id) '+
													'VALUES ('+query_id+','+res3.insertId+')';
													
									connection.query(sqlStat3, function(err, res4) {
										if (err) throw err; 		
										--count2;
										console.log('two keys added...');
										if (count2 == 0){
											
											//retrieve all stored tweets from database into js array
											var js_arr = [];  //json-like js array
											
											var sql = 	'SELECT tweet_id '+
														'FROM Queries_Tweets '+
														'WHERE query_id=?';
														
											connection.query(sql, [query_id], function(err,tweets_id_list){
												if (err) throw err;
												//console.log(tweets_id_list);
												var count3 = tweets_id_list.length;
												for (var indx in tweets_id_list){													
													var tweet_id = tweets_id_list[indx].tweet_id;
													//console.log(tweet_id);
													
													var sql = 	'SELECT * '+
																'FROM Tweets '+
																'WHERE tweet_id=?';
													
													connection.query(sql, [tweet_id], function(err, rows){														
														if (err) throw err;			
														//console.log(rows[0]);
														
														js_arr.push(createElement(rows[0])); //add stored tweets to response array
														console.log(js_arr);
														--count3;
														if (count3 == 0){
															console.log('search done!!!');
															res.status(200).json(js_arr);
															//res.json(JSON.stringify(js_arr));
															connection.end(function(err) {
																console.log('Connection terminated!');
															});			
														}
													});
													
												}
											});													
										}
									});			
								});*/
								
							}
						  }
						});													
					});			
				}					
			});				
        });
        
		
		/**
		*Creating formatted search query
		*@param POST	JSON Object	 	information submitted from form		
		*/		
		function createSearchQuery(POST){
			var teamName = POST.teamName ? 'from:'+POST.teamName : '';  
			var hashtag = POST.hashtag ? '#'+POST.hashtag : '';
			var keyword = POST.keyword ? '\"'+POST.keyword+'\"' : '';
			var searchQuery = '';
			if (POST.AO == 'And'){  //AND 
				searchQuery = teamName+' '+hashtag+' '+keyword;
			}else{ //OR
				searchQuery = teamName+' OR '+hashtag+' OR '+keyword;
			}
			return searchQuery;
		}	
		
		/**
		*Retrieve stored tweets from database
		*@param query_id	int  	ID of existing query in Queries table
		*/
		function retrieveTweets(query_id){
			var js_arr;  //json-like js array
			var sql = 'SELECT tweet_id FROM Queries_Tweets WHERE query_id=?';
			connection.query(sql, [query_id], function(err,tweets_id_list){
				if (err) throw err;
				for (var indx in tweets_id_list){
					var tweet_id = tweets_id_list[indx];
					var sql = 'SELECT * FROM Tweets WHERE tweet_id=?';
					conncetion.query(sql, [tweet_id], function(err, row){
						if (err) throw err;
						js_arr.push(createElement(row)); //add stored tweets to response array
					});
				}
			});
			return js_arr;
		}
		
		
		function checkDuplicate(t, connection){
			var sql = 'SELECT text FROM Tweets';
			connection.query(sql, function(err, rows){
				if (err) throw err;
				var count = rows.length; //num of rows
				var res = false;
				for (var indx in rows){
					--count;
					if ((rows[indx].text).localeCompare(t) == 0){ //match
						res = true;
					}
				}
				if (count==0 && !res){
					//console.log('new tweet');
					return false;
				}else if (res){
					//console.log('tweet already exists');
					return true;
				}
			});
		}
		
		/**
		*create json-like js array
		*@param row		row		Data retrieved from database		
		*/
		function createElement(row){
			var elem = 	 {
				          'text'		:row.text,
						  'created_at'	:row.created_at,						  
						  'user':{ 
							      'screen_name'		        :row.screen_name,
								  'name'					:row.name,
								  'profile_image_url_https'	:row.profile_image_url_https
								}
							};	
							
			if (!row.longitude){ //null
				elem['coordinates']	= null;
			}else{ //not null
				elem['coordinates']= {'coordinates': [row.longitude,row.latitude]};
			}
			
			json_elem = JSON.stringify(elem);			
			return json_elem;
		}
});

//The 404 Route (ALWAYS Keep this as the last route)
app.get('*', function(req, res){
  res.send('404, page not found', 404);
});

/*  The socket.io that is responsible for creating the stream between
    the client and the server. Upon opening the football homepage the
    connection will be opened and start sending tweets to the 
    html form.
    @tweet

*/

io.on('connection', function(clienty) {  

    console.log('Client connected...');

    var stream = client.stream('statuses/filter', {track: '@BBCSport,@ManUtd,@Arsenal,@ChelseaFC,@MCFC,@LFC'})

    stream.on('tweet', function (tweet) {
        io.sockets.emit('stream', tweet);
    });

    clienty.on('messages', function(data) {
        //console.log('messages');
           client.emit('broad', data);
           client.broadcast.emit('broad',data);
    });
});

server.listen(3000);


