var width = 8000;//$(window).width() - 50,
    height = 8000;//$(window).height() - 80;

var svgWidth = width;
var svgHeight = height;

var allData = {};
var parsedData;
var individuals = {};
var individualsArray = [];
var individualsRanked = {};
var families = {};
var familyKeys = [];

$('#sourceInput').change( function(){
//$(document).ready( function(){
	// console.log( "source file chosen!" );
	var reader = new FileReader();
	// console.log( )
	var file = $( this )[0].files[0];
	// console.log( file );
	// reader.readAsText( file );
	//var file = new File( "/Users/Tellart/Desktop/genealogyTest/data/sample.ged", "text" );
	reader.readAsText( file );

	reader.onloadend = function() {
		var d = reader.result;
		//console.log( d );
		//parseData( d );

		var t = parse( d );
		console.log(t);
		parsedData = t;

		findMinMaxTime( parsedData );
		console.log( "earliest year: " + minTime + " >>> latest year: " + maxTime );
		layoutTimeLine();
		//visualizeTree( parsedData );
		createIndividuals( parsedData );
		createFamilies( parsedData );
		console.log( "________ NODES ________" );
		console.log( nodes );
		console.log( "________ LINKS ________" );
		console.log( links );
		
		rankData();
		addRankToIndividuals();
		rankIndividualsObject();

		//doDAG();
		


		var treeData = [];
		var adjacencyList = {};
		individualsArray.forEach(function(node) {
			// add to parent
			// var parent = individuals[node.parents[0]];
			// if (parent) {
			// 	// create child array if it doesn't exist
			// 	(parent.children || (parent.children = []))
			// 	// add node to child array
			// 	.push(node);
			// } else {
			// 	// parent is null or missing
			// 	treeData.push(node);
			// }
			var nodeLinkList = [];
			if ( node.children ){
				node.children.forEach(function(child){
					nodeLinkList.push(child.pointer);
				});
			}
			if ( node.spouse ){
				nodeLinkList.push(node.spouse.pointer);
			}
			if ( node.parents ){
				node.parents.forEach(function(parent){
					nodeLinkList.push(parent.pointer);
				});
			}
			
			adjacencyList[ node.pointer ] = nodeLinkList;

		});
		console.log(adjacencyList);
		//showIndividuals();
		//showFamilies();

		d3force();
		//d3ranks();
	}
});




function rankIndividualsObject(){
	var rankKeys = [];
	for( var i=0; i<individualsArray.length; i++ ){
		( individualsRanked[ individualsArray[i].rank ] || (individualsRanked[ individualsArray[i].rank ]=[]) ).push(individualsArray[i]);
	}
	console.log( individualsRanked );

	for ( i in individualsRanked ){
		console.log(i);
		if ( individualsRanked.hasOwnProperty(i) ){
			rankKeys.push(i);
		}
	}

	rankKeys.sort( function(a,b){
		if ( a != "undefined" && b != "undefined" ){
			var ai = parseInt( a );
			var bi = parseInt( b );
			return ai - bi;
		}
		else if ( a === "undefined" ) return  1;
		else if ( b === "undefined" ) return -1;
	});

	console.log(rankKeys);


}

function addRankToIndividuals(){
	for ( i in ranks ){
		if ( ranks.hasOwnProperty(i) ){
			for ( var j=0; j<ranks[i].length; j++ ){
				for( var k=0; k<individualsArray.length; k++ ){
					if ( ranks[i][j] === individualsArray[k].pointer ){
						individualsArray[k].rank = parseInt(i);
						individualsArray[k].y = parseInt(i);
					}
				}
			}
		}
	}
	//nodes = individualsArray;
	//console.log(nodes);
}

var ranks = {};
var didntGetRanked = [];
var didntGetRanked_prev;
var duplicateRunCount = 0;
var maxxedOutCount = 0;
var maxRunCount = 10;
var maxMaxCount = 10;
var chunks = [];

