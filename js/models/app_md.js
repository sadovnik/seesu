/*
freeze
!restoreFreezed
show_now_playing

!!!show_playlist_page
show_track_page
*/
var appModel;
(function() {




appModel = function(){};
provoda.Model.extendTo(appModel, {
	init: function(){
		this._super();
		
		this.navigation = [];
		this.map = new browseMap();

		return this;
	},
	checkUserInput: function(opts) {
		if (opts.ext_search_query) {
			_this.search(opts.ext_search_query);
		}

		var state_recovered;
		if (this.p && this.p.c_song){
			if (this.p.c_song && this.p.c_song.plst_titl){
				this.show_now_playing(true);
				state_recovered = true;
			}
		}

		if (state_recovered){
			opts.state_recovered = true;
		}
		if (!state_recovered && !opts.ext_search_query){
			this.trigger('handle-location');
		}

		//big_timer.q.push([tracking_opts.category, 'process-thins-sui', big_timer.comp(tracking_opts.start_time), 'seesu ui in process', 100]);
		this.start_page.updateState('can-expand', true);

	},
	infoGen: function(dp, c, base_string){
		if (dp){
			if (c.prev){
				c.str += ', ';
			}
			c.str += base_string.replace('%s', dp);
			if (!c.prev){
				c.prev = true
			}
		}	
	},
	getRemainTimeText: function(time_string, full){
		var d = new Date(time_string);
		var remain_desc = '';
		if (full){
			remain_desc += localize('wget-link') + ' ';
		}
		
		
		remain_desc += d.getDate() + 
		" " + localize('m'+(d.getMonth()+1)) + 
		" " + localize('attime') + ' ' + d.getHours() + ":" + d.getMinutes();
		
		return remain_desc;
	},
	changeNavTree: function(nav_tree) {
		this.nav_tree = $filter(nav_tree, 'resident');
		this.checkNowPlayNav();
	},
	nowPlaying: function(mo) {
		this.updateState('now-playing', mo.getTitle());
		this.current_playing = mo;
		this.checkNowPlayNav();
	},
	checkNowPlayNav: debounce(function() {
		if (this.current_playing){
			this.updateState('viewing-playing', this.nav_tree.indexOf(this.current_playing) != -1);
		}
		
	}, 30),
	playing: function() {
		this.updateState('playing', true);
	},
	notPlaying: function() {
		this.updateState('playing', false);
	},
	setDocTitle: function(title) {
		this.updateState('doc-title', title);
	},
	restoreFreezed: function(transit, url_restoring){
		this.map.restoreFreezed(transit, url_restoring);
	},
	// <<<< browser map
	show_now_playing: function(no_stat){
		if (!no_stat){
			this.trackEvent('Navigation', 'now playing');
		}
		this.restoreFreezed(true);
		this.show_track_page(this.p.c_song);
		
		
	},
	showStartPage: function(url_restoring){
		//mainaly for hash url games
		this.map.startNewBrowse(url_restoring);
	},
	bindMMapStateChanges: function(md, place) {
		var _this = this;
		var navigation = this.getChild('navigation');
		var target_array = this.getChild(place) || [];

		md.on('mpl-attach', function() {
			if (navigation.indexOf(md) == -1) {
				navigation.push(md);
				_this.setChild('navigation', navigation, true);
			}
			if (place){
				if (target_array.indexOf(md) == -1){
					target_array.push(md);
					_this.setChild(place, target_array, true);
				}
			}

		});
		md.on('mpl-detach', function(){
			var new_nav = arrayExclude(navigation, md);
			if (new_nav.length != navigation.length){
				_this.setChild('navigation', new_nav, true);
			}
			if (place){
				var new_tarr = arrayExclude(target_array, md);

				if (new_tarr.length != target_array.length){
					_this.setChild(place, new_tarr, true);
				}
			}
			
		});
	},
	showResultsPage: function(query, no_navi){
		var lev;
		if (!this.search_el || !this.search_el.lev.isOpened()){
			var md = createSuInvestigation();
			this.bindMMapStateChanges(md, 'invstg');
			lev = this.map.goDeeper(false, md);
		} else {
			lev = this.search_el.lev;
		}
		
		var invstg = lev.resident;
		invstg.changeQuery(query);

	},
	showArtcardPage: function(artist, save_parents, no_navi){
		var md = new artCard(artist);
		this.bindMMapStateChanges(md, 'artcard');
		var lev = this.map.goDeeper(save_parents, md);
	},
	showStaticPlaylist: function(pl, save_parents, no_navi) {
		if (pl.lev && pl.lev.canUse() && !pl.lev.isOpened()){
			this.restoreFreezed();
		} else {
			this.show_playlist_page(pl, save_parents, no_navi);
		}
	},
	show_playlist_page: function(pl, save_parents, no_navi){
		this.bindMMapStateChanges(pl, 'playlist');
		var lev = this.map.goDeeper(save_parents, pl);
	},
	show_track_page: function(mo, no_navi){
		var _this = this,
			title = (mo.plst_titl.belongsToArtist(mo.artist) ? '' : (mo.artist + ' - '))  + mo.track;
		
		var pl = mo.plst_titl;
			pl.lev.sliceTillMe(true);
		this.bindMMapStateChanges(mo);
		var lev = this.map.goDeeper(true, mo);
	},
	preparePlaylist: function(params, first_song){
		var pl = new songsList(params, first_song, this.mp3_search, this.p);
		return pl;
	},
	// browser map >>>>>

	show_tag: function(tag, vopts, start_song){
		//save_parents, no_navi
		vopts = vopts || {};
		var full_no_navi = vopts.no_navi;
		vopts.no_navi = vopts.no_navi || !!start_song;
		
		var pl_r = this.preparePlaylist({
			title: 'Tag: ' + tag,
			type: 'artists by tag',
			data: {tag: tag}
		}, start_song);

		pl_r.setLoader(function(paging_opts) {
			
			var request_info = {};
			lfm.get('tag.getTopArtists',{
				tag:tag,
				limit: paging_opts.page_limit,
				page: paging_opts.next_page
			})
				.done(function(r){
					var artists = r.topartists.artist;
					var track_list = [];

					if (artists && artists.length) {
						var l = Math.min(artists.length, paging_opts.page_limit);
						for (var i=0; i < l; i++) {
							track_list.push({
								artist: artists[i].name
							});
						}

					}
					pl_r.injectExpectedSongs(track_list);
					if (track_list.length < paging_opts.page_limit){
						pl_r.setLoaderFinish();
					}
				})
				.fail(function() {
					pl_r.loadComplete(true);
				}).always(function() {
					request_info.done = true;
				});
			return request_info;
		}, true);


		this.show_playlist_page(pl_r, vopts.save_parents, vopts.no_navi);
		
		if (start_song){
			pl_r.showTrack(start_song, full_no_navi);
		}
	},

	showArtistPlaylist: function(artist, pl, vopts){
		vopts = vopts || {};
		var cpl = this.p.isPlaying(pl);
		if (!cpl){
			if (!vopts.from_artcard){
				this.showArtcardPage(artist, vopts.save_parents, true);
			}
			this.show_playlist_page(pl, !vopts.from_artcard || !!vopts.save_parents, vopts.no_navi);
			return false;
		} else{
			this.restoreFreezed();
			return cpl;
		}
	},
	/*
	var vopts = {
		save_parents: save_parents,
		no_navi,
		from_artcard
	}*/
	showAlbum: function(opts, vopts, start_song){
		var artist			= opts.artist, 
			name			= opts.album_name,
			id				= opts.album_id, 
			original_artist	= opts.original_artist,
			vopts = vopts || {};
		var full_no_navi = vopts.no_navi;
		vopts.no_navi = vopts.no_navi || !!start_song;
		
		var pl = this.preparePlaylist({
			title: '(' + artist + ') ' + name,
			type: 'album',
			data: {artist: original_artist || artist, album: name}
		}, start_song).loading();
	
		var recovered = this.showArtistPlaylist(original_artist || artist, pl, vopts);
		
		if (!recovered){
			var get_artist_album_playlist = function(album_id, pl_r){
				if (album_id) {
					lfm.get('playlist.fetch',{
						'playlistURL': 'lastfm://playlist/album/' + album_id
					})
						.done(function(pl_data){
							make_lastfm_playlist(pl_data, pl_r);
						});
				}
			};
			if (id){
				get_artist_album_playlist(id, pl);
			} else{
				lfm.get('album.getInfo',{'artist': artist, album : name})
					.done(function(alb_data){
						get_artist_album_playlist(alb_data.album.id, pl);
					});
			}
		}
		if (start_song){
			(recovered || pl).showTrack(start_song, vopts.no_navi);
		}
	},
	showTopTacks: function (artist, vopts, start_song) {
		vopts = vopts || {};
		var full_no_navi = vopts.no_navi;
		vopts.no_navi = vopts.no_navi || !!start_song;
		
		
		
		var pl = this.preparePlaylist({
			title: 'Top of ' + artist,
			type: 'artist',
			data: {artist: artist}
		}, start_song);
		
		var recovered = this.showArtistPlaylist(artist, pl, vopts);
		
		if (!recovered){
			pl.setLoader(function(paging_opts) {
				
				var request_info = {};
				lfm.get('artist.getTopTracks', {
					'artist': artist, 
					limit: paging_opts.page_limit, 
					page: paging_opts.next_page
				})
					.done(function(r){
						if (r.error){
							pl.loadComplete(true);
							return;
						}
						var tracks = r.toptracks.track || false;
						var track_list = [];
						if (tracks) {
							
							tracks = toRealArray(tracks);
							
							var l = Math.min(tracks.length, paging_opts.page_limit)
							for (var i=paging_opts.remainder; i < l; i++) {
								track_list.push({'artist' : artist ,
									'track': tracks[i].name, 
									images: tracks[i].image
								});
							}
							
						}
						pl.injectExpectedSongs(track_list);
						if (track_list.length < paging_opts.page_limit){
							pl.setLoaderFinish();
						}
					})
					.fail(function() {
						pl.loadComplete(true);
					})
					.always(function() {
						request_info.done = true;
					});
				return request_info;
			}, true);

		}
		if (start_song){
			(recovered || pl).showTrack(start_song, full_no_navi);
		}
	},
	showMetroChart: function(country, metro, vopts){
		vopts = vopts || {};
		var plr = this.preparePlaylist({//can autoload
			title: 'Chart of ' + metro,
			type: 'chart',
			data: {country: country, metro: metro}
		}).loading();

		lfm.get('geo.getMetroUniqueTrackChart', {
			country: country, 
			metro: metro, 
			start: new Date - 60*60*24*7
		})
			.done(function(r){
				if (r.error){
					pl_r.loadComplete(true);
					return;
				}
				if (r && r.toptracks && r.toptracks.track){
					var metro_tracks = toRealArray(r.toptracks.track);
					for (var i=0; i < Math.min(metro_tracks.length, 30); i++) {
						
						var _trm = metro_tracks[i];
						plr.push({artist: _trm.artist.name, track: _trm.name});
					};
					pl_r.loadComplete(metro_tracks.length);
				} else {
					pl_r.loadComplete(true);
				}

				
			});
		this.show_playlist_page(plr, vopts.save_parents, vopts.no_navi);
	},
	showSimilarArtists: function(artist, vopts, start_song){
		vopts = vopts || {};
		var full_no_navi = vopts.no_navi;
		vopts.no_navi = vopts.no_navi || !!start_song;
		
		var pl = this.preparePlaylist({//can autoload
			title: 'Similar to «' + artist + '» artists',
			type: 'similar artists',
			data: {artist: artist}
		}, start_song).loading();

		
		var recovered = this.showArtistPlaylist(artist, pl, vopts);
		if (!recovered){

			pl.setLoader(function(paging_opts){
				var request_info = {};
				lfm.get('artist.getSimilar',{
					artist: artist, 
					limit: paging_opts.page_limit, 
					page: paging_opts.next_page
				})
					.done(function(r){
						var artists = r.similarartists.artist;
						var track_list = [];

						if (artists && artists.length) {
							var l = Math.min(artists.length, paging_opts.page_limit);
							for (var i=0; i < l; i++) {
								track_list.push({
									artist: artists[i].name
								});
							}

						}
						pl.injectExpectedSongs(track_list);
						if (track_list.length < paging_opts.page_limit){
							pl.setLoaderFinish();
						}
					})
					.fail(function() {
						pl.loadComplete(true);
					})
					.always(function() {
						request_info.done = true;
					});
			}, true);
			
		
		}
		
		if (start_song){
			(recovered || pl).showTrack(start_song, full_no_navi);
		}
	},
	search: function(query, no_navi, new_browse){
		if (new_browse){
			this.showStartPage();
		}

		var old_v = this.start_page.state('search-query');
		if (query != old_v){
			if (!query) {
				this.showStartPage();
			} else {
				this.showResultsPage(query, no_navi);
			}

		}

	

		this.start_page.updateState('search-query', query);
		
	}

});

})();