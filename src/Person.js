function Person(t){
	this.rawObject = t;
	this.name;
	this.sex;
	this.birth;
	this.death;
	this.familyConnections;
	this.divString;
	this.div;
	this.rank;
	this.label = t.pointer;
	this.parents = [];
	this.children = [];

	this.pointer = this.rawObject.pointer;
	this.tag = this.rawObject.tag;
	this.tree = this.rawObject.tree;
	this.position = {};
	//console.log( this.rawObject );

	for ( var i=0; i < this.tree.length; i++ ) {
		if( this.tree[i].tag === "NAME" ) { this.name = this.tree[i].data; this.label = this.name; }
		if( this.tree[i].tag === "BIRT" ) {
			if ( this.birth === undefined ){
				this.birth = {};
				for( var j=0; j<this.tree[i].tree.length; j++ ){
					this.birth[ this.tree[i].tree[j].tag ] = this.tree[i].tree[j].data;
				}
			}
		}
		if( this.tree[i].tag === "DEAT" ) {
			if ( this.death === undefined ){
				this.death = {};
				for( var j=0; j<this.tree[i].tree.length; j++ ){
					this.death[ this.tree[i].tree[j].tag ] = this.tree[i].tree[j].data;
				}
			}
		}
		if( this.tree[i].tag === "FAMS" || this.tree[i].tag === "FAMC" ) {
			if ( this.familyConnections === undefined ){
				this.familyConnections = {};
			}
			this.familyConnections[ this.tree[i].tag ] = this.tree[i].data;
		}
		if( this.tree[i].tag === "SEX" ) {
			this.sex = this.tree[i].data;
		}
	};

	this.position.x = Math.random() * width;
	this.position.y = Math.random() * height;
	this.x = 0;
	this.y = 0;

	// this.divString = '';
	// this.divString += '<div id="' + this.pointer + '"';
	// this.divString += 'class="' + ( this.sex === "M" ? "male" : this.sex === "F" ? "female" : "genderNeutral" );
	// this.divString += ' person';
	// this.divString += '">';
	// this.divString += this.name;
	// this.divString += '</div>';
	
	//console.log( this.div );

	// this.injectDiv = function(){
	// 	$("#vizHolder").append( this.divString );
	// 	this.div = $( '#'+jQselEsc(this.pointer) );
	// }


	// this.setName = function( n ){
	// 	this.name = n;
	// }
	// this.getName = function(){
	// 	return this.name;
	// }

	// this.setSex = function(s){
	// 	this.sex = s;
	// }
	// this.getSex = function(){
	// 	return this.sex;
	// }

	// this.setProperty = function(p){
	// 	if ( this[p] === undefined ) this[p] = {};
	// 	this[p] = p;
	// }
	// this.getProperty = function(p){
	// 	if ( this[p] === undefined ) return false;
	// 	return this[p];
	// }

	// this.setPosition = function(pos){
	// 	this.position = pos;
	// 	if ( this.div === undefined ){
	// 		this.injectDiv();
	// 	}
	// 	this.div.css( { "left": this.position.x+"px", "top": this.position.y+"px" } );
	// 	//console.log( this.name + " is now positioned at x: " + this.position.x + ", y: " + this.position.y );
	// }
	// this.getPosition = function(){
	// 	return this.position;
	// }
}