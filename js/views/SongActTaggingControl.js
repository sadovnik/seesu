define(['./etc_views', 'jquery', 'app_serv', 'spv'], function(etc_views, $, app_serv, spv){
"use strict";

//var localize = app_serv.localize;


var addTag = function(e, node, scope) {
	e.preventDefault();
	this.RPCLegacy('addTag', scope.tag.name || scope.tag);
};

var LfmTagItView = function() {};
etc_views.LfmLoginView.extendTo(LfmTagItView, {
	createBase: function() {
		this._super();
	//	var _this = this;
		//

		var tpl_con = this.root_view.getSample('song-act-tagging');

		this.createTemplate(tpl_con);

		this.c.append(tpl_con);
		/*
		var wrap = $('<div class="add-to-lfmfav"></div>');

		this.nloveb = this.root_view.createNiceButton();
		this.nloveb.c.appendTo(wrap);
		this.nloveb.b.click(function(){
			if (_this.nloveb._enabled){
				_this.RPCLegacy('makeLove');
			}
		});
		this.addWayPoint(this.nloveb.b);
		this.nloveb.b.text(localize('addto-lfm-favs'));
		this.c.append(wrap);
		*/
	
	},
	tpl_r_events: {
		'personal_tags': {
			addTag: addTag
		},
		'toptags': {
			addTag: addTag
		},
		'artist_tags': {
			addTag: addTag
		}
	},

	tpl_events:{
		changeTags: spv.debounce(function(e, input) {
			var value = input.value;
			this.overrideStateSilently('user_tags_string', value);
			this.RPCLegacy('changeTags', value);
			//console.log(arguments);
		})
	},
	"stch-user_tags_string": function(state) {
		this.tpl.ancs['tags-input'].val(state);
	},
	"stch-has_session": function(state) {
		state = !!state;
		this.c.toggleClass('has_session', state);
		this.auth_block.toggleClass('hidden', state);
		/*
		
		
		
		this.nloveb.toggle(state);
		*/
	},
	"stch-wait_love_done": function(state){
		//this.c.toggleClass('wait_love_done', !!state);
	}
});



var SongActTaggingControl = function(){};
etc_views.BaseCRowUI.extendTo(SongActTaggingControl, {
	children_views: {
		lfm_tagsong: LfmTagItView
	},
	createDetails: function(){
		var parent_c = this.parent_view.row_context;
		var buttons_panel = this.parent_view.buttons_panel;
		this.c = parent_c.children('.song-tagging');
		this.button = buttons_panel.find('.pc-place .pc-tag');
		this.dom_related_props.push('button');

		this.bindClick();
	},
	expand: function(){
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}
		this.c.append(this.getAFreeCV('lfm_tagsong'));
		this.requestAll();
	}
});
return SongActTaggingControl;

});