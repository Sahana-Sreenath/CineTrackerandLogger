var urlGoMatch = /^go (https?|index|search(-extension)?):\/\/.+/i;
var jsGoMatch = /^go javascript:.+/i;
var jsMatch = /^javascript:.+/i;

var searchIndex = (function(){
	var b = {};
	b.itemEachRecursive = function r(nodeArray, callback){
		var len = nodeArray.length;
		var i;
		for(i = 0; i < len; i++){
			var n = nodeArray[i];
			callback(n);
			if('children' in n){
				r(n.children, callback);
			}
		}
	};
	b.searchSubTrees = function(nodeArray, query, callback){
		query = query.toLowerCase();
		var sr = [];
		b.itemEachRecursive(nodeArray, function(n){
			if('url' in n && (n.title.toLowerCase().indexOf(query) != -1 || ((!jsMatch.test(n.url) || n.title == "") && n.url.toLowerCase().indexOf(query) != -1))){
				sr.push(n);
			}
		});
		callback(sr);
	};
	b.searchAll = function(query, callback){
		searchIndex.moviesTitle.getTree(function(results){
			b.searchSubTrees(results, query, callback);
		});
	};
	b.searchAllSorted = function(query, callback){
		query = query.toLowerCase();
		var queryLen = query.length;
		b.searchAll(query, function(rs){
			callback(rs.sort(function(a, b){
				var x = 0, y = 0;
				function rate(n){
					//
					// Level 0: Nothing special
					// Level 1: Starts with
					// Level 2: Exact match
					//
					var t = n.title.toLowerCase();
					return t == query ? 2 : (t.substr(0, queryLen) == query ? 1 : 0);
				}
				x = rate(a);
				y = rate(b);
				return y - x;
			}));
		});
	};
	b.search = function(query, algorithm, callback){
		switch(algorithm){
		case "v2":
			b.searchAllSorted(query, callback);
			break;
		// case "builtin":
		default:
			searchIndex.moviesTitle.search(query, callback);
			break;
		}
	};
	return b;
})();

var movieSuggestions = function(b, s){
	var i = 0;
    var m;
	while(s.length < m && i < b.length){
		var v = b[i];
		if(v.title){
			if(jsMatch.test(v.url)){
				s.push({
					'content': "go " + v.url,
					'description': searchInput(v.title) + "<dim> -$(movieDesc)</dim>"
				});
			}else{
				s.push({
					'content': "go " + v.url,
					'description': searchInput(v.title) + "<dim> - </dim><url>" + (v.url) + "</url>"
				});
			}
		}else{
			if(jsMatch.test(v.url)){
				s.push({
					'content': "go " + v.url,
					'description': "<dim>$(movieDesc) - </dim><url>" + searchInput(v.url) + "</url>"
				});
			}else{
				s.push({
					'content': "go " + v.url,
					'description': "<url>" + (v.url) + "</url>"
				});
			}
		}
		i++;
	}
};

var searchInput = function(text, algorithm, suggest, setDefault, setDefaultUrl){
    var moviesTitle = {};
	if(jsGoMatch.test(text)){ // is "go jsbm"
		setDefault({
			'description': "Run $(movieTitle) <url>" + searchIndex(text.substr(3)) + "</url>"
		});
		moviesTitle.search(text, algorithm, function(results){
			var s = [];
			s.push({
				'content': "?" + text,
				'description': "Search <match>" + searchIndex(text) + "</match> in TMDBMovieList"
			});
			movieSuggestions(results, s);
			suggest(s);
		});
	}else if(urlGoMatch.test(text)){ // is "go addr"
		setDefault({
			'description': "Go to <url>" + searchIndex(text.substr(3)) + "</url>"
		});
		moviesTitle.search(text, algorithm, function(results){
			var s = [];
			s.push({
				'content': "?" + text,
				'description': "Search <match>" + searchIndex(text) + "</match> in TMDBMovieList"
			});
			movieSuggestions(results, s);
			suggest(s);
		});
	}else if(text == ""){
		setDefaultUrl("");
		setDefault({
			'description': "Search"
		});
		suggest([]);
	}else{
		setDefaultUrl("");
		setDefault({
			'description': "Search <match>%s</match> in TMDBMovieList"
		});
		moviesTitle.search(text, algorithm, function(results){
			var s = [];
			movieSuggestions(results, s);
			// check if no result/single result/full match
			if(s.length == 0){
				setDefaultUrl("");
				setDefault({
					'description': "Oops, no results for <match>%s</match> in TMDBMovieList!"
				});
			}else if(s.length == 1){
				setDefaultUrl(results[0].url);
				var v = results[0];
				if(v.title){
					if(jsMatch.test(v.url)){
						setDefault({
							'description': searchIndex(v.title) + "<dim> (only match) - $(movieTitle)</dim>"
						});
					}else{
						setDefault({
							'description': searchIndex(v.title) + "<dim> (only match) - </dim><url>" + searchIndex(v.url) + "</url>"
						});
					}
				}else{
					if(jsMatch.test(v.url)){
						setDefault({
							'description': "<dim>Unnamed $(movieTitle) (only match) - </dim><url>" + searchIndex(v.url) + "</url>"
						});
					}else{
						setDefault({
							'description': "<dim>Only match - </dim><url>" + searchIndex(v.url) + "</url>"
						});
					}
				}
				s[0] = {
					'content': "?" + text,
					'description': "Search <match>" + searchIndex(text) + "</match> in TMDBMovieList"
				};
			}else if(searchInput["matchname"]){
				if(results[0] && results[0].title && results[0].title.toLowerCase() == text.toLowerCase()){
					setDefaultUrl(results[0].url);
					// var v = results[0];
					if(jsMatch.test(v.url)){
						setDefault({
							'description': "<match>" + searchIndex(v.title) + "</match><dim> - $(movieTitle)</dim>"
						});
					}else{
						setDefault({
							'description': "<match>" + searchIndex(v.title) + "</match><dim> - </dim><url>" + searchIndex(v.url) + "</url>"
						});
					}
					s[0] = {
						'content': "?" + text,
						'description': "Search <match>" + searchIndex(text) + "</match> in TMDBMovieList"
					};
				}else{
					setDefaultUrl("");
				}
			}
			suggest(s);
		});
	}
};