function rankData(famz, reset){
	if ( famz === undefined ){
		for ( k in families ){
			if ( families.hasOwnProperty(k) ){
				familyKeys.push(k);
			}
		}

		familyKeys.sort( function(a,b){
			var ai = parseInt( a.substr( 2, a.length-1 ) );
			var bi = parseInt( b.substr( 2, b.length-1 ) );
			return ai - bi;
		});
	}
	else {
		familyKeys = famz;
	}

	didntGetRanked = [];

	var len = familyKeys.length;

	//for( i in families ){
	for ( var iii=0; iii<len; iii++ ){
		var found = false;
		var i = familyKeys[iii];
		// console.log(i);
		// console.log( families[i].members );
		// seed the ranks the first time through with the first family
		if ( famz === undefined || reset === true ){
			if ( iii === 0 ){
				found = true;
				if ( ranks[0] === undefined ){
					ranks[0] = [];
				}
				for ( j in families[i].members ){
					if ( j === "HUSB" || j === "WIFE" ){
						ranks[0].push( families[i].members[j] );
					}
					if ( j === "CHILDREN" ){
						for ( var k=0; k<families[i].members[j].length; k++ ){
							if ( ranks[-1] === undefined ){
								ranks[-1] = [];
							}
							ranks[-1].push( families[i].members[j][k] );
						}
					}
				}
			}
		}
		// now go through all the ranks and check if someone in this family is in one of the ranks
		else {
			for ( j in ranks ){
				if ( found === false ){
					for ( var k=0; k<ranks[j].length; k++ ){
						for( l in families[i].members ){
							if ( found === false ){
								if ( l != "CHILDREN" ){
									if ( families[i].members[l] === ranks[j][k] ){
										// console.log( "FOUND!!!" );
										// console.log( families[i].members[l] + " === " + ranks[j][k] );
										if ( l === "HUSB" ){
											if ( families[i].members.WIFE != undefined ){
												ranks[j].push( families[i].members.WIFE );
											}
										}
										else if ( l === "WIFE" ){
											if ( families[i].members.HUSB != undefined ){
												ranks[j].push( families[i].members.HUSB );
											}
										}
										if ( families[i].members.CHILDREN != undefined ){
											for ( var m=0; m<families[i].members.CHILDREN.length; m++ ){
												if ( ranks[(parseInt(j)-1)] === undefined ){
													ranks[(parseInt(j)-1)] = [];
												}
												ranks[(parseInt(j)-1)].push( families[i].members.CHILDREN[m] );
											}
										}
										found = true;
										//break;
									}
								}
								else {
									for ( var m=0; m<families[i].members[l].length; m++ ){
										if ( found === false ){
											if ( families[i].members[l][m] === ranks[j][k] ){
												// console.log( "FOUND!!!" );
												// console.log( families[i].members[l][m] + " === " + ranks[j][k] );
												for ( var n=0; n<families[i].members[l].length; n++ ){
													if ( m != n ){
														ranks[j].push( families[i].members[l][n] );
													}
												}
												if ( ranks[(parseInt(j)+1)] === undefined ){
													ranks[(parseInt(j)+1)] = [];
												}
												if ( families[i].members.HUSB != undefined ) ranks[(parseInt(j)+1)].push( families[i].members.HUSB );
												if ( families[i].members.WIFE != undefined ) ranks[(parseInt(j)+1)].push( families[i].members.WIFE );

												found = true;
												//break;
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
		if ( found === false ){
			//console.log( "DIDN'T FIND ANYTHING. SHOULD ADD THIS FAMILY " + i + " TO SOMETHING" );
			didntGetRanked.push(i);
		}
		found = false;
	}
	console.log( ranks );
	console.log( didntGetRanked );

	if ( arraysEqual(didntGetRanked, didntGetRanked_prev) ){
		duplicateRunCount++;
		console.log( "DUPLICATE ARRAY CHECKED. " + duplicateRunCount + " TIMES." );
	}

	if ( duplicateRunCount < maxRunCount ){
		didntGetRanked_prev = didntGetRanked;

		if( didntGetRanked.length > 0 ){
			rankData( didntGetRanked, false );
		}
	}
	else {
		console.log( "MAXXED OUT!!! SHOULD PUT THESE IN A NEW BRANCH OR SOMETHING" );

		//console.log( didntGetRanked );
		maxxedOutCount++;
		console.log( "maxxed out times: " + maxxedOutCount );
		if ( maxxedOutCount < maxMaxCount ){
			didntGetRanked_prev = [];
			duplicateRunCount = 0;
			rankData( didntGetRanked, true );
		}
	}
}

function arraysEqual(a, b) {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (a.length != b.length) return false;

	// If you don't care about the order of the elements inside
	// the array, you should sort both arrays here.

	for (var i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

function showFamilies(){
	var husband;
	var wife;
	var children;
	var famCtr = 0;

	for ( k in families ){
		if ( families.hasOwnProperty(k) ){
			familyKeys.push(k);
		}
	}

	familyKeys.sort( function(a,b){
		var ai = parseInt( a.substr( 2, a.length-1 ) );
		var bi = parseInt( b.substr( 2, b.length-1 ) );
		return ai - bi;
	});

	var len = familyKeys.length;

	//for( i in families ){
	for ( var iii=0; iii<len; iii++ ){
		var i = familyKeys[iii];
		console.log(i);
		var numParents = 0;
		var numChildren = 0;
		var familyPosition = {};
		console.log( families[i] );
		// let's check some things first
		if ( families[i].members.HUSB != undefined ){
			husband = individuals[ families[i].members.HUSB ];
			if ( $('#'+jQselEsc(husband.pointer)).length ) {
				console.log( "HUSBAND " + husband.pointer + " already exists!" );
				for ( k in husband.familyConnections ){
					if ( $('#'+jQselEsc(husband.familyConnections[k])).length ) {
						familyPosition = families[ husband.familyConnections[k] ].getPosition();
						familyPosition.y -= 30;
						familyPosition.x -= 30;
					}
				}
			}
			numParents++;
		}
		if ( families[i].members.WIFE != undefined ){
			wife = individuals[ families[i].members.WIFE ];
			if ( $('#'+jQselEsc(wife.pointer)).length ) {
				console.log( "WIFE " + wife.pointer + " already exists!" );
				for ( k in wife.familyConnections ){
					if ( $('#'+jQselEsc(wife.familyConnections[k])).length ) {
						familyPosition = families[ wife.familyConnections[k] ].getPosition();
						familyPosition.y -= 30;
						familyPosition.x += 30;
					}
				}
			}
			numParents++;
		}
		if ( families[i].members.CHILDREN != undefined ){
			children = [];
			for ( var j=0; j<families[i].members.CHILDREN.length; j++ ){
				children.push( individuals[ families[i].members.CHILDREN[j] ] );
				if ( $('#'+jQselEsc(children[j].pointer)).length ) {
					console.log( "CHILD " + children[j].pointer + " already exists!" );
					familyPosition = children[j].getPosition();
					console.log( children[j].familyConnections );
					for ( k in children[j].familyConnections ){
						console.log( k );
						if ( $('#'+jQselEsc(children[j].familyConnections[k])).length ) {
							
							//familyPosition = families[ children[j].familyConnections[k] ].getPosition();
							if ( k === "FAMS" ){
								familyPosition.y -= 60;
							}
							else {
								familyPosition.y += 60;
							}
							
						}
					}
				}
			}
			numChildren = children.length;
		}


		if ( famCtr === 0 ){
			familyPosition.x = $(window).width()/3;
			familyPosition.y = $(window).height()/1.6;
		}
		else if( $.isEmptyObject(familyPosition) === true ) {
			// familyPosition.x = $(window).width() * Math.random();
			// familyPosition.y = $(window).height() * Math.random();

		}
		console.log( familyPosition );
		families[i].setPosition( familyPosition );
		families[i].checkOtherFamilyPositions();
		families[i].setParentPosition();
		families[i].setChildrenPosition();
		console.log( families[i].getPosition() );


		var str = '<div id="' + i + '" class="family" style="left:'+familyPosition.x+'px;top:'+familyPosition.y + 'px;">';
		// if ( husband != undefined ){
		// 	str += '<div id="' + husband.pointer + '" class="husband">';
		// 	str += husband.name;
		// 	str += '</div>';
		// }
		// if ( wife != undefined ){
		// 	str += '<div id="' + wife.pointer + '" class="wife">';
		// 	str += wife.name;
		// 	str += '</div>';
		// }
		// if ( children != undefined ){
		// 	for ( var j=0; j<children.length; j++ ){
		// 		str += '<div id="' + children[j].pointer + '" class="child">';
		// 		str += children[j].name;
		// 		str += '</div>';
		// 	}
		// }

		str += '</div>';
		$("#vizHolder").append(str);
		famCtr++;

		// reset stuff for the next one
		husband = undefined;
		wife = undefined;
		child = undefined;
	}
}

function showIndividuals(){
	for ( i in individuals ){
		var d = individuals[i];
		console.log( i );
		var str = "<p>";
		str += "i = " + i + " d = " + d.pointer + " name = " + d.name;
		if ( d.birth != undefined ){
			str += "<br>";
			str += tab() + "birth = ";
			if ( d.birth.DATE != undefined ) str += d.birth.DATE;
			if ( d.birth.PLAC != undefined ) str += "<br>" + tab() + tab() + "birth place = " + d.birth.PLAC;
		}
		if ( d.death != undefined ){
			str += "<br>";
			str += tab() + "death = ";
			if ( d.death.DATE != undefined ) str += d.death.DATE;
			if ( d.death.PLAC != undefined ) str += "<br>" + tab() + tab() + "death place = " + d.death.PLAC;
		}
		str += "</p>";
		$("#vizHolder").append(str);
	}
}




var color = d3.scale.category20();

var force = d3.layout.force()
    .charge(-120)
    // .chargeDistance(100)
    // .theta(0.1)
    //.gravity(0)
    //.linkDistance(20)
    .linkDistance(function(d){
    	if( d.type === "spouse" ){
    		return 10;
    	}
    	else if( d.type === "child" ){
    		return 20;
    	}
    	else if( d.type === "sibling" ){
    		return 30;
    	}
    	else {
    		return 20;
    	}
    })
    .size([width, height]);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

//var svg;
var nodes;
var links = [];
var node, link;
var cursor;



var rankKeys = [];

function d3ranks(){
	console.log( 'd3 ranks' );

	// force
	// 	.nodes(nodes)
	// 	.links(links)
	// 	.start();
	
	var node = svg.selectAll( ".node" )
		.data( nodes )
		.enter()
		.append("g")
		.attr( "class", "node" )
		.attr( "transform", function(d,i){
			if ( d.rank != undefined ){
				d.position.x = 100 + i*10; //Math.random()*width;
				d.position.y = ((height*0.7)-(d.rank*80));
				return "translate(" + d.position.x + "," + d.position.y + ")";
			}
			else {
				d.position.x = Math.random()*width;
				d.position.y = height*0.95;
				return "translate(" + d.position.x + "," + d.position.y + ")";
			}
		});

	node.append("circle")
		.attr("class", "node")
		.attr("class", function(d){
			return d.sex === "M" ? "male" : d.sex === "F" ? "female" : "genderNeutral";
		})
		.attr("r", 5);

	node.append("title")
		.attr("class", "node_text")
		.text(function(d) { return d.name; });

	node.append("text")
		.attr("class", "node_text")
		.attr("transform", "rotate(-45)")
		.text(function(d) { return d.name; });



	var link = svg.selectAll(".link")
		.data(links)
		.enter()
		.append("line")
		//.attr("class", "link")
		.attr("class", function(d){
			return d.type === "spouse" ? "link link__spouse" : d.type === "child" ? "link link__child" : d.type === "sibling" ? "link link__sibling" : "";
		});

	link.attr("x1", function(d) { return nodes[d.source].position.x; })
	    .attr("y1", function(d) { return nodes[d.source].position.y; })
	    .attr("x2", function(d) { return nodes[d.target].position.x; })
	    .attr("y2", function(d) { return nodes[d.target].position.y; });

	// force.on("tick", function() {

	// 	node.attr( "transform", function(d){
	// 		if ( d.rank != undefined ){
	// 			d.position.y = ((height*0.7)-(d.rank*50));
	// 			return "translate(" + d.position.x + "," + d.position.y + ")";
	// 		}
	// 		else {
	// 			d.position.y = 0;
	// 			return "translate(" + d.position.x + "," + d.position.y + ")";
	// 		}
	// 	});


	// 	link.attr("x1", function(d) { return nodes[d.source].position.x; })
	// 	    .attr("y1", function(d) { return nodes[d.source].position.y; })
	// 	    .attr("x2", function(d) { return nodes[d.target].position.x; })
	// 	    .attr("y2", function(d) { return nodes[d.target].position.y; });
	// });
	animate();
}

function animate(){
	requestAnimationFrame( animate );


	for ( var i=0; i<nodes.length; i++ ){

	}



	var sMINt, ABSsMINt;

	var link = svg.selectAll(".link")
		.attr("x1", function(d) { 
		    sMINt = nodes[d.source].position.x - nodes[d.target].position.x;
		    ABSsMINt = Math.abs(sMINt);
	    	if( d.type === "spouse" ){
	    		if( ABSsMINt > 30 ){
	    			if ( sMINt < 0 ){
	    				//nodes[d.source].position.x+=0.01*ABSsMINt;
	    				//nodes[d.target].position.x-=0.01*ABSsMINt;
	    				nodes[d.source].position.x = nodes[d.target].position.x-10;
	    			}
	    			else {
	    				// nodes[d.source].position.x-=0.01*ABSsMINt;
	    				// nodes[d.target].position.x+=0.01*ABSsMINt;
	    				nodes[d.source].position.x = nodes[d.target].position.x+10;
	    			}
	    		}
	    		else if ( ABSsMINt < 25 ){
	    			if ( sMINt < 0 ){
	    				nodes[d.source].position.x-=0.01*ABSsMINt;
	    				nodes[d.target].position.x+=0.01*ABSsMINt;
	    			}
	    			else {
	    				nodes[d.source].position.x+=0.01*ABSsMINt;
	    				nodes[d.target].position.x-=0.01*ABSsMINt;
	    			}
	    		}
	    	}
	    	else if( d.type === "child" ){
	    		if( ABSsMINt > 40 ){
	    			if ( sMINt < 0 ){
	    				nodes[d.source].position.x+=0.01*ABSsMINt;
	    				nodes[d.target].position.x-=0.01*ABSsMINt;
	    			}
	    			else {
	    				nodes[d.source].position.x-=0.01*ABSsMINt;
	    				nodes[d.target].position.x+=0.01*ABSsMINt;
	    			}
	    		}
	    		else if ( ABSsMINt < 5 ){
	    			if ( sMINt < 0 ){
	    				nodes[d.source].position.x-=0.01*ABSsMINt;
	    				nodes[d.target].position.x+=0.01*ABSsMINt;
	    			}
	    			else {
	    				nodes[d.source].position.x+=0.01*ABSsMINt;
	    				nodes[d.target].position.x-=0.01*ABSsMINt;
	    			}
	    		}
	    	}
			return nodes[d.source].position.x; 
		})
	    .attr("y1", function(d) { 
	    	return nodes[d.source].position.y; 
	    })
	    .attr("x2", function(d) { 
	    	return nodes[d.target].position.x; 
	    })
	    .attr("y2", function(d) { 
	    	return nodes[d.target].position.y; 
	    });


	var node = svg.selectAll( ".node" )
		.attr( "transform", function(d){
			return "translate(" + d.position.x + "," + d.position.y + ")";
		});
}


function d3force(){
	console.log('d3data');
	//var tree = d3.layout.tree().size([600,900]);
	//tree.nodes(individuals);

	

	  
	      // .attr("d", diagonal);

	// var link = svg.selectAll(".link")
	// 	.data(links)
	// 	.enter().append("path")
	// 	.attr("class", "link")
	// 	.attr("class", function(d){
	// 		return d.type === "spouse" ? "link__spouse" : d.type === "child" ? "link__child" : "";
	// 	})
	// 	.attr("d", function(d){
	// 		console.log(d);
	// 		var strtPos = {};
	// 		var endPos = nodes[d.end].position;
	// 		if( d.type === "spouse" ){
	// 			strtPos = nodes[d.start].position;
	// 		}
	// 		else if ( d.type === "child" ){
	// 			if ( families[ individualsArray[d.end].familyConnections.FAMC ].numParents === 2 ){
	// 				var hPos = individuals[ families[ individualsArray[d.end].familyConnections.FAMC ].members.HUSB ].position;
	// 				var wPos = individuals[ families[ individualsArray[d.end].familyConnections.FAMC ].members.WIFE ].position;
	// 				strtPos.x = ( hPos.x + wPos.x )/2;
	// 				strtPos.y = ( hPos.y + wPos.y )/2;
	// 			}
	// 			else {
	// 				strtPos = nodes[d.start].position;
	// 			}
	// 		}
	// 		return "M" + strtPos.x + "," + strtPos.y + "L" + endPos.x + "," + endPos.y;
	// 	})
	// 	;

	// var node = svg.selectAll(".node")
	// 	.data(nodes)
	// 	.enter().append("g")
	// 	.attr("class", "node")
	// 	.attr("transform", function(d) { 
	// 		console.log( d );
	// 		return "translate(" + d.position.x + "," + d.position.y + ")"; 
	// 	});

	// node.append("circle")
	// 	.attr("r", 4.5);

	// node.append("text")
	// 	// .attr("dx", function(d) { return d.children ? -8 : 8; })
	// 	// .attr("dy", 3)
	// 	// .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
	// 	.text(function(d) { return d.name; });

	force
      .nodes(nodes)
      .links(links)
      .start();

	var link = svg.selectAll(".link")
		.data(links)
		.enter()
		.append("line")
		.attr("class", "link")
		.attr("class", function(d){
			return d.type === "spouse" ? "link__spouse" : d.type === "child" ? "link__child" : d.type === "sibling" ? "link__sibling" : "";
		});

	var node = svg.selectAll(".node")
		.data(nodes)
		.enter()
		.append("g")
		.attr("class", "node")
		.call(force.drag);

	node.append("circle")
		.attr("class", "node")
		.attr("class", function(d){
			return d.sex === "M" ? "male" : d.sex === "F" ? "female" : "genderNeutral";
		})
		.attr("r", 5)

	node.append("title")
		.attr("class", "node_text")
		.text(function(d) { return d.name; });

	node.append("text")
		.attr("class", "node_text")
		//.attr("transform", "rotate(-45)")
		.text(function(d) { return d.name; });

	//force.on("tick", tick() );
	force.on("tick", function() {
		var sMINt, ABSsMINt;
		link.attr("x1", function(d) { 
				return d.source.x; 
			})
		    .attr("y1", function(d) { 
		    	// sMINt = d.source.y - d.target.y;
		    	// ABSsMINt = Math.abs(sMINt);
		    	// if( d.type === "spouse" ){
		    	// 	if( ABSsMINt > 1 ){
		    	// 		if ( sMINt < 0 ){
		    	// 			d.source.y += ABSsMINt/10;
		    	// 			d.target.y -= ABSsMINt/10;
		    	// 		}
		    	// 		else {
		    	// 			d.source.y -= ABSsMINt/10;
		    	// 			d.target.y += ABSsMINt/10;
		    	// 		}
		    	// 	}
		    	// }
		    	// else if ( d.type === "child" ){
		    	// 	if( sMINt > -5 ){
		    	// 		d.source.y -= ABSsMINt/2;
		    	// 		d.target.y += ABSsMINt/10;
		    	// 	}
		    	// }
		    	return d.source.y; 
		    })
		    .attr("x2", function(d) { 
		    	return d.target.x; 
		    })
		    .attr("y2", function(d) { 
		    	sMINt = d.source.y - d.target.y;
		    	ABSsMINt = Math.abs(sMINt);
		    	// if( d.type === "spouse" ){
		    	// 	if( ABSsMINt > 1 ){
		    	// 		if ( sMINt < 0 ){
		    	// 			d.source.y += ABSsMINt/10;
		    	// 			d.target.y -= ABSsMINt/10;
		    	// 		}
		    	// 		else {
		    	// 			d.source.y -= ABSsMINt/10;
		    	// 			d.target.y += ABSsMINt/10;
		    	// 		}
		    	// 	}
		    	// }
		    	// else if ( d.type === "child" ){
		    	// 	if( sMINt > -5 ){
		    	// 		d.source.y -= ABSsMINt/2;
		    	// 		d.target.y += ABSsMINt/2;
		    	// 	}
		    	// }
		    	return d.target.y; 
		    });

		node.attr("transform", function(d) { 
				// var x = Math.max(0, Math.min(width, d.x));
    //      		var y = Math.max(0, Math.min(height, d.y));
				// d.x = x;
				// d.y = y;
				return "translate(" + d.x + "," + d.y + ")"; 
			});
		    //.attr("cy", function(d) { return d.y; });
	});


	//console.log(node);
	// var p = d3.select("#vizHolder").selectAll("p")
	// 	.data(individualsArray)
	// 	.enter()
	// 	.append("p")
	// 	.html(function (d,i) {
	// 		//console.log( d, i );
	// 		var str = "";
	// 		str += "i = " + i + " d = " + d.pointer + " name = " + d.name;
	// 		if ( d.birth != undefined ){
	// 			str += "<br>";
	// 			str += tab() + "birth = ";
	// 			if ( d.birth.DATE != undefined ) str += d.birth.DATE;
	// 			if ( d.birth.PLAC != undefined ) str += "<br>" + tab() + tab() + "birth place = " + d.birth.PLAC;
	// 		}
	// 		if ( d.death != undefined ){
	// 			str += "<br>";
	// 			str += tab() + "death = ";
	// 			if ( d.death.DATE != undefined ) str += d.death.DATE;
	// 			if ( d.death.PLAC != undefined ) str += "<br>" + tab() + tab() + "death place = " + d.death.PLAC;
	// 		}
	// 		return str;
	// 	});
	// console.log(p);


	
}

function tab(){
	return "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp";
}

function tick() {
	var link = svg.selectAll(".link");
	var node = svg.selectAll(".node");

    link.attr("x1", function(d) { return d.source.x; })
	    .attr("y1", function(d) { return d.source.y; })
	    .attr("x2", function(d) { return d.target.x; })
	    .attr("y2", function(d) { return d.target.y; });

	node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    // link.attr("x1", function(d) { return d.source.x; })
    //     .attr("y1", function(d) { return d.source.y; })
    //     .attr("x2", function(d) { return d.target.x; })
    //     .attr("y2", function(d) { return d.target.y; })
    //     .style("stroke", function(d) { return d.color; });

    // node.attr("cx", function(d) { return d.x; })
    //     .attr("cy", function(d) { return d.y; })
    //     .style("stroke-width", 1);
        // .style("fill", function(d) { 
        //     return colors(d.lastName);
        // });

  }















function doDAG(){
	dagLayout( nodes, links, 800,800 );

		// Draw the DAG in its own SVG.
		svg.attr({
		        width: svgWidth,
		        height: svgHeight,
		        xmlns: 'http://www.w3.org/2000/svg'
		      });
		// This template defines an arrowhead, and is referred to by id.
		svg.append('defs').append('marker')
		    .attr({
		      id: 'arrowhead',
		      refX: 5,
		      refY: 2,
		      markerUnits: 'strokeWidth',
		      markerWidth: 5,
		      markerHeight: 4,
		      orient: 'auto'
		    }).append('path').attr({
		      d: 'M 0 0 L 5 2 L 0 4 Z',
		      fill: 'red'
		    });

		var svgDagEdges = svg.selectAll('.link')
		    .data(links)
		    .enter().append('line')
		        //.attr('class', 'link')
		        .attr("class", function(d){
					return d.type === "spouse" ? "link link__spouse" : d.type === "child" ? "link link__child" : d.type === "sibling" ? "link link__sibling" : "";
				})
		        //.style('stroke', 'red')
		        .attr('marker-end', 'url(#arrowhead)')
		        .attr('x1', function(d) { return nodes[d.source].x; })
		        .attr('y1', function(d) { return nodes[d.source].y; })
		        .attr('x2', function(d) { return nodes[d.target].x; })
		        .attr('y2', function(d) { return nodes[d.target].y; });

		var svgDagNodes = svg.selectAll('.dagnode')
		    .data(nodes)
		    .enter().append('g')
		        .attr('class', 'dagnode')
		        .attr('transform', function(d) {
		          return 'translate(' + d.x + ',' + d.y + ')';
		        });
		svgDagNodes.append('circle').attr('r', 5);
		svgDagNodes.append('text')
			.attr('class', 'node_text')
		    .attr('transform', 'translate(-6,20)')
		    .text(function(d) { return d.label; });
}


// Class for DAG layout.
function dagLayout(nodes, links, svgWidth, svgHeight) {
  // For now, assume nodes are topologically sorted (they are).
  console.log(nodes);
  console.log(links);

  // Create reference arrays to parents and children.
  // nodes.forEach(function(node) {
  //   node.children = [];
  //   node.parents = [];
  // });

  // links.forEach(function(link) {
  //   var sourceNode = nodes[ link.source ];
  //   var targetNode = nodes[ link.target ];
  //   sourceNode.children.push(targetNode);
  //   targetNode.parents.push(sourceNode);
  // });

  // Calculate X values.
  nodes.forEach(function(node) {
    // Determine the minimum X value.
    node.x = d3.max(node.parents, function(node) { return node.x; }) + 1 || 0;
  });
  nodes.forEach(function(node) {
    // If a node has children farther in the future, push it towards them.
    var maxX = d3.min(node.children, function(node) { return node.x; }) - 1;
    if (maxX) {
      console.log('moving X ' + node.x + ' -> ' + maxX);
      node.x = maxX;
    }
    // node.x = maxX ? maxX : node.x;
  });
  nodes.sort(function(a, b) { return a.x - b.x; });
  console.log('SORTED:');
  console.log(nodes);

  // Stateful function to remember which spots are "taken".
  var nearestY = (function() {
    var taken = {};
    return function(x, y) {
      taken[x] = taken[x] || {};
      var oldY = y;
      while (taken[x][y]) {
        y += 1;
      }
      taken[x][y] = true;
      console.log('nearestY(' + x + ',' + oldY + ') -> ' + y);
      return y;
    };
  })();

  var onlyChild = function(node) {
    return node.parents.length == 1 && node.parents[0].children.length == 1;
  };
  var placementIndex = 0;
  nodes.forEach(function(node) {
    if (node.parents.length == 0) {
      node.y = nearestY(node.x, 0);
      node.label += ' -(' + placementIndex++ + ')';
      console.log('Placed ' + node.label);
    } else if (onlyChild(node)) {
      // Skip. This node has already been placed.
      return;
    } else {
      var avgY = Math.floor(d3.mean(node.parents, function(p) { return p.y; }));
      node.y = nearestY(node.x, avgY);
      node.label += ' M(' + placementIndex++ + ')';
      console.log('Placed ' + node.label);
    }

    var tries = 0;
    while (node.children.length == 1 && onlyChild(node.children[0])) {
      var child = node.children[0];
      child.y = nearestY(child.x, node.y);
      node = child;
      node.label += ' +(' + placementIndex++ + ')';
      console.log('Placed ' + node.label);
      tries++;
      if ( tries > 10 ) {
      	console.log( 'too many tries' );
      	break;
      }
    }
  });

  nodes.forEach(function(node) {
    node.x = node.x * 100 + 600;
    node.y = node.y * 50 + 50;
  })
};

















var htmlString = '';

var minTime = 100000000
  , maxTime = 0
  ;


function createIndividuals( t ){
	var ind;
	for ( i in t ){
		if ( t[i].tag === "INDI" ){
			ind = new Person(t[i]);
			individuals[ t[i].pointer ] = ind;
			individualsArray.push(ind);
		}
	}
	console.log( individuals );
	console.log( individualsArray );

	nodes = individualsArray;
}

function createFamilies( t ){
	var fam;
	for ( i in t ){
		if ( t[i].tag === "FAM" ){
			fam = new Family(t[i]);
			families[ t[i].pointer ] = fam;
		}
	}
	console.log( families );
	console.log( individuals );
}



function visualizeTree( t ){

	$('#vizHolder').html('');

	
	
	
	htmlString = '';
	for ( i in t ){
		htmlString += t[i].tag;
		htmlString += "  ";
		if ( t[i].data != '' ){
			htmlString += t[i].data;
			htmlString += "  ";
		}
		if ( t[i].pointer != '' ){
			htmlString += t[i].pointer;
			htmlString += "  ";
		}
		htmlString += '<br>';
		if ( t[i].tree.length != 0 ){
			drill( t[i].tree );
		}
	}

	$('#vizHolder').append( htmlString );
}

function layoutTimeLine(){
	var numYears = maxTime - minTime;
	
}

function drill( arr ){
	for ( var i=0; i<arr.length; i++ ){
		for ( var l=0; l<arr[i].level; l++ ){
			htmlString += "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp";
		}
		htmlString += arr[i].tag;
		htmlString += "  ";
		if ( arr[i].data != '' ){
			htmlString += arr[i].data;
			htmlString += "  ";
		}
		if ( arr[i].pointer != '' ){
			htmlString += arr[i].pointer;
			htmlString += "  ";
		}
		htmlString += '<br>';
		if ( arr[i].tree.length != 0 ){
			drill( arr[i].tree );
		}
	}
}

function findMinMaxTime( t ){
	for ( i in t ){
		if ( t[i].tag != "HEAD" && t[i].tag != "TRLR" ){
			if ( t[i].tag === "DATE" ){
				//console.log( "DATE!!! " + t[i].data );
				var yr;
				if ( t[i].data.indexOf( "PM" ) === -1 && t[i].data.indexOf( "AM" ) === -1 ){
					var s = t[i].data.substr(-4);
					// handle split years
					if ( s.indexOf( "/" ) != -1 ){
						s = t[i].data.substr(-7,4);
					}
					// handle unknown years
					if ( s.indexOf( "?" ) != -1 ){
						s = s.replace( "?", "0" );
					}
					yr = parseInt( s );
				}
				else {
					//console.log( "weird time: " + t[i].data );
					var dt = new Date( t[i].data );
					if ( dt != "InvalidDate" ){
						// console.log( "We handled it:" );
						// console.log( "	" + dt );
						yr = dt.getFullYear();
					}
				}
				if ( yr != undefined ){
					if ( yr < minTime ) {
						//console.log( yr + " <<< " + minTime + " : " + t[i].data );
						minTime = yr;
					}
					if ( yr > maxTime ) {
						//console.log( yr + " >>> " + maxTime + " : " + t[i].data );
						if ( yr > new Date().getFullYear() ){
							//console.log( "impossible! future date!" );
						}
						else {
							maxTime = yr;
						}
					}
				}
			}
			if ( t[i].tree.length != 0 ){
				findMinMaxTime(t[i].tree);
			}
		}
	}
}

/*

http://homepages.rootsweb.ancestry.com/~pmcbride/gedcom/55gcch1.htm#S2

A gedcom_line has the following syntax: 

gedcom_line := 
level + delim + [xref_id + delim +] tag + [delim + line_value +] terminator 
level + delim + optional_xref_id + tag + delim + optional_line_value + terminator 

*/

var delim = " ";
var traverse;

function parseData( d ){
	//console.log( 'parsing data' );
	// split the data at new lines
	var lines = d.split( /\r\n|\r|\n/g );
	//console.log( lines );
	var currentRecordID = "";
	var currentRecordStartIndex = 0;
	var last_level = 0;

	// gedcom_line parts
	var level, xref_id, tag, line_value;

	for( var i=0; i<lines.length; i++ ){
		var lineParts = lines[i].split( delim );
		//console.log( lineParts );
		var level = parseInt( lineParts[0] );//lines[i].charAt(0) );
		var type;
		var content;
		// it the first character is a 0, it's a new chunk of data
		if ( level === 0 ){
			var id = lines[i].slice( 2, -4 ).trim();
			type = lines[i].substr(-4);
			if ( type === "HEAD" ){
				id = "HEAD";
			}
			//console.log( 'start of a new record! %s : %s', id, type );
			currentRecordID = id;
			currentRecordStartIndex = i;
			allData[ id ] = {};
			content = id;
		}
		else {
			type = lines[i].substr( 2, 4 ).trim();
			content = lines[i].substr( 6 ).trim();
		}

		if ( level > last_level ){
			if ( allData[ currentRecordID ][ i-currentRecordStartIndex-1 ] === undefined ){
				allData[ currentRecordID ][ i-currentRecordStartIndex-1 ] = {};
			}
			allData[ currentRecordID ][ i-currentRecordStartIndex-1 ][ level ] = {};//content;
			allData[ currentRecordID ][ i-currentRecordStartIndex-1 ][ level ][ type ] = content;
			allData[ currentRecordID ][ i-currentRecordStartIndex-1 ][ level ].level = level;
		}
		else {
			allData[ currentRecordID ][ i-currentRecordStartIndex ] = {};//content;
			allData[ currentRecordID ][ i-currentRecordStartIndex ][ type ] = content;
			allData[ currentRecordID ][ i-currentRecordStartIndex ].level = level;
		}
		// allData[ currentRecordID ][ i-currentRecordStartIndex ] = {};//content;
		// allData[ currentRecordID ][ i-currentRecordStartIndex ][ type ] = content;
		// allData[ currentRecordID ][ i-currentRecordStartIndex ].level = level;
		//allData[ currentRecordID ][ type ] = content; //{}; //type;
		//allData[ currentRecordID ][ type ].content = content;
		
		last_level = level;
	}
	//console.log( allData );

	//traverse = new Traverse();
	//console.log( traverse );
	//traverse.map();

	var t = parse( d );

	console.log( t );
}




var DATA_TYPES = {
	"SOUR":"",
	"HEAD":"",
	"NAME":"",
	"VERS":"",
	"CORP":"",
	"ADDR":"",
	"CONT":"",
	"DEST":"",
	"DATE":"",
	"TIME":""
}




var lineRe = /\s*(0|[1-9]+[0-9]*) (@[^@]+@ |)([A-Za-z0-9_]+)( [^\n\r]*|)/;

function parse(input) {
    var start = { root: { tree: [] }, level: 0 };
    start.pointer = start.root;
    //console.log( input );
    //console.log( start );
    
    return new Traverse(input
        .split('\n')
        .map(mapLine)
        .filter(function(_) { return _; })
        .reduce(buildTree, start)
        .root
        .tree).map(function(node) {
            delete node.up;
            //delete node.level;
            this.update(node);
        });

    // the basic trick of this module is turning the suggested tree
    // structure of a GEDCOM file into a tree in JSON. This reduction
    // does that. The only real trick is the `.up` member of objects
    // that points to a level up in the structure. This we have to
    // censor before JSON.stringify since it creates circular references.
    function buildTree(memo, data) {
        if (data.level === memo.level) {
            memo.pointer.tree.push(data);
        } else if (data.level > memo.level) {
            var up = memo.pointer;
            memo.pointer = memo.pointer.tree[
                memo.pointer.tree.length - 1];
                memo.pointer.tree.push(data);
                memo.pointer.up = up;
                memo.level = data.level;
        } else if (data.level < memo.level) {
            // the jump up in the stack may be by more than one, so ascend
            // until we're at the right level.
            while (data.level <= memo.pointer.level && memo.pointer.up) {
                memo.pointer = memo.pointer.up;
            }
            memo.pointer.tree.push(data);
            memo.level = data.level;
        }
        return memo;
    }

    function mapLine(data) {
        var match = data.match(lineRe);
        if (!match) return null;
        //console.log( match );
        return {
            level: parseInt(match[1], 10),
            pointer: match[2].trim(),
            tag: match[3].trim(),
            data: match[4].trim(),
            tree: []
        };
    }
}

function jQselEsc( sel ){
    return sel.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
}