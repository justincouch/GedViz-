function Family(t){
	this.rawObject = t;
	this.members = {};
	this.info = {};
	this.position;
	this.numParents = 0;
	this.husbandIndex;
	this.wifeIndex;
	this.childIndex;

	for ( var i=0; i<this.rawObject.tree.length; i++ ){
		if ( this.rawObject.tree[i].tag === "HUSB" || this.rawObject.tree[i].tag === "WIFE" ){
			this.members[ this.rawObject.tree[i].tag ] = this.rawObject.tree[i].data;
			this.numParents++;
		}
		else if ( this.rawObject.tree[i].tag === "CHIL" ){
			if ( this.members.CHILDREN === undefined ){
				this.members.CHILDREN = [];
			}
			this.members.CHILDREN.push( this.rawObject.tree[i].data );
		}
		else {
			this.info[ this.rawObject.tree[i].tag ] = this.rawObject.tree[i];
		}
	}

	if( this.members.HUSB != undefined && this.members.WIFE != undefined ){
		for ( var i=0; i<individualsArray.length; i++ ){
			if ( individualsArray[i].pointer === this.members.HUSB ) this.husbandIndex = i;
			if ( individualsArray[i].pointer === this.members.WIFE ) this.wifeIndex = i;
		}
		individuals[ this.members.HUSB ].spouse = individuals[ this.members.WIFE ];
		individuals[ this.members.WIFE ].spouse = individuals[ this.members.HUSB ];
		links.push( { "source": this.husbandIndex, "target": this.wifeIndex, "type": "spouse" } );
		links.push( { "source": this.wifeIndex, "target": this.husbandIndex, "type": "spouse" } );
	}
	else if ( this.members.HUSB != undefined ){
		for ( var i=0; i<individualsArray.length; i++ ){
			if ( individualsArray[i].pointer === this.members.HUSB ) this.husbandIndex = i;
		}
	}
	else if ( this.members.WIFE != undefined ){
		for ( var i=0; i<individualsArray.length; i++ ){
			if ( individualsArray[i].pointer === this.members.WIFE ) this.wifeIndex = i;
		}
	}

	if ( this.members.CHILDREN != undefined ){
		this.childIndex = new Array( this.members.CHILDREN.length );
		for ( var i=0; i<this.members.CHILDREN.length; i++ ){

			if ( this.members.HUSB != undefined ){ individuals[ this.members.CHILDREN[i] ].parents.push( individuals[ this.members.HUSB ] ) };
			if ( this.members.WIFE != undefined ){ individuals[ this.members.CHILDREN[i] ].parents.push( individuals[ this.members.WIFE ] ) };	

			for ( var j=0; j<individualsArray.length; j++ ){
				if ( individualsArray[j].pointer === this.members.CHILDREN[i] ) this.childIndex[i] = j;
			}

			if( this.husbandIndex != undefined && this.wifeIndex != undefined ){
				(individualsArray[ this.husbandIndex ].children || (individualsArray[ this.husbandIndex ].children = [])).push( individuals[ this.members.CHILDREN[i] ] );
				(individualsArray[ this.wifeIndex ].children || (individualsArray[ this.wifeIndex ].children = [])).push( individuals[ this.members.CHILDREN[i] ] );
				links.push( { "source": this.husbandIndex, "target": this.childIndex[i], "type": "child" } );
				links.push( { "source": this.wifeIndex, "target": this.childIndex[i], "type": "child" } );
			}
			else if( this.husbandIndex != undefined ){
				(individualsArray[ this.husbandIndex ].children || (individualsArray[ this.husbandIndex ].children = [])).push( individuals[ this.members.CHILDREN[i] ] );
				links.push( { "source": this.husbandIndex, "target": this.childIndex[i], "type": "child" } );
			}
			else if( this.wifeIndex != undefined ){
				(individualsArray[ this.wifeIndex ].children || (individualsArray[ this.wifeIndex ].children = [])).push( individuals[ this.members.CHILDREN[i] ] );
				links.push( { "source": this.wifeIndex, "target": this.childIndex[i], "type": "child" } );
			}
			else {
				console.log( "DOES THIS CHILD HAVE NO PARENTS???");
				console.log( individualsArray[this.childIndex] );
				console.log( this.childIndex );
				//console.log( this );
			}

			for ( var j=0; j<this.members.CHILDREN.length; j++ ){
				if ( i != j ){
					if ( individuals[ this.members.CHILDREN[i] ].siblings === undefined ){ individuals[ this.members.CHILDREN[i] ].siblings = []; }
					individuals[ this.members.CHILDREN[i] ].siblings.push( individuals[ this.members.CHILDREN[j] ] );
				}
			}
		}
		
		for ( var i=0; i<this.members.CHILDREN.length; i++ ){
		// add sibling connection
			// we'll just add sequentially 0-1, 1-2, 3-4, etc.
			if ( i+1 < this.members.CHILDREN.length-1 ){
				links.push( { "source": this.childIndex[i], "target": this.childIndex[i+1], "type": "sibling" } );
			}
		}
	}

	this.setPosition = function( pos ){
		this.position = pos;

		// this.checkOtherFamilyPositions();

		// this.setParentPosition();
		// this.setChildrenPosition();
	}

	this.checkOtherFamilyPositions = function(){
		//console.log( "---- " + this.rawObject.pointer + " checking positions ----" );
		var pushed = false;
		for ( i in families ){
			if ( i != this.rawObject.pointer ){
				if ( families[i].position != undefined ){
					if ( (Math.abs( this.position.y - families[i].position.y ) < 5) && (Math.abs( this.position.x - families[i].position.x ) < 300) ){
						//console.log( this.rawObject.pointer + " & " + i + " are too close!" );
						//console.log( this.position.x + " : " + families[i].position.x );
						pushed = true;
						// check which side each is on
						if ( this.position.x - families[i].position.x < 0 ){
							// this is on left, i is on right
							this.position.x -= 10;
							families[i].position.x += 10;
						}
						else {
							// either co-positioned or this is on right, i is on left
							this.position.x += 10;
							families[i].position.x -= 10;
						}
						//console.log( this.position.x + " : " + families[i].position.x );
						families[i].setParentPosition();
						families[i].setChildrenPosition();
					}
				}
			}
		}
		//console.log( this.rawObject.pointer + " is now at x: " + this.position.x + ", y: " + this.position.y );
		if ( pushed === true ){
			this.checkOtherFamilyPositions();
			// this.setParentPosition();
			// this.setChildrenPosition();
		}
	}

	this.getPosition = function(){
		return this.position;
	}

	this.setParentPosition = function(){
		//console.log( "---- " + this.rawObject.pointer + " setting parent positions ----" );
		if ( this.numParents === 0 ){
			console.log( "NO PARENTS!!! WHAT TO DO?" );
		}
		else if ( this.numParents === 1 ){
			if ( this.members.HUSB != undefined ){
				individuals[ this.members.HUSB ].setPosition( this.position );
			}
			else if ( this.members.WIFE != undefined ){
				individuals[ this.members.WIFE ].setPosition( this.position );
			}
		}
		else if ( this.numParents === 2 ){
			individuals[ this.members.HUSB ].setPosition( { x: this.position.x - 60, y: this.position.y } );
			individuals[ this.members.WIFE ].setPosition( { x: this.position.x + 60, y: this.position.y } );
		}
		else {
			console.log( "SO MANY PARENTS!!! WHAT TO DO?" );
		}
	}

	this.setChildrenPosition = function(){
		//console.log( "---- " + this.rawObject.pointer + " setting children positions ----" );
		if( this.members.CHILDREN != undefined ){
			for ( var i=0; i<this.members.CHILDREN.length; i++ ){
				var x = i * 60 * (this.members.CHILDREN.length-1)/2;
				individuals[ this.members.CHILDREN[i] ].setPosition( { x: this.position.x + x, y: this.position.y + 60 } );
			}
		}
	}
}