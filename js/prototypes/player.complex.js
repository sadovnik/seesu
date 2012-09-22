var playerComplex = function(){};
playerBase.extendTo(playerComplex, {
	constructor: playerComplex,
	playNext: function(mo, auto){
		mo.playNext(auto);
	},
	playPrev: function(mo){
		mo.playPrev();
	},
	removeCurrentWantedSong: function(){
		if (this.wanted_song){
			this.wanted_song.updateState('want_to_play', false);
			delete this.wanted_song
		}
	},
	wantSong: function(mo){
		var _this = this;
		if (this.wanted_song !== mo){
			this.removeCurrentWantedSong();
			if (!this.c_song){
				if (mo.plst_titl.lev){
					mo.plst_titl.lev.freeze()
				}
			}
			(this.wanted_song = mo).updateState('want_to_play', true);
			mo.setPrio('highest');

			var opts = mo.state('files_search');
			if (opts && ((opts.complete && opts.have_tracks) || opts.have_best_tracks)){
				mo.play();
			} else {
				var filesSearch = function(opts){
					if (_this.wanted_song == mo){
						if (mo.canPlay()){
							if (opts.complete || opts.have_best_tracks){
								clearTimeout(mo.cantwait_toplay);
								mo.play()
							} else if (!mo.cantwait_toplay){
								mo.cantwait_toplay = setTimeout(function(){
									mo.play();
								}, 20000);
							}	
						}
						
					} else {
						mo.off('files_search', filesSearch);
					}
				};
				mo.on('files_search', filesSearch);
			}
			
		}
	},
	isPlaying: function(playlist, force){
		if (this.c_song){
			var pl = this.c_song && this.c_song.plst_titl;
			if (pl){
				if (playlist === pl ){
					return pl;
				} else if (force || (pl.belongsToArtist())){
					if (pl.compare(playlist)){
						return pl;
					}
				}
			}
			
		}
	},
	changeNowPlaying: function(mo){
		var last_mo = this.c_song;
		if (last_mo != mo){
			this.removeCurrentWantedSong();

			if (last_mo && last_mo.state('mp-show') && this.c_song != mo){
				mo.view()
			}
			if (last_mo){
				last_mo.stop();
				last_mo.updateState("player-song", false);
			}
			if (this.nowPlaying){
				this.nowPlaying(mo);
			}
			
			if (mo.plst_titl.lev){
				mo.plst_titl.lev.freeze()
			}
			this.c_song = mo;
			mo.updateState("player-song", true);
		}
	}
});