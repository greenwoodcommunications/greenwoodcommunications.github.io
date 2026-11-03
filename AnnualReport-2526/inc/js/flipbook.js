var __domData = new WeakMap();
var dom = {
	create: function(tag, attrs) {
		var el = document.createElement(tag);
		if (attrs) {
			Object.keys(attrs).forEach(function(k) {
				if (k === 'class') el.className = attrs[k];
				else el.setAttribute(k, attrs[k]);
			});
		}
		return el;
	},
	css: function(el, props, val) {
		if (!el) return;
		var _noPx = {opacity:1,zIndex:1,'z-index':1,fontWeight:1,'font-weight':1,lineHeight:1,'line-height':1,orphans:1,widows:1,order:1,flex:1,'flex-grow':1,'flex-shrink':1,fillOpacity:1,'fill-opacity':1,columnCount:1,'column-count':1};
		var _px = function(k, v) { return (typeof v === 'number' && !_noPx[k]) ? v + 'px' : v; };
		if (typeof props === 'string' && typeof val !== 'undefined') {
			el.style[props] = _px(props, val);
			return el;
		}
		if (typeof props === 'string') return getComputedStyle(el)[props];
		Object.keys(props).forEach(function(k) { el.style[k] = _px(k, props[k]); });
		return el;
	},
	show: function(el) {
		if (!el) return;
		if (el._domAnim) { el._domAnim.cancel(); el._domAnim = null; }
		el._domFading = 'shown';
		el.style.display = '';
		if (getComputedStyle(el).display === 'none') el.style.display = 'block';
		el.style.opacity = '';
	},
	hide: function(el) {
		if (!el) return;
		if (el._domAnim) { el._domAnim.cancel(); el._domAnim = null; }
		el._domFading = 'hidden';
		el.style.display = 'none';
		el.style.opacity = '';
	},
	fadeIn: function(el, duration, callback) {
		if (!el) return;
		if (el._domFading === 'in' || el._domFading === 'shown') { if (callback) callback(); return; }
		if (el._domAnim) el._domAnim.cancel();
		el._domFading = 'in';
		el._domAnim = null;
		el.style.display = '';
		if (getComputedStyle(el).display === 'none') el.style.display = 'block';
		el.style.opacity = '0';
		if (typeof el.animate === 'function') {
			var anim = el.animate([{opacity: 0}, {opacity: 1}], {duration: duration || 200, fill: 'forwards'});
			el._domAnim = anim;
			anim.onfinish = function() { el._domFading = 'shown'; el._domAnim = null; el.style.opacity = '1'; if (callback) callback(); };
		} else {
			el.style.opacity = '1';
			el._domFading = 'shown';
			if (callback) callback();
		}
	},
	fadeOut: function(el, duration, callback) {
		if (!el) return;
		if (el._domFading === 'out' || el._domFading === 'hidden') { if (callback) callback(); return; }
		if (el._domAnim) el._domAnim.cancel();
		el._domFading = 'out';
		el._domAnim = null;
		if (typeof el.animate === 'function') {
			var anim = el.animate([{opacity: 1}, {opacity: 0}], {duration: duration || 200, fill: 'forwards'});
			el._domAnim = anim;
			anim.onfinish = function() { el.style.display = 'none'; el._domFading = 'hidden'; el._domAnim = null; el.style.opacity = ''; if (callback) callback(); };
		} else {
			el.style.display = 'none';
			el._domFading = 'hidden';
			el.style.opacity = '';
			if (callback) callback();
		}
	},
	data: function(el, key, val) {
		if (!el) return;
		var store = __domData.get(el) || {};
		if (typeof val !== 'undefined') { store[key] = val; __domData.set(el, store); return; }
		if (typeof key === 'undefined') {
			var result = {};
			if (el.dataset) {
				for (var k in el.dataset) { if (el.dataset.hasOwnProperty(k)) result[k] = el.dataset[k]; }
			}
			for (var s in store) { if (store.hasOwnProperty(s)) result[s] = store[s]; }
			return result;
		}
		if (key in store) return store[key];
		var attr = el.getAttribute('data-' + key.replace(/([A-Z])/g, '-$1').toLowerCase());
		return attr;
	},
	offset: function(el) {
		var rect = el.getBoundingClientRect();
		return { top: rect.top + window.scrollY, left: rect.left + window.scrollX };
	},
	fromHTML: function(html) {
		var temp = document.createElement('div');
		temp.innerHTML = html.trim();
		return temp.firstElementChild;
	},
	on: function(parent, event, selector, handler) {
		var bubbleEvent = event;
		if (event === 'mouseenter') bubbleEvent = 'mouseover';
		else if (event === 'mouseleave') bubbleEvent = 'mouseout';
		parent.addEventListener(bubbleEvent, function(e) {
			var target = e.target.closest(selector);
			if (target && parent.contains(target)) {
				if (event === 'mouseenter' || event === 'mouseleave') {
					var related = e.relatedTarget;
					if (related && target.contains(related)) return;
				}
				handler.call(target, e);
			}
		});
	}
};

function Deferred() {
	var _resolve, _reject, _state = 'pending', _value;
	var p = new Promise(function(resolve, reject) { _resolve = resolve; _reject = reject; });
	p.resolve = function(val) { _state = 'resolved'; _value = val; _resolve(val); return p; };
	p.reject = function(val) { _state = 'rejected'; _reject(val); return p; };
	p.state = function() { return _state; };
	p.done = function(fn) { p.then(fn); return p; };
	p.fail = function(fn) { p.catch(fn); return p; };
	p.always = function(fn) { p.finally(fn); return p; };
	p.promise = function() { return p; };
	return p;
}


// window.initFlipbook is defined inside the main IIFE where pageflipInit is in scope

(function() {
	var FlipbookTooltips = function(options) {
		var config = {};
		Object.assign(config, this.config, options);
		this.config = config;
		var _self = this;
		if (typeof this.config.el === 'string') {
			dom.on(document, 'mouseenter', this.config.el, function(e) { e.data = _self; _self.events.show.call(this, e); });
			dom.on(document, 'mouseleave', this.config.el, function(e) { e.data = _self; _self.events.hide.call(this, e); });
		} else if (this.config.el instanceof HTMLElement) {
			this.config.el.addEventListener('mouseenter', function(e) { e.data = _self; _self.events.show.call(this, e); });
			this.config.el.addEventListener('mouseleave', function(e) { e.data = _self; _self.events.hide.call(this, e); });
		}
	};

	FlipbookTooltips.prototype.config = {
		orientation: 'top',
		background: 'blue',
		color: 'white',
		speed: 0,
		margin: 0,
		fixedY: null,
		text: false
	};

	FlipbookTooltips.prototype.events = {
		show: function(e) {
			var self = this;
			var text = dom.data(this, 'tooltip') ? dom.data(this, 'tooltip') : e.data.config.text;
			var toolbarHidden = dom.data(this, 'tooltip-hidden') === true;
			if (text && !toolbarHidden) {
				var config = e.data.config;
				var tooltip = makeTooltip(text, config);

			tooltip.style.opacity = '0';
			tooltip.style.display = 'block';
			document.body.append(tooltip);
			var elRect = this.getBoundingClientRect();
			var tooltipH = tooltip.offsetHeight;
			var left = parseInt(tooltip.offsetWidth / 2, 10) - parseInt(elRect.width / 2, 10);
				var alignMethods = {
					top: function() {
						var x = elRect.left - left;
						var y = config.fixedY ? (config.fixedY() - config.margin) : (elRect.top - tooltipH - config.margin);
						dom.css(tooltip, 'transform', translate(x, y));
					},
					bottom: function() {
						var x = elRect.left - left;
						var y = config.fixedY ? (config.fixedY() + elRect.height + config.margin) : (elRect.top + elRect.height + config.margin);
						dom.css(tooltip, 'transform', translate(x, y));
					}
				};

				alignMethods[config.orientation]();

				dom.fadeIn(tooltip, config.speed);
			}
		},
		hide: function(e) {
			var tc = document.querySelector('.tooltip-container');
			if (tc) tc.remove();
		}
	};

	var makeTooltip = function(message, config) {
		var container = dom.create('div', {'class': 'tooltip-container'});
		var border = dom.create('div', {'class': 'tooltip'});
		var text = dom.create('div', {'class': 'tooltip-text'});
		var triangle = dom.create('div', {'class': 'tooltip-triangle-' + config.orientation});

		dom.css(triangle, 'border-' + config.orientation + '-color', config.background);
		dom.css(text, 'background-color', config.background);
		dom.css(text, 'color', config.color);

		text.innerHTML = message;
		border.append(text);
		border.append(triangle);
		container.append(border);
		return container;
	};

	var translate = function(x, y) {
		return 'translate(' + x + 'px, ' + y + 'px)';
	};

	window.FlipbookTooltips = FlipbookTooltips;
})();

window.FlipbookCursorManager = function(options, flipBookAPI) {
	var cursorColor = options.cursorColor;
	var incDirPath = options.incDirPath;
	var cursorUrls = {
		zoomin: incDirPath + 'inc/img/controlbar/zoomin.cur',
		zoomout: incDirPath + 'inc/img/controlbar/zoomout.cur'
	};

	this.setCursor = function($elements, cursorName) {
		var els = [];
		if ($elements instanceof NodeList || $elements instanceof HTMLCollection) {
			els = [].slice.call($elements);
		} else if ($elements instanceof HTMLElement) {
			els = [$elements];
		}
		els.forEach(function($element) {
			switch (cursorName) {
			case 'zoomin':
			case 'zoomout':
				if (dom.data($element, 'cursor') !== cursorName) {
					dom.data($element, 'cursor', cursorName);
					dom.css($element, 'cursor', 'url(\'' + cursorUrls[cursorName] + '\'), auto');
				}
				break;
			default:
				if (dom.data($element, 'cursor') !== 'auto') {
					dom.css($element, 'cursor', 'auto');
					dom.data($element, 'cursor', 'auto');
				}
				break;
			}
		});
	};

	var init = function() {
		var preloadCursor = function(url) {
			var preloadDiv = dom.create('div');
			dom.css(preloadDiv, {
				position: 'absolute',
				width: '0px',
				height: '1px',
				cursor: 'url(\'' + url + '\'), auto'
			});
			document.body.appendChild(preloadDiv);
		};
		Object.keys(cursorUrls).forEach(function(cursorName) {
			preloadCursor(cursorUrls[cursorName]);
		});
	};

	init();
};


(function() {
	window.FlipbookUrl = function(parameters, flipBookAPI) {
		var that = this;
		var currentPageInUrl;
		var singlePageMode = parameters.singlePageMode;

		this.getPageNumberFromUrl = function() {
			if (typeof currentPageInUrl === 'undefined') {
				var urlSearch = window.location.search;
				var pageNumber;
				if (typeof urlSearch === 'string' && urlSearch.length > 0) {
					var regexp = /page=([^&]*)/g;
					var match = regexp.exec(urlSearch);
					if (Array.isArray(match) && match.length > 1) {
						var pageStr = match[1];
						var pageInt = parseInt(pageStr, 10);
						if (!isNaN(parseFloat(pageInt)) && isFinite(pageInt)) {
							pageNumber = validatePageNumber(pageInt);
						}
					}
				}
				if (typeof pageNumber === 'undefined') {
					pageNumber = flipBookAPI.getFirstPageNumber();
				}
				currentPageInUrl = pageNumber;
			}

			return currentPageInUrl;
		};

		this.updateUrl = function(navPagerStr) {
			var navPagerStrSplit = navPagerStr.split('-');
			var pageStr = navPagerStrSplit[0];
			var baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
			var queryParams = new URLSearchParams(window.location.search);
			var utm_items = ['utm_campaign', 'utm_medium', 'utm_term', 'utm_source'];
            var utm_values = {};
            utm_items.forEach(function (item) {
                if (queryParams.has(item)) {
                    utm_values[item] = queryParams.get(item);
                }
            });
            var queryString = new URLSearchParams(utm_values).toString();
            if (queryString.length > 0) {
                queryString = "&" + queryString;
            }
			var pageInt = parseInt(pageStr, 10);
			if (window.history && typeof window.history.pushState === 'function' && !isNaN(parseFloat(pageInt)) && isFinite(pageInt)) {
				if (location.protocol === 'http:' || location.protocol === 'https:') {
					if (currentPageInUrl != pageInt) {
						window.history.pushState({pagenum: pageInt}, '', baseUrl + '?page=' + pageInt + queryString);
						currentPageInUrl = pageInt;
					} else {
						window.history.replaceState({pagenum: pageInt}, '', baseUrl + '?page=' + pageInt + queryString);
					}
				}
			}
		};

		var validatePageNumber = function(pageNumber) {
			var firstPageNumber = flipBookAPI.getFirstPageNumber();
			var lastPageNumber = flipBookAPI.getLastPageNumber();
			if (pageNumber < firstPageNumber) {
				pageNumber = firstPageNumber;
			} else if (pageNumber > lastPageNumber) {
				pageNumber = lastPageNumber;
			}
			if (!singlePageMode && pageNumber > 1) {
				pageNumber = pageNumber - pageNumber % 2;
			}
			return pageNumber;
		};

		var init = function() {
			window.addEventListener('popstate', function(event, data) {
				if (window.history.state && window.history.state.pagenum) {
					var prevPageNumber = validatePageNumber(window.history.state.pagenum);
					if (prevPageNumber) {
						currentPageInUrl = prevPageNumber;
						flipBookAPI.gotoPageNumber(prevPageNumber, true);
					}
				}
			});
		};

		init();
	};
})();

(function() {
	var Fading = function(options) {
		var config = {};
		Object.assign(config, {delayBlinkTime: 100, blinkTime: 300, background: 'blue'}, options);
		this.config = config;
		this.data = {pageOpenTimestamp: null, blinkTimestamp: null, status: null};
		var _self = this;
		dom.on(document, 'mouseenter', this.config.el, function() {
			dom.css(this, 'opacity', 0.5);
			dom.css(this, 'background', _self.config.background);
		});
		dom.on(document, 'mouseleave', this.config.el, function() {
			dom.css(this, 'background', 'transparent');
		});
	};

	Fading.prototype._cssAll = function(prop, val) {
		document.querySelectorAll(this.config.el).forEach(function(el) {
			dom.css(el, prop, val);
		});
	};

	Fading.prototype._blinkStart = function() {
        if (this.data.status === 'waiting') {
            var timeDiff = new Date() - this.data.pageOpenTimestamp;
            if (timeDiff >= this.config.blinkTime) {
                this.data.status = 'process';
                this.data.blinkTimestamp = new Date();
                this._cssAll('background', this.config.background);
            }
        }
	};

	Fading.prototype._blinkEnd = function() {
        if (this.data.status === 'process') {
            var timeDiff = new Date() - this.data.blinkTimestamp;
            if (timeDiff >= this.config.blinkTime) {
                this.data.status = 'done';
                this._cssAll('background', 'transparent');
            }
        }
	};

	Fading.prototype.blink = function() {
	    if (!this.data.status || this.data.status === 'done')
        this.data.pageOpenTimestamp = new Date();
        this.data.status = 'waiting';
    };

	Fading.prototype.OEF = function() {
		if (this.data.status && this.data.status !== 'done') {
            this._blinkStart();
            this._blinkEnd();
        }
	};

	window.FlipbookLinksFading = Fading;
})();



window.makeObjectObservable = function(object) {
	if (typeof object === 'object') {
		var eventHandlers = {};
		object.addEventHandler = function(eventName, eventHandler) {
			if (!Array.isArray(eventHandlers[eventName])) {
				eventHandlers[eventName] = [];
			}
			eventHandlers[eventName].push(eventHandler);
		};
		object._emitEvent = function(eventName, eventData) {
			if (Array.isArray(eventHandlers[eventName])) {
				eventHandlers[eventName].forEach(function(callback, _) {
					callback(eventData);
				});
			};
		};
	}
};

(function() {
	var largeIcon = 50;
	var smallIcon = 26;
	var indent = 10;
	var animationDuration = 200;
	window.NavigationArrowsManager = function(flipBookAPI, parameters, customColors) {
		var that = this;
		var navigationButtonsTemplate;
		var $navigationButtons;
		var $prevButton;
		var $nextButton;
		var $firstButton;
		var $lastButton;
		var areAllArrowsShown = true;

		var coordinates;

		this.init = function() {
			navigationButtonsTemplate = document.getElementById('Template-navigationButtons').innerHTML;
			$navigationButtons = dom.create('div');
			$navigationButtons.innerHTML = navigationButtonsTemplate;
			$prevButton = $navigationButtons.querySelector('#b-prev');
			$nextButton = $navigationButtons.querySelector('#b-next');
			$firstButton = $navigationButtons.querySelector('#b-first');
		$lastButton = $navigationButtons.querySelector('#b-last');
		[$prevButton, $nextButton, $firstButton, $lastButton].forEach(function(btn) {
			dom.css(btn, 'cursor', 'pointer');
		});
		initColors();
			initEventHandlers();
			var stage = document.getElementById('pf-stage');
			stage.prepend($navigationButtons);
		};

		this.setPosition = function(BS) {
			var StageWidth = flipBookAPI.getStageWidth();
			var StageHeight = flipBookAPI.getStageHeight();
			var margin = flipBookAPI.getMargin();
			var bookWidth = flipBookAPI.getBookWidth();
			var bookHeight = flipBookAPI.getBookHeight();
			var controlbarHeight = flipBookAPI.getControlbarHeight();

			var maxW = StageWidth;
			var maxY = StageHeight - margin * 2 - controlbarHeight;
			var offsetX = (maxW - bookWidth * BS) / 2;
			var offsetY = (maxY - bookHeight * BS) / 2 + margin;
			var realH = BS * bookHeight;
			var realW = BS * bookWidth;

			coordinates = {
				prev: {
					left: offsetX - largeIcon - indent,
					top: offsetY + realH / 2 - largeIcon / 2
				},
				first: {
					left: offsetX - smallIcon - indent - 8,
					top: offsetY + realH - smallIcon
				},
				next: {
					left: offsetX + realW + indent,
					top: offsetY + realH / 2 - largeIcon / 2
				},
				last: {
					left: offsetX + realW + indent + 8,
					top: offsetY + realH - smallIcon
				}
			};
			setTranslate3d($prevButton, coordinates.prev);
			setTranslate3d($nextButton, coordinates.next);
			setTranslate3d($firstButton, coordinates.first);
			setTranslate3d($lastButton, coordinates.last);
		};

		this.shift = function(x, y) {
			if (typeof coordinates === 'undefined') return;

			var pn = flipBookAPI.getPN();
			var bookWidth = flipBookAPI.getBookWidth();
			var bookScale = flipBookAPI.getBookScale();
			var singlePageMode = parameters.SinglePageMode;
			var lastPageNumber = flipBookAPI.getLastPageNumber();
			var _offsetX = singlePageMode ? 0 : x * bookScale;

			[['prev', $prevButton], ['first', $firstButton], ['next', $nextButton], ['last', $lastButton]].forEach(function(val) {
				setTranslate3d(val[1], coordinates[val[0]].left + _offsetX, coordinates[val[0]].top);
			});

			if (!areAllArrowsShown) return;

			var showPrev = true;
			var showNext = true;

			if (pn === 0) showPrev = false;
			if (pn >= lastPageNumber - 1) showNext = false;

			if (showPrev) {
				dom.fadeIn($prevButton, animationDuration);
				dom.fadeIn($firstButton, animationDuration);
			} else {
				dom.fadeOut($prevButton, animationDuration);
				dom.fadeOut($firstButton, animationDuration);
			}
			if (showNext) {
				dom.fadeIn($nextButton, animationDuration);
				dom.fadeIn($lastButton, animationDuration);
			} else {
				dom.fadeOut($nextButton, animationDuration);
				dom.fadeOut($lastButton, animationDuration);
			}
		};

		this.toggle = function(show) {
			if (show) {
				dom.show($navigationButtons);
				var pn = flipBookAPI.getPN();
				var lastPageNumber = flipBookAPI.getLastPageNumber();

				if (pn === 0) {
					dom.hide($prevButton);
					dom.hide($firstButton);
					dom.fadeIn($nextButton, animationDuration);
					dom.fadeIn($lastButton, animationDuration);
				} else if (pn === lastPageNumber - 1) {
					dom.hide($nextButton);
					dom.hide($lastButton);
					dom.fadeIn($prevButton, animationDuration);
					dom.fadeIn($firstButton, animationDuration);
				} else {
					dom.fadeIn($prevButton, animationDuration);
					dom.fadeIn($firstButton, animationDuration);
					dom.fadeIn($nextButton, animationDuration);
					dom.fadeIn($lastButton, animationDuration);
				}
				areAllArrowsShown = true;
			} else {
				dom.hide($navigationButtons);
				[$prevButton, $nextButton, $firstButton, $lastButton].forEach(function(btn) {
					if (btn._domAnim) { btn._domAnim.cancel(); btn._domAnim = null; }
					btn._domFading = null;
					btn.style.opacity = '';
				});
				areAllArrowsShown = false;
			}
		};

		var initEventHandlers = function() {
			$prevButton.addEventListener('click', function(event) {
				event.preventDefault();
				flipBookAPI.gotoPrevPage(true);
			});
			$nextButton.addEventListener('click', function(event) {
				event.preventDefault();
				flipBookAPI.gotoNextPage(true);
			});
			$firstButton.addEventListener('click', function(event) {
				event.preventDefault();
				flipBookAPI.gotoFirstPage(true);
			});
			$lastButton.addEventListener('click', function(event) {
				event.preventDefault();
				flipBookAPI.gotoLastPage(true);
			});
		};

		var initColors = function() {
			if (typeof customColors.color === 'string') {
				$navigationButtons.querySelectorAll('g').forEach(function(g) { dom.css(g, 'fill', customColors.color); });
			}
			if (typeof customColors.hoverColor === 'string' && !flipBookAPI.getIsTouchDevice()) {
				var onEvent = 'mouseenter';
				var offEvent = 'mouseleave';
				[].slice.call($navigationButtons.children).forEach(function(btn) {
					btn.addEventListener(onEvent, function() {
						[].slice.call(this.querySelectorAll('g')).forEach(function(_el) { dom.css(_el, 'fill', customColors.hoverColor); });
					});
					btn.addEventListener(offEvent, function() {
						[].slice.call(this.querySelectorAll('g')).forEach(function(_el) { dom.css(_el, 'fill', customColors.color); });
					});
				});
			}
		};

		var setTranslate3d = function($obj, x, y) {
			if (typeof x === 'undefined' || typeof y === 'undefined') {
				y = x.top;
				x = x.left;
			}
			dom.css($obj, {
				transform: 'translate(' + Math.round(x) + 'px, ' + Math.round(y) + 'px)'
			});
		};

		this.init();
	};
	window.NavigationArrowsManager.getSize = function() {
		return indent + largeIcon;
	};
})();

window.AudioPlayer = function(audioSources) {
	var audioObjects = {};
	var defaultVolume = 1.0;

	this.init = function() {
		if (audioSources) {
			Object.keys(audioSources).forEach(function(audioFileName) {
				var audioFileInfo = audioSources[audioFileName];
				if (typeof audioFileInfo !== 'undefined' && typeof audioFileInfo.src === 'string') {
					var audio = new Audio();
					audio.src = audioFileInfo.src;
					audio.preload = 'auto';
					audio.loop = false;
					if (typeof audioFileInfo.volume === 'number') {
						audio.volume = audioFileInfo.volume;
					} else {
						audio.volume = defaultVolume;
					}
					audioObjects[audioFileName] = audio;
				}
			});
		}
	};

	this.playSound = function(audioFileName) {
		if (typeof audioObjects[audioFileName] !== 'undefined') {
			if (!audioObjects[audioFileName].paused) {
				audioObjects[audioFileName].pause();
				audioObjects[audioFileName].currentTime = 0;
			}
			audioObjects[audioFileName].play();
		}
	};

	this.init();
};

//Object for class-related things
window.VideoManager = function(flipBookAPI) {
	var restoreVideosOnPage = function() {
		var pn = flipBookAPI.getCurrentPageNumber();
		initPage(pn);
		initPage(pn + 1);
	};

	this.init = function() {
		flipBookAPI.addEventHandler('onShow', initPage);
		flipBookAPI.addEventHandler('onFlip', removeVideosFromPage);
		flipBookAPI.addEventHandler('onFlipEnd', restoreVideosOnPage);
	};

	var removeVideosFromPage = function() {
		var hadIframes = document.querySelectorAll('.video-iframe').length > 0;
		document.querySelectorAll('.video-iframe').forEach(function(el) { el.remove(); });
		if (hadIframes) {
			var book = document.getElementById('pf-book');
			if (book) {
				var overlay = document.createElement('div');
				overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:9999;pointer-events:none;opacity:0.01;transition:opacity 0.1s';
				book.appendChild(overlay);
				void overlay.offsetHeight;
				overlay.style.opacity = '0';
				setTimeout(function() { overlay.remove(); }, 150);
			}
		}
	};

	var initPage = function(pageNumber) {
		var page = document.getElementById('page' + pageNumber);
		if (!page) return;

		[].slice.call(page.querySelectorAll('.youtube-player')).forEach(function($player) {
			if ($player.querySelector('.video-iframe')) return;
			var w = parseInt(dom.data($player, 'width'));
			var h = parseInt(dom.data($player, 'height'));
			dom.css($player.parentElement, {
				width: w,
				height: h,
				top: parseInt(dom.data($player, "top")),
				left: parseInt(dom.data($player, "left"))
			});
			youtubeIframe($player, dom.data($player, 'id'));
		});

		[].slice.call(page.querySelectorAll('.vimeo-player')).forEach(function($player) {
			var id = String(dom.data($player, 'id') || '');
			if (!id || $player.querySelector('.video-iframe')) return;
			var vw = parseInt(dom.data($player, 'width'));
			var vh = parseInt(dom.data($player, 'height'));
			dom.css($player.parentElement, {
				width: vw,
				height: vh,
				top: parseInt(dom.data($player, "top")),
				left: parseInt(dom.data($player, "left"))
			});
			vimeoIframe($player, id);
		});
	};

	var youtubeIframe = function($container, id) {
		var w = parseInt(dom.data($container, 'width'));
		var h = parseInt(dom.data($container, 'height'));
		var src = 'https://www.youtube.com/embed/' + encodeURIComponent(id) + '?playsinline=1&rel=0&modestbranding=1';
		var $iframe = dom.create('iframe', {
			'class': 'video-iframe',
			src: src,
			width: w,
			height: h,
			frameborder: '0',
			allow: 'autoplay; encrypted-media; fullscreen; picture-in-picture',
			allowfullscreen: 'allowfullscreen',
			referrerpolicy: 'strict-origin-when-cross-origin'
		});
		dom.css($iframe, { border: 0 });
		$container.appendChild($iframe);
	};

	var vimeoIframe = function($container, id) {
		if ($container.querySelector('.video-iframe')) return;
		var w = parseInt(dom.data($container, 'width'));
		var h = parseInt(dom.data($container, 'height'));
		var src = 'https://player.vimeo.com/video/' + encodeURIComponent(id) + '?playsinline=1&muted=0&title=0&byline=0&portrait=0&dnt=1';
		var $iframe = dom.create('iframe', {
			'class': 'video-iframe',
			src: src,
			width: w,
			height: h,
			frameborder: '0',
			allow: 'autoplay; fullscreen; picture-in-picture',
			allowfullscreen: 'allowfullscreen',
			referrerpolicy: 'strict-origin-when-cross-origin'
		});
		dom.css($iframe, { border: 0 });
		$container.appendChild($iframe);
	};

	this.init();
};

//Object for searching-related things
//TODO: Move everything related to searching here
window.SearchManager = function(flipBookAPI, config, $controlbarContent) {
	var snippetLength = 65;
	var that = this;
	var originalPageInfoList = flipBookAPI.getPageInfoList();

	var pageInfoList;

	this.init = function() {
	};

	/**
	 * Perform searching
	 */
	this.search = function(searchString, searchHighlightClassName) {
		if (typeof pageInfoList === 'undefined') {
			initPageInfoList();
		}
		var searchResultsList = [];
		pageInfoList.forEach(function(pageInfoObject, _) {
			var innerText = pageInfoObject.innerText;
			var substringPositions = findAllIndices(innerText, searchString);
			var searchResultsOnPageList = [];
			substringPositions.forEach(function(substringPosition, _) {
				var snippet = '';
				//Snippet generation
				var snippetContextLength = snippetLength - searchString.length; //Length of our snippet(which we will display in sarch result)
				var leftContentSnippetStartIdx; //start idx of the snippet text that is on the left on the found substring
				var rightContentSnippetEndIdx; //end idx of the snippet text that is on the right on the found substring
				if (snippetContextLength > 6) {
					var snippetContextSideLength = Math.floor((snippetContextLength - 6) / 2); //Length of the one side of the snippet(before the substring and after the substring)
					var fullLeftContentLength = substringPosition; //length of the text that is on the left of the found substring
					var fullRightContentLength = innerText.length - searchString.length - substringPosition; //length of the text that is on the right of the found substring

					var putLeftDots;
					var putRightDots;
					var charactersToBorrow;

					var leftSideHasEnoughChars = fullLeftContentLength > snippetContextSideLength; //length on the left on the found substring is enough for snippet
					var rightSideHasEnoughChars = fullRightContentLength > snippetContextSideLength; //length on the right on the found substring is enough for snippet

					if (leftSideHasEnoughChars && rightSideHasEnoughChars) { //length on the left and right is enough
						leftContentSnippetStartIdx = substringPosition - snippetContextSideLength;
						rightContentSnippetEndIdx = substringPosition - 1 + searchString.length + snippetContextSideLength;
						putLeftDots = true;
						putRightDots = true;
					} else if (leftSideHasEnoughChars && !rightSideHasEnoughChars) { //length on the left is enough, on the right - not
						rightContentSnippetEndIdx = innerText.length - 1; //grab all leftover right-side text
						charactersToBorrow = snippetContextSideLength - fullRightContentLength; //characters to 'borrow' from the left side
						if (charactersToBorrow + snippetContextSideLength < fullLeftContentLength) { //if left side does have enough characters to borrow
							leftContentSnippetStartIdx = substringPosition - snippetContextSideLength - charactersToBorrow; //take characters we need
						} else {
							leftContentSnippetStartIdx = 0; //Take the whole left side, if it doesn't have
						}
						putLeftDots = true;
						putRightDots = false;
					} else if (rightSideHasEnoughChars && !leftSideHasEnoughChars) { //length on the right is enough, on the left - not
						leftContentSnippetStartIdx = 0; //grab all leftover left-side text
						charactersToBorrow = snippetContextSideLength - fullLeftContentLength; //characters to 'borrow' from the right side
						if (charactersToBorrow + snippetContextSideLength < fullRightContentLength) { //if right side does have enough characters to borrow
							rightContentSnippetEndIdx = substringPosition + searchString.length - 1 + snippetContextSideLength + charactersToBorrow; //take characters we need
						} else {
							rightContentSnippetEndIdx = innerText.length - 1; //Take the whole right side, if it doesn't have
						}
						putLeftDots = false;
						putRightDots = true;
					} else { //lengths on the both sides aren't big enough - take the whole pagetext
						leftContentSnippetStartIdx = 0;
						rightContentSnippetEndIdx = innerText.length - 1;
						putLeftDots = false;
						putRightDots = false;
					}

					if (leftContentSnippetStartIdx < 0) { //this should never happen, don't rely on these two ifs. If it fits one of them - fix algo above
						leftContentSnippetStartIdx = 0;
					}
					if (rightContentSnippetEndIdx > innerText.length - 1) { //this should never happen too
						rightContentSnippetEndIdx = innerText.length - 1;
					}
					var snippetPlainText = innerText.substring(leftContentSnippetStartIdx, rightContentSnippetEndIdx + 1);
					snippet = snippetPlainText.replace(new RegExp('(' + searchString + ')', 'gi'), '<div class=\'SearchResult-highlight\'>$1</div>');
					if (putLeftDots) {
						snippet = '...' + snippet;
					}
					if (putRightDots) {
						snippet += '...';
					}
				} else {
					snippet = '...<div class=\'' + searchHighlightClassName + '\'>' + searchString + '</div>...'; //substring is as long as a snippet limit length - just take substring without context
					leftContentSnippetStartIdx = 0;
					rightContentSnippetEndIdx = innerText.length - 1;
				}

				//If this snippet overlaps with another snippet - don't return it
				var isOverlapping = false;
				searchResultsOnPageList.forEach(function(searchResult, _) { //Checking overlapping
					var leftIdx = searchResult.snippetPositionLeftIdx;
					var rightIdx = searchResult.snippetPositionRightIdx;
					if (substringPosition >= leftIdx && substringPosition + searchString.length - 1 <= rightIdx) {
						isOverlapping = true;
					}
				});
				if (!isOverlapping) {
					searchResultsOnPageList.push({
						pageInfoObject: pageInfoObject,
						snippet: snippet,
						snippetPositionLeftIdx: leftContentSnippetStartIdx,
						snippetPositionRightIdx: rightContentSnippetEndIdx
					});
				}
			});
			searchResultsList = searchResultsList.concat(searchResultsOnPageList); //merge search results from one page with search results from different pages
		});
		return searchResultsList;
	};

	/**
	 * Load pages content for easier searching to pageInfoList
	 */
	var initPageInfoList = function() {
		pageInfoList = [];
		if (typeof window.flipbookSettings.content !== 'undefined') {
			var pagesContent = window.flipbookSettings.content;
			originalPageInfoList.forEach(function(pageObject, pageIdx) {
				if (typeof pageObject.__ThumbnailImageUrl === 'string') {
					if (typeof pageObject.__PageNumber !== 'undefined' && pageObject.__PageNumber > 0) {
						var pageNumber = pageObject.__PageNumber;
						if (typeof pagesContent[pageNumber] !== 'undefined') {
							var innerText = pagesContent[pageNumber].replace(/\s+/g, ' ').trim();
							var pageInfo = {
								pageNumber: pageNumber,
								innerText: innerText,
								thumbnail: pageObject.__ThumbnailImageUrl
							};
							pageInfoList.push(pageInfo);
						}
					}
				}
			});
		}
	};

	/**
	 * Find all positions of substring in string
	 */
	var findAllIndices = function(string, substring) {
		var indices = [];
		if (typeof string === 'string' && string.length > 0) {
			if (typeof substring === 'string' && substring.length > 0) {
				var lowerCasedString = string.toLowerCase();
				var lowerCasedSubstring = substring.toLowerCase();
				var pos = lowerCasedString.indexOf(lowerCasedSubstring);
				while (pos !== -1 && indices.length < 1000) {
					indices.push(pos);
					pos = lowerCasedString.indexOf(lowerCasedSubstring, pos + 1);
				}
			}
		}
		return indices;
	};

	this.init();
};


window.SearchScreenManager = function(flipBookAPI, config, searchManager) {
	var that = this;
	var searchResultHeight = 168;
	var searchResultsOnScreenNumber;

	var $searchScreenResultTemplate;
	var $searchScreen;
	var $searchScreenContentTransparent;
	var $searchScreenCloseButton;
	var $searchScreenInput;
	var $searchScreenResultsContent;
	var $searchScreenResultsBackground;
	var $searchScreenScrollingContainer;
	var $body = document.body;

	var searchScreenActive = false;
	var currentSearchResultsList = [];
	var currentLastShownResultIdx = 0;
	var paddingTopBottom;

	/**
	 * Initialize searchscreen elements/colors
	 */
	this.init = function() {
		$searchScreen = dom.fromHTML(document.getElementById('Template-searchScreen').innerHTML);
		$searchScreenCloseButton = $searchScreen.querySelector('.SearchScreen-closeButton');
		var $searchScreenSearchButton = $searchScreen.querySelector('.SearchScreen-searchButton');
		$searchScreenResultTemplate = dom.fromHTML(document.getElementById('Template-searchScreenRes').innerHTML);
		$searchScreenInput = $searchScreen.querySelector('.SearchScreen-inputField');
		$searchScreenResultsContent = $searchScreen.querySelector('.SearchScreen-resultsOpaqueContent');
		$searchScreenResultsBackground = $searchScreen.querySelector('.SearchScreen-resultsBackground');
		$searchScreenContentTransparent = $searchScreen.querySelector('.SearchScreen-contentTransparent');

		$searchScreenInput.addEventListener('keypress', function(event) {
			if (event.which === 13 || event.keyCode === 13) {
				onScreenInput(event);
				$searchScreenInput.blur();
				event.preventDefault();
			}
		});
		$searchScreenSearchButton.addEventListener('click', function(event) {
			onScreenInput({ target: $searchScreenInput });
			$searchScreenInput.blur();
			event.preventDefault();
		});
		$searchScreenCloseButton.querySelector('.SearchScreen-closeButtonImg').addEventListener('click', function(event) {
			that.closeSearchScreen();
			event.preventDefault();
		});

		dom.css($searchScreenResultsBackground, 'background-color', config.searchResultsBackground);
		dom.css($searchScreenContentTransparent, 'background-color', config.searchScreenBackground);
		dom.css($searchScreenResultsBackground, {
			'background-color': config.searchResultsBackground
		});
		dom.css($searchScreenResultsContent, 'color', config.searchResultsText);
		dom.css($searchScreenCloseButton.querySelector('svg'), 'color', config.color1);
		if ($searchScreenSearchButton) dom.css($searchScreenSearchButton.querySelector('svg'), 'color', config.color1);
		dom.css($searchScreenResultsContent, 'color', config.searchResultsText);
		$searchScreenScrollingContainer = $searchScreenResultsContent.parentElement;
		$searchScreenScrollingContainer.addEventListener('scroll', onScroll);

		$searchScreen.addEventListener('click', function(event) {
			if (event.target === $searchScreen) {
				that.closeSearchScreen();
			}
		});
	};

	/**
	 * Open search screen for mobile devices
	 */
	this.openSearchScreen = function() {
		if (!searchScreenActive) {
			var appendTarget = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || $body;
			appendTarget.append($searchScreen);
			searchResultsOnScreenNumber = Math.ceil($searchScreenResultsContent.offsetHeight / searchResultHeight);
			$searchScreenResultsContent.innerHTML = '';
			$searchScreenInput.value = '';
			currentLastShownResultIdx = 0;
			$searchScreenInput.focus();
			searchScreenActive = true;
		}
	};

	/**
	 * Close search screen
	 */
	this.closeSearchScreen = function() {
		if (searchScreenActive) {
			$searchScreen.remove();
			searchScreenActive = false;
		}
	};

	/**
	 * On .SearchScreen-inputField input event
	 */
	var onScreenInput = function(event) {
		var searchString = event.target.value;
		$searchScreenResultsContent.innerHTML = '';
		currentLastShownResultIdx = 0;
		if (searchString.length > 2) {
			currentSearchResultsList = searchManager.search(searchString, 'SearchScreenRes-highlight');
			if (currentSearchResultsList.length === 0) {
				var $noResults = document.createElement('div');
				$noResults.style.cssText = 'text-align:center;padding:40px 20px;font-size:15px;color:' + config.searchResultsText + ';';
				$noResults.textContent = 'No results found. Try a different search.';
				$searchScreenResultsContent.append($noResults);
			} else {
				onScroll();
			}
		}
	};

	var applyColorsToSearchResult = function($searchResult, isLast) {
		if (!isLast) {
			//dom.css($searchResult, 'border-bottom', '1px solid ' + config.searchResultsSeparator);
		}
	};

	var onScroll = function(event) {
		var scrollTop = $searchScreenScrollingContainer.scrollTop;
		var height = $searchScreenResultsContent.offsetHeight;
		var scrollingPositionPercent = (scrollTop + height) / $searchScreenScrollingContainer.scrollHeight;
		if (scrollingPositionPercent > 0.8 && currentLastShownResultIdx < currentSearchResultsList.length + 1) {
			var lastSearchResultIdx = currentLastShownResultIdx;
			Array.from({length: searchResultsOnScreenNumber}).forEach(function(_, searchResultPartialIdx) {
				var searchResultIdx = currentLastShownResultIdx + searchResultPartialIdx;
				if (searchResultIdx < currentSearchResultsList.length) {
					var searchResultObject = currentSearchResultsList[searchResultIdx];
					var $searchResult = $searchScreenResultTemplate.cloneNode(true);
					var $thumbnailImg = $searchResult.querySelector('.SearchScreenRes-thumbnail img');
					$thumbnailImg.setAttribute('src', searchResultObject.pageInfoObject.thumbnail);
					var $caption = $searchResult.querySelector('.SearchScreenRes-content');
					$caption.innerHTML = searchResultObject.snippet;
					var isLastResult = searchResultIdx === currentSearchResultsList.length - 1;
					applyColorsToSearchResult($searchResult, isLastResult);
					$searchScreenResultsContent.append($searchResult);
					if (typeof paddingTopBottom === 'undefined') {
						var $searchResContainer = $searchResult.querySelector('.SearchScreenRes-container');
						paddingTopBottom = $searchResContainer.clientWidth - $searchResContainer.offsetWidth;
					}
					dom.css($searchResult, 'padding-bottom', paddingTopBottom + 'px');
					dom.css($searchResult, 'padding-top', paddingTopBottom + 'px');
					$searchResult.addEventListener('click', function() {
						flipBookAPI.gotoPageNumber(searchResultObject.pageInfoObject.pageNumber, true);
						that.closeSearchScreen();
					});
					lastSearchResultIdx += 1;
				}
			});
			currentLastShownResultIdx = lastSearchResultIdx;
		}
	};

	that.init();
};

window.SearchTooltipManager = function(flipBookAPI, config, searchManager, controlBar) {
	var that = this;
	var $searchMiniTooltip;
	var $searchFullTooltip;
	var $searchInputMini;
	var $searchInputFull;
	var $searchNoResultsCaption;
	var $searchResultsContainer;
	var $searchCloseButton;
	var $searchButtonFull;
	var $searchButtonMini;
	var $searchResultTemplate;

	var currentSearchResultsList = [];
	var currentLastShownResultIdx = 0;
	var searchResultsAmountPerStep = 30;
	var clickEventName = 'click';

	window.makeObjectObservable(this);

	this.getMiniTooltip = function() {
		return $searchMiniTooltip;
	};

	this.getFullTooltip = function() {
		return $searchFullTooltip;
	};

	this.toggleTooltipMini = function(performShowing) {
		controlBar.toggleTooltip($searchMiniTooltip, performShowing);
		if (performShowing) {
			$searchInputMini.value = '';
			dom.css($searchInputMini, 'visibility', 'visible');
			$searchInputMini.focus();
		} else {
			dom.css($searchInputMini, 'visibility', 'hidden');
		}
	};

	this.toggleTooltipFull = function(performShowing) {
		controlBar.toggleTooltip($searchFullTooltip, performShowing);
		if (performShowing) {
			dom.css($searchInputFull, 'visibility', 'visible');
		} else {
			dom.css($searchInputFull, 'visibility', 'hidden');
		}
	};

	var addClickListener = function(el, handler) {
		if (!el) return;
		clickEventName.split(' ').forEach(function(evt) { el.addEventListener(evt, handler); });
	};
	var init = function() {
		$searchMiniTooltip = document.querySelector('.ControlbarTooltip--searchMini');
		$searchFullTooltip = document.querySelector('.ControlbarTooltip--searchFull');
		if (!$searchMiniTooltip || !$searchFullTooltip) { console.warn('Search tooltips not found in DOM'); return; }
		$searchInputMini = $searchMiniTooltip.querySelector('.SearchMini-input');
		$searchInputFull = $searchFullTooltip.querySelector('.SearchFull-input');
		$searchNoResultsCaption = $searchFullTooltip.querySelector('.SearchFull-noResults');
		$searchResultsContainer = $searchFullTooltip.querySelector('.SearchFull-results');
		$searchCloseButton = $searchFullTooltip.querySelector('.SearchFull-closeButton');
		$searchButtonFull = $searchFullTooltip.querySelector('.SearchFull-searchButton');
		$searchButtonMini = $searchMiniTooltip.querySelector('.SearchMini-searchButton');

		var searchResultTpl = document.getElementById('Template-searchResult');
		$searchResultTemplate = searchResultTpl ? dom.fromHTML(searchResultTpl.innerHTML) : null;
	['mousedown', 'mouseup', 'mousemove', 'touchstart', 'touchmove', 'touchend'].forEach(function(evt) {
		[$searchMiniTooltip, $searchFullTooltip].forEach(function(el) {
			if (!el) return;
			el.addEventListener(evt, function(event) {
				event.stopPropagation();
			});
		});
	});
		if ($searchInputMini) $searchInputMini.addEventListener('input', onInput);
		if ($searchInputFull) $searchInputFull.addEventListener('input', onInput);
		[$searchInputMini, $searchInputFull].forEach(function(el) { if (!el) return; el.addEventListener('keypress', function(event) {
			if (event.which === 13) {
				onInput();
			}
		}); });
		[$searchButtonMini, $searchButtonFull].forEach(function(el) { addClickListener(el, function(event) {
			onInput();
		}); });
		addClickListener($searchCloseButton, function() {
			that._emitEvent('closeButtonClick');
		});
		if ($searchResultsContainer) $searchResultsContainer.addEventListener('scroll', onScroll);
		applyColors();
	};

	var applyColors = function() {
		[$searchInputMini, $searchInputFull].forEach(function(el) { if (!el) return; dom.css(el, {
			'background-color': config.searchInputBackground,
			'color': config.searchInputText
		}); });
		if ($searchInputMini) dom.css($searchInputMini, 'border', '0');
		if ($searchInputFull) dom.css($searchInputFull, 'border', '0');
		if ($searchResultsContainer) dom.css($searchResultsContainer, 'color', config.searchResultsText);
		var resultsContainer = $searchFullTooltip ? $searchFullTooltip.querySelector('.SearchFull-resultsContainer') : null;
		if (resultsContainer) dom.css(resultsContainer, { 'background-color': config.searchResultsBackground });
		if ($searchNoResultsCaption) dom.css($searchNoResultsCaption, 'color', config.searchResultsSeparator);
	};

	var applyColorsToSearchResult = function($searchResult) {
		dom.css($searchResult, 'background-color', config.searchResultsBackground);
		//dom.css($searchResult, 'border-bottom', '1px solid ' + config.searchResultsSeparator);
	};

	//Called when user clicks Search.
	var onInput = function() {
		var searchString = '';
		if ($searchMiniTooltip.classList.contains('ControlbarTooltip--active')) {
			searchString = $searchInputMini.value;
		} else {
			searchString = $searchInputFull.value;
		}
		currentSearchResultsList = [];
		currentLastShownResultIdx = 0;
		if (searchString.length > 2) {
			currentSearchResultsList = searchManager.search(searchString, 'SearchResult-highlight');
			that.toggleTooltipMini(false);
			that.toggleTooltipFull(true);
			$searchInputFull.value = searchString;
			$searchInputFull.focus();
			$searchInputFull.value = '';
			$searchInputFull.value = searchString;
			$searchResultsContainer.innerHTML = '';
			if (currentSearchResultsList.length > 0) {
				dom.hide($searchNoResultsCaption);
				onScroll();
			} else {
				dom.show($searchNoResultsCaption);
			}
		} else {
			$searchResultsContainer.innerHTML = '';
			dom.show($searchNoResultsCaption);
		}
	};

	var onScroll = function() {
		if (!$searchResultsContainer) return;
		var scrollTop = $searchResultsContainer.scrollTop;
		var height = $searchResultsContainer.offsetHeight;
		var scrollingPositionPercent = (scrollTop + height) / $searchResultsContainer.scrollHeight;
		if (scrollingPositionPercent > 0.8 && currentLastShownResultIdx < currentSearchResultsList.length + 1) {
			var lastSearchResultIdx = currentLastShownResultIdx;
			Array.from({length: searchResultsAmountPerStep}).forEach(function(_, searchResultPartialIdx) {
				var searchResultIdx = currentLastShownResultIdx + searchResultPartialIdx;
				if (searchResultIdx < currentSearchResultsList.length) {
					var searchResultObject = currentSearchResultsList[searchResultIdx];
					var $searchResult = $searchResultTemplate.cloneNode(true);
					var $thumbnail = $searchResult.querySelector('.SearchResult-thumbnail');
					var _img = dom.create('img'); _img.setAttribute('src', searchResultObject.pageInfoObject.thumbnail); $thumbnail.append(_img);
					var $caption = $searchResult.querySelector('.SearchResult-content');
					$caption.innerHTML = searchResultObject.snippet;
					applyColorsToSearchResult($searchResult);
					$searchResultsContainer.append($searchResult);
					addClickListener($searchResult, function() {
						flipBookAPI.gotoPageNumber(searchResultObject.pageInfoObject.pageNumber, true);
						that.toggleTooltipFull(false);
					});
					lastSearchResultIdx += 1;
				}
			});
			currentLastShownResultIdx = lastSearchResultIdx;
		}
	};

	init();
};

//Main object for managing control bar.
window.ControlBar = function($container, config, flipBookAPI, videoManager) {
	var that = this;
	var $template = document.getElementById('Template-controlBar');
	var $controlBar;
	var $controlBarContent;

	var $otherButtons;
	var $pageNavBar;

	var $buttonToBeginningActive;
	var $buttonToBeginningInactive;
	var $buttonBackActive;
	var $buttonBackInactive;
	var $buttonToEndActive;
	var $buttonToEndInactive;
	var $buttonForwardActive;
	var $buttonForwardInactive;

	var $pageInput;
	var $pageInputContainer;

	var $printButton;
	var $downloadButton;
	var $searchButton;
	var $menuButton; // Thumbnails button actually
	var $fullscreenButton;

	var $allButtons;

	var $printTooltip;
	var $searchMiniTooltip;
	var $searchFullTooltip;

	var defaultColors = {
		color1: '#b7b7b7',
		color2: '#ebebeb',
		background: '#272727',
		pagerText: '#cccccc',
		searchScreenBackground: '#000000',
		searchInputBackground: '#121212',
		searchInputText: '#cccccc',
		searchResultsBackground: '#dfdfdf',
		searchResultsSeparator: '#4a4a4a',
		searchResultsText: '#4a4a4a'
	};
	var customColors = {
	};
	var elementsToColorFill = {
		color1: [
			'.ControlBar-backToBeginningActiveImg svg', '.ControlBar-backActiveImg svg',
			'.ControlBar-forwardActiveImg svg', '.ControlBar-forwardToEndActiveImg svg',
			'.ControlBar-printButtonImg svg', '.ControlBar-downloadButtonImg svg',
			'.ControlBar-searchButtonImg svg', '.ControlBar-menuButtonImg svg',
			'.ControlBar-fullscreenButtonImg svg', '.PrintMenu-iconImg svg',
			'.SearchMini-searchButtonImg', '.SearchFull-searchButtonImg'
		],
		color2: [
			'.ControlBar-backToBeginningActiveImgHover svg', '.ControlBar-backActiveImgHover svg',
			'.ControlBar-forwardActiveImgHover svg', '.ControlBar-forwardToEndActiveImgHover svg',
			'.ControlBar-printButtonImgHover svg', '.ControlBar-downloadButtonImgHover svg',
			'.ControlBar-searchButtonImgHover svg', '.ControlBar-menuButtonImgHover svg',
			'.ControlBar-fullscreenButtonImgHover svg', '.PrintMenu-iconImgHover svg',
			'.SearchMini-searchButtonImgHover', '.SearchFull-searchButtonImgHover'
		]
	};
	var elementsToColorColor = {
		color1: ['.SearchFull-closeButtonImg'],
		color2: ['.SearchFull-closeButtonImgHover'],
	};

	var zIndex = config.zIndex ? config.zIndex : 2;
	var clickEventName = 'click';
	var isOnePage; //boolean. True if there is only one page on screen
	var originalOtherButtonsWidth;
	var originalNavButtonsWidth;
	var areOtherButtonsShown = true;
	var areNavButtonsShown = true;
	var currentShownNavButtonsNumber = 5;
	var useNavBarMinSizes = config.useNavBarMinSizes;
	var navbarMinHeight = config.navbarMinHeight;
	var navbarMinWidth = config.navbarMinWidth;
	var navBarTablet = config.navBarTablet;
	var navBarMobile = config.navBarMobile;
	var navBarButtonsSize2;
	var navBarButtonsSize4;
	var isActiveBackButtonHidden;
	var isActiveForwardButtonHidden;

	var searchManager;
	var searchScreenManager;
	var searchTooltipManager;
	var controlbarTooltipsManager;
	var controlbarPaddings;
	var navButtonsMargin;

	this.init = function() {
		if ($template) {
			$container.innerHTML = $template.innerHTML;
			$controlBar = $container.querySelector('.ControlBar');
			$controlBarContent = $controlBar.querySelector('.ControlBar-content');
			dom.css($controlBar, 'z-index', zIndex);

			$pageNavBar = document.querySelector('.ControlBar-pageNavBar');
			$buttonToBeginningActive = $pageNavBar.querySelector('.ControlBar-backToBeginningActive');
			$buttonToBeginningInactive = $pageNavBar.querySelector('.ControlBar-backToBeginningInactive');
			$buttonBackActive = $pageNavBar.querySelector('.ControlBar-backActive');
			$buttonBackInactive = $pageNavBar.querySelector('.ControlBar-backInactive');
			$buttonToEndActive = $pageNavBar.querySelector('.ControlBar-forwardToEndActive');
			$buttonToEndInactive = $pageNavBar.querySelector('.ControlBar-forwardToEndInactive');
			$buttonForwardActive = $pageNavBar.querySelector('.ControlBar-forwardActive');
			$buttonForwardInactive = $pageNavBar.querySelector('.ControlBar-forwardInactive');
			$pageInputContainer = $pageNavBar.querySelector('.ControlBar-pageInputContainer');
			$pageInput = $pageInputContainer.querySelector('.ControlBar-pageInput');

			$otherButtons = document.querySelector('.ControlBar-otherButtons');
			$printButton = $otherButtons.querySelector('.ControlBar-printButton');
			$downloadButton = $otherButtons.querySelector('.ControlBar-downloadButton');
			$searchButton = $otherButtons.querySelector('.ControlBar-searchButton');
			$menuButton = $otherButtons.querySelector('.ControlBar-menuButton');
			$fullscreenButton = $otherButtons.querySelector('.ControlBar-fullscreenButton');
			if (!config.fullScreenEnabled || flipBookAPI.getIsMobileDevice()) {
				dom.hide($fullscreenButton);
			}
			if (!config.searchButtonEnabled) {
				dom.hide($searchButton.parentElement);
			}
			if (!config.printButtonEnabled || flipBookAPI.getIsMobileDevice()) {
				dom.hide($printButton.parentElement);
			}
			if (!config.navigationButtonsEnabled) {
				dom.hide($pageNavBar);
			}
			if (!config.downloadButtonEnabled) {
				dom.hide($downloadButton);
			}
			if (!config.thumbnailsButtonEnabled) {
				dom.hide($menuButton);
			}
			controlbarPaddings = $controlBarContent.clientWidth - $controlBarContent.offsetWidth;
			originalOtherButtonsWidth = $otherButtons.clientWidth;
			originalNavButtonsWidth = $pageNavBar.clientWidth;
			navButtonsMargin = $controlBarContent.offsetWidth - originalOtherButtonsWidth - originalNavButtonsWidth;
			navButtonsMargin -= controlbarPaddings;
			if (navbarMinWidth < originalNavButtonsWidth + controlbarPaddings) {
				navbarMinWidth = originalNavButtonsWidth + controlbarPaddings;
			}
			if (!config.touchControl) {
				$controlBarContent.querySelectorAll('.ControlBar-button').forEach(function(btn) { btn.classList.add('ControlBar-button--hover'); });
			}

			$allButtons = [$buttonToBeginningActive, $buttonBackActive, $buttonToEndActive, $buttonForwardActive, $printButton, $downloadButton, $searchButton, $menuButton, $fullscreenButton];

			$printTooltip = $otherButtons.querySelector('.ControlbarTooltip--print');

		$printTooltip.addEventListener('mousedown', function(event) { event.stopPropagation(); return false; });
		$printTooltip.addEventListener('mouseup', function(event) {
			event.stopPropagation();
			return false;
		});

			initLinkTooltips();
			var customColors = applyColors();
			var searchConfig = {
				touchControl: customColors.touchControl,
				color1: customColors.color1,
				searchInputBackground: customColors.searchInputBackground,
				searchInputText: customColors.searchInputText,
				searchResultsBackground: customColors.searchResultsBackground,
				searchResultsSeparator: customColors.searchResultsSeparator,
				searchResultsText: customColors.searchResultsText,
				searchScreenBackground: customColors.searchScreenBackground
			};
			searchManager = new window.SearchManager(flipBookAPI, searchConfig, $controlBarContent);
			if (!config.touchControl) {
				searchTooltipManager = new window.SearchTooltipManager(flipBookAPI, searchConfig, searchManager, that);
			} else {
				searchScreenManager = new window.SearchScreenManager(flipBookAPI, searchConfig, searchManager);
			}
			attachEventHandlers();
		}
	};

	//This method is called when user changes the page. It updates pagenum textinput and some buttons.
	this.updatePage = function() {
		var pageNumber = flipBookAPI.getCurrentPageNumber();
		var pageInfoList = flipBookAPI.getPageInfoList();

		var leftPageInfo = pageInfoList[pageNumber];
		var leftPageInfoName;
		var leftPageName;
		var leftPageNumber;

		var rightPageInfo = pageInfoList[pageNumber + 1];
		var rightPageInfoName;
		var rightPageName;
		var rightPageNumber;

		isOnePage = false;
		if (!leftPageInfo || !(leftPageInfo.__PageNumber > 0)) {
			leftPageInfo = rightPageInfo;
			rightPageInfo = undefined;
		}

		if (typeof rightPageInfo === 'undefined' || !(rightPageInfo.__PageNumber > 0)) {
			isOnePage = true;
		}

		if (!leftPageInfo) return;
		leftPageInfoName = leftPageInfo.__PageName;
		leftPageNumber = leftPageInfo.__PageNumber;
		if (leftPageInfoName) {
			leftPageName = leftPageInfoName;
		} else if (leftPageNumber > 0) {
			leftPageName = leftPageNumber;
		}

		if (!isOnePage) {
			rightPageInfoName = rightPageInfo.__PageName;
			rightPageNumber = rightPageInfo.__PageNumber;
			if (rightPageInfoName) {
				rightPageName = rightPageInfoName;
			} else if (rightPageNumber > 0) {
				rightPageName = rightPageNumber;
			}
		}

		var n = 0;
		if (!rightPageInfoName && !leftPageInfoName) {
			if (typeof rightPageName === 'number' && typeof leftPageName === 'number') {
				if (rightPageName > 0 && leftPageName > 0) {
					n = 1;
				}
			}
		}

		var txts = config.pagerText.split('~')[n].split('#');
		var txt;
		var pns;

		if (isOnePage) {
			if (leftPageName) {
				txt = leftPageInfoName ? leftPageName : txts[0] + leftPageName + txts[1];
				pns = leftPageName;
			}
		} else {
			if (leftPageInfoName && rightPageInfoName) {
				txt = leftPageName + ' - ' + rightPageName;
			} else if (leftPageInfoName) {
				txt = leftPageName + ' - ' + txts[0] + rightPageName + txts[1];
			} else if (rightPageInfoName) {
				txt = txts[0] + leftPageName + txts[1] + ' - ' + rightPageName;
			} else {
				txt = txts[0] + leftPageName + txts[1] + rightPageName + txts[2];
			}
			pns = leftPageName + '-' + rightPageName;
		}
		pns = encodeURI(pns);
		setPageInputValue(txt);
		that.adjustButtonsToScreenSize();
		if (config.hashControl) {
			flipBookAPI.updateHash(pns);
		}
	};

	//Get controlbar's height
	this.getHeight = function() {
		var height = 0;
		if (typeof currentShownNavButtonsNumber !== 'undefined') {
			height = $controlBarContent.offsetHeight;
		}
		return height;
	};

	//On window resize
	this.adjustButtonsToScreenSize = function() {
		if (navBarTablet && flipBookAPI.getIsTablet()) {
			dom.hide($pageNavBar);
		} else if (navBarMobile && flipBookAPI.getIsPhone()) {
			dom.hide($pageNavBar);
		} else if (useNavBarMinSizes === true) {
			adjustButtonsToScreenByVars();
		} else {
			adjustButtonsToScreenBySize();
		}
	};

	this.toggleTooltip = function($tooltip, performShowing) {
		var isTooltipActive = $tooltip.classList.contains('ControlbarTooltip--active');
		if (typeof performShowing === 'undefined') {
			performShowing = !isTooltipActive;
		}
		if (performShowing && !isTooltipActive) {
			$tooltip.classList.add('ControlbarTooltip--active');
		} else if (!performShowing && isTooltipActive) {
			$tooltip.classList.remove('ControlbarTooltip--active');
		}
	};

	var initLinkTooltips = function() {
		if (config.controlbarTooltipEnabled) {
			controlbarTooltipsManager = new window.FlipbookTooltips({
				el: 'div.ControlBar-button[data-tooltip]',
				color: config.TooltipText,
				background: config.TooltipBackground,
				orientation: 'top',
				margin: 45,
				fixedY: function() {
					return document.documentElement.scrollHeight - $controlBar.offsetHeight;
				}
			});
			dom.on(document, 'click', 'div.ControlBar-button[data-tooltip]', function() { controlbarTooltipsManager.events.hide(); });
		}
	};

	var adjustButtonsToScreenBySize = function() {
	var _toggle = function(el, show) { if (el) el.style.display = show ? '' : 'none'; };
	var toggle2Buttons = function(doShowing) {
		if (isActiveBackButtonHidden) {
			dom.hide($buttonBackActive);
			_toggle($buttonBackInactive, doShowing);
		} else {
			_toggle($buttonBackActive, doShowing);
			dom.hide($buttonBackInactive);
		}
		if (isActiveForwardButtonHidden) {
			dom.hide($buttonForwardActive);
			_toggle($buttonForwardInactive, doShowing);
		} else {
			_toggle($buttonForwardActive, doShowing);
			dom.hide($buttonForwardInactive);
		}
	};
	var toggle4Buttons = function(doShowing) {
		if (isActiveBackButtonHidden) {
			dom.hide($buttonToBeginningActive);
			_toggle($buttonToBeginningInactive, doShowing);
		} else {
			_toggle($buttonToBeginningActive, doShowing);
			dom.hide($buttonToBeginningInactive);
		}
		if (isActiveForwardButtonHidden) {
			dom.hide($buttonToEndActive);
			_toggle($buttonToEndInactive, doShowing);
		} else {
			_toggle($buttonToEndActive, doShowing);
			dom.hide($buttonToEndInactive);
		}
	};
		var toggle5Buttons = function(doShowing) {
			if ($pageInputContainer) dom.css($pageInputContainer, 'display', doShowing ? '' : 'none');
		};
		if (typeof navBarButtonsSize2 === 'undefined') {
			navBarButtonsSize2 = $buttonBackActive.offsetWidth + $buttonForwardActive.offsetWidth;
			navBarButtonsSize4 = $buttonToBeginningActive.offsetWidth + navBarButtonsSize2 + $buttonToEndActive.offsetWidth;
		}
		var navBar2ButtonsSize = navBarButtonsSize2 + navButtonsMargin + 4;
		var navBar4ButtonsSize = navBarButtonsSize4 + navButtonsMargin + 8;
		var controlBar0NavButtonsWidth = controlbarPaddings + originalOtherButtonsWidth + 2;
		var controlBar2NavButtonsWidth = controlbarPaddings + navBar2ButtonsSize + originalOtherButtonsWidth;
		var controlBar4NavButtonsWidth = controlbarPaddings + navBar4ButtonsSize + originalOtherButtonsWidth;
		var controlBar5NavButtonsWidth = controlBar4NavButtonsWidth + $pageInputContainer.offsetWidth + 8 + 6;
		var windowWidth = window.innerWidth;
		if (windowWidth < controlBar0NavButtonsWidth) {
			if (areOtherButtonsShown) {
				dom.hide($pageNavBar);
				dom.hide($otherButtons);
				dom.hide($controlBar);
				areOtherButtonsShown = false;
				areNavButtonsShown = false;
				currentShownNavButtonsNumber = undefined;
			}
		} else if (windowWidth >= controlBar0NavButtonsWidth && windowWidth < controlBar2NavButtonsWidth) {
			if (currentShownNavButtonsNumber !== 0) {
				areOtherButtonsShown = true;
				dom.show($controlBar);
				dom.show($otherButtons);
				dom.hide($pageNavBar);
				areNavButtonsShown = false;
				currentShownNavButtonsNumber = 0;
			}
		} else if (windowWidth >= controlBar2NavButtonsWidth && windowWidth < controlBar4NavButtonsWidth) {
			if (currentShownNavButtonsNumber !== 2) {
				areOtherButtonsShown = true;
				dom.show($controlBar);
				toggle2Buttons(true);
				toggle4Buttons(false);
				toggle5Buttons(false);
				dom.show($otherButtons);
				if (config.navigationButtonsEnabled) {
					dom.show($pageNavBar);
					areNavButtonsShown = true;
				}
				currentShownNavButtonsNumber = 2;
			}
		} else if (windowWidth >= controlBar4NavButtonsWidth && windowWidth < controlBar5NavButtonsWidth) {
			if (currentShownNavButtonsNumber !== 4) {
				areOtherButtonsShown = true;
				dom.show($controlBar);
				toggle2Buttons(true);
				toggle4Buttons(true);
				toggle5Buttons(false);
				dom.show($otherButtons);
				if (config.navigationButtonsEnabled) {
					dom.show($pageNavBar);
					areNavButtonsShown = true;
				}
				currentShownNavButtonsNumber = 4;
			}
		} else {
			if (currentShownNavButtonsNumber !== 5) {
				areOtherButtonsShown = true;
				dom.show($controlBar);
				toggle2Buttons(true);
				toggle4Buttons(true);
				toggle5Buttons(true);
				dom.show($otherButtons);
				if (config.navigationButtonsEnabled) {
					dom.show($pageNavBar);
					areNavButtonsShown = true;
				}
				currentShownNavButtonsNumber = 5;
			}
		}
	};

	var adjustButtonsToScreenByVars = function() {
		var windowWidth = window.innerWidth;
		var windowHeight = window.innerHeight;
		if (areNavButtonsShown && (windowWidth < navbarMinWidth || windowHeight < navbarMinHeight)) {
			dom.hide($pageNavBar);
			areNavButtonsShown = false;
			if (!areOtherButtonsShown) {
				dom.hide($controlBar);
			}
		} else if (!areNavButtonsShown) {
			if (windowWidth > navbarMinWidth && windowHeight > navbarMinHeight) {
				if (config.navigationButtonsEnabled) {
					dom.show($pageNavBar);
					areNavButtonsShown = true;
				}
				if ($controlBar.style.display === 'none') {
					dom.show($controlBar);
				}
			}
		}
		var _navBarWidth = originalNavButtonsWidth;
		if (!areNavButtonsShown) {
			_navBarWidth = 0;
		}

		if (areOtherButtonsShown && (windowWidth < originalOtherButtonsWidth + _navBarWidth)) {
			dom.hide($otherButtons);
			if (!areNavButtonsShown) {
				dom.hide($controlBar);
			}
			areOtherButtonsShown = false;
		} else if (!areOtherButtonsShown && (windowWidth > originalOtherButtonsWidth + _navBarWidth)) {
			dom.show($otherButtons);
			if ($controlBar.style.display === 'none') {
				dom.show($controlBar);
			}
			areOtherButtonsShown = true;
		}
	};

	/**
	 * Apply colors to controlbar elements
	 *
	 * @return {object}		customColors	Used colors
	 */
	var applyColors = function() {
		customColors = Object.assign({}, defaultColors);
		if (typeof config.colors === 'object') {
		Object.keys(config.colors).forEach(function(colorName) {
			customColors[colorName] = config.colors[colorName];
		});
	}
	Object.keys(elementsToColorFill).forEach(function(colorName) {
		elementsToColorFill[colorName].forEach(function(selectorStr, _) {
			var _el = document.querySelector(selectorStr);
			if (_el) dom.css(_el, 'fill', customColors[colorName]);
		});
	});
	Object.keys(elementsToColorColor).forEach(function(colorName) {
		elementsToColorColor[colorName].forEach(function(selectorStr, _) {
			var _el = document.querySelector(selectorStr);
			if (_el) dom.css(_el, 'color', customColors[colorName]);
		});
	});

		if ($controlBarContent) dom.css($controlBarContent, 'background-color', customColors.background);
		if ($pageInput) dom.css($pageInput, 'color', customColors.pagerText);
		var _smini = document.querySelector('.ControlbarTooltip--searchMini');
		var _sfull = document.querySelector('.ControlbarTooltip--searchFull');
		var _sarrows = document.querySelectorAll('.ControlbarTooltip-arrow');
		if (_smini) dom.css(_smini, 'background-color', customColors.background);
		if (_sfull) dom.css(_sfull, 'background-color', customColors.background);
		_sarrows.forEach(function(arrow) { dom.css(arrow, 'border-top', 'solid ' + customColors.background + ' 10px'); });

		return customColors;
	};

	//Attach event handlers to elements. Called on init.
	var attachEventHandlers = function() {
	$allButtons.forEach(function(btn) { if (btn !== $menuButton) btn.addEventListener(clickEventName, function(event) {
		event.preventDefault();
		flipBookAPI.hideThumbnails();
	}); });
	$controlBarContent.addEventListener('mousedown', function(event) { event.stopPropagation(); return false; }); $controlBarContent.addEventListener('mouseup', function(event) {
			event.stopPropagation();
			return false;
		});
		$buttonToBeginningActive.addEventListener(clickEventName, function(event) {
			event.preventDefault();
			flipBookAPI.gotoFirstPage(true);
		});
		$buttonBackActive.addEventListener(clickEventName, function(event) {
			event.preventDefault();
			flipBookAPI.gotoPrevPage(true);
		});
		$buttonForwardActive.addEventListener(clickEventName, function(event) {
			event.preventDefault();
			flipBookAPI.gotoNextPage(true);
		});
		$buttonToEndActive.addEventListener(clickEventName, function(event) {
			event.preventDefault();
			flipBookAPI.gotoLastPage(true);
		});
		initPageInput();

		initPrintButton();
		$downloadButton.addEventListener(clickEventName, function(event) {
			event.preventDefault();
			flipBookAPI.download();
		});
		$menuButton.addEventListener(clickEventName, function(event) {
			event.preventDefault();
			if (flipBookAPI.getIsThumbnailMode()) {
				dom.data($menuButton, 'tooltip-hidden', false);
				flipBookAPI.hideThumbnails();
			} else {
				dom.data($menuButton, 'tooltip-hidden', true);
				flipBookAPI.showThumbnails();
			}
		});
	$allButtons.forEach(function(btn) { if (btn !== $menuButton) btn.addEventListener(clickEventName, function(event) {
		if (flipBookAPI.getIsThumbnailMode()) {
			flipBookAPI.hideThumbnails();
		}
	}); });
	$fullscreenButton.addEventListener(clickEventName, function(event) {
			event.preventDefault();
			if (!flipBookAPI.getIsFullScreen()) {
				flipBookAPI.enterFullScreen();
			} else {
				flipBookAPI.exitFullScreen();
			}
		});
		initSearchButton();
	};

	//Initialize event handlers for page number textinput
	var initPageInput = function() {
		var updatePage = function() {
			var newValue = $pageInput.value;
			var newValueNum = parseInt(newValue, 10);
			if (!isNaN(newValueNum) || newValueNum > flipBookAPI.getLastPageNumber()) {
				flipBookAPI.gotoPageNumber(newValueNum, true);
			} else {
				$pageInput.value = previousValue;
			}
			setPageInputValue();
		};
		var previousValue;
		$pageInput.addEventListener('click', function() {
			$pageInput.focus();
		});
		$pageInput.addEventListener('focus', function() {
			previousValue = $pageInput.value;
			$pageInput.value = '';
		});
		$pageInput.addEventListener('blur', updatePage);
		$pageInput.addEventListener("keydown", function(event) {
			if (event.which === 13) {
				if (!flipBookAPI.getIsFullScreen()) {
					$pageInput.blur();
				} else {
					updatePage();
				}
			}
		});
	};

	//Sets value to pageInput with resizing. If value parameter is undefined - just resizes.
	var setPageInputValue = function(value) {
		if (!$pageInput) return;
		if (typeof value === 'undefined') {
			value = $pageInput.value;
		}
		var width = 35;
		if (value.length > 5) {
			width += 6 * (value.length - 5);
		}
		width += 2;
		dom.css($pageInputContainer, {
			'width': width
		});
		$pageInput.value = value;
	};

	//Initialize event handlers for Print button
	var initPrintButton = function() {
		var closeTooltip = function() {
			that.toggleTooltip($printTooltip, false);
			dom.data($printButton, 'tooltip-hidden', false);
		};
		$printButton.addEventListener(clickEventName, function() {
			flipBookAPI.printPDF();
		});
		flipBookAPI.addEventHandler(['onPageChange', 'onZoomIn', 'onZoomOut', 'onLinkClicked'], closeTooltip);
		$pageInput.addEventListener('focus', closeTooltip);
	};

	//Initialize event handlers for Search button
	var initSearchButton = function() {
		var isSearchActive = false; //boolean
		var closeSearch = function() {
			if (isSearchActive) {
				if (typeof searchScreenManager === 'undefined') {
					isSearchActive = false;
					dom.data($searchButton, 'tooltip-hidden', false);
					if (typeof searchTooltipManager !== 'undefined') {
						searchTooltipManager.toggleTooltipMini(false);
						searchTooltipManager.toggleTooltipFull(false);
					}
				} else {
					searchScreenManager.closeSearchScreen();
				}
			}
		};
		var openSearch = function() {
			if (!isSearchActive) {
				if (typeof searchScreenManager === 'undefined') {
					isSearchActive = true;
					dom.data($searchButton, 'tooltip-hidden', true);
					if (typeof searchTooltipManager !== 'undefined') {
						searchTooltipManager.toggleTooltipMini(true);
					}
				} else {
					searchScreenManager.openSearchScreen();
				}
			}
		};
	$searchButton.addEventListener(clickEventName, function() {
		if (isSearchActive) {
			closeSearch();
		} else {
			openSearch();
		}
	});
		[$printButton, $menuButton, $downloadButton, $fullscreenButton].forEach(function(el) { if (el) el.addEventListener(clickEventName, closeSearch); });
		if (typeof searchTooltipManager !== 'undefined') {
			searchTooltipManager.addEventHandler('closeButtonClick', closeSearch);
		}
		flipBookAPI.addEventHandler(['onPageChange', 'onZoomIn', 'onZoomOut', 'onLinkClicked'], closeSearch);
		$pageInput.addEventListener('focus', closeSearch);
	};

	this.init();
};

var userAgent = navigator.userAgent || navigator.vendor || window.opera;
if (/Presto/i.test(userAgent) || /Android 2\./i.test(userAgent)) {
	throw new Error('use_fallback');
}
(function() {
	'use strict';
	var __window = window;
	var __undefined = undefined;

	// The script is started with pageflipInit function!
	// confuguration options and all Pageflip Variables
	// - Pageflip uses local variables (global inside this scope)

	var _ID, // ID.
		_Title,
		_IDs,
		_DefaultID,
		_PageWidth, // Width of the inside pages
		_PageHeight, // Height of the inside pages
		_CoverWidth, // Width of the cover, if not defined it will be the same as the page Width
		_CoverHeight, // cover Height
		_StageWidth, // Size of the stage ( if not defined, CSS values will kept
		_StageHeight,
		_HardCover, // Hard Cover enabled
		_HardPages, // Hard pages enabled (flase by default)
		_CenterSinglePage,
		_doubleTapZoomSpeed,
		//_PageAutoScale,	// scales the loaded content to fit the page
		_Margin, // Margin Around the book.
		_MarginTop, // Margins also can be set on each side
		_MarginBottom,
		_MarginLeft,
		_MarginRight,
		_AutoScale, // scale the book to fit the stage (pageflip-container)
		_FullScale, // set the pageflip div size match the browser size!
		_FillScale, // fills the screen
		_UpScale, // Allow upscale too!
		_AutoStageHeight, // Stage Height set automatically depending on the actual scaled book height
		_AutoMaxHeight, // Stage is resized vertically if doesn't fit in the browser window
		_MaxHeightOffset, // Stage Max Height = Browser Window Height - MaxHeightOffset
		_ScaleToSinglePage, // Scales the book the way a single page is visilble as much as possible
		_FlexibleContent, // Content doesn't scales, it size is changing, and the content is rearranges like on a HTML page.
		_FlexibleContentMinWidth, // The minimum size of a such page. (if the visible size is smaller, downscaling occurs)
		_StartPage, // book starts opened at this page
		_MinPageLimit, // the first accessible page
		_MaxPageLimit, // the last accessible page
		_StartAutoFlip, // Start with autoFlip mode!
		_AutoFlipEnabled, // Enable/Disable auto flipping feature
		_FullScreenEnabled, // Enable/Disable fullscreen feature (it doesn't work on iOS at all)
		_SearchButtonEnabled,
		_PrintButtonEnabled,
		_NavigationButtonsEnabled,
		_DownloadButtonEnabled,
		_ThumbnailsButtonEnabled,
		_IsPhone = false,
		_IsTablet = false,

		_AutoFlipInterval, // default interval between pageflps
		_AutoFlipLoop, // Looping
		_navigationLoop, // previous/next buttons to accsess last/first page (from first/last pages)
		_VerticalMode, // vertical flipping direction
		_RightToLeft, // Right to left flipping direction
		_AlwaysOpened, // Alwasy opened book (can't see the front cover)
		_Preflip, // Enable/Disable preflipping (corner flip on hover)
		//_CenterFlipControl,
		//_BookSelectorFile,
		_ControlbarToFront, // controlbar to front (flipping page is behind it)
		_ControlbarEnabled,
		_Thumbnails, // Thumbnails enabled
		_ThumbnailsLazyLoad, // Loads Thumbnail images only when container is visible on the screen)
		_ThumbnailsToFront, // Thumbnail over the book
		_ThumbnailsAutoHide, // Hide thumbnails after X ms
		_ThumbnailsHidden, // Hide Thumbnails on start
		_ThumbnailWidth, // Width of a thumbnail page
		_ThumbnailHeight, // height
		_ThumbnailAlwaysCentered, // actual page/spread is centered
		_Transparency, // is transparency enabled? multi level transparency
		_PageCache, // how many page have to be preloaded in background
		_NoFlipShadow, // no flipshadow rendered
		_DropShadow, // Enable/Disable book dropshadow
		_Emboss, // Shadows in the center of the opened book.
		_DropShadowOpacity,
		_FlipTopShadowOpacity,
		_FlipShadowOpacity,
		_HardFlipShadowOpacity,
		_HardFlipShadowOpacity,
		_EmbossOpacity,
		_PreflipArea,
		_SecondaryDragArea,
		_InsideDragArea,
		_FlipDuration,
		_BookOffsetX,
		_BookOffsetY,
		_PerformanceAware,
		_PagerText,
		_PagerSkip, //page skipping when called gotoPage from pager exec
		_ZoomEnabled,
		_ClickZoom,
		_ZoomFlip,
		_PinchZoom,
		_MaxZoomLevel,
		_MouseControl,
		_GoogleAnalyticsMeasurementId,
		_HashControl,
		_vChecked,
		_DisableSelection,
		_SinglePageDesktopMode,
		_SinglePageMobileMode,
		_SinglePageMode,
		_DownloadUrl,
		_ControlbarColors,
		_LinksTooltipContent,
		_TooltipText,
		_TooltipBackground,
		_LinkFading,
        _LinkShowPermanently,
		_LinkBackground,
		_InvisibleLinks,
		_ControlbarTooltipsEnabled,
		_LinksTooltipEnabled,
		_BackgroundColor,
		_BackgroundImage,
		_SoundList,
		_IncDirPath = '',
		_MobileImageMaxHeight = 700,
		_MobileImageMaxWidth = 500,
		_NavigationArrowsEnabled = false,
		_NavigationArrowsColors = {},
		_UseHQImage = true,
		_NavbarMinHeight = 700,
		_NavbarMinWidth = 500,
		_UseNavBarMinSizes = false,
		_NavBarMobile = false,
		_NavBarTablet = _NavBarMobile,
		_ChangeQualityOnMobile = true,
		_ZoomCursorEnabled = true,
		_ZoomCursorColor,
		_TwoPagesFlippingAreaPercentsPC = 0.1,
		_TwoPagesFlippingAreaPercentsMobile = 0.3,
		_TwoPagesFlippingAreaPercentsMobileSP = 0.15,
		_TwoPagesFlippingAreaPercentsMobileZoomed = 0.15,
		_LastMousePositionX,
		_LastMousePositionY,

		/*
		*.unselectable {
		   -moz-user-select: -moz-none;
		   -khtml-user-select: none;
		   -webkit-user-select: none;
		   -ms-user-select: none;
		   user-select: none;
		}

		*/
		// pointers to DOM elements

		__pageflip, // document.getElementById('pageflip')	Pageflip wrapper
		__stage, // the Pageflip container (everything pageflip is in it)
		__book, // the book (all pages already positioned, ready for display)
		__bookc, // the container of the book (needed for scaling)
		__bookoffs, // another level of wrapper for the book, for positioning
		__dropshadow, // the dropshadow
		__cursoroverlay,
		__pageOverlays = [],
		__doc, // document

		__controlbar, // the controlbar
		__videoManager, //VideoManager
		__audioPlayer, //AudioPlayer
		__pagerin, // the Page number display input box
		__pagesTemplate,
		__navigationArrowsManager,
		__flipbookTooltips,
		__urlManager,
		__cursorManager,

		// main variables

		PN, // PageNumber, where we are in the book...
		maxPage, // the last page's index in the pages array
		bookWidth, // max width of the book
		bookHeight, // max height of the book
		bookCOffsX, // offset
		bookCOffsY,
		bookScale, // book scale
		largeCover, // cover is larger than inside pages
		maskpw, // page mask size
		maskcw, // cover mask size
		changed, // layout changed

		has3d,
		eventCallback = {},

		// flip variables

		flipping, // is there a flipping animation in action?
		flipPages, // array of the flipping pages to render
		flipOrder, // an array with all the running flips
		flipDir, // direction of the flip: left -1, right 1
		flipType, // flip mpde
		//maskType,			// mask type to be use
		lastFlipMode, // the previous Flip Type used
		startPN, // PN before flip
		endPN, // PN after flip
		maxFlips, // max number of flip animation at the same time
		lastNavTime = 0,
		mx, // used as touch point for animation, have to be updated every frame!
		my,
		//lx,				// *** korabbi pozicio, ezt flipOrder elemenkent kellene allitani
		//ly,

		autoFlip, //slideshow autoflip!
		autoPreflip,
		manualPreflip,
		manualFlipFD, // reference to the active manual flip descriptor (null when idle)
		manualFlipTouchId, // touch identifier for the active manual flip
		cancelFlip,
		manualFlipDir,
		lastClickStartTime,
		lastClickDuration,
		lastNativeTouchTime,

		leftPageW, leftPageH, rightPageW, rightPageH,

		// content variables

		pages, // Array containing all page informations
		images = [],
		_deferredPageLoads = [],  // pages queued until current spread images are loaded
		_spreadLoadsDone = false, // true once PN/PN+1 images have resolved
		renderedPages, // actually rendered pages (pages displayed)
		hiddenPages, // Array containing hidden pages
		removedPages, // an array containing remover page data
		pagesToPreload, // Array with pages to preload
		htmlBuffer, // temporary storage of the original content of the div#pageflip

		fadeLink, //fade link object

		touchControl,
		currentTouchControl,
		touchType, // 'touch' or 'pointer'
		clickEventName,
		pfEvent,

		// constants
		M = Math,
		PI = M.PI,
		AM,
		sides = ['left', 'right'],
		FALSE = false,
		TRUE = true,
		Ms = M.sin,
		Mas = M.asin,
		Mc = M.cos,
		Mq = M.sqrt,
		Ma = M.abs,
		Mf = M.floor,
		Md = M.ceil,
		Mr = M.round,
		Mrn = M.random,
		D90, //90
		D180, //180
		D2, //2
		D100, //100

		s1 = 'toUpperCase',
		s2 = 'charCodeAt',
		s3 = 'length',
		s4 = 'get',
		s5 = 'UTC',
		s6 = s4 + s5,
		s4 = s6 + 'FullYear',
		s5 = s6 + 'Month',
		s6 = s6 + 'Date',
		s7 = 'location',
		s8 = 'href',
		s9 = 'offline',
		s17 = 'online',
		s10 = 'split',
		s11 = 'substr',
		s12 = 'file:',
		s13 = 'www',
		s14 = '/',
		s15 = 'fromCharCode',
		s16 = 'top',
		auto = 'auto',

		n0 = 85, //170 later...
		n1 = n0 * 3, //255
		n2 = n1 + 1, //256
		n3 = 6, //6
		n4 = 8, //8
		n5 = 1000,
		n6 = 50,
		n7 = n2 >> 2, //64

		HD, // horizontal divider
		VD, // vertical divider
		VM, // vertical multiplier


		// function definitions ----------------------------------------------------------------------

		//-------------------------------------------------------------------------------------

		// set up configuration with variables given arguments, or default values
		configSetUp = function(pConfig) {
			var t, u = 0.3;
			if (typeof pConfig.IncDirPath === 'string') {
				_IncDirPath = pConfig.IncDirPath;
			}
			_IDs = pConfig.IDs,

			_DefaultID = pConfig.DefaultID,
            _Title = pConfig.Title || "flipbook",
			_PageWidth = pConfig.PageWidth || 300,
			_PageHeight = pConfig.PageHeight || 400,
			_CoverWidth = pConfig.CoverWidth || _PageWidth,
			_CoverHeight = pConfig.CoverHeight || _PageHeight,
			_HardCover = (typeof pConfig.HardCover === 'undefined') ? false : pConfig.HardCover,
			_HardPages = pConfig.HardPages || FALSE,
			_StageWidth = pConfig.StageWidth,
			_StageHeight = pConfig.StageHeight,
			_doubleTapZoomSpeed = typeof pConfig.DoubleTapZoomSpeed === 'undefined' ? 2 : pConfig.DoubleTapZoomSpeed,
			_VerticalMode = pConfig.VerticalMode || FALSE,
			_SinglePageDesktopMode = pConfig.SinglePageDesktopMode || FALSE,
			_SinglePageMobileMode = typeof pConfig.SinglePageMobileMode === 'undefined' ? true : pConfig.SinglePageMobileMode,
			_RightToLeft = (pConfig.RightToLeft && !_VerticalMode) || FALSE,
			_AutoScale = pConfig.AutoScale || TRUE,
			_FullScale = pConfig.FullScale || TRUE,
			_FillScale = pConfig.FillScale || FALSE,
			_UpScale = pConfig.UpScale || TRUE,
			pConfig.CenterSinglePage = typeof pConfig.CenterSinglePage !== 'undefined' ? pConfig.CenterSinglePage : true,
			_AutoStageHeight = (typeof pConfig.AutoStageHeight === 'undefined') ? FALSE : Boolean(pConfig.AutoStageHeight),
			_ControlbarEnabled = (typeof pConfig.ControlbarEnabled === 'undefined') ? true : Boolean(pConfig.ControlbarEnabled);
			_SearchButtonEnabled = (typeof pConfig.SearchButtonEnabled === 'undefined') ? TRUE : Boolean(pConfig.SearchButtonEnabled);
			_PrintButtonEnabled = (typeof pConfig.PrintButtonEnabled === 'undefined') ? FALSE : Boolean(pConfig.PrintButtonEnabled);
			_ThumbnailsButtonEnabled = (typeof pConfig.ThumbnailsButtonEnabled === 'undefined') ? TRUE : Boolean(pConfig.ThumbnailsButtonEnabled);
			_IsPhone = (function(a) {
				var isPhoneOS = /android.+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|meego.+mobile|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a);
				if (isPhoneOS || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) {
					return true;
				} else {
					return false;
				}
			})(userAgent);
			_IsTablet = Boolean(userAgent.match(/iPad|Android|(?=.*\bWindows\b)(?=.*\bARM\b)/i));
			var defaultMargin = 32;
			if (_IsPhone || _IsTablet) {
				_SinglePageMode = _SinglePageMobileMode;
				if (_HardCover) {
					//_HardCover = false;
				}
				if (_HardPages) {
					_HardPages = false;
				}
				if (_SinglePageMode) {
					defaultMargin = 10;
				}
				if (typeof pConfig.ControlbarEnabledMobile === 'boolean') {
					_ControlbarEnabled = pConfig.ControlbarEnabledMobile;
				}
			} else {
				_SinglePageMode = _SinglePageDesktopMode;
			}
			_Margin = typeof pConfig.Margin === 'undefined' ? defaultMargin : pConfig.Margin;
			_MarginTop = typeof pConfig.MarginTop === 'undefined' ? _Margin : pConfig.MarginTop;
			_MarginBottom = typeof pConfig.MarginBottom === 'undefined' ? _Margin : pConfig.MarginBottom;
			_MarginLeft = typeof pConfig.MarginLeft === 'undefined' ? _Margin : pConfig.MarginLeft;
			_MarginRight = typeof pConfig.MarginRight === 'undefined' ? _Margin : pConfig.MarginRight;
			_CenterSinglePage = _SinglePageMode ? FALSE : Boolean(pConfig.CenterSinglePage);
			_ScaleToSinglePage = _SinglePageMode ? TRUE : pConfig.ScaleToSinglePage || FALSE;
			_AlwaysOpened = _SinglePageMode ? FALSE : pConfig.AlwaysOpened || FALSE;

			_SoundList = {};
			if (typeof pConfig.FlippingSoundVolume !== 'undefined' && pConfig.FlippingSoundVolume > 0) {
				_SoundList['pageFlipping'] = {};
				_SoundList['pageFlipping'].src = (typeof pConfig.FlippingSoundSrc !== 'undefined')
					? pConfig.FlippingSoundSrc : _IncDirPath + 'inc/sound/flip.mp3';
				_SoundList['pageFlipping'].volume = (typeof pConfig.FlippingSoundVolume !== 'undefined')
					? pConfig.FlippingSoundVolume : 0;
			}

			if (_FullScale || _FillScale || _UpScale) {
				_AutoStageHeight = FALSE;
			}
			_AutoMaxHeight = pConfig.AutoMaxHeight || FALSE;
			_MaxHeightOffset = pConfig.MaxHeightOffset || 0,
			_FlexibleContent = pConfig.FlexibleContent || FALSE,
			t = pConfig.FlexibleContentMinWidth, _FlexibleContentMinWidth = t == __undefined ? 768 : t,
			t = pConfig.StartPage, _StartPage = t == __undefined ? 1 : t,
			//_StartPage					= pConfig.StartPage || 1,
			_MinPageLimit = pConfig.MinPageLimit || 0;
			if (_StartPage < _MinPageLimit) _StartPage = _MinPageLimit;
			_MaxPageLimit = pConfig.MaxPageLimit,
			_StartAutoFlip = pConfig.StartAutoFlip || false,
			t = pConfig.AutoFlipEnabled, _AutoFlipEnabled = t == __undefined ? true : t,
			_FullScreenEnabled = (typeof pConfig.FullScreenEnabled === 'undefined') ? TRUE : Boolean(pConfig.FullScreenEnabled);
			// Chromium's compositor cannot keep up with per-frame re-rasters of a
			// zoomed book covering a 5K-class screen and paints white flashes
			// during zoom/pan. Fullscreen is therefore disabled for Chromium-based
			// browsers on screens of ~12+ megapixels (Studio Display, 5K/6K
			// iMac/Pro Display XDR). Chrome on regular displays and all other
			// browsers are unaffected.
			if (_FullScreenEnabled && /Chrome\//.test(navigator.userAgent)) {
				t = window.devicePixelRatio || 1;
				if ((screen.width * t) * (screen.height * t) >= 12000000) {
					_FullScreenEnabled = FALSE;
				}
			}
			_BackgroundColor = (typeof pConfig.BackgroundColor === 'undefined') ? '#d4d4d4' : pConfig.BackgroundColor;
			_BackgroundImage = (typeof pConfig.BackgroundImage === 'undefined') ? null : _IncDirPath + pConfig.BackgroundImage;

			_AutoFlipInterval = pConfig.AutoFlipInterval || 2000,
			t = pConfig.AutoFlipLoop, _AutoFlipLoop = t == __undefined ? false : t,
			_navigationLoop = pConfig.NavigationLoop || FALSE,

			t = pConfig.Preflip, _Preflip = t == __undefined ? TRUE : t,

			_ControlbarToFront = pConfig.ControlbarToFront || TRUE,
			_Thumbnails = (typeof pConfig.Thumbnails === 'undefined') ? TRUE : Boolean(pConfig.Thumbnails),
			t = pConfig.ThumbnailsLazyLoad, _ThumbnailsLazyLoad = t == __undefined ? TRUE : t,
			t = pConfig.ThumbnailsToFront, _ThumbnailsToFront = t == __undefined ? FALSE : t,
			_ThumbnailsAutoHide = pConfig.ThumbnailsAutoHide || 0,
			_ThumbnailsHidden = pConfig.ThumbnailsHidden || TRUE,
			_ThumbnailWidth = pConfig.ThumbnailWidth || 60,
			_ThumbnailHeight = pConfig.ThumbnailHeight || 80,
			_ThumbnailAlwaysCentered = pConfig.ThumbnailAlwaysCentered || FALSE;
			if (!_Thumbnails) {
				_ThumbnailsButtonEnabled = false;
			}

			_Transparency = pConfig.Transparency || FALSE,
			t = pConfig.PageCache, _PageCache = t == __undefined ? 5 : t,
			_NoFlipShadow = pConfig.NoFlipShadow || FALSE,
			t = pConfig.DropShadow, _DropShadow = t == __undefined ? TRUE : t,
			t = pConfig.Emboss, _Emboss = t == __undefined ? TRUE : t,
			t = pConfig.DropShadowOpacity, _DropShadowOpacity = t == __undefined ? 0.2 : t,
			t = pConfig.FlipTopShadowOpacity, _FlipTopShadowOpacity = t == __undefined ? 0.2 : t,
			t = pConfig.FlipShadowOpacity, _FlipShadowOpacity = t == __undefined ? 0.2 : t,
			t = pConfig.EmbossOpacity, _EmbossOpacity = t == __undefined ? 0.2 : t,
			t = pConfig.HardFlipShadowOpacity, _HardFlipShadowOpacity = t == __undefined ? u : t,
			_PreflipArea = pConfig.PreflipArea || 128,
			_SecondaryDragArea = pConfig.SecondaryDragArea || 64,
			_InsideDragArea = _SinglePageMode ? _PreflipArea : pConfig.InsideDragArea || 0,
			_FlipDuration = pConfig.FlipDuration || 400,

			_BookOffsetX = pConfig.BookOffsetX || 0,
			_BookOffsetY = pConfig.BookOffsetY || 0;

			if (_SinglePageMode) {
				if (_VerticalMode) {
					_BookOffsetY -= _CoverHeight / 2;
				} else {
					if (_RightToLeft && !_SinglePageMode) {
						_BookOffsetX += _CoverWidth / 2;
					} else {
						_BookOffsetX -= _CoverWidth / 2;
					}
				}
			}

			_PerformanceAware = has3d ? pConfig.PerformanceAware || FALSE : TRUE,
				_PagerText = pConfig.PagerText || '#~#–#',
				t = pConfig.PagerSkip, _PagerSkip = t == __undefined ? TRUE : t,
				t = pConfig.HashControl, _HashControl = t == __undefined ? TRUE : t,
				t = pConfig.ZoomEnabled, _ZoomEnabled = t == __undefined ? TRUE : t,
				_ClickZoom = pConfig.ClickZoom || TRUE,
				t = pConfig.ZoomFlip, _ZoomFlip = t == __undefined ? FALSE : t,
				t = pConfig.PinchZoom, _PinchZoom = t == __undefined ? FALSE : t,
				t = pConfig.MaxZoomLevel, _MaxZoomLevel = (t == __undefined || t <= 0 || t > 1) ? 1 : t,
				t = pConfig.MouseControl, _MouseControl = t == __undefined ? TRUE : t,
				_GoogleAnalyticsMeasurementId = pConfig.GoogleAnalyticsMeasurementId || '',
				_DisableSelection = pConfig.DisableSelection || TRUE;

			_DownloadUrl = typeof pConfig.DownloadUrl !== 'undefined' ? pConfig.DownloadUrl : null;

			_DownloadButtonEnabled = typeof pConfig.DownloadButtonEnabled !== 'undefined' ? pConfig.DownloadButtonEnabled : false;
			if (!_DownloadUrl) {
				_DownloadButtonEnabled = false;
			}

			_LinksTooltipEnabled = typeof pConfig.LinksTooltipEnabled !== 'undefined' ? pConfig.LinksTooltipEnabled : false;
			if (_LinksTooltipEnabled && (typeof touchType !== 'undefined')) {
				_LinksTooltipEnabled = false;
			}

			_TooltipText = pConfig.TooltipText || '#CCCCCC';
			_TooltipBackground = pConfig.TooltipBackground || '#272727';
			_LinksTooltipContent = pConfig.LinksTooltipContent || 'Click to open this link';
			_LinkFading = typeof pConfig.LinkFading !== 'undefined' ? pConfig.LinkFading : false;
            _LinkShowPermanently = typeof pConfig.LinkShowPermanently !== 'undefined' ? pConfig.LinkShowPermanently : false;
			_LinkBackground = pConfig.LinkBackground || '#0000ff';

			

			_ControlbarTooltipsEnabled = typeof pConfig.ControlbarTooltipEnabled !== 'undefined' ? pConfig.ControlbarTooltipEnabled : false;

			_InvisibleLinks = typeof pConfig.InvisibleLinks !== 'undefined' ? pConfig.InvisibleLinks : false;
			if (_InvisibleLinks == true) {
				_LinkBackground = 'transparent';
			}

			if (typeof pConfig.MobileImageMaxHeight !== 'undefined') {
				_MobileImageMaxHeight = pConfig.MobileImageMaxHeight;
			}
			if (typeof pConfig.MobileImageMaxWidth !== 'undefined') {
				_MobileImageMaxWidth = pConfig.MobileImageMaxWidth;
			}

			_NavigationArrowsEnabled = (typeof pConfig.NavigationArrowsEnabled !== 'undefined')
				? pConfig.NavigationArrowsEnabled : false;

			if (typeof pConfig.NavigationButtonsEnabled !== 'undefined') {
				_NavigationButtonsEnabled = pConfig.NavigationButtonsEnabled;
			} else if (_NavigationArrowsEnabled) {
				_NavigationButtonsEnabled = false;
			} else {
				_NavigationButtonsEnabled = true;
			}

			_NavigationArrowsColors.color = (typeof pConfig.NavigationArrowsColor !== 'undefined')
				? pConfig.NavigationArrowsColor : '#b5b5b5';

			_NavigationArrowsColors.hoverColor = (typeof pConfig.NavigationArrowsHover !== 'undefined')
				? pConfig.NavigationArrowsHover : '#ffffff';

			_ControlbarColors = {};
			if (typeof pConfig.ControlbarColor1 !== 'undefined') {
				_ControlbarColors.color1 = pConfig.ControlbarColor1;
			}

			if (typeof pConfig.ControlbarColor2 !== 'undefined') {
				_ControlbarColors.color2 = pConfig.ControlbarColor2;
			}

			if (typeof pConfig.ControlbarBackground !== 'undefined') {
				_ControlbarColors.background = pConfig.ControlbarBackground;
			}

			if (typeof pConfig.ControlbarPagerText !== 'undefined') {
				_ControlbarColors.pagerText = pConfig.ControlbarColor1;
			}

			_ControlbarColors.searchInputBackground = pConfig.ControlbarBackground;
			_ControlbarColors.searchInputText = pConfig.ControlbarColor1;
			_ControlbarColors.searchScreenBackground = pConfig.ControlbarBackground;

			if (typeof pConfig.ControlbarSearchResultsBackground !== 'undefined') {
				_ControlbarColors.searchResultsBackground = pConfig.ControlbarSearchResultsBackground;
			}

			if (typeof pConfig.ControlbarSearchResultsSeparator !== 'undefined') {
				_ControlbarColors.searchResultsSeparator = pConfig.ControlbarSearchResultsSeparator;
			}

			if (typeof pConfig.ControlbarSearchResultsText !== 'undefined') {
				_ControlbarColors.searchResultsText = pConfig.ControlbarSearchResultsText;
			}
			if (typeof pConfig.ZoomCursorColor !== 'undefined') {
				_ZoomCursorColor = pConfig.ZoomCursorColor;
			}
			if (typeof pConfig.ZoomCursorEnabled !== 'undefined') {
				_ZoomCursorEnabled = pConfig.ZoomCursorEnabled;
			}
			if (typeof pConfig.NavbarMinHeight !== 'undefined') {
				_NavbarMinHeight = pConfig.NavbarMinHeight;
			}
			if (typeof pConfig.NavbarMinWidth !== 'undefined') {
				_NavbarMinWidth = pConfig.NavbarMinWidth;
			}
			if (typeof pConfig.UseNavBarMinSizes !== 'undefined') {
				_UseNavBarMinSizes = pConfig.UseNavBarMinSizes;
			}
			if (typeof pConfig.NavBarMobile !== 'undefined') {
				_NavBarMobile = pConfig.NavBarMobile;
				_NavBarTablet = _NavBarMobile;
			}
			if (typeof pConfig.ChangeQualityOnMobile !== 'undefined') {
				_ChangeQualityOnMobile = pConfig.ChangeQualityOnMobile;
			}
		},

		// Some variable initializations
		resetMainVariables = function() {
			bookCOffsX = bookCOffsY = 0;
			bookScale = 1;
			textInput = FALSE; // no text input in progress
			n0 *= 2;
			D180 = n0 + 10;
			D2 = 2;
			D90 = D180 / D2;
			D100 = D90 + 10;
			AM = D180 / PI;
			resetBookVariables();
		},
		resetBookVariables = function() {
			// the opened book size, depending on the book orientation and the page size
			bookWidth = _CoverWidth * 2;
			bookHeight = _CoverHeight * 1;

			if (_VerticalMode) {
				bookWidth = _CoverWidth;
				bookHeight = _CoverHeight * 2;
			}

			if (_SinglePageMode) {
				bookWidth = _CoverWidth;
				bookHeight = _CoverHeight;
			}

			largeCover = _CoverWidth > _PageWidth || _CoverHeight > _PageHeight;
			maskpw = Md(getDist(_PageWidth, _PageHeight) / 2) * 2;
			maskcw = Md(getDist(_CoverWidth, _CoverHeight) / 2) * 2;
			HD = _VerticalMode ? 1 : 2;
			VD = 3 - HD;
			VM = _VerticalMode ? -1 : 1;
		},
		resetContentVariables = function() {
			pages = [];
			renderedPages = [];
			pagesToPreload = [];
			hiddenPages = [];
			removedPages = [];
		},
		resetFlippingVariables = function() {
			flipping = FALSE;
			flipOrder = [];
			flipQueue = [];
			maxFlips = 4;
			autoFlip = FALSE,
				autoPreflip = FALSE,
				manualPreflip = FALSE,
				manualFlipFD = null,
				manualFlipTouchId = null,
				cancelFlip = FALSE;
			leftPageW = leftPageH = rightPageW = rightPageH = 0;
			baseLeftWidth = shBaseLeftWidth = baseRightWidth = shBaseRightWidth =
				leftWidth = shLeftWidth = rightWidth = shRightWidth = __undefined;
		},
	resetPages = function() {
		// reset displayed content (remove everything)
		_spreadLoadsDone = false;
		_deferredPageLoads = [];
		pagesToPreload = [];
		renderedPages = [];
		hiddenPages = [];
			__bookc.innerHTML = '';
			// regenerate whole content
			setPages();
		},

		// Page Order setup - this is the list of all pages in the book with all associated data
		pageOrderSetup = function($pageData) {
			resetContentVariables();
			for (var i = 0,
					cnt = 0,
					page = 0,
					pn = 1,
					tag,
					$page,
					cover,
					havecover = FALSE,
					outer,
					forcedCover,
					singleRightToLeft,
					pageData;

			cnt < $pageData.length; cnt++) {

				$page = $pageData[cnt]; // page definition DIV
				tag = $page.getAttribute('class');
				cover = tag === 'cover'; // is cover?
				singleRightToLeft = _SinglePageMode && _RightToLeft;
				if (cover) {
					havecover = cover;
				}
				outer = tag === 'outerpage'; // is it an outer page (page before first page, or page after last page)
				if (_SinglePageMode) {
					outer = false;
				}
				forcedCover = outer || cover; // temp variable
				if (!cover && tag !== 'page' && !outer) {
					continue;
				}

				if (i == 0 && !outer && !_AlwaysOpened) {
					if (!singleRightToLeft) {
						setPage(page++, {
							__PageNumber: 0,
							__notEmpty: FALSE
						});
					}
				} else if (_SinglePageMode && !_RightToLeft) {
				setPage(page++, getPageData(dom.create('div', {'class': 'page'}), true, cover, undefined, page));
			}


				if (i === 0 && outer) {
					_AlwaysOpened = FALSE;
				}

				pageData = getPageData($page, outer, cover, forcedCover, page);
				if (typeof pageData.__PageNumber === 'undefined') {
					pageData.__PageNumber = pn++;
				} else if (pageData.__PageNumber > 0) {
					pn = pageData.__PageNumber + 1;
				}

				setPage(page++, pageData);

				if (singleRightToLeft) {
					setPage(page++, getPageData(dom.create('div', {'class': 'page'}), true, cover, undefined, page));
				}

				i++;
			}
			maxPage = page - 1;
			if (_HardCover) {
				var maxPageInfo = pages[maxPage];
				if (typeof maxPageInfo !== 'undefined') {
					maxPageInfo.__isHard = true;
				}
			}
			fixLastPage();

			if (_RightToLeft) {
				pages.reverse(); // Reverse page order if Right To Left
			}
			if (!havecover) largeCover = FALSE;

			pageLimit(_MinPageLimit, _MaxPageLimit);
			resetGotoVariables();
		},
		addNewPages = function($pageData, pPN, pRenumber) {
			// insert a new page on the fly
			pPN = pPN || PN;
			pRenumber = pRenumber || FALSE;
			if (pPN == 0 && !_AlwaysOpened) pPN++;

			for (var i = 0,
					cnt = 0,
					page = pPN,
					pn = 1,
					tag,
					$page,
					cover,
					havecover = FALSE,
					outer,
					forcedCover,
					pageData;

				cnt < $pageData.length; cnt++) {

				$page = (function(){ var _d = dom.create('div'); _d.innerHTML = $pageData[cnt]; return _d.firstElementChild || _d; })();
				cover = (tag = $page.getAttribute("class")) == "cover";
				if (cover) havecover = cover;
				outer = (tag == "outerpage");
				forcedCover = (outer || cover);
				if (!cover && tag != "page" && !outer) continue;
				pageData = getPageData($page, outer, cover, forcedCover, cnt);
				maxPage++;
				pages.splice(pPN, 0, pageData);

				i++;

			}

			fixLastPage();
			pageLimit();
			resetGotoVariables();
			resetPages();
		},
		removePages = function(pPN, pNumberOfPages, pRenumber) {
			// remove a page from the book on the fly
			pPN = pPN || PN;
			pNumberOfPages = pNumberOfPages || 1;
			pRenumber = pRenumber || FALSE;
			if (pPN == 0 && !_AlwaysOpened) pPN++;

			pages.splice(pPN, pNumberOfPages);
			maxPage -= pNumberOfPages;

			fixLastPage();
			pageLimit();
			resetGotoVariables();

			if (PN > maxPage) {
				PN = maxPage - maxPage % 2;
			}
			if (PN < 0) {
				PN = 0; // eeee
			}

			resetPages();
		},
		fixLastPage = function() {
			// fix page order ending to even number of pages by adding or removing unneaded empty page.
			if (maxPage % 2 == 0) {
				if (!pages[maxPage].__notEmpty) {
					pages.splice(maxPage, 1);
					maxPage--;
				} else setPage(++maxPage, {
					__PageNumber: 0,
					__notEmpty: FALSE
				});
			}
		},
		setPage = function(pPN, pData) {
			pages[pPN] = pData;
		},
		getPageData = function($page, outer, cover, forcedCover, pageNumber) {
			outer = outer || FALSE;
			cover = cover || (pageNumber === 1);
			if (!cover && typeof _MaxPageLimit !== 'undefined') {
				if (_SinglePageMode) {
					cover = pageNumber === _MaxPageLimit - 2;
				} else {
					cover = pageNumber === _MaxPageLimit - 1;
				}
			}
			forcedCover = forcedCover || FALSE;
			var data = dom.data($page);
			var demboss = data.disableEmbossing;
			var isHard = _HardPages || data.hard === true;
			if (_HardCover && cover) {
				isHard = true;
			}
			var pageData = { //__PageWidth: data.pageWidth,
				//__PageHeight: data.pageHeight,
				__Unload: !(data.unload == FALSE),
				__BackgroundFiles: [],
				//__MainBackgroundFile: data.MainBackgroundFile,
				__HtmlFile: data.htmlFile,
				__HtmlData: $page.innerHTML,
				__ThumbnailImageUrl: data.thumbnailImage,
				__ThumbnailImage: undefined,
				__DisableEmbossing: typeof demboss === 'undefined' ? !_Emboss : demboss,
				__TransparentPage: data.transparentPage == TRUE,
				__RemovablePage: data.removablePage == TRUE,
				__PageNumber: outer ? 0 : data.pageNumber,
				__PageName: data.pageName,
				__PageLabel: data.pageLabel,
				__AutoFlipInterval: data.autoFlipInterval,
				__Data: data.data,
				__renderWidth: forcedCover ? _CoverWidth : _PageWidth,
				__renderHeight: forcedCover ? _CoverHeight : _PageHeight,
				__maskSize: cover ? maskcw : maskpw,
				__isHard: isHard,
				__isCover: forcedCover,
				__outer: outer,
				__notEmpty: TRUE
			};
			var backgroundFile = (typeof data.backgroundFileDesktop !== 'undefined') ? data.backgroundFileDesktop : __undefined;
			// Backwards-compatible fallback: if a legacy template/page only provides the mobile attribute,
			// treat it as the single background image.
			if (typeof backgroundFile === 'undefined' && typeof data.backgroundFileMobile !== 'undefined') {
				backgroundFile = data.backgroundFileMobile;
			}
			if (typeof backgroundFile !== 'undefined') {
				pageData.__BackgroundFiles.push({
					type: 'desktop',
					url: backgroundFile,
					set: false
				});
			}
			if (pageData.__isHard) pageData.__DisableEmbossing = TRUE;
			pageData.__isLoaded = !pageData.__HtmlFile;

			return pageData;
		},
		getStringCheckSum = function(st) {
			st = st[s1]();
			for (var a = 0, b = 1, l = 0, i = 0, c; i < st[s3]; i++) {
				c = st[s2](i) - n7 / 2;
				c = c == 0 ? 1 : c;
				(c < 0 || c >= n7) ? c = 0: a += c, b *= -1, b += c + a % 8, a += b % 16, l++;
			}
			return {
				a: a & n1,
				b: negfix((b + l) & n1)
			};
		},
		compareStringCheckSum = function(s1, s2) {
			return s1.a == s2.a && s1.b == s2.b;
		},
		generateABC = function() {
			return generateString(97, 123) + generateString(n7 + 1, 91) + generateString(47, 58) + String[s15](36);
		},
		generateString = function(st, en) {
			for (var chars = "", i = st; i < en; i++) {
				chars += String[s15](i);
			}
			return chars;
		},
		E = function(input) {
			for (var l = input[s3], rnd = negfix(n0 - input[0]), out = [], i = 0; i < l; i++) out[i] = (input[i] + rnd) & n1;
			return out;
		},
		negfix = function(i) {
			return i < 0 ? i + n2 : i;
		},
		B = function(input, code) {
			for (var sub = code, rn = input[s3], out = input, i = 0; i < rn; i++) sub = deltasub(out, i, sub);
			for (var sub = code, i = rn - 1; i >= 0; i--) sub = deltasub(out, i, sub);
			return out;
		},
		deltasub = function(out, i, sub) {
			if ((out[i] -= sub) < 0) out[i] += n2;
			return out[i];
		},
		C = function(input) {
			var bit = 0,
				by = 0,
				byte6 = 0,
				out = [],
				l = input[s3],
				maxByte = Mf((l * 6) / 8);
			input.push(bit, by);
			while (by++ < maxByte) {
				out.push(((input[byte6] + n7 * input[byte6 + 1] + n7 * n7 * input[byte6 + 2]) >> bit) & n1);
				bit += 8;
				while (bit >= 6) {
					bit -= 6;
					byte6++;
				}
			}
			return out;
		},
		D = function(input) {
			for (var l = input[s3], out = [], chr = generateABC(), i = 0; i < l; i++) out.push(chr.lastIndexOf(input[s11](i, 1)));
			return out;
		},

		//-------------------------------------------------------------------------------------

		// variables that helps book positioning
		baseLeftWidth, shBaseLeftWidth, baseRightWidth, shBaseRightWidth,
		leftWidth, shLeftWidth, rightWidth, shRightWidth,
		rightWidthMax = function(pW) {
			rightWidth = rightWidth < pW ? pW : rightWidth;
		},
		leftWidthMax = function(pW) {
			leftWidth = leftWidth < pW ? pW : leftWidth;
		},
		setBookOffset = function() {
			var ox = _BookOffsetX - ((_CenterSinglePage && !_VerticalMode) ? Mr((rightWidth - leftWidth) / 2) : 0);
			var oy = _BookOffsetY - ((_CenterSinglePage && _VerticalMode) ? Mr((rightWidth - leftWidth) / 2) : 0);

			if (_NavigationArrowsEnabled && __navigationArrowsManager && zF < 0.01) {
				__navigationArrowsManager.shift(ox, oy);
			}

			if (bookCOffsX == ox && bookCOffsY == oy) {
				return;
			}
			changed = true;
			bookCOffsX = ox, bookCOffsY = oy;
			dom.css(__bookoffs, {
				transform: tr(bookCOffsX, bookCOffsY)
			});

		},
		//-------------------------------------------------------------------------------------

		// This is the heart of the book rendering
		setPages = function() {
			// this function places the active pages on the DOM.
			var lastPages = renderedPages;
			var lastPreload = pagesToPreload;
			var leftPages = [];
			var rightPages = [];
			var pagesToEnable = [];
			var pagesToDisable = [];
			var PFeventsToCall = [];
			var IPN = PN;
			var NPN = PN + 1; // force render

			// visible width on the left/right (upper/bottom) side of the book
			leftWidth = rightWidth = shBaseLeftWidth = shBaseRightWidth = 0;

			// ----------------------------------------------------------------------------------------------------------------------------- **********
			// add flipping pages if there are any
			flipPages = [];
			if (flipping) { // we have animated pages!
				if (flipDir < 0) IPN = endPN; //skipping flipping pages from normal display
				else NPN = endPN + 1;
				for (var i = 0, pageA, pageB; i < flipOrder.length; i++) {
					pageA = flipOrder[i].__startPagePN,
					pageB = flipOrder[i].__endPagePN;
					pages[pageA].__flip = pages[pageB].__flip = pages[pageB].__animated = TRUE;
					pages[pageA].__animated = FALSE;
					if (flipOrder[i].__flipType != 1) {
						flipPages.splice(0, 0, pageA);
						flipPages.push(pageB);
					} else {
						flipPages.splice(i, 0, pageB);
						flipPages.splice(i, 0, pageA);
					}
					if (!flipOrder[i].__started) {
						PFeventsToCall.push({
							e: 0,
							p: pageA
						}); // ******* QUEUE onFlip
						PFeventsToCall.push({
							e: 0,
							p: pageB
						}); // ******* QUEUE onFlip
						flipOrder[i].__started = TRUE;
					}
					if (pages[pageA].__onTop) {
						PFEventDispatcher(3, pageA);
						pages[pageA].__onTop = FALSE;
					} // ******* INST onTopEnd
					if (pages[pageB].__onTop) {
						PFEventDispatcher(3, pageB);
						pages[pageB].__onTop = FALSE;
					} // ******* INST onTopEnd
				}
			}


			// ----------------------------------------------------------------------------------------------------------------------------- **********
			pagesToPreload = [];
			// now add the fix pages
			// LEFT SIDE PAGES
			var ipn = IPN, // current page number
				FR = pages[ipn].__notEmpty, // ForceRender if the actual page isn't an empty page
				PL = FR ? _PageCache : 0; // if the first page isn't empty, Preaload will be required for next pages.
			while (ipn >= 0) { // check left side pages' visibility
				if (FR || ((pages[ipn].__isCover && !pages[ipn].__outer) && largeCover)) {
					// Add page if Forced to render
					// or if it is a Large Cover and not Outer page
					leftPages.push(ipn); // Add it to the render list.
					FR = (_Transparency && pages[ipn].__TransparentPage); // if transparency is enabled globally and for that page, then Force render the next!
				} else if (PL > 0) { // if it's not the case, add preloaded pages.
					if (pages[ipn].__notEmpty) pagesToPreload.push(ipn); // if it isn't an empty page Preload it,
					if (pages[ipn + 1].__notEmpty) pagesToPreload.push(ipn + 1); // and its pair too
					PL--; // decrement preload counter
				}
				if (!FR && PL == 0 && ipn > 4) ipn = 2;
				else ipn -= 2; // sok oldalnal atugorjuk amit ugyse lathatunk...

			}
			// RIGHT SIDE PAGES
			var npn = NPN;
			FR = pages[npn].__notEmpty;
			PL = FR ? _PageCache : 0;
			while (npn <= maxPage) {
				if (FR || ((pages[npn].__isCover && !pages[npn].__outer) && largeCover)) {
					rightPages.push(npn);
					FR = (_Transparency && pages[npn].__TransparentPage);
				} else if (PL > 0) {
					if (pages[npn - 1].__notEmpty) pagesToPreload.push(npn - 1);
					if (pages[npn].__notEmpty) pagesToPreload.push(npn);
					PL--;
				}
				if (!FR && PL == 0 && npn < maxPage - 4) npn = maxPage - 2;
				else npn += 2; // sok oldalnal atugorjuk amit ugyse lathatunk...
			}

			// ----------------------------------------------------------------------------------------------------------------------------- **********
			renderedPages = []; // the list of the pages to display, it is generated from the previous LEFT and RIGHT pages
			var ll = leftPages.length, // number of pages on the left side
				rl = rightPages.length, // number of pages on the right side
				len = ll > rl ? ll : rl, // len is the longest length
				pg, t;
			for (var i = 0; i < len; i++) { // create z-index order based Page List / szepen sorban z-index alapjan sorba tesszuk az oldalakat!
				if (i < rl) {
					t = rightPages[i]; // page number on the right side
					pg = pages[t]; // pageObject of this page.
					rightWidthMax(_VerticalMode ? pg.__renderHeight : pg.__renderWidth); //visible width on the right side...
					if (!pg.__outer) shBaseRightWidth = rightWidth;
					renderedPages.splice(0, 0, t); // Put this page at the begining of the z-index order / itt adjuk a listahoz a lapot.
					pg.__flip = FALSE; // this page is not flipping (maybe it was in the previous session, so clear it!
					if (i == 0 && !flipping) { // if this is the topmost page, and there isn't any flip animation
						if (!pg.__onTop) { // and it wasn't already on top, then set onTop flag, and queue on top event!
							PFeventsToCall.push({
								e: 2,
								p: t
							}); // ******* QUEUE onTop
							pg.__onTop = TRUE;
						}
					} else if (pg.__onTop) { // if it was set az top page, then clear that flag, and queue on top end event!
						PFEventDispatcher(3, t); // ******* INST onTopEnd
						pg.__onTop = FALSE;
					}
				}
				if (i < ll) {
					t = leftPages[i];
					pg = pages[t];
					leftWidthMax(_VerticalMode ? pg.__renderHeight : pg.__renderWidth);
					if (!pg.__outer) shBaseLeftWidth = leftWidth;
					renderedPages.splice(0, 0, t); // ***** onTop!!!
					pages[leftPages[i]].__flip = FALSE;
					if (i == 0 && !flipping) {
						if (!pg.__onTop) {
							PFeventsToCall.push({
								e: 2,
								p: t
							}); // ******* QUEUE onTop
							pg.__onTop = TRUE;
						}
					} else if (pg.__onTop) {
						PFEventDispatcher(3, t); // ******* INST onTopEnd
						pg.__onTop = FALSE;
					}
				}
				// if( i==0 ) akkor az L es R pages egyarant kaphat egy onTop esemenyt!!!
			}

			// ----------------------------------------------------------------------------------------------------------------------------- **********
			// set book centering according to the calculated LEFT and RIGHT side max width
			baseLeftWidth = leftWidth, baseRightWidth = rightWidth;
			// if there's an active flipping animation, add these pages to the rendered pages list
			if (flipping) renderedPages = renderedPages.concat(flipPages);
			else setBookOffset();
			if ((flipping && (!_HardCover || _PerformanceAware)) || !flipping) {
				setPageOverlays(shBaseLeftWidth, shBaseRightWidth);
			}

			// ----------------------------------------------------------------------------------------------------------------------------- **********
			// check for new pages to display, and pages to remove from the display
			for (var i = 0; i < renderedPages.length; i++) {
				t = renderedPages[i];
				if (lastPages.lastIndexOf(t) < 0) {
					pagesToEnable.push(t);
				}
			}
			pagesToEnable = pagesToEnable.concat(pagesToPreload);
			for (var i = 0; i < lastPages.length; i++) {
				t = lastPages[i];
				if (renderedPages.lastIndexOf(t) < 0) pagesToDisable.push(t);
			}
			for (var i = 0; i < lastPreload.length; i++) {
				t = lastPreload[i];
				if (pagesToPreload.lastIndexOf(t) < 0 &&
					renderedPages.lastIndexOf(t) < 0) pagesToDisable.push(t);
			}

			// remove old pages from the DOM.
			for (var i = 0, tp; i < pagesToDisable.length; i++) {
				tp = pagesToDisable[i];
				hi = hiddenPages.lastIndexOf(tp);
				t = pages[tp];
				//if( pagesToPreload.lastIndexOf( tp ) < 0 ) {
				if (t.__onTop) {
					PFEventDispatcher( 3, tp );
					PFeventsToCall.push({
						e: 3,
						p: tp
					}); // ******* QUEUE onTopEnd
					pg.__onTop = FALSE;
				}
				if (t.__Unload !== FALSE) {
					// Remove page
					if (hi >= 0) hiddenPages.splice(hi, 1);

					PFEventDispatcher(5, tp); // ******* INST onUnload
					t.$p.remove();
					if (t.__masked) {
						t.__masked = FALSE;
						t.$m.remove();
						if (t.$fsc) t.$fsc.remove();
					}
					if (t.$hts) {
						t.$hts.remove();
						t.$hts = __undefined;
					}
				} else if (hi < 0) {
					// hide page.
					//t.__flip = FALSE;
					//t.__animated = FALSE;
					if (t.__masked) removePageMask(tp);
					dom.css(t.$p, "display", "none");
					hiddenPages.push(tp);
					PFeventsToCall.push({
						e: 7,
						p: tp
					}); // ******* QUEUE Hide
				}
				//}
			}

			// add new pages to the DOM
			var p, $p, $c, rw, rh, T, L, R, hi, pl;
			Array.from({length: pagesToEnable.length}).forEach(function(_, i) {
				/* felmerulo problemak:
				- melyik oldal lapozodik, annak maszk kell
				- de mivel nem akarjuk ujrarakni ami mar kinnvolt, a maszkot le kell tudni venni es visszatenni!
				tovabba itt kell beallitani a div-ek css-et:
				- meret, pozicionalas, esetlegeg effekt reset (korabbi verzio kinnlete miatt, tehat resteljuk amit kell!
				meg kell oldani a div maszkositasat es eltunteteset (.css poziciok valtoznak!!!)
				preload is megoldando (kulon hideolt div-ben)*/
				p = pagesToEnable[i]; // page number of the new page
				hi = hiddenPages.lastIndexOf(p);
				pl = pagesToPreload.lastIndexOf(p);
				if (hi >= 0) {
					if (pl < 0) {
						hiddenPages.splice(hi, 1); // remove from hidden pages
						dom.css(pages[p].$p, "display", "");
						PFeventsToCall.splice(0, 0, {
							e: 8,
							p: p
						}); // ******* Priority QUEUE onShow
					}
				} else {
					if (pl < 0) { // the page is not a preloaded page, make it visible
						PFeventsToCall.splice(0, 0, {
							e: 8,
							p: p
						}); // ******* Priority QUEUE onShow
					}
				__bookc.insertAdjacentHTML('beforeend', pageDOM(p)); // add this page to the DOM
				$p = pages[p].$p = p$(p);
					PFeventsToCall.splice(0, 0, {
						e: 4,
						p: p
					}); // ******* Priority QUEUE onLoad
					// let's make a page with default attributes.
					rw = pages[p].__renderWidth; // render width/height
					rh = pages[p].__renderHeight;

					if (_VerticalMode) { // T->R, L->T, R->B, B->L
						L = (_CoverWidth - rw) / 2;
						T = p % 2 ? _CoverHeight : _CoverHeight - rh;
						R = auto;
					} else if (_SinglePageMode) {
						T = (_CoverHeight - rh) / 2;
						L = p % 2 ? _CoverWidth / 2 : _CoverWidth - rw;
						R = p % 2 ? _CoverWidth - rw : auto;
					} else {
						T = (_CoverHeight - rh) / 2;
						L = p % 2 ? auto : _CoverWidth - rw;
						R = p % 2 ? _CoverWidth - rw : auto;
					}
					dom.css($p, {
						"position": "absolute",
						"overflow": "hidden",
						"width": rw,
						"height": rh,
						"top": T,
						"left": L,
						"right": R
					});
			// place previously loaded html content into the new page in the DOM
			$c = pages[p].$c = c$(p);

			///// images
			// Always show loader on freshly appended pages that have a background image
			if (pages[p].__BackgroundFiles && pages[p].__BackgroundFiles.length > 0) {
				setLoadingBackgroundImage($p, false);
			}
			setSuitableBackgroundImage(p);
					$c.innerHTML = pages[p].__HtmlData; // fill the page with content
					if (pages[p].__HtmlFile) {
						fetch(pages[p].__HtmlFile).then(function(r){return r.text()}).then(function(html){$c.innerHTML=html});
					}
					if (!pages[p].__isCover && !pages[p].__DisableEmbossing) { // lehet lehetne elore belebaszni a html-be!
					$c.insertAdjacentHTML('afterend', div("pf-emboss-" + (p % 2 ? "right" : "left"), "page" + p + "emboss"));
					dom.css(e$(p), {
							"position": "absolute",
							"overflow": "hidden",
							"width": (_VerticalMode ? rh/7 : rw/7),
							"height": (_VerticalMode ? rw : rh),
							"top": (_VerticalMode ? (p % 2 ? -rw / 2 : rh - rw / 2) : 0),
							"left": (_VerticalMode ? (p % 2 ? "50%" : auto) : (p % 2 ? 0 : auto)),
							"right": (_VerticalMode ? (p % 2 ? auto : "50%") : (p % 2 ? auto : 0)),
							"transform-origin": (_VerticalMode ? (p % 2 ? "0% 50%" : "100% 50%") : ""),
							"transform": (_VerticalMode ? "rotate(90deg)" : ""),
							"opacity": _EmbossOpacity
						});
					}
					if (pl >= 0) {
						dom.css($p, "display", "none");
						hiddenPages.push(p);
						PFeventsToCall.push({
							e: 7,
							p: p
						}); // ******* QUEUE onHide
					}
				}
			});

			//var zi = 1;	// z-index	let's start from 1, dropshadow is 0, we set everything from base...
			for (var i = 0, p, pp, $p, rw, rh, zi = 2; i < renderedPages.length; i++) { // go trough all the page actually rendered
				p = renderedPages[i], // current page number
					//pr = _RightToLeft? maxPage-p: p;
					pp = pages[p],
					$p = pp.$p, //pp,				// the jQ page
					rw = pp.__renderWidth, // render sizes
					rh = pp.__renderHeight;
				if (pp.__flip && pp.__masked) { // page is flipping and already masked
					if (!_NoFlipShadow && pp.__animated) {
						dom.css(pp.$fsc, {
							"z-index": zi++
						});
					}
					dom.css(pp.$m, {
						"z-index": zi++
					});
				} else if (pp.__flip && !pp.__masked) { // page is flipping, but not masked yet
					if (flipType == 2) { // the page doesn't need mask (hardflip)
						var zIndex = zi++;
						dom.css($p, {
							"z-index": zIndex,
							"transform-origin": _VerticalMode ? (p % 2 ? "50% 0%" : "50% 100%") : (p % 2 ? "0% 50%" : "100% 50%"),
							"backface-visibility": "hidden"
						});
						if (p % 2 == 0 && ((_HardCover && p - 1 === 1) || _HardPages) && _SinglePageMode) {
							dom.css($p, 'display', 'none');
						}
						if (!_NoFlipShadow && !pp.$hts) {
							pp.$c.insertAdjacentHTML('afterend', div("pf-hard-topshadow", "page" + p + "hardtopshadow"));
							pp.$hts = hts$(p);
							dom.css(pp.$hts, {
								"position": "absolute",
								"top": 0,
								"left": 0,
								"width": "100%",
								"height": "100%",
								"background": "rgba(0,0,0," + _HardFlipShadowOpacity + ")"
							});
						}
					} else { // page is flipping, so create masks!
						//addmask when needed (flipping page yet without mask, only if needed!!!)
						(function() { var _w = dom.create("div"); _w.innerHTML = div("pf-mask", "page" + p + "mask"); var wrapper = _w.firstElementChild; $p.parentElement.insertBefore(wrapper, $p); wrapper.appendChild($p); })();
						pp.$m = m$(p)
						var ms = pp.__maskSize,
							animated = -pp.__animated;
						// set mask position...
						dom.css(pp.$m, {
							"position": "absolute",
							"right": _VerticalMode ? auto : "50%",
							"top": _VerticalMode ? _CoverHeight - ms : (_CoverHeight - ms) / 2,
							"left": _VerticalMode ? (_CoverWidth - ms) / 2 : auto,
							"width": ms,
							"height": ms,
							"transform-origin": _VerticalMode ? "50% 100%" : "100% 50%",
							"overflow": "hidden"
						});
						// adjust page position

						dom.css($p, {
							"top": _VerticalMode ? auto : (ms - rh) / 2,
							"bottom": _VerticalMode ? (p % 2 ? -rh : 0) : auto,
							"left": auto,
							"right": _VerticalMode ? (ms - rw) / 2 : (p % 2 ? -rw : 0),
							"z-index": ""
						});
						if (!_NoFlipShadow) {
							if (animated) {
								//arnyek nem kell minden esetben, ezt korabban jelolni kell!
								pp.$c.insertAdjacentHTML('afterend', div("pf-flip-topshadow", "page" + p + "fliptopshadow"));
								pp.$fts = fts$(p);

								dom.css(pp.$fts, {
									"position": "absolute", // ***** vertikalis mod...
									"top": (rh - ms) / 2,
									"left": rw / 2 - D100,
									"width": D100,
									"height": ms,
									"transform-origin": "100% 50%",
									"overflow": "hidden",
									"opacity": _FlipTopShadowOpacity
								});

							pp.$m.insertAdjacentHTML('beforebegin', div("pf-flip-shadow-container", "page" + p + "flipshadowcontainer",
								div("pf-flip-shadowA", "page" + p + "flipshadowA") +
								div("pf-flip-shadowB", "page" + p + "flipshadowB")));
							pp.$fsc = fsc$(p);
							pp.$fsA = fsA$(p);
							pp.$fsB = fsB$(p);
								setFlipShadow(p, zi++, rh, rw, ms);
							}
						}
						dom.css(pp.$m, {
							"z-index": zi++
						});
						pp.__masked = TRUE;
					}
					//bzi++;
				} else if (!pp.__flip && pp.__masked) {
					// the page have a mask, but didn't need it anymore, so remove it, also the shadows
					removePageMask(p);
					dom.css($p, "z-index", zi++);
				} else {
					if (pp.$hts) {
						pp.$hts.remove();
						pp.$hts = __undefined;
					}
					dom.css($p, "z-index", (pp.__outer ? 0 : zi++));
				}
			}
			// ***** cache and unload

			//finally call the event handlers - use trigger event instead!!!!!
			for (i = 0; i < PFeventsToCall.length; i++) {
				PFEventDispatcher(PFeventsToCall[i].e, PFeventsToCall[i].p);
			}
			setPageCheckVariables();
			if (_Thumbnails) setThumbnailsOffset();
			updateCursor();
		},
		updateCursor = function(cursorName) {
			if (_ZoomCursorEnabled && __cursorManager) {
				var _pages = document.querySelectorAll('.pf-page-container');
				if (typeof zF !== 'number' || (flipping || (flipQueue && flipQueue.length > 0) || (flipOrder && flipOrder.length > 0))) {
					__cursorManager.setCursor(_pages);
				} else if ((zF > 0.02 && typeof cursorName === 'undefined') || cursorName === 'zoomout') {
					__cursorManager.setCursor(_pages, 'zoomout');
				} else if ((zF < 0.02 && typeof cursorName === 'undefined') || cursorName === 'zoomin') {
					if (bookScale < 1) {
						__cursorManager.setCursor(_pages, 'zoomin');
					} else {
						__cursorManager.setCursor(_pages);
					}
				}
			}
            if (_LinkShowPermanently) {
                document.querySelectorAll('a.pf-hotspot').forEach(function(el) {
                    dom.css(el, 'opacity', 0.5);
                    dom.css(el, 'background', _LinkBackground);
                });
            }
		},
		preloadLoadedPageImages = function() {
			pages.forEach(function(pageInfo, pageIdx) {
				if (typeof pageInfo.$p !== 'undefined' && pageInfo.$p) {
					setSuitableBackgroundImage(pageIdx);
				}
			});
		},
	setLoadedBackgroundImage = function($block, url) {
		dom.css($block, {
			'background-image': 'url(\'' + url + '\')',
			'background-size': '100% auto'
		});
	},
	setLoadingBackgroundImage = function($block, calculateSize) {
		var originalLoadingImageSize = 24;
		var actualLoadingImageSize = originalLoadingImageSize;
		if (calculateSize && typeof bookScale !== 'undefined' && bookScale > 0) {
			var currentBookScale = bookScale + zoomScale * zF;
			if (currentBookScale > 0) {
				actualLoadingImageSize = originalLoadingImageSize / currentBookScale;
			}
		}
			dom.css($block, {
				'background-image': 'url(\"' + _IncDirPath + 'inc/img/loader.gif\")',
				'background-color': 'white',
				'background-repeat': 'no-repeat',
				'background-position': '50% 50%',
				'background-size': actualLoadingImageSize + 'px ' + actualLoadingImageSize + 'px'
			});
		},
		setSuitableThumbnailImage = function($thumbnail, pageNumber) {
			var loadImage = function(_pageNumber) {
				var loadingPromise;
				if (typeof pages[_pageNumber].__ThumbnailImage === 'undefined') {
					loadingPromise = Deferred();
					if (dom.css($thumbnail, 'background-image') !== 'url(\"' + _IncDirPath + 'inc/img/loader.gif\")') {
						setLoadingBackgroundImage($thumbnail, false);
					}
					if (typeof pages[_pageNumber].__ThumbnailImageUrl !== 'undefined') {
						var url = pages[_pageNumber].__ThumbnailImageUrl;
						var image = new Image();
						image.onload = loadingPromise.resolve.bind(loadingPromise, image);
						image.src = url;
						image.loadingPromise = loadingPromise;
						pages[_pageNumber].__ThumbnailImage = image;
						image.onerror = function() {
							pages[_pageNumber].__ThumbnailImage = undefined;
							setTimeout(function() {
								loadImage(_pageNumber).done(function(image) {
									pages[_pageNumber].__ThumbnailImage = image;
									loadingPromise.resolve(image);
								});
							}, 500);
						};
					}
				} else {
					if (pages[_pageNumber].__ThumbnailImage.loadingPromise.state() !== 'resolved') {
						if (dom.css($thumbnail, 'background-image') !== 'url(\"' + _IncDirPath + 'inc/img/loader.gif\")') {
							setLoadingBackgroundImage($thumbnail, false);
						}
					}
					loadingPromise = pages[_pageNumber].__ThumbnailImage.loadingPromise;
				}
				return loadingPromise;
			};
			return loadImage(pageNumber);
		},
		_checkSpreadComplete = function() {
		var bgDone = function(pn) {
			if (!pages[pn] || !pages[pn].__BackgroundFiles || pages[pn].__BackgroundFiles.length === 0) return true;
			var idx = (pages[pn].__BackgroundFiles.length > 1 && !_UseHQImage) ? 1 : 0;
			return !!(pages[pn].__BackgroundFiles[idx] && pages[pn].__BackgroundFiles[idx].set);
		};
		if (bgDone(PN) && bgDone(PN + 1)) {
			_spreadLoadsDone = true;
			var queued = _deferredPageLoads.slice();
			_deferredPageLoads = [];
			queued.forEach(function(pn, _) { setSuitableBackgroundImage(pn); });
		}
	},
	setSuitableBackgroundImage = function(pageNumber) {
		var loadImage = function(_pageNumber, type, url) {
			if (typeof images[_pageNumber] === 'undefined') {
				images[_pageNumber] = {};
			}
			var loadingPromise;
			if (typeof images[_pageNumber][type] === 'undefined') {
				loadingPromise = Deferred();
				setLoadingBackgroundImage(document.getElementById('page' + _pageNumber), true);
				var image = new Image();
				image.onload = function() {
					images[_pageNumber][type] = image;
					loadingPromise.resolve(image);
				};
				image.src = url;
				image.loadingPromise = loadingPromise;
				image.onerror = function() {
					setTimeout(function() {
						loadImage(_pageNumber, type, url).done(function(image) {
							images[_pageNumber][type] = image;
							loadingPromise.resolve(image);
						});
					}, 500);
				};
				} else {
					if (images[_pageNumber][type].loadingPromise.state() !== 'resolved') {
						setLoadingBackgroundImage(document.getElementById('page' + _pageNumber));
					}
					loadingPromise = images[_pageNumber][type].loadingPromise;
				}
				return loadingPromise;
			};

			var pageNumbersToSetImages = [];
			if (typeof pageNumber === 'undefined') {
				pageNumbersToSetImages = [PN, PN + 1];
			} else {
				pageNumbersToSetImages = [pageNumber];
			}

		pageNumbersToSetImages.forEach(function(_pageNumber, _) {
			if (typeof pages[_pageNumber] !== 'undefined' && typeof pages[_pageNumber].__BackgroundFiles !== 'undefined') {
				var backgroundFiles = pages[_pageNumber].__BackgroundFiles; // [0] - desktop, [1] - mobile
				if (backgroundFiles.length > 0) {
					var imageIdxToSet = 0;
					if (backgroundFiles.length > 1) {
						if (!_UseHQImage) {
							imageIdxToSet = 1;
						}
					}

					var isCurrentSpread = (_pageNumber === PN || _pageNumber === PN + 1);

					// Defer non-spread pages until PN/PN+1 images finish loading
					if (!isCurrentSpread && !_spreadLoadsDone) {
						if (_deferredPageLoads.indexOf(_pageNumber) < 0) {
							_deferredPageLoads.push(_pageNumber);
						}
						return; // will be loaded after spread is ready
					}

			if (!backgroundFiles[imageIdxToSet].set || (_pageNumber !== PN && _pageNumber !== PN + 1)) {
					if (!backgroundFiles[imageIdxToSet].set && backgroundFiles.length > 1) {
						backgroundFiles[Math.abs(imageIdxToSet - 1)].set = false;
					}
					var type = backgroundFiles[imageIdxToSet].type;
					var url = backgroundFiles[imageIdxToSet].url;
					loadImage(_pageNumber, type, url).done(function() {
						setLoadedBackgroundImage(document.getElementById('page' + _pageNumber), backgroundFiles[imageIdxToSet].url);
						backgroundFiles[imageIdxToSet].set = true;
						if (isCurrentSpread) {
							_checkSpreadComplete();
						}
					});
				} else {
					// Image already loaded (.set===true, current page) — re-apply directly to freshly added DOM element
					setLoadedBackgroundImage(document.getElementById('page' + _pageNumber), backgroundFiles[imageIdxToSet].url);
					if (isCurrentSpread) {
						_checkSpreadComplete();
					}
				}
				}
			}
		});
		},
		removePageMask = function(p) {
			var pp = pages[p];
			var	$p = pp.$p;
			var	rw = pp.__renderWidth;
			var	rh = pp.__renderHeight;
			var __parent = $p.parentNode; if (__parent && __parent.parentNode) { while (__parent.firstChild) { __parent.parentNode.insertBefore(__parent.firstChild, __parent); } __parent.remove(); }

			var left = _VerticalMode ? auto : (p % 2 ? auto : _CoverWidth - rw);
			if (_SinglePageMode) {
				left = (p % 2 ? _CoverWidth / 2 : _CoverWidth - rw);
			}

			dom.css($p, {
				'top': _VerticalMode ? (p % 2 ? _CoverHeight : _CoverHeight - rh) : (_CoverHeight - rh) / 2,
				'left': left,
				'right': _VerticalMode ? (_CoverWidth - rw) / 2 : (p % 2 ? _CoverWidth - rw : auto),
				'transform-origin': '',
				'backface-visibility': ''
			});
			// levenni az arnyekokat ha vannak...
			if (pp.$fsc) {
				pp.$fsc.remove();
				pp.$fsc = pp.$fsA = pp.$fsB = __undefined;
			}
			if (pp.$fts) {
				pp.$fts.remove();
				pp.$fts = __undefined;
			}
			pp.__masked = FALSE;
		},
		setFlipShadow = function(p, zi, rh, rw, ms) {
			var shadowLeft = _VerticalMode ? (_CoverWidth - rw) / 2 : _CoverWidth - rw;
			if (_SinglePageMode) {
				shadowLeft = -_CoverWidth / 2;
			}

			dom.css(pages[p].$fsc, {
				'z-index': zi++,
				'position': 'absolute', // ***** vertikalis mod...
				'top': _VerticalMode ? _CoverHeight - rh : (_CoverHeight - rh) / 2,
				'left': shadowLeft,
				'width': _VerticalMode ? rw : 2 * rw,
				'height': _VerticalMode ? rh * 2 : rh,
				'overflow': 'hidden',
				'opacity': _FlipShadowOpacity
			});
			dom.css(pages[p].$fsA, {
				'position': 'absolute', // ***** vertikalis mod...
				'top': _VerticalMode ? rh - ms : rh / 2 - ms,
				'right': _VerticalMode ? rw / 2 : rw,
				'width': D100,
				'height': ms * 2,
				'transform-origin': '100% 50%',
				'overflow': 'hidden'
			});
			dom.css(pages[p].$fsB, {
				'position': 'absolute', // ***** vertikalis mod...
				'top': _VerticalMode ? rh - ms / 2 : (rh - ms) / 2,
				'left': _VerticalMode ? rw / 2 : rw,
				'width': D100,
				'height': ms,
				'transform-origin': '0% 50%',
				'overflow': 'hidden'
			});
		},
		setPageOverlays = function(pLW, pRW) {
			if (__pageOverlays.length > 0) {
				if (pLW !== shLeftWidth || pRW !== shRightWidth) {
					shLeftWidth = pLW;
					shRightWidth = pRW;
					var sc = (pLW + pRW) / (_VerticalMode ? bookHeight : bookWidth);
					if (_VerticalMode) {
						dom.css(__dropshadow, 'transform', tr(0, bookHeight / 2 - pLW) + 'scaleY(' + sc + ')');
					} else {
						dom.css(__dropshadow, 'transform', tr(bookWidth / 2 - pLW, 0) + 'scaleX(' + sc + ')');
					}
				}
			}
		},
		// fliptModes: 0 - auto, 1 - auto preflip, 2 - manual, 3 - manual preflip, 4 - auto finish
		// flipTypes:: 0 - pullflip, 1 - pushflip,  2 - hardflip
		// Directions: -1 - left Backward, +1 - right forward
		//-------------------------------------------------------------------------------------

		// Page flipping animations are managed here
		addFlip = function(mx, my, pFlipMode, pDir, pFlipType, pPNadd, mxf, myf) {
			if (cancelFlip) return FALSE;

			if (touchControl && flipOrder.length > 0 && flipDir !== pDir) {
				var hasActiveManual = false;
				for (var j = 0; j < flipOrder.length; j++) {
					if (flipOrder[j].__flipMode === 2 || flipOrder[j].__flipMode === 3) {
						hasActiveManual = true;
						break;
					}
				}
				if (!hasActiveManual) {
					while (flipOrder.length > 0) {
						removeFlip(0);
					}
					setPages();
				}
			}

			mxf = mxf || mx;
			myf = myf || my;

			var flips = flipOrder.length,
				sPN = startPN,
				pPNadd = pPNadd || 2,
				pFlipType = pFlipType || 0;

			if (flips >= maxFlips) return FALSE;
			sPN = (flips == 0) ? PN : endPN;

			pPNadd += pPNadd % 2;

			if (pDir < 0 && sPN - pPNadd < _MinPageLimit) return FALSE;
			if (pDir > 0 && sPN + pPNadd > _MaxPageLimit) return FALSE;

			var startPagePN = sPN + (pDir > 0 ? 1 : 0),
				endPagePN = sPN + (pPNadd - (pDir < 0 ? 1 : 0)) * pDir,
				tempFlipType;

			if (pages[startPagePN].__isHard || pages[endPagePN].__isHard) tempFlipType = 2;
			else tempFlipType = pFlipType;

			lastFlipMode = pFlipMode;
			if (flips == 0) {
				flipping = TRUE;
				flipDir = pDir;
				flipType = tempFlipType;
				PFEventDispatcher('onFlippingSequenceStarted');
			} else if (flipDir != pDir || flipType != tempFlipType) {
				return FALSE;
			} else if (touchControl && flips >= 3) {
				for (var ri = 0; ri < flipOrder.length; ri++) {
					if (flipOrder[ri].__flipMode === 4 || flipOrder[ri].__flipMode === 0 || flipOrder[ri].__flipMode === 1) {
						removeFlip(ri);
						break;
					}
				}
			}
			if (pFlipMode === 0 || pFlipMode === 1 || pFlipMode === 4) {
				PFEventDispatcher('onAutoFlippingSequenceStarted');
			}
			startPN = sPN;
			endPN = sPN + pPNadd * pDir;
			var psh = flipType == 1;
			// duration?
			// ok there's no more obstacle, start the flip
			var a = null;
			flipOrder[flips] = resetFlipCalc({
				__startPN: startPN,
				__endPN: endPN,
				__startPagePN: psh ? endPagePN : startPagePN, // ***** on flip start
				__endPagePN: psh ? startPagePN : endPagePN, // ***** on flip start
				__flipMode: pFlipMode,
				__flipType: flipType,
				__dir: pDir,
				__started: FALSE,
				//__pos: psh?1:0,
				//__targetPos: psh?0:1,
				__success: FALSE
			}, mx, my);

			// data done!!!
			setPages();
			if (mxf || myf) {
				flipCalc(flipOrder[flips], mxf * VM, myf);
			}
			return TRUE;
		},
		changeFlip = function(pFD, pFlipMode, pDir, mxf, myf) {
			pDir = pDir || pFD.__dir;
			if (pFD.__dir != pDir ||
				pFD.__flipMode == 0 ||
				pFD.__flipMode == 4 ||
				pFD.__flipMode == 5 ||
				pFlipMode == 0 ||
				pFlipMode == 1) {
				return FALSE;
			}
			lastFlipMode = pFD.__flipMode = pFlipMode;
			flipCalc(pFD, mxf, myf);
			return TRUE;
		},
		clearFlip = function(pFD) {
			var pageA = pFD.__startPagePN,
				pageB = pFD.__endPagePN,
				$pageA = pages[pageA].$p,
				$pageB = pages[pageB].$p;
			pages[pageA].__flip = pages[pageA].__animated = pages[pageB].__flip = pages[pageB].__animated = FALSE;
			dom.css($pageB, {
				transform: tr(0, 0) + "rotate(0deg) "
			});
			dom.css($pageA, {
				transform: tr(0, 0) + "rotate(0deg) "
			});
		},
		removeFlip = function(pI) {
			var FD = flipOrder[pI]; //, tornOff = FD.__flipMode==5;
			if (!FD.__success) {
				cancelFlip = FALSE;
			} else {
				PN = FD.__endPN;
				PFEventDispatcher('onBeforePageChange', FD.__startPN);
				PFEventDispatcher('onPageChange', PN);
			}
			PFEventDispatcher(1, FD.__startPagePN); // flip end events
			PFEventDispatcher(1, FD.__endPagePN);
			clearFlip(FD);
			/*if( tornOff ) {
				if( FD.__dir<0 ) PN = FD.__endPN;
				removePages( pages[FD].__startPagePN, pages[FD].__endPagePN );
			} */
			flipOrder.splice(pI, 1);
			flipping = flipOrder.length != 0;
			if (flipping && pI > 0) {
				startPN = flipOrder[pI - 1].__startPN;
				endPN = flipOrder[pI - 1].__endPN;
			}
			if (FD.__success) {
				if (lastFlipMode === 0 || lastFlipMode === 1) {
					PFEventDispatcher('onAutoFlippingSequenceEnded');
				} else {
					PFEventDispatcher('onManualFlippingSequenceEnded');
				}
				//if (flipOrder.length < 1 && flipQueue.length < 1) {
					PFEventDispatcher('onPageChangingComplete');
				//}
			}
		},
		resetFlipCalc = function(pFD, mx, my) {
			// set up some variables needed for the flipping
			var pn = pFD.__endPagePN,
				rw = pages[pn].__renderWidth,
				rh = pages[pn].__renderHeight;

			if (pFD.__flipMode == 2) {
				if (_VerticalMode) {
					mx *= rh * pFD.__dir / my; // Y korrekctio
					my = rh * pFD.__dir;
					if (mx < -rw / 2) mx = -rw / 2;
					if (mx > rw / 2) mx = rw / 2;
				} else {
					my *= rw * pFD.__dir / mx; // X korrekctio
					mx = rw * pFD.__dir;
					if (my < -rh / 2) my = -rh / 2;
					if (my > rh / 2) my = rh / 2;
				}
			}
			pFD.__side = pn % 2 ? 1 : -1;
			pFD.__sx = _VerticalMode ? -mx : -rw * pFD.__side;
			pFD.__sy = _VerticalMode ? -rh * pFD.__side : my;
			pFD.__cx = _VerticalMode ? 0 : -rw / 2 * pFD.__side;
			pFD.__cy = _VerticalMode ? -rh / 2 * pFD.__side : 0;
			pFD.__ax = _VerticalMode ? -mx : -rw * (mx < 0 ? 1 : -1);
			pFD.__ay = _VerticalMode ? -rh * (my < 0 ? 1 : -1) : my;

			return pFD;
		},
		flipCalc = function(pFD, mx, my, pForced) { //pFlipData
			mx = mx || pFD.__ax;
			my = my || pFD.__ay;

			var pA = pFD.__startPagePN,
				pB = pFD.__endPagePN,
				$pageA = pages[pA].$p,
				$maskA = pages[pA].$m,
				$pageB = pages[pB].$p,
				$maskB = pages[pB].$m,
				rw = pages[pA].__renderWidth,
				rh = pages[pA].__renderHeight,
				hw = rw / 2,
				hh = rh / 2,
				FD = flipDir * (flipType == 1 ? -1 : 1),
				sx = pFD.__sx,
				sy = pFD.__sy,
				cx = pFD.__cx,
				cy = pFD.__cy,

				mfd = _VerticalMode ? (my == pFD.__ex ? __undefined : (my < pFD.__ex ? -1 : 1)) :
				(mx == pFD.__ex ? __undefined : (mx < pFD.__ex ? -1 : 1));
			pFD.__ex = _VerticalMode ? my : mx;

			// drag point limit calculations (not for hardcover)
			if (flipType != 2) {
				// check position...
				if (_VerticalMode) {
					var r0 = Mq(my * my + (hw + mx) * (hw + mx)), // right
						r1 = Mq(my * my + (hw - mx) * (hw - mx)), // left
						r0max = Mq(rh * rh + (hw + sx) * (hw + sx)),
						r1max = Mq(rh * rh + (hw - sx) * (hw - sx));

					if ((r0 > r0max || r1 > r1max) && pFD.__flipMode != 5) {
						if (mx < sx) {
							var b = hw - mx,
								a = Mas(b / r1);
							mx = hw - Ms(a) * r1max;
							my = Mc(a) * r1max * (my < 0 ? -1 : 1);
							if (mx > sx) {
								if ((sy * my) > 0) {
									my = sy, mx = sx;
								} else {
									my = -sy, mx = sx;
								}
							}
						} else {
							var b = hw + mx,
								a = Mas(b / r0);
							mx = Ms(a) * r0max - hw;
							my = Mc(a) * r0max * (my < 0 ? -1 : 1);
							if (mx < sx) {
								if ((sy * my) > 0) {
									my = sy, mx = sx;
								} else {
									my = -sy, mx = sx;
								}
							}
						}
					}
					// keep a little space from the edge (animations could look terrible without it...)
					if (((sy < 0 && (my - sy) < 20) || (sy > 0 && (sy - my) < 20)) && !pForced) {
						if (sy < 0) my = -rh + 20;
						if (sy > 0) my = rh - 20;
					}
				} else {
					var r0 = Mq(mx * mx + (hh + my) * (hh + my)), // top r
						r1 = Mq(mx * mx + (hh - my) * (hh - my)), // bottom r
						r0max = Mq(rw * rw + (hh + sy) * (hh + sy)),
						r1max = Mq(rw * rw + (hh - sy) * (hh - sy));

					if ((r0 > r0max || r1 > r1max) && pFD.__flipMode != 5) {
						if (my < sy) {
							var b = hh - my,
								a = Mas(b / r1);
							my = hh - Ms(a) * r1max;
							mx = Mc(a) * r1max * (mx < 0 ? -1 : 1);
							if (my > sy) {
								if ((sx * mx) > 0) {
									my = sy, mx = sx;
								} else {
									my = sy, mx = -sx;
								}
							}
						} else {
							var b = my + hh,
								a = Mas(b / r0);
							my = Ms(a) * r0max - hh;
							mx = Mc(a) * r0max * (mx < 0 ? -1 : 1);
							if (my < sy) {
								if ((sx * mx) > 0) {
									my = sy, mx = sx;
								} else {
									my = sy, mx = -sx;
								}
							}
						}
					}
					// keep a little space from the edge (animations could look terrible without it...)
					if (((sx < 0 && (mx - sx) < 20) || (sx > 0 && (sx - mx) < 20)) && !pForced) {
						if (sx < 0) mx = -rw + 20;
						if (sx > 0) mx = rw - 20;
					}
				}
			}
			// follow mouse gently...
			if (pForced) {
				pFD.__ax = mx, pFD.__ay = my;
			} else {
				pFD.__ax += (mx - pFD.__ax) / 5, pFD.__ay += (my - pFD.__ay) / 5;
				if (Ma(mx - pFD.__ax) < 0.5 && Ma(my - pFD.__ay) < 0.5) {
					pFD.__ax = mx, pFD.__ay = my;
				}
				mx = pFD.__ax, my = pFD.__ay;
			}
			// Hardflip position and PageWidth for centering: (pos)
			var pos = _VerticalMode ? (my / rh) * D90 : (mx / rw) * D90;
			if (pos < -D90) pos = -D90;
			if (pos > D90) pos = D90;
			if (pos < 0) leftWidthMax(-Ms(pos / AM) * (_VerticalMode ? rh : rw));
			if (pos > 0) rightWidthMax(Ms(pos / AM) * (_VerticalMode ? rh : rw));

			// if the last position was the same, don't waste time with further calculations...
			if (mx == pFD.__lx && my == pFD.__ly) return;

			if (flipType == 2) {
				var FD = flipDir * (pos < 0 ? 1 : -1),
					ba = D90 * flipDir,
					rots = _VerticalMode ? "rotateX" : "rotateY",
					out = 3000;

				if (FD < 0) {
					if (has3d) {
						var pageACss = {
							transform: rots + '(' + ((D180 + ba + pos) * VM) + 'deg) ' + tr(0, 0)
						};
						dom.css($pageA, pageACss);
						var pageBCss = {
							transform: rots + '(' + (D90) + 'deg) ' + tr(out, out)
						};
						dom.css($pageB, pageBCss);
					} else {
						var s = -(D90 - Ma(pos)) / 5 * flipDir;
						dom.css($pageA, {
							transform: _VerticalMode ? "scaleY(" + Ms(flipDir * pos / AM) + ") skewX(" + s + "deg) " + tr(0, 0) : "scaleX(" + Ms(flipDir * pos / AM) + ") skewY(" + s + "deg) " + tr(0, 0)
						});
						dom.css($pageB, {
							transform: tr(out, out)
						});
					}
				} else {
					if (has3d) {
						var pageBCss = {
							transform: rots + '(' + ((D180 - ba + pos) * VM) + 'deg) ' + tr(0, 0)
						};
						dom.css($pageB, pageBCss);
						var pageACss = {
							transform: rots + '(' + (D90) + 'deg) ' + tr(out, out)
						};
						dom.css($pageA, pageACss);
					} else {
						var s = (D90 - Ma(pos)) / 5 * flipDir;
						dom.css($pageB, {
							transform: _VerticalMode ? "scaleY(" + Ms(-flipDir * pos / AM) + ") skewX(" + s + "deg) " + tr(0, 0) : "scaleX(" + Ms(-flipDir * pos / AM) + ") skewY(" + s + "deg) " + tr(0, 0)
						});
						dom.css($pageA, {
							transform: tr(out, out)
						});
					}
				}

				if (!_NoFlipShadow) {
					if (FD < 0) {
						dom.css(pages[pA].$hts, "opacity", (1 - Ma(Ms(pos / AM)) + 1 - Ma(pos / 90)) / 2);
					} else {
						dom.css(pages[pB].$hts, "opacity", (1 - Ma(Ms(pos / AM)) + 1 - Ma(pos / 90)) / 2);
					}
				}
				pFD.__ax = mx, pFD.__ay = my;
			} else {

				if (_VerticalMode) {
					// start calculations ( values for rotation and translation for pages, masks, and shadows)
					var dx = sx - mx,
						dy = sy - my,
						dcx = sx - cx,
						dcy = sy - cy,
						r = Mq(dx * dx + dy * dy),
						a = Mas(dx / r) || 0, //(flipDir<0?PI:0),
						cr = Mq(dcx * dcx + dcy * dcy),
						b = Mas(dcx / cr);

					if (dy < 0 || (dy == 0 && FD < 0)) a = PI - a;
					if (dcy < 0) b = PI - b;
					b = a - (b - a);

					var py = Mc(b) * cr + my,
						px = Ms(b) * cr + mx,
						dpcx = (px - cx) / 2,
						dpcy = (py - cy) / 2,
						mpx = cx + dpcx,
						mpy = cy + dpcy,
						l = Mq(dpcx * dpcx + dpcy * dpcy);

					if (dpcy < 0) {
						l *= -1
					};

					var ad = a * AM;
					var z = 6;

					//move the pages, and masks
					dom.css($pageB, {
						transform: tr(0, ((hh + l) * FD).toFixed(z)) + "rotate(" + (ad) + "deg) "
					});
					dom.css($maskB, {
						transform: tr(-mpx.toFixed(z), mpy.toFixed(z)) + "rotate(" + (ad) + "deg)"
					});
					dom.css($pageA, {
						transform: tr(-(Ms(-a) * FD).toFixed(z), ((-hh - l + 1 * Mc(-a)) * FD).toFixed(z)) + "rotate(" + (-ad) + "deg) "
					});
					dom.css($maskA, {
						transform: tr((-mpx).toFixed(z), (mpy - 1 * FD).toFixed(z)) + "rotate(" + (ad) + "deg)"
					});

					// find the farest corner from the folding line
					var sl = Ma(Mc(a) * hh) - l * FD,
						stl = Ms(-a) * hw + sl,
						sbl = Ms(a) * hw + sl,
						sml = (stl + sbl) / 2,
						op = 1;
					sl = stl > sbl ? stl : sbl;
					pFD.__sl = sl;

					if (!_NoFlipShadow) {
						sl /= rh;
						sml /= rh;
						var ssl2 = sml < .05 ? .05 : sml;
						if (sml < .2) sml = sl;
						if (sml < .2) op = 5 * sml;
						if (sml > .9) op = 1 - (sml - .9) * 10;

						var ssl = sl;
						if (ssl > .6) {
							if (ssl > .8) {
								ssl = .6 - 1 * (ssl - .8)
							} else {
								ssl = .6 + Ms(((ssl - .6) / .2) * PI) * .1;
							}
						}
						var shOp = 0.5 + op / 2;
						// move the shadows
						dom.css(pages[pB].$fsA, {
							transform: tr((-mpx).toFixed(5), (mpy).toFixed(5)) + "rotate(" + (ad + 90) + "deg) scaleX(" + (ssl2 * 6) + ")",
							"opacity": shOp.toFixed(5)
						});
						dom.css(pages[pB].$fsB, {
							transform: tr((-mpx).toFixed(5), (mpy).toFixed(5)) + "rotate(" + (ad + 90) + "deg) scaleX(" + (sl * 3) + ")",
							"opacity": op.toFixed(5)
						});
						dom.css(pages[pB].$fts, {
							transform: "rotate(" + (-ad + 90) + "deg) " + tr((-l * FD).toFixed(5), 0) + "scaleX(" + (ssl * 4) + ")",
							"opacity": (op * _FlipTopShadowOpacity).toFixed(5)
						});

					}
					pFD.__lx = mx, pFD.__ly = my;

				} else {
					// start calculations ( values for rotation and translation for pages, masks, and shadows)
					var dx = sx - mx,
						dy = sy - my,
						dcx = sx - cx,
						dcy = sy - cy,
						r = Mq(dx * dx + dy * dy),
						a = Mas(dy / r) || 0, //(flipDir<0?PI:0),
						cr = Mq(dcx * dcx + dcy * dcy),
						b = Mas(dcy / cr);

					if (dx < 0 || (dx == 0 && FD < 0)) a = PI - a;
					if (dcx < 0) b = PI - b;
					b = a - (b - a);

					var px = Mc(b) * cr + mx,
						py = Ms(b) * cr + my,
						dpcx = (px - cx) / 2,
						dpcy = (py - cy) / 2,
						mpx = cx + dpcx,
						mpy = cy + dpcy,
						l = Mq(dpcx * dpcx + dpcy * dpcy);

					if (dpcx < 0) {
						l *= -1
					};

					var ad = a * AM;
					var z = 6;

					//move the pages, and masks
					dom.css($pageB, {
						transform: tr(((hw + l) * FD).toFixed(z), 0) + "rotate(" + (ad) + "deg) "
					});
					dom.css($maskB, {
						transform: tr(mpx.toFixed(z), mpy.toFixed(z)) + "rotate(" + (ad) + "deg)"
					});
					dom.css($pageA, {
						transform: tr(((-hw - l + 1 * Mc(-a)) * FD).toFixed(z), (Ms(-a) * FD).toFixed(z)) + "rotate(" + (-ad) + "deg) "
					});
					dom.css($maskA, {
						transform: tr((mpx - 1 * FD).toFixed(z), (mpy).toFixed(z)) + "rotate(" + (ad) + "deg)"
					});

					// find the farest corner from the folding line
					var sl = Ma(Mc(a) * hw) - l * FD,
						stl = Ms(-a) * hh + sl,
						sbl = Ms(a) * hh + sl,
						sml = (stl + sbl) / 2,
						op = 1;
					sl = stl > sbl ? stl : sbl;
					pFD.__sl = sl;

					if (!_NoFlipShadow) {
						sl /= rw;
						sml /= rw;
						var ssl2 = sml < .05 ? .05 : sml;
						if (sml < .2) sml = sl;
						if (sml < .2) op = 5 * sml;
						if (sml > .9) op = 1 - (sml - .9) * 10;

						var ssl = sl;
						if (ssl > .6) {
							if (ssl > .8) {
								ssl = .6 - 1 * (ssl - .8)
							} else {
								ssl = .6 + Ms(((ssl - .6) / .2) * PI) * .1;
							}
						}
						var shOp = 0.5 + op / 2;
						// move the shadows
						dom.css(pages[pB].$fsA, {
							transform: tr((mpx).toFixed(5), (mpy).toFixed(5)) + "rotate(" + (ad) + "deg) scaleX(" + (ssl2 * 6) + ")",
							"opacity": shOp.toFixed(5)
						});
						dom.css(pages[pB].$fsB, {
							transform: tr((mpx).toFixed(5), (mpy).toFixed(5)) + "rotate(" + (ad) + "deg) scaleX(" + (sl * 3) + ")",
							"opacity": op.toFixed(5)
						});
						dom.css(pages[pB].$fts, {
							transform: "rotate(" + (-ad) + "deg) " + tr((-l * FD).toFixed(5), 0) + "scaleX(" + (ssl * 4) + ")",
							"opacity": (op * _FlipTopShadowOpacity).toFixed(5)
						});

					}
					pFD.__lx = mx, pFD.__ly = my;
				}

			}
			return mfd;
		},
		//-------------------------------------------------------------------------------------

		// Time based animation control
		setTBA = function(pFD, tx, ty, duration, styleX, styleY, pR) {
			pFD.__stx = pFD.__ax;
			pFD.__sty = pFD.__ay;
			pFD.__tx = tx;
			pFD.__ty = ty;
			pFD.__duration = duration;
			pFD.__styleX = styleX;
			pFD.__styleY = styleY;
			pFD.__start = getNow().getTime();
			pFD.__r = pR;
		},
		getTBA = function(pFD) {
			var elapsed = getNow().getTime() - pFD.__start,
				duration = pFD.__duration,
				end = FALSE;
			if (elapsed >= duration) {
				end = TRUE
				elapsed = duration;
			}
			var timeScale = duration > 0 ? elapsed / duration : 1,
				dx = pFD.__tx - pFD.__stx,
				dy = pFD.__ty - pFD.__sty,
				x = pFD.__stx + getTBAstyle(pFD.__styleX, timeScale, dx, pFD.__r),
				y = pFD.__sty + getTBAstyle(pFD.__styleY, timeScale, dy, pFD.__r);

			return {
				x: x,
				y: y,
				end: end
			};
		},
		getTBAstyle = function(style, timeScale, dist, r) {
			switch (style) {
				case 0:
					return dist * timeScale; // Linear
				case 1:
					return Ms(PI * timeScale / 2) * dist; // EaseIn
				case 2:
					return (1 - Mc(PI * timeScale / 2)) * dist; // EaseOut
				case 3:
					return (1 - Mc(PI * timeScale)) / 2 * dist; // EaseInOut
				case 4:
					return Ms(2 * PI * timeScale) * r; // SINUS
				case 5:
					return Ms(PI * timeScale) * r; // HALFSINUS
				case 6:
					return Mc(2 * PI * timeScale) * r; // COSINUS
				case 7:
					return Mc(PI * timeScale) * r; // HALFCOSINUS
			}
		},
		getNow = function() {
			return new Date();
		},
		//-------------------------------------------------------------------------------------

		// Pageflip Main Loop
		loop,
		moved = FALSE,
		PFLoop = function() {
			if (loop) raf(PFLoop);

			if (flipQueue.length > 0) {
				// Any flip in the queue?
				tryQueueFlip();
			}
			if (flipping) {
				var FD;
				leftWidth = shBaseLeftWidth, rightWidth = shBaseRightWidth;
				for (var i = 0; i < flipOrder.length; i++) {
					FD = flipOrder[i];
					switch (FD.__flipMode) {

						case 1:
							break;
						case 2:
						case 3:
							if (FD.__manualStartTime && (+new Date() - FD.__manualStartTime > 1500)) {
								endManualFlip(FD, false);
								if (FD.__flipMode === 2 || FD.__flipMode === 3) {
									removeFlip(i);
									i--;
								}
								if (manualFlipFD === FD) {
									manualFlipFD = null;
									manualFlipTouchId = null;
								}
								cancelFlip = false;
								break;
							}
							manualFlipDir = flipCalc(FD, mx * VM, my);
							break;
						case 0:
						case 4:
							var tba = getTBA(FD);
							flipCalc(FD, tba.x, tba.y, TRUE);
							// remove flip
							if (tba.end) {
								removeFlip(i);
								setPages();
								if (!flipping) {
									setPages();
								}
								// touchcontrol bug fix (loses touchmove event, so we finish the flip insted of simply freezing it.
								if (touchControl && manualFlipFD) {
									if (flipOrder.indexOf(manualFlipFD) !== -1) {
										endManualFlip(manualFlipFD);
									}
									manualFlipFD = null;
									manualFlipTouchId = null;
									resetMultiTouches();
								}
								if (!changed) triggerOnMove()
								i--;
							}
							break;
						case 5:
							var tba = getTBA(FD);
							flipCalc(FD, tba.x, tba.y, TRUE);
							if (tba.end) {
								removeFlip(i);
								setPages();
								if (!flipping) {
									setPages();
								}
								i--;
							}
							break;
					}
				}
				if (flipping) {
					if (_HardCover && !_PerformanceAware) setPageOverlays(leftWidth, rightWidth);
					leftWidthMax(baseLeftWidth);
					rightWidthMax(baseRightWidth);
					setBookOffset();
				}
			}
			if (_Thumbnails) {
				thumbnailOEF();
			}

			zoomOEF();

			if (fadeLink && _LinkFading) {
                fadeLink.OEF();
            }
		},

		// Pageflip Control
		onStart = function(e) {
			if (e.target.classList.contains('pf-hotspot')) {
				return;
			}

			if (e && e.type && e.type === 'mousedown') {
				if (lastNativeTouchTime && Date.now() - lastNativeTouchTime < 500) {
					return;
				}
				currentTouchControl = false;
			} else {
				currentTouchControl = true;
			}

			moved = FALSE;
			cancelFlip = false;
			lastClickDuration = undefined;
			lastClickStartTime = +new Date();

			var eTouchId = null;
			if (currentTouchControl && e.changedTouches && e.changedTouches[0]) {
				eTouchId = e.changedTouches[0].identifier;
			}

			if (manualFlipFD && touchControl) {
				if (flipOrder.indexOf(manualFlipFD) !== -1) {
					endManualFlip(manualFlipFD, false);
				}
				manualFlipFD = null;
				manualFlipTouchId = null;
				manualPreflip = false;
				cancelFlip = false;
			}

			if (touchControl) {
				for (var fi = flipOrder.length - 1; fi >= 0; fi--) {
					if (flipOrder[fi] && (flipOrder[fi].__flipMode === 2 || flipOrder[fi].__flipMode === 3)) {
						endManualFlip(flipOrder[fi], false);
						if (flipOrder[fi] && (flipOrder[fi].__flipMode === 2 || flipOrder[fi].__flipMode === 3)) {
							removeFlip(fi);
						}
					}
				}
				cancelFlip = false;
			}

			if (!!manualFlipFD || autoFlip || !_MouseControl) {
				return;
			}
			try { setTargetCoords(e); } catch(ex) { return; }

			zFAtStart = zF;
			var CA = checkPreflipArea(mx, my, manualPreflip);
			var zoomCornerFlip = false;
			if (CA && zooming && _Preflip && !_SinglePageMode) {
				zoomOut();
				zoomCornerFlip = true;
			}
			if (CA && (canFlip() || zoomCornerFlip)) {
				resetMultiTouches();
				PD(e);
				switch (CA) {
					case "TL":
					case "BL":
						if (manualPreflip || autoPreflip) {
							if (changeFlip(flipOrder[flipOrder.length - 1], 2, -1)) {
								manualPreflip = autoPreflip = FALSE;
								manualFlipFD = flipOrder[flipOrder.length - 1];
							}
						} else if (addFlip(mx, my, 2, -1, 0)) {
							manualFlipFD = flipOrder[flipOrder.length - 1];
						}
						break;
					case "TR":
					case "BR":
						if (manualPreflip || autoPreflip) {
							if (changeFlip(flipOrder[flipOrder.length - 1], 2, 1)) {
								manualPreflip = autoPreflip = FALSE;
								manualFlipFD = flipOrder[flipOrder.length - 1];
							}
						} else if (addFlip(mx, my, 2, 1, 0)) {
							manualFlipFD = flipOrder[flipOrder.length - 1];
						}
						break;
				}
			} else {
				CA = checkControlArea(mx, my);
			if (CA && canFlip()) {
				resetMultiTouches();
				PD(e);
				var caFlipType = touchControl ? 0 : 1;
				switch (CA) {
					case "OL":
							if (addFlip(mx, my, 2, -1, caFlipType)) manualFlipFD = flipOrder[flipOrder.length - 1];
							break;
						case "IR":
							if (addFlip(_VerticalMode ? (mx < 0 ? -leftPageW : leftPageW) : -D100,
									_VerticalMode ? -D100 : (my < 0 ? -leftPageH : leftPageH),
									2, -1, _SinglePageMode ? caFlipType : 0)) manualFlipFD = flipOrder[flipOrder.length - 1];
							break;
						case "OR":
							if (addFlip(mx, my, 2, 1, caFlipType)) manualFlipFD = flipOrder[flipOrder.length - 1];
							break;
						case "IL":
							if (addFlip(_VerticalMode ? (mx < 0 ? -rightPageW : rightPageW) : D100,
									_VerticalMode ? D100 : (my < 0 ? -rightPageH : rightPageH),
									2, 1, _SinglePageMode ? caFlipType : 0)) manualFlipFD = flipOrder[flipOrder.length - 1];
							break;
					}
				} else if (!touchPinch && zooming && canZoom(e)) {
					if (e.target.className === "pf-hotspot") {
							return true;
					}
					zoomDrag = TRUE;
					if (touchAutoZooming) {
						touchAutoZooming = FALSE;
						zoomInInProgress = false;
						zoomOutInProgress = false;
						updateBorders();
					}
					moved = FALSE;
					var eventCoordinates = getCoordinatesFromEvent(e, false);
					if (typeof eventCoordinates !== 'undefined') {
						var result = getZoomTargetCoords(touchControl, eventCoordinates.x, eventCoordinates.y, true);
						if (!isNaN(result.x) && !isNaN(result.y)) {
							zoomResetDrag(result.x, result.y);
						}
					}
				} else {
					return TRUE;
				}
			}
			if (manualFlipFD) {
				manualFlipTouchId = eTouchId;
				manualFlipFD.__manualStartTime = +new Date();
			}
		},
		onMove = function(e) {
			if (e) {
				if (e.type && e.type === 'mousemove') {
					if (currentTouchControl) {
						return;
					}
				}
			}

			// A mouse click or touch has occured
			if (!touchControl) {
				mouseoverPositionX = e.pageX;
				mouseoverPositionY = e.pageY;
			}
			if (!touchControl && zooming && !zoomDrag && canZoom(e)) {
				PD(e);
				zoomDrag = TRUE;
				moved = FALSE;
				if (typeof e.pageX !== 'undefined') {
					var result = getZoomTargetCoords(touchControl, e.pageX, e.pageY, true);
					zoomResetDrag(result.x, result.y);
				}
				return;
			}
			moved = TRUE;
			if (autoFlip || !_MouseControl)  {
				return;
			}
			if (!!manualFlipFD || manualPreflip || zoomDrag || pinching) {
				PD(e);
			}

			setTargetCoords(e); // get book coordinates. Sets the position of cursor relative to the book

			if (!touchPinch && zoomDrag) {
				var eventCoordinates = getCoordinatesFromEvent(e, false);
				if (typeof eventCoordinates !== 'undefined') {
					var result = getZoomTargetCoords(touchControl, eventCoordinates.x, eventCoordinates.y, true);
					if (!isNaN(result.x) && !isNaN(result.y)) {
						setZoomTargetPosition(result.x, result.y);
					}
				}
				if (!touchControl && zooming && _Preflip && !_SinglePageMode) {
					if (checkPreflipArea(mx, my, manualPreflip)) {
						// fall through to preflip logic below
					} else {
						if (manualPreflip) {
							endManualFlip(flipOrder[flipOrder.length - 1]);
						}
						return;
					}
				} else {
					return;
				}
			}

			var CA = checkPreflipArea(mx, my, manualPreflip);
			if (manualPreflip && !touchControl) {
				if (!CA) {
					endManualFlip(flipOrder[flipOrder.length - 1]);
				}
			} else if (!!manualFlipFD) {

			} else if (!touchControl && _Preflip && !_SinglePageMode) {
				if (CA) {
					switch (CA) {
						// preflip itt kezdodik
						case "TL":
						case "BL":
							if (addFlip(_VerticalMode ? (mx < 0 ? -leftPageW : leftPageW) : mx,
									_VerticalMode ? my : (my < 0 ? -leftPageH : leftPageH),
									3, -1, 0, __undefined, mx, my)) manualPreflip = TRUE;
							break;

						case "TR":
						case "BR":
							if (addFlip(_VerticalMode ? (mx < 0 ? -rightPageW : rightPageW) : mx,
									_VerticalMode ? my : (my < 0 ? -rightPageH : rightPageH),
									3, 1, 0, __undefined, mx, my)) manualPreflip = TRUE;
							break;
					}
				}
			}
		},
		onEnd = function(e) {
			if (e && e.type && e.type === 'mouseup' && currentTouchControl) {
				return;
			}
			lastClickDuration = +new Date() - lastClickStartTime;
			lastClickStartTime = undefined;
			if (e.target) {
				var $target = e.target;
				if ($target.closest && $target.closest('#pageflip-thumbnails')) {
					return true;
				}
				var clickOnThumbnails = false;
				if ($target.classList.contains('pf-thumbnail-button') || $target.classList.contains('pf-thumbnail-page') || $target.classList.contains('pf-thumbnail-spread')) {
					clickOnThumbnails = true;
				}
				if ($target.getAttribute('id') === 'pf-thumbnail-container' || $target.getAttribute('id') === 'pageflip-thumbnails') {
					clickOnThumbnails = true;
				}
				if (clickOnThumbnails) {
					return true;
				}
			}

			if (!_MouseControl) return;

			try { setTargetCoords(e); } catch(ex) { }
			touchid = null;

			if (manualFlipFD || manualPreflip) {
				var endTouchId = null;
				if (currentTouchControl && e.changedTouches && e.changedTouches[0]) {
					endTouchId = e.changedTouches[0].identifier;
				}
				var isOwner = !currentTouchControl || manualFlipTouchId === null || endTouchId === null || manualFlipTouchId === endTouchId;
				if (isOwner) {
					PD(e);
					PFEventDispatcher('onManualEnded');
					var endFD = manualFlipFD || flipOrder[flipOrder.length - 1];
					if (endFD && flipOrder.indexOf(endFD) !== -1) {
						endManualFlip(endFD, true);
					}
					manualFlipFD = null;
					manualFlipTouchId = null;
					manualPreflip = false;
					changed = FALSE;
					triggerOnMove();
				} else {
					return;
				}
			} else if (zoomDrag) {
				PD(e);
				if (touchControl) {
					zX = zTX;
					zY = zTY;
					zoomDrag = FALSE;
					touchMomentumActive = true;
				}
				if (!canZoom(e)) {
					return TRUE;
				}
				if (!touchControl && checkPageArea(mx, my) && _ClickZoom) {
					zoomDrag = FALSE;
					if (e.target.className !== "pf-hotspot") {

						API.zoomOut();
						API.hideThumbnails();
					}
				}
			} else {
				if (!canZoom(e)) {
					return TRUE;
				}
				if (!touchControl && checkPageArea(mx, my) && _ClickZoom) {
					if (e.target.className !== "pf-hotspot") {
						var result = getZoomTargetCoords(touchControl, e.pageX, e.pageY);
						matchZoomPosition(mx, my, result.x, result.y);
						API.zoomIn();
						API.hideThumbnails();
					}
				}
			}
		},

		triggerOnMove = function() {
			if (!touchControl) __doc.dispatchEvent(new Event(pfEvent.__onMove));
		},

		addAutoFlip = function(pDir, pFlipType, pPNadd) {
			thumbnailsHide();
			var success = FALSE,
				HDir = _VerticalMode ? -0.5 : pDir, //(_SinglePageMode? -pDir: pDir),
				VDir = _VerticalMode ? pDir * 2 : 1;

			if (addFlip(HDir * _PageWidth, VDir * _PageHeight / 2, 0, pDir, pFlipType, pPNadd,
					HDir * _PageWidth * .97, VDir * _PageHeight / 2 * .97)) {
				var FD = flipOrder[flipOrder.length - 1];
				FD.__success = TRUE;
				var TM = FD.__flipType == 1 ? 1 : -1; // Target multiplier

				if (_VerticalMode) {
					setTBA(FD, FD.__sx, TM * FD.__sy, _FlipDuration, 5, FD.__flipType == 2 ? 0 : 3, -_PageWidth / 8 - ((Mrn() - 0.5) * _PageWidth / 16));
				} else {
					setTBA(FD, TM * FD.__sx, FD.__sy, _FlipDuration, FD.__flipType == 2 ? 0 : 3, 5, -_PageHeight / 8 + ((Mrn() - 0.5) * _PageHeight / 16));
				}
				success = TRUE;
			}
			return success;
		},

		endManualFlip = function(pFD, clickHappened) {
			// finish manual flip with automated animation
			//if (pDir && pDir != pFD.__dir) {
				//return;
			//}
			var tside = pFD.__side * (pFD.__flipType == 1 ? -1 : 1);
			if (changeFlip(pFD, 4)) {
				pFD.__success = manualFlipDir && !!manualFlipFD ? manualFlipDir == tside : (tside * (_VerticalMode ? my : mx)) > 0;
				var preflipArea = checkPreflipArea(mx, my, manualPreflip || !!manualFlipFD);
				var controlArea = false;
				if (zFAtStart < 0.01) {
					 controlArea = checkControlArea(mx, my);
				}
				if (preflipArea	|| clickHappened) {
					var directionKnown = (typeof manualFlipDir !== 'undefined' && manualFlipDir === tside);
					if (directionKnown || (typeof lastClickDuration !== 'undefined' && lastClickDuration < 400)) {
						pFD.__success = TRUE;
					}
				}
				manualFlipFD = null;
				manualFlipTouchId = null;
				manualPreflip = false;
				var tx = pFD.__sx * (_VerticalMode ? 1 : (pFD.__success ? -1 : 1) * pFD.__side * tside);
				var ty = pFD.__sy * (_VerticalMode ? (pFD.__success ? -1 : 1) * pFD.__side * tside : 1);
				var chv = _VerticalMode ? bookHeight : bookWidth;
				var m = getDist(tx - pFD.__ax, ty - pFD.__ay) / chv;
				var m2 = pFD.__sl / chv;
				var st = 2;
				if (m2 > m) {
					m = m2;
					st = 1;
				}
				setTBA(pFD, tx, ty, _FlipDuration * m, _VerticalMode ? st : 0, _VerticalMode ? 0 : st);
				cancelFlip = !pFD.__success;
			}
		},

		setPageCheckVariables = function() {
			leftPageW = pages[PN].__renderWidth / VD || 0;
			leftPageH = pages[PN].__renderHeight / HD || 0;
			rightPageW = pages[PN + 1].__renderWidth / VD || 0;
			rightPageH = pages[PN + 1].__renderHeight / HD || 0;
		},

		// Multitouch control functions --------------------------------------------------------

		multiTouches,
		resetMultiTouches = function() {
			multiTouches = [];
			pinchTouches = [];
		},
		addTouch = function(touch, id) {
			multiTouches.splice(0, 0, {
				__touch: touch,
				__id: id
			});
		},
		updateTouch = function(touch, id) {
			multiTouches[getTouchByID(id)].__touch = touch;
		},
		removeTouch = function(touch, id) {
			multiTouches.splice(getTouchByID(id), 1);
		},
		getTouchByID = function(id) {
			for (var i = 0; i < multiTouches.length; i++) {
				if (multiTouches[i].__id == id) return i;
			}
			return -1;
		},
		/*dumpTouches = function( msg ) {

			for( var i=0; i<multiTouches.length; i++ ) {
				msg +=  "<br>"+i+" - "+multiTouches[i].__id;
			}
			if( pinchTouches.length==2 ) msg = "Pinch ids: "+pinchTouches[0]+", "+pinchTouches[1]+"<br>"+msg;
			if( pinching ) msg += "<br> Pinch D: "+pBD+" x,y: "+pCX+","+pCY+"<br>Pinch Scale: "+pSC;
			document.getElementById('outmsg').innerHTML = msg;
		},*/

		newPinch,
		pinching,
		pinchTouches,
		getPinchTouches = function() {
			if (multiTouches.length > 1) {
				if (pinchTouches.length == 0) {
					pinchTouches[0] = multiTouches[0].__id;
					pinchTouches[1] = multiTouches[1].__id;
					// new pinch
					newPinch = TRUE;
				} else {
					if (getTouchByID(pinchTouches[0]) == -1) {
						pinchTouches[0] = getNewTouch(pinchTouches[1]);
						newPinch = TRUE;
					}
					if (getTouchByID(pinchTouches[1]) == -1) {
						pinchTouches[1] = getNewTouch(pinchTouches[0]);
						newPinch = TRUE;
					}
				}
			} else {
				pinchTouches = [];
				newPinch = FALSE;
				// handle pinch ending...
				endPinch();
			}
		},
		getNewTouch = function(exl) {
			for (var i = 0; i < multiTouches.length; i++) {
				var id = multiTouches[i].__id;
				if (id != exl) return id;
			}
			return -1;
		},

		pBD, // pinch base distance
		pBZF, // pinch base zoom Factor (zF)
		pCX, pCY, // pinch center X/Y (stage coordinates)
		pBX, pBY, // pinch Base x/y
		pSC, // pinch scale
		pzX = 0,
		pzY = 0, // pinch pffset
		pSX, pSY, // pinch start x/y
		pTF, // pinch target zF for smoothing
		setPinch = function() {
			var A = multiTouches[getTouchByID(pinchTouches[0])].__touch,
				B = multiTouches[getTouchByID(pinchTouches[1])].__touch;

			pCX = (A.pageX + B.pageX) / 2 - dom.offset(__stage).left;
			pCY = (A.pageY + B.pageY) / 2 - dom.offset(__stage).top;

			return getDist(A.pageX - B.pageX, A.pageY - B.pageY);
		},
		resetPinch = function() {
			// ezt akkor is meg kellene hivni ha atmeretezzuk a stage-et, bar pinching kozben az lehet fura lenne... de megis
			pzX = zX * zF;
			pzY = zY * zF;
			zX = zTX = zY = zTY = 0;

			pBD = setPinch();
			pSC = 1;
			pBZF = zF;
			pBX = pCX - pzX; // a jo kezdopozicio!
			pBY = pCY - pzY;

			var BS = bookScale + zoomScale * pBZF;
			pSX = (((pCX + dom.offset(__stage).left) - dom.offset(__book).left) / BS - bookWidth / 2) / (BS); //-bookCOffsX;
			pSY = (((pCY + dom.offset(__stage).top) - dom.offset(__book).top) / BS - bookHeight / 2) / (BS); //-bookCOffsY;
		},
		renewPinch = function() {
			pBD = setPinch() / pSC;
		},
		updatePinch = function() {
			pSC = setPinch() / pBD;
			pTF = getPinchZF(); // zF ***
		},
		getPinchZF = function() {
			var p100 = bookScale + zoomScale * pBZF,
				nZF = ((p100 * pSC) - bookScale) / zoomScale;

			return nZF;
		},
		endPinch = function() {
			zX = pzX / zF;
			zY = pzY / zF;

			var result = checkZoomPos(zX, zY);
			zTX = result.x;
			zTY = result.y;

			pzX = pzY = 0;
			setZoomBtnStat();
		},
		setPinchTargetPosition = function(x, y) {
			//pzX = x-pBX + pSX*(bookScale+zoomScale*pBZF) - pSX*(bookScale+zoomScale*zF);
			//pzX = x-pBX + pSX*zoomScale*pBZF - pSX*zoomScale*zF;
			pzX = x - pBX + pSX * zoomScale * (pBZF - zF); // +bookCOffsX*(zF-pBZF);
			pzY = y - pBY + pSY * zoomScale * (pBZF - zF); // +bookCOffsY*(zF-pBZF);
			//pzY = y-pBY ;
		},

		//Multitouch end -------------------------------------------------------------------------

		// some helper functions
		setTargetCoords = function(e) {
			// get book coordinates. Sets the position of cursor relative to the book. Center - middle.
			var pageX;
			var pageY;
			var eventCoordinates = getCoordinatesFromEvent(e, false);
			if (typeof eventCoordinates !== 'undefined') {
				pageX = eventCoordinates.x;
				pageY = eventCoordinates.y;
			}
			var BS = bookScale + zoomScale * zF;
			var x = (pageX - dom.offset(__book).left) / BS - bookWidth / 2 - bookCOffsX;
			var y = (pageY - dom.offset(__book).top) / BS - bookHeight / 2 - bookCOffsY;

			if (!isNaN(x)) {
				mx = x;
				my = y;
			}
		},
		getZoomTargetCoords = function(nospeed, posX, posY, useMaxZf) {
			//// OLD
			//var speed = {
				//x: 1,
				//y: 1
			//};
			//var sf = 1;
			//var result = {};
			//if (zoomDrag) {
				//if (nospeed) {
					//speed.x = speed.y = 1 * sf;
					//if (zF > 0) {
						//speed.x = speed.y = 1 * sf / zF;
					//}
				//} else {
					//var bw = bookWidth;
					//var bh = bookHeight;
					//if (_SinglePageMode) {
						//if (_VerticalMode) {
							//bh /= 2;
						//} else {
							//bw /= 2;
						//}
					//}
					//var controlBarHeight = 0;
					//if (_ControlbarEnabled) {
						//controlBarHeight = __controlbar.getHeight();
					//}

					//var zfForCalc = zF;
					//if (useMaxZf) {
						//zfForCalc = getMaxZoomFactor();
					//}
					//var currentBS = bookScale + zoomScale * zfForCalc;

					//var initialBS = bookScale;
					//var initialMarginX = (_StageWidth - bw * initialBS) / 2;
					//var newMarginX = (initialMarginX * currentBS) / initialBS;
					//bw += newMarginX + newMarginX + bookCOffsX;
					//bh += _MarginTop + _MarginBottom + bookCOffsY + controlBarHeight;
					//var zoomedWidth = bw * currentBS;
					//var zoomedHeight = bh * currentBS;
					//speed.x = (zoomedWidth - _StageWidth) / _StageWidth;
					//speed.y = (zoomedHeight - _StageHeight) / _StageHeight;
					//var _posX = parseInt(posX - dom.offset(__stage).left, 10) * speed.x;
					//var _posY = parseInt(posX - dom.offset(__stage).left, 10) * speed.x;
					//return {
						//x: (posX * (_StageWidth * currentBS / initialBS - _StageWidth)) / _StageWidth,
						//y: (posY * (_StageHeight * currentBS / initialBS - _StageHeight)) / _StageHeight
					//};

				//}
			//}
			//return {
				//x: parseInt(posX - dom.offset(__stage).left, 10) * speed.x,
				//y: parseInt(posY - dom.offset(__stage).top, 10) * speed.y
			//};
			///// NEW
			var speed = {
				x: 1,
				y: 1
			};
			var sf = 1;
			var result;
      var bw = bookWidth;
      var bh = bookHeight;
      if (_SinglePageMode) {
        if (_VerticalMode) {
          bh /= 2;
        } else {
          bw /= 2;
        }
      }
      var controlBarHeight = 0;
      if (_ControlbarEnabled) {
        controlBarHeight = __controlbar.getHeight();
      }

      var zfForCalc = zF;
      if (useMaxZf) {
        zfForCalc = getMaxZoomFactor();
      }
			var _zF = zfForCalc / getMaxZoomFactor();
			var maxZf = getMaxZoomFactor();
			var maxBS = bookScale + zoomScale * maxZf;
      var currentBS = bookScale + zoomScale * zfForCalc;
      var initialBS = bookScale;

      var zoomedBookWidthInitial = bw * initialBS;
      var initialMarginX = (_StageWidth - zoomedBookWidthInitial) / 2;
      var newMarginX = initialMarginX * currentBS / initialBS;
      if (newMarginX > _StageWidth / 2) {
        newMarginX = _StageWidth / 2;
      }
      var newStageWidth = bw * currentBS + newMarginX * 2;

      var zoomedBookHeightInitial = bh * initialBS;
      var initialMarginY = (_StageHeight - zoomedBookHeightInitial - controlBarHeight) / 2;
      var newMarginY = initialMarginY * maxBS / initialBS;
      if (newMarginY > _StageHeight / 2) {
        newMarginY = (_StageHeight) / 2;
      }
			var currentMarginY = initialMarginY + _zF * (newMarginY - initialMarginY);
			var maxStageHeight = bh * maxBS + controlBarHeight + newMarginY * 2;
			var currentFullStageHeight = bh * currentBS + controlBarHeight + currentMarginY * 2;

      var newStageHeight = bh * currentBS + controlBarHeight + newMarginY * 2;
			var newMarginYDownscaled = newMarginY * initialBS / currentBS;
			var marginDiff = initialMarginY - newMarginYDownscaled;
      if (!touchControl && zoomDrag) {
        if (nospeed) {
          speed.x = speed.y = 1 * sf;
          if (zF > 0) {
            speed.x = speed.y = 1 * sf / zF;
          }
        } else {
					var newPosY;
					var y;
					if (posY < initialMarginY) {
						var positionOnInitialMarginTop = posY;
						var positionOnNewMarginTop = positionOnInitialMarginTop * newMarginY / initialMarginY;
						newPosY = positionOnNewMarginTop;
					} else if (posY > initialMarginY + zoomedBookHeightInitial) {
						var positionOnInitialMarginBottom = posY - zoomedBookHeightInitial - initialMarginY;
						var positionOnNewMarginBottom = positionOnInitialMarginBottom * (newMarginY) / (initialMarginY);
						newPosY = newMarginY + bh * currentBS + positionOnNewMarginBottom;
					} else {
						var positionOnInitialBook = posY - initialMarginY;
						var positionOnNewBook = positionOnInitialBook * (bh * currentBS) / zoomedBookHeightInitial;
						newPosY = newMarginY + positionOnNewBook;
					}
					var _y = (newPosY - posY) - ((newStageHeight - controlBarHeight) / 2 - (_StageHeight) / 2);
					_y += (currentFullStageHeight - controlBarHeight - _StageHeight) / 2;

          result = {
            x: (posX * (newStageWidth - _StageWidth)) / _StageWidth,
						y: _y
          };

        }
      }
      if (typeof result === 'undefined') {
        result = {
          x: parseInt(posX - dom.offset(__stage).left, 10) * speed.x,
          y: parseInt(posY - dom.offset(__stage).top, 10) * speed.y
        };
      }
      return result;
      ///
		},
		touchid,
		mytouch,
		getCoordinatesFromEvent = function(event, updateMytouch) {
			var x, y;
			var result;
			var eventForCoordinates = event;
			if (typeof updateMytouch === 'undefined') {
				updateMytouch = true;
			}
			if (currentTouchControl && touchType === 'touch') {
				var changedTouches = event.changedTouches;
				eventForCoordinates = undefined;
				if (typeof changedTouches[0] !== 'undefined') {
					if (updateMytouch) {
						if (touchid && typeof window.TouchEmulator === 'undefined') {
							eventForCoordinates = mytouch;
						} else {
							touchid = changedTouches[0].identifier;
							mytouch = changedTouches[0];
							eventForCoordinates = mytouch;
						}
					} else {
						eventForCoordinates = changedTouches[0];
					}
				}
			}
			if (!currentTouchControl || (touchType === 'touch' && typeof eventForCoordinates !== 'undefined')) {
				if (typeof eventForCoordinates.pageX !== 'undefined') {
					if (typeof eventForCoordinates.pageY !== 'undefined') {
						x = eventForCoordinates.pageX;
						y = eventForCoordinates.pageY;
					}
				}
			} else if (touchType === 'pointer') {
				if (typeof eventForCoordinates.clientX !== 'undefined') {
					if (typeof eventForCoordinates.clientY !== 'undefined') {
						x = eventForCoordinates.clientX;
						y = eventForCoordinates.clientY;
					}
				}
			}
			if (typeof x !== 'undefined') {
				result = {
					x: x,
					y: y
				};
			}
			return result;
		},
		checkPreflipArea = function(mx, my, over) {
			var output = "",
				pfa = _PreflipArea * (over ? 1.2 : 1);
			if (_VerticalMode) {
				if (my > -leftPageH && my < rightPageH) {
					if (my < -leftPageH + pfa) {
						if (mx > -leftPageW && mx < -leftPageW + pfa) output = "BL";
						else if (mx < leftPageW && mx > leftPageW - pfa) output = "TL";
					} else if (my > rightPageH - pfa) {
						if (mx > -rightPageW && mx < -rightPageW + pfa) output = "BR";
						else if (mx < rightPageW && mx > rightPageW - pfa) output = "TR";
					}
				}
			} else {
				if (mx > -leftPageW && mx < rightPageW) {
					if (mx < -leftPageW + pfa) {
						if (my > -leftPageH && my < -leftPageH + pfa) output = "TL";
						else if (my < leftPageH && my > leftPageH - pfa) output = "BL";
					} else if (mx > rightPageW - pfa) {
						if (my > -rightPageH && my < -rightPageH + pfa) output = "TR";
						else if (my < rightPageH && my > rightPageH - pfa) output = "BR";
					}
				}
			}
			return output;
		},
		getFlippingAreaPercents = function() {
			var areaPercents = _TwoPagesFlippingAreaPercentsPC;
			if (touchControl) {
				areaPercents = _TwoPagesFlippingAreaPercentsMobile;
				if (_SinglePageMode) {
					areaPercents = _TwoPagesFlippingAreaPercentsMobileSP;
				}
			}
			return areaPercents;
		},
		checkControlArea = function(mx, my) {
			var output = "";
			var areaPercents = getFlippingAreaPercents();
			if (touchControl && zF > 0.01) {
				areaPercents = _TwoPagesFlippingAreaPercentsMobileZoomed;
			}
			var spmTouch = _SinglePageMode && touchControl;
			if (_VerticalMode) {
				_SecondaryDragArea = areaPercents * Math.max(leftPageH, rightPageH);
				if (_SinglePageMode) {
					_InsideDragArea = _SecondaryDragArea;
				}
				var effLPH = spmTouch ? leftPageH / 2 : leftPageH;
				var effRPH = spmTouch ? rightPageH / 2 : rightPageH;
				if (my > -effLPH && my < effRPH) {
					if (my < -effLPH + _SecondaryDragArea) {
						if (Ma(mx) < leftPageW && (!_SinglePageMode || mx < -leftPageW + _PreflipArea || mx > leftPageW - _PreflipArea)) output = "OL";
					} else if (my > effRPH - _SecondaryDragArea) {
						if (Ma(mx) < rightPageW && (!_SinglePageMode || mx < -rightPageW + _PreflipArea || mx > rightPageW - _PreflipArea)) output = "OR";
					} else if (Ma(my) < _InsideDragArea) {
						output = my < 0 ? "IL" : "IR";
					}
				}
			} else {
				_SecondaryDragArea = areaPercents * Math.max(leftPageW, rightPageW);
				if (_SinglePageMode) {
					_InsideDragArea = _SecondaryDragArea;
				}
				var effLPW = spmTouch ? leftPageW / 2 : leftPageW;
				var effRPW = spmTouch ? rightPageW / 2 : rightPageW;
				if (mx > -effLPW && mx < effRPW) {
					if (mx < -effLPW + _SecondaryDragArea) {
						if (Ma(my) < leftPageH && (!_SinglePageMode || my < -leftPageH + _PreflipArea || my > leftPageH - _PreflipArea)) output = "OL";
					} else if (mx > effRPW - _SecondaryDragArea) {
						if (Ma(my) < rightPageH && (!_SinglePageMode || my < -rightPageH + _PreflipArea || my > rightPageH - _PreflipArea)) output = "OR";
					} else if (Ma(mx) < _InsideDragArea) {
						output = mx < 0 ? "IL" : "IR";
					}
				}
			}
			return output;
		},
		checkPageArea = function(mx, my) {
			if (_VerticalMode) {
				var PW = getTheRightSize(my, leftPageW, rightPageW);
				if (my > -leftPageH && my < rightPageH && mx > -PW && mx < PW) {
					return TRUE;
				}
			} else {
				var _leftPageH = 0;
				if (!_SinglePageMode) {
					_leftPageH = leftPageH;
				}
				var PH = getTheRightSize(mx, _leftPageH, rightPageH);
				if (mx > -leftPageW && mx < rightPageW && my > -PH && my < PH) {
					return TRUE;
				}
			}
			return FALSE;
		},
		getTheRightSize = function(c, a, b) {
			return c < 0 ? a : b;
		},
		canZoom = function(e) {
			// click zoom over the following DOM element types is disabled
			var target = e.target;
			var tagName = target.tagName ? target.tagName.toLowerCase() : '';
			return !(tagName === 'input' ||
				tagName === 'textarea' ||
				tagName === 'button');
		},

		//-------------------------------------------------------------------------------------
		// generator/selector functions
		pageDOM = function(pPage) {
			var isBlankPage = (pages[pPage].__BackgroundFiles.length == 0) ? true : false;
			var domStr;
			var flippingAreaPercents = getFlippingAreaPercents();
			var pageClass;
			if (isBlankPage) {
				pageClass = 'pf-page-container white-bg' + (pages[pPage].__outer ? ' pf-outer' : '') + (_ID ? ' ' + _ID : '');
			} else {
				pageClass = 'pf-page-container pf-' + sides[pPage % 2] + '-side' + (pages[pPage].__outer ? ' pf-outer' : '') + (_ID ? ' ' + _ID : '');
			}
			var cursorOverlayDiv = '';
			if (_ZoomCursorEnabled && pages[pPage].__PageNumber && pages[pPage].__PageNumber > 0) {
				var $cursorOverlayDiv = dom.create('div', {'class': 'pf-page-cursoroverlay'});
				$cursorOverlayDiv.setAttribute('id', 'page' + pPage + 'cursoroverlay');
				var width = pages[pPage].__renderWidth;
				var height = pages[pPage].__renderHeight;
				if (width && height) {
					var areaPercents = getFlippingAreaPercents();
					var checkLeftArea = false;
					var checkRightArea = false;
					if (_SinglePageMode) {
						if (pages[pPage].__PageNumber === 1 && _MaxPageLimit - 1 > 1) {
							checkRightArea = true;
						} else if (pages[pPage].__PageNumber > 1 && pages[pPage].__PageNumber === _MaxPageLimit - 1) {
							checkLeftArea = true;
						} else if (pages[pPage].__PageNumber > 1 && pages[pPage].__PageNumber < _MaxPageLimit - 1) {
							checkLeftArea = true;
							checkRightArea = true;
						}
					} else {
						if (pages[pPage].__PageNumber === 1 && _MaxPageLimit - 1 > 1) {
							checkRightArea = true;
						} else if (pages[pPage].__PageNumber > 1 && pages[pPage].__PageNumber === _MaxPageLimit - 1) {
							if ((_MaxPageLimit - 1) % 2 === 0) {
								checkLeftArea = true;
							}
						} else if (pages[pPage].__PageNumber > 1 && pages[pPage].__PageNumber < _MaxPageLimit - 1) {
							if ((_MaxPageLimit - 1) % 2 === 0) {
								if (pages[pPage].__PageNumber % 2 === 0) { //left
									checkLeftArea = true;
								} else { //right
									checkRightArea = true;
								}
							}
						}
					}
					var widthWithoutFA = width;
					var offsetLeft = 0;
					if (checkLeftArea) {
						widthWithoutFA -= width * areaPercents;
						offsetLeft += width * areaPercents;
					}
					if (checkRightArea) {
						widthWithoutFA -= width * areaPercents;
					}
					dom.css($cursorOverlayDiv, {
						'position': 'absolute',
						'height': '100%',
						'width': widthWithoutFA + 'px',
						'top': '0px',
						'left': offsetLeft + 'px',
						'pointer-events': 'none'
					});
					cursorOverlayDiv = $cursorOverlayDiv.outerHTML;
				}
			}
			domStr = div(
				pageClass,
				'page' + pPage,
				[
					cursorOverlayDiv,
					div('pf-page-content', 'page' + pPage + 'content')
				]
			);
			return domStr;
		},
		div = function(pClass, pId, pInnerDiv) {
			var output = '<div' + (pId ? ' id="' + pId + '"' : '') + (pClass ? ' class="' + pClass + '"' : '') + '>';
			if (pInnerDiv) {
				if (!Array.isArray(pInnerDiv)) {
					pInnerDiv = [pInnerDiv];
				}
				pInnerDiv.forEach(function(innerDivStr, _) {
					if (typeof innerDivStr === 'string') {
						output += innerDivStr;
					}
				});
			}
			return output + '</div>';
		},
		p$ = function(pPN) {
			return document.getElementById("page" + pPN);
		}, // the page container
		c$ = function(pPN) {
			return document.getElementById("page" + pPN + "content");
		}, // the content block of a page
		e$ = function(pPN) {
			return document.getElementById("page" + pPN + "emboss");
		}, // the page emboss (center shadow)
		m$ = function(pPN) {
			return document.getElementById("page" + pPN + "mask");
		}, // the mask of a page
		fsc$ = function(pPN) {
			return document.getElementById("page" + pPN + "flipshadowcontainer");
		}, // flip shadow container of a page
		fsA$ = function(pPN) {
			return document.getElementById("page" + pPN + "flipshadowA");
		}, // flip shadow A
		fsB$ = function(pPN) {
			return document.getElementById("page" + pPN + "flipshadowB");
		}, // flip shadow B
		fts$ = function(pPN) {
			return document.getElementById("page" + pPN + "fliptopshadow");
		}, // flip top shadow
		hts$ = function(pPN) {
			return document.getElementById("page" + pPN + "hardtopshadow");
		}, // hard top shadow
		tr = function(pX, pY) {
			return "translate(" + pX + "px," + pY + "px) ";
		},
		getDist = function(x, y, signed) { // the distance of 2 points
			var l = Mq(x * x + y * y);
			if (signed) {
				l *= x > 0 ? -1 : 1;
			}
			return l;
		},
		PD = function(e) {
			return e.preventDefault();
		},

		//initialization -----------------------------------------------------------------------
		pageflipInit = function(pConfig, ID) {
			if (__pageflip == __undefined) {
				touchControl = true;
				if ((window.PointerEvent || window.navigator.pointerEnabled) && !!(window.navigator.msMaxTouchPoints)) {
					pfEvent = {
						__onStart: 'pointerdown',
						__onMove: 'pointermove',
						__onEnd: 'pointerup'
					};
					touchType = 'pointer';
					clickEventName = 'pointerup';
				} else if ((window.MSPointerEvent || window.navigator.msPointerEnabled) && !!(window.navigator.msMaxTouchPoints)) {
					pfEvent = {
						__onStart: 'MSPointerDown',
						__onMove: 'MSPointerMove',
						__onEnd: 'MSPointerUp'
					};
					touchType = 'pointer';
					clickEventName = 'MSPointerUp';
				} else if ('ontouchstart' in __window || !!(window.navigator.msMaxTouchPoints) || 'TouchEmulator' in window) {
					pfEvent = {
						__onStart: 'touchstart',
						__onMove: 'touchmove',
						__onEnd: 'touchend'
					};
					touchType = 'touch';
					clickEventName = 'touchend';
				} else {
					touchControl = false;
					pfEvent = {
						__onStart: 'mousedown',
						__onMove: 'mousemove',
						__onEnd: 'mouseup'
					};
					clickEventName = 'click';
				}
				if (typeof ID === 'undefined') {
					_ID = 'Flipbook';
				} else {
					_ID = ID;
				}
				__pageflip = this;
				has3d = "WebKitCSSMatrix" in __window || "MozPerspective" in document.body.style;
				/*@cc_on if (/^10/.test(@_jscript_version)) has3d = TRUE; @*/ //IE10 have 3d support

				configSetUp(pConfig);

				if (_GoogleAnalyticsMeasurementId) {
					if (typeof window.gtag !== 'function') {
						window.dataLayer = window.dataLayer || [];
						window.gtag = function(){ window.dataLayer.push(arguments); };
						window.gtag('js', new Date());
						window.gtag('config', _GoogleAnalyticsMeasurementId);
						var s = document.createElement('script');
						s.async = true;
						s.src = 'https://www.googletagmanager.com/gtag/js?id=' + _GoogleAnalyticsMeasurementId;
						document.head.appendChild(s);
					}
					statReset();
				}

				resetMainVariables();
				resetFlippingVariables();
				initPass1();
			} else { //trying to initialize a new pageflip but another one is still active
				return __pageflip;
			}
			return this;
		},
		initLinks = function() {
			window.goToLabel = function(n) {
				API.gotoPageLabel('t' + n, true);
				PFEventDispatcher(12);
			};

			dom.on(document, 'click', 'a.pf-hotspot', function(event) {
				//event.stopPropagation();
				PFEventDispatcher(12);
				var url = event.target.getAttribute('href');
				if (url && !/^mailto:/.test(url)) {
					event.preventDefault();
					var popupWindow = window.open(url, '_blank');
					if (popupWindow) {
						popupWindow.focus();
					}
				} else if (/^mailto:/.test(url)) {
					window.top.location = url;
					return false;
				} else {
					return true;
				}
			});

			if (_LinksTooltipEnabled) {
				__flipbookTooltips = new FlipbookTooltips({
					el: 'a.pf-hotspot',
					color: _TooltipText,
					background: _TooltipBackground,
					orientation: "top",
					text: _LinksTooltipContent,
					margin: 7
				});
			}

			if (!_LinkShowPermanently) {
                fadeLink = new FlipbookLinksFading({el: 'a.pf-hotspot', background: _LinkBackground});
                if (_LinkFading) {
                    addEventHandler('onAutoFlippingSequenceEnded', function() {
                        if (!flipping) {
                            fadeLink.blink();
                        }
                    });
                    addEventHandler('onManualFlippingSequenceEnded', function() {
                        fadeLink.blink();
                    });
                    addEventHandler('onManualEnded', function() {
                        
                    });
                }
            }
		},
		initPass1 = function() {
			//initialization with all data available in variables.
			function _initPass1Ready() {
				if (_NavigationArrowsEnabled) {
					var size = window.NavigationArrowsManager.getSize();
					if (_Margin < size) {
						_MarginLeft = size;
						_MarginRight = size;
					}
				}
				htmlBuffer = __pageflip.innerHTML;
				var $pagesTemplate = document.getElementById('Template-pages');
				if (window.flipbookSettings) {
					var $container = dom.create('div');
					Object.keys(window.flipbookSettings.pages).forEach(function(num) {
					var page = window.flipbookSettings.pages[num];
					var $page = dom.create('div', {
						'class': 'page',
						'data-background-file-desktop': _IncDirPath + 'inc/pages/page' + num + '.jpg',
						'data-thumbnail-image': _IncDirPath + 'inc/pages/thumbnails/page' + num + '.jpg',
						'data-page-label': 't' + num
					});
						page.links.forEach(function(link, link_num) {
							var $link;
							if (link.is_internal) {
							$link = dom.create('a', {'class': 'pf-hotspot', 'onclick': 'goToLabel(' + link.link + ')'});
							dom.css($link, {
								top: link.top,
								left: link.left,
								width: link.width,
								height: link.height
							});
						} else {
						$link = dom.create('a', {
								class: 'pf-hotspot',
								href: link.link
							});
							dom.css($link, {
								top: link.top,
								left: link.left,
								width: link.width,
								height: link.height
							});
							}
							$page.append($link);
						});
						page.videos.forEach(function(video, page_num) {
							var $videoContainer = dom.create('div', {
								class: 'video-container'
							});
							var $videoplayer = dom.create('div', {
								class: 'video-player',
								'data-id': video.id,
								'data-width': parseInt(video.width),
								'data-height': parseInt(video.height),
								'data-top': parseInt(video.top),
								'data-left': parseInt(video.left)
							});
							if (video.host === 'youtube') {
								$videoplayer.classList.add('youtube-player');
							} else if (video.host === 'vimeo') {
								$videoplayer.classList.add('vimeo-player');
							}
							$videoContainer.append($videoplayer);
							$page.append($videoContainer);
						});
						$container.append($page);
					});
					$pagesTemplate = $container;
				}
				__pagesTemplate = $pagesTemplate;
				if ($pagesTemplate && $pagesTemplate.children.length > 0) {
					__pageflip.innerHTML = $pagesTemplate.innerHTML;
					initPass2();
				} else {
					initPass2();
				}

				dom.css(__book, 'display', 'block');
			}
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', _initPass1Ready);
			} else {
				_initPass1Ready();
			}
		},
		initPass2 = function() {
			//initialization with loaded content.
			var $pageData = [].slice.call(__pageflip.children);
			if ($pageData.length == 0) {
				return [];
			};
			pageOrderSetup($pageData);

			var pageNumber = _StartPage = (_StartPage > _MaxPageLimit ? _MaxPageLimit : (_StartPage < _MinPageLimit ? _MinPageLimit : _StartPage));
			PN = getPNfromNumber(pageNumber);
			PN -= PN % 2;
			//if (_RightToLeft) PN = maxPage - PN - 1;

			// Create the DOM structure
			var idsuffx = (_ID ? ' ' + _ID : '');
		__pageflip.innerHTML = div('pageflip-container' + idsuffx, 'pf-stage',
			div('pf-book-container' + idsuffx, 'pf-book',
				div('pf-book-offset' + idsuffx, 'pf-bookoffs',
					div('pf-book-content' + idsuffx, 'pf-bookc', [
						_DropShadow ? div((_ID ? _ID : __undefined), 'pf-dropshadow') : __undefined,
						_ZoomCursorEnabled ? div(undefined, 'pf-cursoroverlay') : __undefined
					])
				)
			) +
			div(_ID ? _ID : __undefined, 'pf-controls')
		);
		dom.css(__pageflip, 'visibility', 'visible');

			__stage = document.getElementById('pf-stage');
			__book = document.getElementById('pf-book');
			__bookoffs = document.getElementById('pf-bookoffs');
			__bookc = document.getElementById('pf-bookc');

			dom.css(__book, 'display', 'none');

			if (_DropShadow) {
				__dropshadow = document.getElementById('pf-dropshadow');
				__pageOverlays.push(__dropshadow);
			}
			__doc = document;
			dom.css(__stage, 'background-color', _BackgroundColor);
			if (typeof _BackgroundImage === 'string') {
				dom.css(__stage, {
					'background-image': 'url("' + _BackgroundImage + '")',
					'background-size': 'cover'
				});
			}

			dom.css(__stage, {
				position: "relative",
				margin: auto,
				"-webkit-perspective-origin-x": "50%",
				"-webkit-perspective-origin-y": "50%"
			});
			if (_FullScale) {
				dom.css(__stage, {
					width: '100%',
					height: '100%'
				});
			} else {
				if (typeof _StageWidth === 'undefined') {
					dom.css(__stage, {
						width: _AutoScale ? '100%' : bookWidth + _MarginLeft + _MarginRight
					});
				} else {
					dom.css(__stage, {
						width: _StageWidth
					});
				}

				if (typeof _StageHeight === 'undefined') {
					dom.css(__stage, {
						height: _AutoScale ? '100%' : bookHeight + _MarginTop + _MarginBottom
					});
				} else {
					dom.css(__stage, {
						height: _StageHeight
					});
					dom.css(__stage, {
						overflow: 'hidden'
					});
				}
			}

			setContentSizes();
			dom.css(__book, {
				top: 0,
				left: 0,
				"z-index": 10
			});
			if (_SinglePageMode) {
				dom.css(__book, {
					position: 'absolute'
				});
			} else {
				dom.css(__book, {
					position: 'relative'
				});
			}
			dom.css(__bookc, {
				"transform-style": "preserve-3d",
				opacity: 1
			});
			dom.css(__bookoffs, {
				position: "absolute",
				top: 0,
				left: 0
			});

		if (__pageOverlays.length > 0) {
			__pageOverlays.forEach(function(_el) { dom.css(_el, {
				position: "absolute",
				top: 0,
				left: 0,
				"z-index": 1,
				"transform-origin": _VerticalMode ? "50% 0%" : "0% 50%",
				"opacity": _DropShadowOpacity
			}); });
		}


			if (_Thumbnails) {
				resetThumbnails();
			}
			if (_DisableSelection) {
				dom.css(__pageflip, {
					"user-select": "none"
				});
			}

			// Watch the Hash
			__urlManager = new window.FlipbookUrl({
				singlePageMode: _SinglePageMode
			}, API);
			var urlPageNum = __urlManager.getPageNumberFromUrl();

			__videoManager = new window.VideoManager(API);
			__audioPlayer = new window.AudioPlayer(_SoundList);
			if (_ZoomCursorEnabled) {
				__cursorManager = new window.FlipbookCursorManager({
					cursorColor: _ZoomCursorColor,
					incDirPath: _IncDirPath
				}, API);
				addEventHandler('onFlippingSequenceStarted', function() {
					updateCursor();
				});
				addEventHandler('onAutoFlippingSequenceEnded', function() {
					updateCursor();
				});
				addEventHandler('onManualEnded', function() {
					updateCursor();
				});
			}
			if (_SoundList['pageFlipping']) {
				addEventHandler('onAutoFlippingSequenceStarted', function() {
					__audioPlayer.playSound('pageFlipping');
				});
				addEventHandler('onManualEnded', function() {
					__audioPlayer.playSound('pageFlipping');
				});
			}
			if (_ControlbarEnabled) {
				try { loadControlBar(__videoManager); } catch(e) { console.error('ControlBar init error:', e); }
			}
			API.gotoPageNumber(urlPageNum, true);
			try { initLinks(); } catch(e) { console.error('initLinks error:', e); }
			try { initZoomPinch(); } catch(e) { console.error('initZoomPinch error:', e); }
			initZoomVariables();

			// display the book
			if (_NavigationArrowsEnabled) {
				try { __navigationArrowsManager = new window.NavigationArrowsManager(API, {
					SinglePageMode: _SinglePageMode
				}, _NavigationArrowsColors); } catch(e) { console.error('NavigationArrows error:', e); }
			}
			if (_LinksTooltipEnabled) {
				addEventHandler('onFlippingSequenceStarted', function() {
					if (__flipbookTooltips && __flipbookTooltips.events) __flipbookTooltips.events.hide();
				});
			}

			setPages();
			if (fadeLink && _LinkFading) {
				fadeLink.blink();
			}

		__book.addEventListener(pfEvent.__onStart, onStart);
		__doc.addEventListener(pfEvent.__onMove, onMove); __doc.addEventListener(pfEvent.__onEnd, onEnd);
		if (touchControl) {
			__book.addEventListener('mousedown', onStart);
			__doc.addEventListener('mousemove', onMove); __doc.addEventListener('mouseup', onEnd);
			onTouchCancel = function() {
				lastClickStartTime = undefined;
				if (manualFlipFD) {
					if (flipOrder.indexOf(manualFlipFD) !== -1) {
						endManualFlip(manualFlipFD, false);
					}
					manualFlipFD = null;
					manualFlipTouchId = null;
					manualPreflip = false;
				}
				for (var fi = flipOrder.length - 1; fi >= 0; fi--) {
					if (flipOrder[fi] && (flipOrder[fi].__flipMode === 2 || flipOrder[fi].__flipMode === 3)) {
						endManualFlip(flipOrder[fi], false);
						if (flipOrder[fi] && (flipOrder[fi].__flipMode === 2 || flipOrder[fi].__flipMode === 3)) {
							removeFlip(fi);
						}
					}
				}
				cancelFlip = false;
				zoomDrag = FALSE;
				touchid = null;
			};
			__doc.addEventListener('touchcancel', onTouchCancel);
		}

		__book.addEventListener('wheel', function(e) {
			if (!_MouseControl || !_ClickZoom || touchControl) return;
			if (!checkPageArea(mx, my)) return;
			if (!canZoom(e)) return;
			var delta = e.deltaY !== undefined ? e.deltaY : -e.wheelDelta;
			if (Math.abs(delta) < 20) return;
			if (delta < 0 && !zooming) {
				var result = getZoomTargetCoords(touchControl, e.pageX, e.pageY);
				matchZoomPosition(mx, my, result.x, result.y);
				API.zoomIn();
				e.preventDefault();
			} else if (delta > 0 && zooming) {
				API.zoomOut();
				e.preventDefault();
			}
		});


			// Control The size of the book.
			__window.addEventListener("resize", reSizeStage);
			__window.addEventListener("orientationchange", function() {
				setTimeout(reSizeStage, 300);
				setTimeout(reSizeStage, 600);
			});
			if (window.visualViewport) {
				window.visualViewport.addEventListener("resize", reSizeStage);
			}

			// latest things to set up, then we're finished with initialization...
			if (_FullScale || _AutoScale) {
				reSizeStage();
				setTimeout(reSizeStage, 250);
			}
			setBookOffset();
			preloadLoadedPageImages();
			if (_StartAutoFlip) {
				API.startAutoFlip(FALSE);
			}

			onKeyDown = function(event) {
				switch(event.which || event.keyCode) {
					case 27: // escape
						if (typeof searchScreenManager !== 'undefined') {
							searchScreenManager.closeSearchScreen();
						} else if (typeof searchTooltipManager !== 'undefined') {
							searchTooltipManager.toggleTooltipMini(false);
							searchTooltipManager.toggleTooltipFull(false);
						}
						if (_Thumbnails) thumbnailsHide();
						event.preventDefault();
						break;
					case 37: // left
						API.gotoPrevPage();
						event.preventDefault();
						break;
					case 39: // right
						API.gotoNextPage();
						event.preventDefault();
						break;
				}
			};
			__doc.addEventListener('keydown', onKeyDown);

			// start loop!
			__window.raf = (function() {
				return __window.requestAnimationFrame ||
					__window.webkitRequestAnimationFrame ||
					__window.mozRequestAnimationFrame ||
					function(callback) {
						__window.setTimeout(callback, D100 / 6);
					};
			})();
			loop = TRUE;
			PFLoop(); // start the main loop!

			return __pageflip;
		},

		onTouchCancel, onKeyDown,
		closing, // is closing in progress? then not start it again...
		closePageflip = function(callBack) {
			if (closing || !__pageflip) return;
			closing = TRUE;
			dom.css(__bookc, "opacity", 0);
			if (__controlbar) {
				dom.css(__controlbar, "opacity", 0);
				var newControlbar = __controlbar.cloneNode(true); __controlbar.parentNode.replaceChild(newControlbar, __controlbar); __controlbar = newControlbar;
			}
			if (_Thumbnails) thumbnailsHide();
			__window.setTimeout(function() {
				loop = FALSE;
			}, 900);
			__window.setTimeout(function() {
				flipping = FALSE;
				// stop all timeouts etc.
				stopAutoFlip();
				_ID = __undefined;
				__pageflip.innerHTML = '';
				__pageflip.innerHTML = htmlBuffer; __pageflip.removeAttribute("style");
				__pageflip = __undefined;
				n0 = 85;

				__doc.removeEventListener(pfEvent.__onMove, onMove); __doc.removeEventListener(pfEvent.__onEnd, onEnd);
				if (onTouchCancel) __doc.removeEventListener('touchcancel', onTouchCancel);
				if (onKeyDown) __doc.removeEventListener('keydown', onKeyDown);
				['webkitfullscreenchange', 'mozfullscreenchange', 'msfullscreenchange', 'fullscreenchange'].forEach(function(evt) { __doc.removeEventListener(evt, onFullScreenChange); });
				__window.removeEventListener("resize", reSizeStage);
				closing = FALSE;
				if (callBack) callBack();
			}, 1000);
			// book_time disabled
		},

		// ----------------------------------------------------------------------------------------------------------------
		reSizeStage = function() {
			var vh = __window.innerHeight;
			document.documentElement.style.height = vh + 'px';
			document.body.style.height = vh + 'px';
			/*
			AutoScale
			FullScale
			FillScale
			AutoStageHeight
			*/
			if (_FullScale) {
				// FullScale resizes the stage to fit the browser Window
				dom.css(__pageflip, {
					width: __window.innerWidth,
					height: vh
				});
			}
			if (_FullScale || _AutoScale) {
				// here we resize the book, and show/hide content depending on the Stage size
				var ash = _AutoStageHeight
				if (ash && isFullScreen) { // If fullscreen: clear auto stage height flag, as it have to be 100%
					ash = FALSE;
					dom.css(__stage, {
						height: '100%'
					});
				}

				_StageWidth = window.innerWidth;
				_StageHeight = window.innerHeight;

				if (_AutoMaxHeight) {
					var max = __window.innerHeight - _MaxHeightOffset;
					if (_StageHeight > max) {
						_StageHeight = max;
						ash = FALSE;
						dom.css(__stage, {
							height: max
						});
					}
				}

				var controlBarHeight = 0;
				if (_ControlbarEnabled && !ash) {
					controlBarHeight = __controlbar.getHeight();
				}
				var mw = _StageWidth - _MarginLeft - _MarginRight; //Max width available.
				var mh = ash ? bookHeight : _StageHeight - _MarginTop - _MarginBottom; //Max height
				mh -= controlBarHeight;
				var ow = _ScaleToSinglePage ? _CoverWidth : bookWidth;
				var oh = _ScaleToSinglePage ? _CoverHeight : bookHeight;
				var sx = mw / ow;
				var sy = mh / oh;

				if (_AutoMaxHeight) {
					var minsc = sx < sy ? sx : sy;
					var MH = bookHeight * minsc + _MarginTop + _MarginBottom;
					if (MH > max) {
						ash = FALSE;
						mh = _StageHeight - _MarginTop - _MarginBottom;
						sy = mh / oh;
						dom.css(__stage, {
							height: max
						});
					}
				}

				if (_FlexibleContent) {
					if (_VerticalMode ? mh >= _FlexibleContentMinWidth : mw >= _FlexibleContentMinWidth) {
						_CoverWidth = _PageWidth = Md(mw / HD);
						_CoverHeight = _PageHeight = Md(mh / VD);
						bookScale = 1;
					} else {
						if (_VerticalMode) {
							_CoverHeight = _PageHeight = _FlexibleContentMinWidth / 2;
							bookScale = mh / _FlexibleContentMinWidth;
							_CoverWidth = _PageWidth = mw / bookScale;
						} else {
							_CoverWidth = _PageWidth = _FlexibleContentMinWidth / 2;
							bookScale = mw / _FlexibleContentMinWidth;
							_CoverHeight = _PageHeight = mh / bookScale;
						}
					}

					resetBookVariables();
					setContentSizes();

					for (var i = 0; i < pages.length; i++) {
						pages[i].__renderWidth = _PageWidth;
						pages[i].__renderHeight = _PageHeight;
						pages[i].__maskSize = pages[i].__isCover ? maskcw : maskpw;
					}

					resetPages();

				} else {
					if (_FillScale) {
						if (sx > sy) {
							bookScale = sx;
						} else {
							bookScale = sy;
						}
					} else {
						if (sx < sy) {
							bookScale = sx;
						} else {
							bookScale = sy;
						}
					}
					if (bookScale > 1 && !_UpScale) {
						bookScale = 1; // if no Upscale, leave it 1
					}
				}

				var bw = bookWidth;
				var bh = bookHeight;
				/*if (_SinglePageMode) {
					if (_VerticalMode) {
						bh /= 2;
					} else {
						bw /= 2;
					}
				}*/

				//var currentBookScale = bookScale + zoomScale * zF;
				//var currentBookHeight = bh * currentBookScale;
				//var currentBookWidth = bw * currentBookScale;
				var currentScreenHeight = window.screen.height;
				var currentScreenWidth = window.screen.width;
				//if (_SinglePageMode) {
					//currentBookWidth *= 2;
				//}
				_UseHQImage = true;
				if (_ChangeQualityOnMobile && _IsPhone) {
					if (typeof _MobileImageMaxHeight !== 'undefined') {
						if (currentScreenHeight <= _MobileImageMaxHeight) {
							_UseHQImage = false;
						} else {
							_UseHQImage = true;
						}
					}
					if (typeof _MobileImageMaxWidth !== 'undefined') {
						if (currentScreenWidth <= _MobileImageMaxWidth) {
							_UseHQImage = false;
						} else if (typeof _MobileImageMaxHeight !== 'undefined') {
							_UseHQImage = true;
						}
					}
				}

				preloadLoadedPageImages();

				bsOX = Md((bookWidth * bookScale - bookWidth) / 2 + (mw - bookWidth * bookScale) / 2);
				if (ash) {
					mh = bookHeight * (bookScale + zoomScale * zF);
					dom.css(__stage, {
						height: mh + (_MarginTop + _MarginBottom)
					});
					bsOY = Mf((bookHeight * (bookScale + zoomScale * zF) - bookHeight) / 2);
				} else {
					bsOY = Mf((bookHeight * bookScale - bookHeight) / 2 - (bookHeight * bookScale - mh) / 2);
				}

				resetZoomVariables(mw, mh);
				PFEventDispatcher('onStageResize');
				setBookScale();

				if (_Thumbnails) setThumbnailsOffset(TRUE); //also adjust the thumbnails.
			} else {
				PFEventDispatcher('onStageResize');
			}
		  updateDoubleTapSpeed();
			zoomOut();
			if (_SinglePageMode) {
				dom.css(__book, {
					clip: 'rect(-' + _StageHeight / bookScale + 'px ' + _StageWidth / bookScale + 'px ' + _StageHeight / bookScale + 'px 2px)'
				}).classList.add('pf-book-container-singlepage');
			}
			updateCursor();
		},
		setContentSizes = function() {
			//flexible content size adjustment
			dom.css(__book, {
				width: bookWidth
			});
			if (_SinglePageMode) {
				dom.css(__book, 'height', bookHeight);
			} else {
				dom.css(__book, 'height', bookHeight);
			}
			dom.css(__bookoffs, {
				width: bookWidth,
				height: bookHeight
			});
			if (__pageOverlays.length > 0) {
				var areaPercents = getFlippingAreaPercents();
			__pageOverlays.forEach(function(_el) { dom.css(_el, {
				width: bookWidth,
				height: bookHeight
			}); });
		}
	},

		bsOX,
		bsOY,
		setBookScale = function() { // Sets the scale of the #pf-book element
			var BX, BY;
			var currentBS = bookScale + zoomScale * zF;
			if (touchControl) {
				BX = bsOX + zX * zF + pzX + _MarginLeft;
				BY = bsOY + zY * zF + pzY + _MarginTop;
				//if (!touchPinch && zoomDrag) {
					//BX = bsOX + zX * zF + pzX;
					//BY = bsOY + zY * zF + pzY;
				//}
			} else { //Implying maxZoomLvl is 1.
				var bw = bookWidth;
				var bh = bookHeight;
				if (_SinglePageMode) {
					if (_VerticalMode) {
						bh /= 2;
					} else {
						bw /= 2;
					}
				}
				var controlBarHeight = 0;
				if (_ControlbarEnabled) {
					controlBarHeight = __controlbar.getHeight();
				}
				var _zF = zF / getMaxZoomFactor();

				var maxZf = getMaxZoomFactor();
				var maxBS = bookScale + zoomScale * maxZf;

				var initialBS = bookScale;

				//var zoomedBookWidthInitial = bw * initialBS;
				//var initialMarginX = (_StageWidth - zoomedBookWidthInitial) / 2;
				//var maxMarginX = initialMarginX * maxBS / initialBS;
				//if (newMarginX > _StageWidth / 2) {
					//newMarginX = _StageWidth / 2;
				//}
				//var newStageWidth = bw * currentBS + newMarginX * 2;

				var zoomedBookHeightInitial = bh * initialBS;
				var initialMarginY = (_StageHeight - zoomedBookHeightInitial - controlBarHeight) / 2;
				var maxMarginY = initialMarginY * maxBS / initialBS;
				if (maxMarginY > _StageHeight / 2) {
					maxMarginY = _StageHeight / 2;
				}
				var currentMarginY = initialMarginY + _zF * (maxMarginY - initialMarginY);
				var maxStageHeight = bh * maxBS + controlBarHeight + maxMarginY * 2;
				var currentFullStageHeight = bh * currentBS + controlBarHeight + currentMarginY * 2;

				var controlBarHeight = 0;
				if (_ControlbarEnabled && !_AutoStageHeight) {
					controlBarHeight = __controlbar.getHeight();
				}

				var mw = _StageWidth - _MarginLeft - _MarginRight;
				var mh = _AutoStageHeight ? bookHeight : _StageHeight - _MarginTop - _MarginBottom;
				mh -= controlBarHeight;
				var maxZFBH = bookHeight * (bookScale + zoomScale * getMaxZoomFactor());
				var _bsOY = bsOY + (currentBS - bookScale) * bsOY / (1 - bookScale);

				BX = bsOX - zX * zF + pzX + _MarginLeft;
				BY = ((_StageHeight - controlBarHeight) / 2 - bh * currentBS / 2) - zY * _zF + pzY;

				dom.css(__book, {
					'transform-origin': '50% top'
				});
			}
			if (_NavigationArrowsEnabled && __navigationArrowsManager && zF < 0.01) {
				__navigationArrowsManager.setPosition(currentBS);
				setBookOffset();
			}
			dom.css(__book, {
				'transform': tr(BX, BY) + 'scale(' + currentBS + ',' + currentBS + ')'
			});
		},
		// ----------------------------------------------------------------------------------------------------------------

		// everything zoom
		zooming, // if zoomed in or zooming in progress
		touchAutoZooming, //
		touchPinch,
		touchPinchType,
		touchPinchScale,
		zoomScale, // the max scale add values (to the displayed bookScale)
		zF, // the zoom factor (0-1)
		zDX, zDY, // Size diference between Book, and available space /2!. Space between borders and book.
		zDXMin, zDXMax,
		zDYMin, zDYMax,
		zDFX, zDFY, // Factor diference between Book, and available space
		zX, zY, // Actual position(the position of the left-upper corner)
		zTX, zTY, // Target position
		zBX, zBY, // Base position. zX when started to drag.
		zPX, zPY, // Previous position
		zFAtStart = 0,
		bookSizeWidth,
		bookSizeHeight,
		pageSizeWidth,
		maxSceneWidth,
		maxSceneHeight,
		zoomDrag, //
		touchDragVelX = 0,
		touchDragVelY = 0,
		touchDragPrevZTX,
		touchDragPrevZTY,
		touchDragPrevTime,
		touchMomentumActive = false,
		mouseoverPositionX,
		mouseoverPositionY,
		maxZoomLvl = 1,
		zoomFactorMultiplier = 2.5,
		initZoomPinch = function() {
			if (!touchControl) return;
			if (!_ZoomEnabled) return;

			var el = __bookoffs;
			var pinchBaseZF = 0;
			var pinchScaleSensitivity = 0.55;
			var pinchSmoothingFactor = 0.25;

			var pinchStartDist = 0;
			var isPinching = false;
			var lastTapTime = 0;
			var lastTapX = 0;
			var lastTapY = 0;
			var pinchStartCenterX = 0;
			var pinchStartCenterY = 0;
			var pinchBaseZX = 0;
			var pinchBaseZY = 0;

			var swipeStartX = 0;
			var swipeStartY = 0;
			var swipeStartTime = 0;

			el.style.touchAction = 'none';

			function getTouchDist(t1, t2) {
				var dx = t1.pageX - t2.pageX;
				var dy = t1.pageY - t2.pageY;
				return Math.sqrt(dx * dx + dy * dy);
			}

			function makePinchEvent(touches) {
				var t1 = touches[0];
				var t2 = touches[1];
				return {
					scale: getTouchDist(t1, t2) / pinchStartDist,
					center: {
						x: (t1.pageX + t2.pageX) / 2,
						y: (t1.pageY + t2.pageY) / 2
					},
					preventDefault: function() {}
				};
			}

			el.addEventListener('touchstart', function(ev) {
				lastNativeTouchTime = Date.now();
				if (ev.touches.length === 1) {
					swipeStartX = ev.touches[0].pageX;
					swipeStartY = ev.touches[0].pageY;
					swipeStartTime = Date.now();
				}
				if (ev.touches.length === 2) {
					pinchStartDist = getTouchDist(ev.touches[0], ev.touches[1]);
					if (pinchStartDist < 1) pinchStartDist = 1;
					isPinching = true;
					var pe = makePinchEvent(ev.touches);
					alignByPinchCoords(pe, true);
					touchPinch = true;
					pinchBaseZF = zF;
					pinchStartCenterX = pe.center.x;
					pinchStartCenterY = pe.center.y;
					pinchBaseZX = zX;
					pinchBaseZY = zY;
					ev.preventDefault();
				}
			}, { passive: false });

			el.addEventListener('touchmove', function(ev) {
				if (isPinching && ev.touches.length >= 2) {
					var pe = makePinchEvent(ev.touches);
					var _maxZoomLvl = getMaxZoomFactor();
					var scaleChange = pe.scale >= 1
						? (pe.scale - 1.0) * pinchScaleSensitivity
						: (1 - 1 / pe.scale) * pinchScaleSensitivity;
					var targetZF = pinchBaseZF + scaleChange;
					if (targetZF < 0) targetZF = 0;
					if (targetZF > _maxZoomLvl) targetZF = _maxZoomLvl;
					zF += (targetZF - zF) * pinchSmoothingFactor;
					if (zF < 0.005) zF = 0;
					if (zF > _maxZoomLvl) zF = _maxZoomLvl;
					zooming = zF > 0;
					PFEventDispatcher(zooming ? 9 : 10, PN);

					if (zF > 0.01) {
						var fingerDeltaX = pe.center.x - pinchStartCenterX;
						var fingerDeltaY = pe.center.y - pinchStartCenterY;
						zX = pinchBaseZX + fingerDeltaX / zF;
						zY = pinchBaseZY + fingerDeltaY / zF;
						zTX = zX;
						zTY = zY;
					}

					updateBorders();
					setBookScale();
					ev.preventDefault();
				}
			}, { passive: false });

			el.addEventListener('touchend', function(ev) {
				if (isPinching && ev.touches.length < 2) {
					isPinching = false;
					touchPinch = false;
					touchPinchType = false;
					if (zF < 0.02) {
						zF = 0;
						zooming = false;
						PFEventDispatcher(10, PN);
					}
					updateBorders();
					var res = checkZoomPos(zX, zY);
					zX = zTX = res.x;
					zY = zTY = res.y;
					setBookScale();
					return;
				}

			if (ev.touches.length === 0 && ev.changedTouches.length === 1 && !isPinching) {
				var touch = ev.changedTouches[0];
				var now = Date.now();

				if (!zooming && !manualFlipFD && swipeStartTime > 0) {
					var swipeDX = touch.pageX - swipeStartX;
					var swipeDY = touch.pageY - swipeStartY;
					var swipeElapsed = now - swipeStartTime;
					if (swipeElapsed < 500 && Math.abs(swipeDX) > 30 && Math.abs(swipeDX) > Math.abs(swipeDY) * 1.2) {
						cancelFlip = false;
						lastTapTime = 0;
						swipeStartTime = 0;
						if (swipeDX < 0) {
							API.gotoNextPage(true);
						} else {
							API.gotoPrevPage(true);
						}
						return;
					}
				}
				swipeStartTime = 0;

				if (!!manualFlipFD || autoFlip) {
					lastTapTime = 0;
					return;
				}

				var dx = touch.pageX - lastTapX;
				var dy = touch.pageY - lastTapY;

					if (now - lastTapTime < 300 && Math.sqrt(dx * dx + dy * dy) < 50) {
						lastTapTime = 0;
						var target = ev.target;
						if (target.className !== 'pf-hotspot') {
							var e = {
								center: { x: touch.pageX, y: touch.pageY },
								target: target,
								preventDefault: function() {}
							};
							alignByPinchCoords(e, true);
							if (zooming) {
								zoomOut();
							} else {
								zoomIn();
							}
						}
						ev.preventDefault();
					} else {
						lastTapTime = now;
						lastTapX = touch.pageX;
						lastTapY = touch.pageY;
					}
				}
			}, { passive: false });

			el.addEventListener('touchcancel', function() {
				if (isPinching) {
					isPinching = false;
					touchPinch = false;
					touchPinchType = false;
				}
			});
		},
		alignByPinchCoords = function(e, nocheck) {
			var setPinchTargetCoords = function(e) {
				var BS = bookScale + zoomScale * zF;
				var x = (e.center.x - dom.offset(__book).left) / BS - bookWidth / 2 - bookCOffsX;
				var y = (e.center.y - dom.offset(__book).top) / BS - bookHeight / 2 - bookCOffsY;

				if (isNaN(x)) {
					return;
				}
				mx = x;
				my = y;
			};

			var zoomPitchTargetCoords = {
				x: parseInt(e.center.x - dom.offset(__stage).left),
				y: parseInt(e.center.y - dom.offset(__stage).top)
			};
			setPinchTargetCoords(e);
			matchZoomPosition(mx, my, zoomPitchTargetCoords.x, zoomPitchTargetCoords.y, nocheck);
		},
		initZoomVariables = function() {
			zoomScale = 0;
			zF = 0;
			zDX = 0;
			zDY = 0;
			zX = 0;
			zY = 0;
			zTX = 0;
			zTY = 0;
			zBX = 0;
			zBY = 0;
			zPX = 0;
			zPY = 0;
			zooming = FALSE;
			zoomDrag = FALSE;
			touchAutoZooming = FALSE;
			touchPinchType = FALSE;
		},
		updateBorders = function() {
			var bw = bookWidth;
			var bh = bookHeight;
			var controlBarHeight = 0;
			if (_ControlbarEnabled) {
				controlBarHeight = __controlbar.getHeight();
			}
			var _bw = bw;
			var _bh = bh;
			var _zF = zF;
			if (!touchControl) {
				var maxBookScale = bookScale + zoomScale * getMaxZoomFactor();
				_bw = _bw * maxBookScale;
				_bh = _bh * maxBookScale;
				if (_SinglePageMode) {
					zDX = Math.floor((_bw * 2 - maxSceneWidth) / getMaxZoomFactor());
				} else {
					zDX = Math.floor((_bw - _StageWidth) / (2 * getMaxZoomFactor()));
				}
				zDY = Math.floor((_bh + controlBarHeight - _StageHeight) / (2 * getMaxZoomFactor()));
			} else {
				_bw = _bw * (bookScale + zoomScale * _zF);
				_bh = _bh * (bookScale + zoomScale * _zF);
				zDX = Math.floor((_bw - _StageWidth) / (2*_zF));
				zDY = Math.floor((_bh + controlBarHeight - _StageHeight) / (2*_zF));
			}
			if (touchControl && zooming && _zF > 0.01) {
				var zScale = 1 / _zF;
				var marginScale = 0.5;
				zDYMin = -1 * Math.abs(zDY) - _MarginBottom * marginScale * zScale;
				zDYMax = Math.abs(zDY) + _MarginTop * marginScale * zScale;
			} else {
				zDYMin = -1 * Math.abs(zDY) - _MarginBottom;
				zDYMax = Math.abs(zDY) + _MarginTop;
			}
			if ((touchControl && zDX < -1 * Math.abs(_MarginTop)) || (!touchControl && zDX < 0)) {
				zDX = 0;
				zDXMin = 0;
				zDXMax = 0;
			} else {
				if (touchControl && zooming && _zF > 0.01) {
					var zScaleX = 1 / _zF;
					var marginScaleX = 0.5;
					zDXMin = -1 * zDX - _MarginLeft * marginScaleX * zScaleX;
					zDXMax = zDX + _MarginRight * marginScaleX * zScaleX;
				} else {
					zDXMin = -1 * zDX - _MarginLeft;
					zDXMax = zDX + _MarginRight;
				}
			}
		},
		resetZoomVariables = function(mw, mh) {
			var bw = bookWidth;
			var bh = bookHeight;
			var controlBarHeight = 0;
			if (_SinglePageMode) { // fix for
				if (_VerticalMode) {
					bh /= 2;
				} else {
					bw /= 2;
				}
			}
			if (_ControlbarEnabled) {
				controlBarHeight = __controlbar.getHeight();
			}
			bookSizeWidth = bw;
			bookSizeHeight = bh;
			pageSizeWidth = bw;
			if (!_SinglePageMode) {
				pageSizeWidth = Math.floor(pageSizeWidth / 2);
			}
			zoomScale = (bookScale < 1 ? 1 - bookScale : 0);
			maxSceneWidth = mw;
			maxSceneHeight = mh;
			updateBorders();

			zDFX = bw / maxSceneWidth;
			zDFY = bh / maxSceneHeight;
			if (zDFX < 1) zDFX = 1;
			if (zDFY < 1) zDFY = 1;

			if (zoomScale == 0) {
				initZoomVariables();
			} else if (zooming) { // stage atmeretezesnel igazitas
				var result = checkZoomPos(zTX, zTY)
				zX = zTX = result.x;
				zY = zTY = result.y;
			}
			setZoomBtnStat();
			addEventHandler('onFlippingSequenceStarted', function() {
				if (lastFlipMode !== 3) {
					zoomOut();
				}
				setZoomBtnStat();
				if (_LinksTooltipEnabled) {
					__flipbookTooltips.events.hide();
				}
			});
		},
		zoomIn = function() {
			if (!zooming && bookScale < 1) { // if default
				if (_NavigationArrowsEnabled && __navigationArrowsManager) {
					__navigationArrowsManager.toggle(false);
				}
				zooming = TRUE;
				if (touchControl) touchAutoZooming = TRUE;
				PFEventDispatcher(9, PN);
			}
		},
		zoomOut = function() {
			if (zooming && bookScale < 1) {
				zooming = FALSE;
				if (!touchControl) {
					zX = zTX;
					zY = zTY;
				}
				if (touchControl) touchAutoZooming = TRUE;
				moved = false;
				zoomDrag = false;
				PFEventDispatcher(10, PN);
			}
		},
		getMaxZoomFactor = function() {
			//var _multiplier = 1;
			//if (!touchControl) {
				//_multiplier = (bookScale + ((bookScale * zoomFactorMultiplier * maxZoomLvl - bookScale) * maxZoomLvl)) / (bookScale + zoomScale * maxZoomLvl);
			//}
			var value = (typeof _MaxZoomLevel !== 'undefined' && _MaxZoomLevel > 0) ? _MaxZoomLevel : 1;
			return value;
		},
		prev = 0,
		updateDoubleTapSpeed = function() {
			var durationFramesNumber = _doubleTapZoomSpeed + 1;
			var _maxZoomLvl = getMaxZoomFactor();
			var zf0 = 0.01;
			var speed;
			for (var i = 1.0001; i < 10; i += 0.0001) {
				var sum = zf0 * (1 - Math.pow(i, durationFramesNumber)) / (1 - i);
				if (sum > _maxZoomLvl) {
					speed = i;
					break;
				}
			}
			if (typeof speed === 'undefined') {
			}
			zoomSpeed = speed;
		},
		zoomCurrentFrameNumber = 0,
		zoomSpeed,
		zoomInInProgress = false,
		zoomOutInProgress = false,
		zoomOEF = function() {
			var _maxZoomLvl = getMaxZoomFactor();
			var multiplier;
			var durationMode = typeof _doubleTapZoomSpeed !== 'undefined';
			if (durationMode) {
				multiplier = zoomSpeed;
			} else {
				multiplier = _maxZoomLvl / 7;
			}
		if (!touchControl || touchAutoZooming) {
		// 1 = slow, 2 = default, 3 = fast
		var _zoomSpeedPresets = {
		1: { in: 0.06, out: 0.12 },
		2: { in: 0.15, out: 0.22 },
		3: { in: 0.25, out: 0.30 }
		};
		var _zoomPreset    = _zoomSpeedPresets[_doubleTapZoomSpeed] || _zoomSpeedPresets[2];
		var easeRateIn  = _zoomPreset.in;
		var easeRateOut = _zoomPreset.out;
		if (zooming) {
			if (Ma(_maxZoomLvl - zF) > 0.005 || zoomInInProgress) { // Zoom In
				zoomInInProgress = true;
				zoomOutInProgress = false;
				zF += (_maxZoomLvl - zF) * easeRateIn;
					updateCursor();
					if (Ma(_maxZoomLvl - zF) <= 0.005) {
						zF = _maxZoomLvl;
						zoomInInProgress = false;
						zoomCurrentFrameNumber = 0;
						touchAutoZooming = FALSE;
						updateBorders();
					}
					setBookScale();
					if (_AutoStageHeight) {
						__window.dispatchEvent(new Event('resize')); //reSizeStage();
					}
				}
			} else {
			if (zF > 0.005 || zoomOutInProgress) { // Zoom Out
				zoomOutInProgress = true;
				zoomInInProgress = false;
				zF -= zF * easeRateOut;
					updateCursor();
					if (zF <= 0.005) {
						if (_NavigationArrowsEnabled && __navigationArrowsManager) {
							__navigationArrowsManager.toggle(true);
						}
						zoomOutInProgress = false;
						zoomCurrentFrameNumber = 0;
						zF = 0;
						touchAutoZooming = FALSE;
						updateBorders();
					}
					setBookScale();
					if (_AutoStageHeight) {
						__window.dispatchEvent(new Event('resize')); //reSizeStage();
					}
				}
			}
		}
			setZoomPosition();
		},
		setZoomBtnStat = function() {
			if (__controlbar) {
			dom.css(document.getElementById('b-zoomout'), "display", zooming ? "" : "none");
			dom.css(document.getElementById('b-zoomin'), "display", zooming ? "none" : "");
				enable(document.getElementById('b-zoomin'), (zoomScale > 0 && _ZoomEnabled));
			}
		},
	setZoomPosition = function() {
		if (!touchControl && zooming) {
			if (zTX === zX && zTY === zY) {
				return;
			}
			zX += (zTX - zX) / 5;
			zY += (zTY - zY) / 5;
				setBookScale();
			} else if (touchControl && zooming) {
				if (zoomDrag) {
					if (Math.abs(zTX - zX) > 0.001 || Math.abs(zTY - zY) > 0.001) {
						zX += (zTX - zX) * 0.55;
						zY += (zTY - zY) * 0.55;
						setBookScale();
					}
				} else if (touchMomentumActive) {
					touchDragVelX *= 0.95;
					touchDragVelY *= 0.95;
					zX += touchDragVelX;
					zY += touchDragVelY;
					var res = checkZoomPos(zX, zY);
					zX += (res.x - zX) * 0.12;
					zY += (res.y - zY) * 0.12;
					zTX = zX;
					zTY = zY;
					if (Math.abs(touchDragVelX) < 0.05 && Math.abs(touchDragVelY) < 0.05 &&
						Math.abs(res.x - zX) < 0.5 && Math.abs(res.y - zY) < 0.5) {
						touchMomentumActive = false;
						zX = zTX = res.x;
						zY = zTY = res.y;
					}
					setBookScale();
				}
			} else if (Math.abs(zTX - zX) > 0.001 || Math.abs(zTY - zY) > 0.001) {
				updateBorders();
				var res = checkZoomPos(zTX, zTY);
				zTX = res.x;
				zTY = res.y;
				zX = zTX;
				zY = zTY;
				setBookScale();
			}
		},
		setZoomTargetPosition = function(x, y) {
			x += zBX;
			y += zBY;
			zTX = x;
			zTY = y;
			//if (!touchControl) {
				//var bw = bookWidth;
				//var bh = bookHeight;
				//if (_SinglePageMode) {
					//if (_VerticalMode) {
						//bh /= 2;
					//} else {
						//bw /= 2;
					//}
				//}
				//var controlBarHeight = 0;
				//if (_ControlbarEnabled) {
					//controlBarHeight = __controlbar.getHeight();
				//}

				//var zfForCalc = zF;
				//var currentBS = bookScale + zoomScale * zfForCalc;

				//var initialBS = bookScale;
				//var zoomedBookHeightInitial = bh * initialBS;
				//var initialMarginY = (_StageHeight - zoomedBookHeightInitial - controlBarHeight) / 2;
				//var newMarginY = initialMarginY * currentBS / initialBS;
				//if (newMarginY > _StageHeight / 2) {
					//newMarginY = (_StageHeight) / 2;
				//}
				//var newMarginYDownscaled = newMarginY * initialBS / currentBS;
				//var marginDiff = initialMarginY - newMarginYDownscaled;
				//zTY -= marginDiff;
			//}
			var dX = zTX - zPX;
			var dY = zTY - zPY;
			if (zF > 0) {
				dX = dX / zF;
				if (!touchControl) {
					dY = dY * (zF / getMaxZoomFactor());
				} else {
					dY = dY / zF;
				}
			}
			zTX = zPX + dX;
			zTY = zPY + dY;
			if (touchControl) {
				var rubberBand = 0.18;
				if (zTX < zDXMin) {
					zTX = zDXMin + (zTX - zDXMin) * rubberBand;
				} else if (zTX > zDXMax) {
					zTX = zDXMax + (zTX - zDXMax) * rubberBand;
				}
				if (zTY < zDYMin) {
					zTY = zDYMin + (zTY - zDYMin) * rubberBand;
				} else if (zTY > zDYMax) {
					zTY = zDYMax + (zTY - zDYMax) * rubberBand;
				}
				var now = Date.now();
				if (touchDragPrevTime && now - touchDragPrevTime > 0 && now - touchDragPrevTime < 100) {
					var dt = (now - touchDragPrevTime) / 16.67;
					if (dt > 0) {
						touchDragVelX = touchDragVelX * 0.6 + ((zTX - touchDragPrevZTX) / dt) * 0.4;
						touchDragVelY = touchDragVelY * 0.6 + ((zTY - touchDragPrevZTY) / dt) * 0.4;
					}
				}
				touchDragPrevZTX = zTX;
				touchDragPrevZTY = zTY;
				touchDragPrevTime = now;
			} else {
				var result = checkZoomPos(zTX, zTY);
				zTX = result.x;
				zTY = result.y;
			}
		},
		checkZoomPos = function(x, y) {
			//Don't let user to drag outside the borders
			if (touchControl) {
				if (x < zDXMin) x = zDXMin;
				else if (x > zDXMax) x = zDXMax;
				if (y < zDYMin) y = zDYMin;
				else if (y > zDYMax) y = zDYMax;
			} else {
				if (y > Math.abs(zBY)) {
					y = Math.abs(zBY);
				}
			}
			return {
				x: x,
				y: y
			};
		},
		zoomResetDrag = function(x, y) {
            var bw = bookWidth;
            var bh = bookHeight;
            if (_SinglePageMode) {
                if (_VerticalMode) {
                    bh /= 2;
                } else {
                    bw /= 2;
                }
            }
            var controlBarHeight = 0;
            if (_ControlbarEnabled) {
                controlBarHeight = __controlbar.getHeight();
            }

            var zfForCalc = getMaxZoomFactor();
            var currentBS = bookScale + zoomScale * zfForCalc;

            var initialBS = bookScale;
            var zoomedBookWidthInitial = bw * initialBS;
            var initialMarginX = (_StageWidth - zoomedBookWidthInitial) / 2;
            var newMarginX = initialMarginX * currentBS / initialBS;
            if (newMarginX > _StageWidth / 2) {
                newMarginX = _StageWidth / 2;
            }
            var newStageWidth = bw * currentBS + newMarginX * 2;

            var zoomedBookHeightInitial = bh * initialBS;
            var initialMarginY = (_StageHeight - zoomedBookHeightInitial - controlBarHeight) / 2;
            var newMarginY = initialMarginY * currentBS / initialBS;
            if (newMarginY > _StageHeight / 2) {
                newMarginY = (_StageHeight) / 2;
            }
            var newStageHeight = bh * currentBS + controlBarHeight + newMarginY * 2;
			zBX = zX - x;
			//zPY = undefined;
			//zPX = undefined;
			//var checkedPosition = checkZoomPos(zX, zY);
			zPX = zX;
			zPY = zY;
			if (!touchControl) {
				zBY = -1 * ((newStageHeight - controlBarHeight) / 2 - (_StageHeight - controlBarHeight) / 2);
			} else {
				zBY = zY - y;
			}
			touchDragVelX = 0;
			touchDragVelY = 0;
			touchDragPrevTime = undefined;
			touchMomentumActive = false;
		},
		matchZoomPosition = function(mx, my, tx, ty, nocheck) { // 1.3 // keep pointer position over the book while zooming with click
            var bw = bookWidth;
            var bh = bookHeight;
            if (_SinglePageMode) {
                if (_VerticalMode) {
                    bh /= 2;
                } else {
                    bw /= 2;
                }
            }
            var controlBarHeight = 0;
            if (_ControlbarEnabled) {
                controlBarHeight = __controlbar.getHeight();
            }

            var zfForCalc = zF;
			zfForCalc = getMaxZoomFactor();
            var currentBS = bookScale + zoomScale * zfForCalc;

            var initialBS = bookScale;
            var zoomedBookWidthInitial = bw * initialBS;
            var initialMarginX = (_StageWidth - zoomedBookWidthInitial) / 2;
            var newMarginX = initialMarginX * currentBS / initialBS;
            if (newMarginX > _StageWidth / 2) {
                newMarginX = _StageWidth / 2;
            }
            var newStageWidth = bw * currentBS + newMarginX * 2;

            var zoomedBookHeightInitial = bh * initialBS;
            var initialMarginY = (_StageHeight - zoomedBookHeightInitial - controlBarHeight) / 2;
            var newMarginY = initialMarginY * currentBS / initialBS;
            if (newMarginY > _StageHeight / 2) {
                newMarginY = (_StageHeight) / 2;
            }
            var newStageHeight = bh * currentBS + controlBarHeight + newMarginY * 2;
			var x = tx - bsOX - bookWidth / 2 - mx - _MarginLeft - bookCOffsX;
			var y = ty - bsOY - bookHeight / 2 - my - _MarginTop - bookCOffsY;
			var newMarginYDownscaled = newMarginY * initialBS / currentBS;
			var marginDiff = initialMarginY - newMarginYDownscaled;
			if (!touchControl) {
				var newPosY;
				x = -x;
				if (ty < initialMarginY) {
					var positionOnInitialMarginTop = ty;
					var positionOnNewMarginTop = positionOnInitialMarginTop * newMarginY / initialMarginY;
					newPosY = positionOnNewMarginTop;
				} else if (ty > initialMarginY + zoomedBookHeightInitial) {
					var positionOnInitialMarginBottom = ty - zoomedBookHeightInitial - initialMarginY;
					var positionOnNewMarginBottom = positionOnInitialMarginBottom * newMarginY / initialMarginY;
					newPosY = newMarginY + bh * currentBS + positionOnNewMarginBottom;
				} else {
					var positionOnInitialBook = ty - initialMarginY;
					var positionOnNewBook = positionOnInitialBook * (bh * currentBS) / zoomedBookHeightInitial;
					newPosY = newMarginY + positionOnNewBook;
				}
				y = (newPosY - ty) - ((newStageHeight - controlBarHeight) / 2 - (_StageHeight - controlBarHeight) / 2);
				//_y += (currentFullStageHeight - controlBarHeight - _StageHeight) / 2;

				//var newPosY = marginPartYTop * marginRatio + (bookRelativePositionY - marginPartYBottom) + marginPartYBottom * marginRatio;
				//y = (posOnScaledScreen - ty) - ((newStageHeight - controlBarHeight) / 2 - (_StageHeight) / 2);

				//y = (newPosY * (newStageHeight - controlBarHeight - _StageHeight)) / (_StageHeight - 2*marginDiff - controlBarHeight);
				//y = -1 * ((newStageHeight - controlBarHeight) / 2 - (_StageHeight - controlBarHeight) / 2) + y;
			}

			var result;
			if (nocheck || !touchControl) {
				result = {
					x: x,
					y: y
				};
			} else {
				result = checkZoomPos(x, y);
			}
			zX = result.x;
			zTX = result.x;
			zY = result.y;
			zTY = result.y;
		},

		// ----------------------------------------------------------------------------------------------------------------

		// everything Hash
		lastHash, // last stored Hash, to not set again!
		lastPN,
		canUpdateHash,
		updateHash = function(pns) {
			if (_HashControl) {
				if ((!flipQueue || flipQueue.length === 0) && (!flipOrder || flipOrder.length === 0)) {
					__urlManager.updateUrl(pns);
				}
			}
		},

		// control bar function -------------------------------------------------------------------------------------------
		loadControlBar = function(videoManager) {
			if (window.ControlBar) {
				var $controlBarContainer = document.getElementById('pf-controls');
				__controlbar = new window.ControlBar($controlBarContainer, {
					zIndex: (_ControlbarToFront || forceTop) ? 12 : 2,
					colors: _ControlbarColors,
					touchControl: touchControl,
					touchType: touchType,
					pagerText: _PagerText,
					minPageLimit: _MinPageLimit,
					maxPageLimit: _MaxPageLimit,
					hashControl: _HashControl,
					navigationLoop: _navigationLoop,
					fullScreenEnabled: _FullScreenEnabled,
					searchButtonEnabled: _SearchButtonEnabled,
					printButtonEnabled: _PrintButtonEnabled,
					navigationButtonsEnabled: _NavigationButtonsEnabled,
					downloadButtonEnabled: _DownloadButtonEnabled,
					thumbnailsButtonEnabled: _ThumbnailsButtonEnabled,
					controlbarTooltipEnabled: _ControlbarTooltipsEnabled,
					TooltipBackground: _TooltipBackground,
					TooltipText: _TooltipText,
					navbarMinHeight: _NavbarMinHeight,
					navbarMinWidth: _NavbarMinWidth,
					useNavBarMinSizes: _UseNavBarMinSizes,
					navBarTablet: _NavBarTablet,
					navBarMobile: _NavBarMobile
				}, API, videoManager);
				addEventHandler('onPageChangingComplete', function() {
					__controlbar.updatePage();
				});
				if (__urlManager.getPageNumberFromUrl() < 2) {
					__controlbar.updatePage();
				}
				addEventHandler('onStageResize', __controlbar.adjustButtonsToScreenSize);
			}
			isFullScreen = false;
			if (_FullScreenEnabled) {
				fe = document.getElementById("pf-stage");
				_FullScreenEnabled = (fe.requestFullscreen || fe.mozRequestFullScreen || fe.webkitRequestFullScreen || fe.msRequestFullscreen) ? TRUE : FALSE;
			}
			if (_FullScreenEnabled) {
				__doc.addEventListener('webkitfullscreenchange', onFullScreenChange);
			__doc.addEventListener('mozfullscreenchange', onFullScreenChange);
			__doc.addEventListener('fullscreenchange', onFullScreenChange);
			__doc.addEventListener('msfullscreenchange', onFullScreenChange);
			}
			return __controlbar;
		},
		textInput,
		controlbarOnMove = function(e) {
			if (!manualPreflip && !manualFlipFD) thumbnailEventDisabler(e);
		},
		enable = function(btn, enable) {
			if (!btn) return;
			if (enable == __undefined) enable = TRUE;
			if (enable) btn.classList.remove("pf-disabled");
			else disable(btn);
		},
		disable = function(btn) {
			if (!btn) return;
			btn.classList.add("pf-disabled");
		},

		// thumbnail functions ---------------------------------------------------------------------------------------------
		thumbnailOffsets,
		thumbnailPages,
		thumbnailWidths,
		thumbnailToLoad,
		__thumbs,
		__thumbnails,
		resetThumbnails = function() {
			var t = "pageflip-thumbnails",
				tc = "pf-thumbnail-container";

			__book.insertAdjacentHTML('afterend', div((_ThumbnailsHidden ? "pf-hidden" : __undefined), t, div(__undefined, tc)));
			__thumbs = document.getElementById(t);
			if (_ID) __thumbs.classList.add(_ID);
			__thumbnails = document.getElementById(tc);
			dom.css(__thumbnails, "width", maxPage * _ThumbnailWidth * 1.5);
			//Build the thumbnail DOM layout
			thumbnailOffsets = [];
			thumbnailPages = [];
			thumbnailWidths = [];
			thumbnailToLoad = [];
			thumbW = 0;
			thumbTX = 0;
			thumbX = 0;
			var sa = "pf-thumbnail",
				sb = "-",
				sc = "page",
				sd = "spread",
				se = "button",
				sf = sa + sb + sc,
				sg = sa + sb + sd,
				sh = sa + sb + se,
				si = "#" + sa;
			// sf = "pf-thumbnail-page"
			// sg = "pf-thumbnail-spread"
			// sh = "pf-thumbnail-button"
			// si = "#pf-thumbnail"
			for (var i = 0, a, b, t; i <= maxPage; i += 2) {
				a = pages[i].__ThumbnailImageUrl ? i : -1, b = pages[i + 1].__ThumbnailImageUrl ? i + 1 : -1
				if (a < 0 && b >= 0) {
					a = b, b = -1;
				}
				if (a >= 0 && b >= 0) {
					__thumbnails.insertAdjacentHTML('beforeend', div(sg, __undefined, div(sh, sa + a + se) + div(sh, sa + b + se)));
					thumbnailButton(a);
					t = document.querySelector(si + a + se).offsetLeft;
					thumbnailOffsets.push(t + _ThumbnailWidth);
					thumbnailPages.push(i);
					thumbnailWidths.push(_ThumbnailWidth * 2);
					thumbnailButton(b);
					if (_ThumbnailsLazyLoad) thumbnailToLoad.push([a, b]);
				} else if (a >= 0) {
					__thumbnails.insertAdjacentHTML('beforeend', div(sf, __undefined, div(sh, sa + a + se)));
					thumbnailButton(a);
					t = document.querySelector(si + a + se).offsetLeft;
					thumbnailOffsets.push(t + _ThumbnailWidth / 2);
					thumbnailPages.push(i);
					thumbnailWidths.push(_ThumbnailWidth);
					if (_ThumbnailsLazyLoad) thumbnailToLoad.push([a]);
				}
			}
			if (thumbnailOffsets.length) {
				thumbW = t + _ThumbnailWidth * (pages[maxPage].__outer ? 1 : 2) + _MarginRight;
				dom.css(__thumbnails, "width", thumbW + 20);
				setThumbnailsZ();
				thumbDrag = FALSE;
				thumbS = 0; //reset speed ugly...
			__thumbnails.addEventListener(pfEvent.__onStart, thumbnailsOnStart);
			__thumbnails.addEventListener(pfEvent.__onEnd, thumbnailsOnEnd);
			__thumbnails.addEventListener(pfEvent.__onMove, thumbnailsOnMove);
				if (touchControl) {
					__thumbnails.addEventListener('mousedown', thumbnailsOnStart)
					__thumbnails.addEventListener('mouseup', thumbnailsOnEnd)
					__thumbnails.addEventListener('mousemove', thumbnailsOnMove)
				}
				dom.css(__thumbnails, "height", _ThumbnailHeight + 16);
				if (!touchControl) {
					__thumbnails.addEventListener("mouseleave", thumbnailsOnOut);
				}
				thumbnailsHidden = _ThumbnailsHidden; // initaial state from config
				thumbnailsIdle(); // reset idle timer
				addEventHandler('onZoomIn', thumbnailsHide);
				addEventHandler('onZoomOut', thumbnailsHide);
				addEventHandler('onPageChange', thumbnailsHide);
			} else {
				_Thumbnails = FALSE;
				__thumbs.remove();
			}
			if (_ThumbnailsHidden) {
				dom.css(__thumbnails, 'display', 'none');
			}
		},
		setThumbnailsZ = function(forceTop) {
			if (_Thumbnails) {
				var zIndex = 1;
				if (_ThumbnailsToFront || forceTop) {
					zIndex = 12;
				}
				dom.css(__thumbs, "z-index", zIndex);
			}
		},
		thumbnailButton = function(i) {
			var css = {
				width: _ThumbnailWidth,
				height: _ThumbnailHeight,
				"background-size": +_ThumbnailWidth + "px " + _ThumbnailHeight + "px",
				cursor: 'pointer'
			};
			if (!_ThumbnailsLazyLoad) { //TODO?
				css["background"] = "url(" + pages[i].__ThumbnailImageUrl + ")";
			}
			var $button = document.getElementById("pf-thumbnail" + i + "button");
			$button.setAttribute("data-page", i); $button.setAttribute("title", "Page " + pages[i].__PageNumber);
			dom.css($button, css);
			$button.addEventListener('click', function(event) {
				if (!thumbnailsHidden && !flipping) {
					var _btn = event.target.closest('.pf-thumbnail-button'); var t = _btn ? _btn.getAttribute('data-page') : undefined;
					if (typeof t !== 'undefined') {
						thumbCantFollow = TRUE;
						API.gotoPage(t, TRUE);
						thumbnailsHide();
						thumbnailEventDisabler(event);
					}
				}
			});
		},
		thumbnailEventDisabler = function(e) {
			if (!manualFlipFD && !manualPreflip) {
				PD(e);
				e.stopPropagation();
			}
		},
		thumbnailsOnStart = function(e) {
			if (e && e.type && e.type === 'mousedown') {
				currentTouchControl = false;
			} else {
				currentTouchControl = true;
			}
			thumbnailsResetDrag(getPosX(e));
			thumbnailEventDisabler(e);
		},
		thumbnailsOnMove = function(e) {
			if (e && e.type && e.type === 'mousemove' && currentTouchControl) {
				return;
			}
			if (thumbnailsHidden && _ThumbnailsAutoHide && !manualFlipFD && !manualPreflip && !zoomDrag) {
				thumbnailsShow();
			} else {
				thumbnailsIdle();
			}
			if (thumbCanDrag) {
				var _cx = getPosX(e);
				if (!thumbDrag && typeof thumbStartX !== 'undefined' && Math.abs(_cx - thumbStartX) < 8) {
					return;
				}
				thumbDrag = TRUE;
				thumbCantClick = TRUE;
				thumbTX = checkThumbX(thumbBX + _cx);
			}
			thumbnailEventDisabler(e);
		},
		thumbnailsOnEnd = function(e) {
			if (e && e.type && e.type === 'mouseup' && currentTouchControl) {
				return;
			}
			if (!thumbDrag && (e.changedTouches && e.changedTouches.length > 0)) {
				var target = e.changedTouches[0].target;
				var $btn = target.closest('.pf-thumbnail-button');
				if ($btn && !thumbnailsHidden && !flipping) {
					var t = dom.data($btn, 'page');
					if (typeof t !== 'undefined') {
						thumbCantFollow = TRUE;
						API.gotoPage(t, TRUE);
						thumbnailsHide();
						thumbnailEventDisabler(e);
						return;
					}
				}
			}
			thumbnailsDragOver();
		},
		thumbnailsOnOut = function(e) {
			thumbnailsDragOver();
			if (!thumbnailsHidden && _ThumbnailsAutoHide) thumbnailsHide();
		},
		thumbnailsIdle = function(chtime) {
			if (!_ThumbnailsAutoHide) return FALSE;
			var now = getNow();
			if (chtime == __undefined) thumbnailsIdleTimer = now;
			else return (now - thumbnailsIdleTimer) > chtime;
		},
		thumbnailsIdleTimer,
		thumbnailsHidden,
		thumbnailsHide = function() {
			//if (thumbX != thumbTX) {
				//return;
			//}
			thumbnailsHidden = true;
			__thumbs.classList.add("pf-hidden");
			setTimeout(function() {
				if (thumbnailsHidden) {
					setThumbnailsZ(false);
					dom.css(__thumbnails, 'display', 'none');
				}
			}, 300);
		},
		thumbnailsShow = function() {
			thumbnailsIdle();
			thumbnailsHidden = false;
			dom.css(__thumbnails, 'display', 'block');
			__thumbs.classList.remove("pf-hidden");
			setThumbnailsZ(TRUE);
		},
		thumbnailOEF = function() {
			if (!thumbnailsHidden) {
				if (thumbnailsIdle(_ThumbnailsAutoHide)) {
					thumbnailsHide();
				}
				if (thumbX != thumbTX) {
					setThumbnailPosition();
				}
			}
		},

		//thumbnail scrolling, positioning.
		thumbXMin,
		thumbXMax,
		thumbTX,
		thumbX,
		thumbLX, //last x
		thumbW,
		thumbDrag,
		thumbCanDrag,
		thumbBX,
		thumbS,
		thumbPTX,
		thumbCantClick,
		thumbCantFollow,
		thumbStartX,
		setThumbnailsOffset = function(inst) {
			if (thumbCantFollow) {
				thumbCantFollow = FALSE;
				return;
			}

			var w = Mf(_StageWidth / 2), //width()/2 ),
				t,
				l = thumbnailOffsets.length - 1,
				f = thumbnailPages.lastIndexOf(PN);
			if (_ThumbnailAlwaysCentered) {
				thumbXMax = w - thumbnailOffsets[0];
				thumbXMin = w - thumbnailOffsets[l];
			} else {
				thumbXMax = w - thumbnailOffsets[0] - w /*+ _MarginLeft*/ + thumbnailWidths[0] / 2;
				thumbXMin = w - thumbnailOffsets[l] + w /* - _MarginRight */ - thumbnailWidths[l] / 2;

				if (thumbXMax < thumbXMin) {
					thumbXMax = thumbXMin = Mf(thumbXMax + thumbXMin / 2);
				}
			}
			if (f < 0) {
				if (inst) t = 0;
				else return;
			} else {
				t = thumbnailOffsets[f];
			}
			thumbTX = checkThumbX(w - t);
			if (!thumbX == __undefined || thumbnailsHidden || inst) thumbX = thumbTX + 0.5; // force render ugly:(
		},
		setThumbnailPosition = function() {
			if (thumbX == thumbTX) {
				return;
			}
			if (thumbDrag) {
				thumbS = thumbTX - thumbPTX;
				thumbPTX = thumbTX;
			} else if (thumbS != 0) {
				thumbS *= .9;
				if (Ma(thumbS) < 1) {
					thumbS = 0;
				} else {
					thumbTX = checkThumbX(thumbTX + thumbS);
				}
			}
			thumbX += (thumbTX - thumbX) / 5;
			if (Ma(thumbTX - thumbX) < 1) {
				thumbX = thumbTX;
				thumbS = 0;
			};
			dom.css(__thumbnails, "transform", tr(thumbX, 0));

			if (_ThumbnailsLazyLoad && !(Ma(thumbX - thumbLX) < 32)) {
				thumbLX = thumbX
				var min = -_ThumbnailWidth - 32,
					max = _StageWidth + _ThumbnailWidth + 32,
					mt = thumbnailToLoad.length,
					i = 0;
				var __lazyCount = 0;
				while (i < mt && thumbnailOffsets[i] + thumbX < min) {
					i++
				}
				while (i < mt && thumbnailOffsets[i] + thumbX < max) {
					if (thumbnailToLoad[i]) {
					__lazyCount += thumbnailToLoad[i].length;
					thumbnailToLoad[i].forEach(function(a, b) {
							var $thumbnailButton = document.getElementById("pf-thumbnail" + a + "button");
							setSuitableThumbnailImage($thumbnailButton, a).done(function() {
								dom.css($thumbnailButton, {
									'background-image': 'url("' + pages[a].__ThumbnailImageUrl + '")',
									'background-size': 'auto'
								});
							});
						});
						thumbnailToLoad[i] = null;
					}
					i++;
				}
			}
		},
		thumbnailsResetDrag = function(x) {
			thumbCanDrag = TRUE;
			thumbDrag = FALSE;
			thumbCantClick = FALSE;
			thumbStartX = x;
			thumbPTX = thumbTX;
			thumbBX = thumbTX - x;
		},
		thumbnailsDragOver = function() {
			thumbCantClick = thumbDrag;
			thumbDrag = thumbCanDrag = FALSE;
		},
		getPosX = function(event) {
			var coordinates = getCoordinatesFromEvent(event, false);
			if (typeof coordinates !== 'undefined') {
				return coordinates.x;
			}
		},
		checkThumbX = function(x) {
			//x = Mr(x);
			if (x < thumbXMin) x = thumbXMin;
			else if (x > thumbXMax) x = thumbXMax;
			return x;
		},

		// API handler functions ------------------------------------------------
		// These function controls the book navigation.

		gotoPage = function(pn, pSkip, pNoFlipSkip) {
			thumbnailsHide();
			var success = FALSE;
			if (pn < _MinPageLimit || pn > _MaxPageLimit) {
				PFEventDispatcher('onPageChangingComplete');
				return success;
			}
			if (!flipping && flipQueue.length == 0) {
				pn -= pn % 2;
				if (pn != PN) {
					success = TRUE;
					if (pNoFlipSkip) {
						PN = pn;
						PFEventDispatcher('onPageChangingComplete');
						setPages();
					} else {
						var dpn = pn - PN;
						if (pSkip) {
							if (((pn == maxPage - 1 && PN != 0) || (pn == 0 && PN != maxPage - 1)) && (_HardCover || largeCover) && Ma(dpn) > 2) {
								if (dpn < 0) {
									addFlipToQueue(0, dpn + 2);
									addFlipToQueue(200, -2);
								} else {
									addFlipToQueue(0, dpn - 2);
									addFlipToQueue(200, 2);
								}
							} else if (((PN == maxPage - 1 && pn != 0) || (PN == 0 && pn != maxPage - 1)) && (_HardCover || largeCover) && Ma(dpn) > 2) {
								if (dpn < 0) {
									addFlipToQueue(0, -2);
									addFlipToQueue(200, dpn + 2);
								} else {
									addFlipToQueue(0, 2);
									addFlipToQueue(200, dpn - 2);
								}
							} else addFlipToQueue(0, dpn);
						} else {
							var stepLimit = 999,
								dir;
							if (dpn < 0) {
								dir = -1;
								dpn *= -1;
							} else {
								dir = 1;
							}
							dpn /= 2;
							if (dpn < stepLimit) stepLimit = dpn;
							var step = 0,
								lastStep = 0,
								t = dpn / stepLimit;
							for (var i = 0; i < stepLimit; i++) {
								step = Mr(t * (i + 1));
								addFlipToQueue((i ? _FlipDuration / 4 : 0), (step - lastStep) * 2 * dir);
								lastStep = step;
							}
						}
					}
				} else {
					PFEventDispatcher('onPageChangingComplete');
				}
			}
			return success;
		},
		gotoNumber = function(pNumber, pSkip) {
			gotoPage(getPNfromNumber(pNumber), pSkip);
		},
		gotoName = function(pName, pSkip) {
			gotoPage(getPNfromName(pName), pSkip);
		},
		gotoLabel = function(pLabel, pSkip) {
			gotoPage(getPNfromLabel(pLabel), pSkip);
		},
		gotoFirst = function(btn) {
			//if (canFlip()) {
				gotoPage((_RightToLeft && !btn) ? _MaxPageLimit : _MinPageLimit, TRUE);
			//}
		},
		gotoPrev = function(btn) {
			//if (canFlip()) {
				if (_navigationLoop && (!(_RightToLeft && !btn) ? PN < (_MinPageLimit + 1) : PN > (_MaxPageLimit - 2))) {
					return gotoLast(btn);
				}
				return addAutoFlip((_RightToLeft && !btn) ? 1 : -1, (_SinglePageMode && !_RightToLeft) ? 1 : 0, 2);
			//}
		},
		gotoNext = function(btn) {
			//if (canFlip()) {
				if (_navigationLoop && ((_RightToLeft && !btn) ? PN < (_MinPageLimit + 1) : PN > (_MaxPageLimit - 2))) {
					return gotoFirst(btn);
				}
				return addAutoFlip((_RightToLeft && !btn) ? -1 : 1, (_SinglePageMode && _RightToLeft) ? 1 : 0, 2);
			//}
		},
		gotoLast = function(btn) {
			//if (canFlip()) {
				gotoPage((_RightToLeft && !btn) ? _MinPageLimit : _MaxPageLimit, TRUE);
			//}
		},
		getPNfromNumber = function(pNumber) {
			return pNumber > 0 ? pageNumbers.lastIndexOf(parseInt(pNumber)) : -1;
		},
		getPNfromName = function(pName) {
			return pageNames.lastIndexOf(pName.toLowerCase());
		},
		getPNfromLabel = function(pLabel) {
			return pageLabels.lastIndexOf(pLabel);
		},
		pageNumbers,
		pageNames,
		pageLabels,
		resetGotoVariables = function() { // meg kell hivni ha ujrarendezodik az oldal!
			pageNumbers = [], pageNames = [], pageLabels = [];
			for (var i = 0, t; i <= maxPage; i++) {
				pageNumbers[i] = pages[i].__PageNumber;
				pageNames[i] = pages[i].__PageName ? pages[i].__PageName.toLowerCase() : __undefined;
				pageLabels[i] = pages[i].__PageLabel;
			}
		},
		setData = function(pn, pData) {
			if (pData) pages[pn].__Data = pData;
			else return pages[pn].__Data;
		},
		userNav = function() {
			return !(manualPreflip || !!manualFlipFD || pinching);
		},
		pageLimit = function(min, max) {
			if (min == __undefined) min = 0;
			if (max == __undefined) max = maxPage;
			_MinPageLimit = _RightToLeft ? maxPage - max : min;
			_MaxPageLimit = _RightToLeft ? maxPage - min : max;
			if (_MinPageLimit < 0) _MinPageLimit = 0;
			if (_MaxPageLimit > maxPage) _MaxPageLimit = maxPage;
			_MinPageLimit -= _MinPageLimit % 2;
			_MaxPageLimit += (1 - _MaxPageLimit % 2);
		},
		canFlip = function() {
			return !zooming && !_ZoomFlip && zF < 0.01;
		},
		// auto flip functions
		autoFlipTimer,
		startAutoFlipTimer = function() {
			var t = pages[PN].__AutoFlipInterval || pages[PN + 1].__AutoFlipInterval;
			t = t == __undefined ? _AutoFlipInterval : t;
			autoFlipTimer = __window.setTimeout(autoFlipLoop, t);
		},
		startAutoFlip = function(inst) {
			if (inst == __undefined) inst = TRUE;
			if (!autoFlip) {
				autoFlip = TRUE;
				if (inst) {
					autoFlipLoop();
				}
				else {

					startAutoFlipTimer();
				}
			}
		},
		stopAutoFlip = function() {
			if (autoFlip) {
				autoFlip = FALSE;
				__window.clearTimeout(autoFlipTimer);
			}
		},
		autoFlipLoop = function() {
			if (!gotoNext(FALSE)) {
				if (_AutoFlipLoop) {
					gotoFirst();
				} else {
					API.stopAutoFlip();
					return;
				}
			}
			startAutoFlipTimer();
		},
		setPlayBtnStat = function() {
			if (__controlbar) {
			dom.css(document.getElementById('b-pause'), "display", autoFlip ? "" : "none");
			dom.css(document.getElementById('b-play'), "display", autoFlip ? "none" : "");
			}
		},
		isFullScreen,
		fe, fsw, fsh,
		enterFullScreen = function() {
			/*if( !fsw ) {
				fsw = dom.css(__pageflip, "width" );
				fsh = dom.css(__pageflip, "height" );
			}*/

			if (fe.requestFullscreen) {
				fe.requestFullscreen();
			} else if (fe.mozRequestFullScreen) {
				fe.mozRequestFullScreen();
			} else if (fe.webkitRequestFullScreen) {
				fe.webkitRequestFullScreen();
			} else if (fe.msRequestFullscreen) {
				fe.msRequestFullscreen();
			}
			isFullScreen = TRUE;
		},
		exitFullScreen = function() {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitCancelFullScreen) {
				document.webkitCancelFullScreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			}
			isFullScreen = FALSE;
		},
		setFullScreenBtnStat = function() {
			if (_FullScreenEnabled) {
			dom.css(document.getElementById('b-fullscreen'), "display", isFullScreen ? "none" : "");
			dom.css(document.getElementById('b-fullscreenoff'), "display", isFullScreen ? "" : "none");
			}
		},
		onFullScreenChange = function(e) {
			//isFullScreen = !isFullScreen;
			setFullScreenBtnStat();
			/*if( !_FullScale ) {
				// nem jo:(

				dom.css(__pageflip, { width: fsw, height: fsh } );
				fsw = fsh = __undefined;
			}*/
			reSizeStage();
		},
		// flip Queue
		flipQueue,
		addFlipToQueue = function(pDelay, pPNadd) {
			var flipData = {
				__delay: pDelay,
				__pnAdd: pPNadd,
				__startTime: __undefined
			}; //getNow() };
			flipQueue.push(flipData);
		},
		tryQueueFlip = function() {
			var now = getNow(),
				fq = flipQueue[0];
			if (!fq.__startTime) fq.__startTime = getNow();
			if (fq.__delay < (now - fq.__startTime)) {
				if (addAutoFlip((fq.__pnAdd < 0) ? -1 : 1, 0, Ma(fq.__pnAdd))) flipQueue.splice(0, 1);
			}
		},

		//Analytics
		sbooktime,
		spagetimes,
		sLabel,
		statReset = function() {
			sLabel = (_Title ? _Title : "Untitled");
			spagetimes = [];
			sLastViewedPN = __undefined;
			sbooktime = getNow();
			statSendBookView();
		},
		resolveSingleEffectivePN = function(pn) {
			if (!_SinglePageMode) return pn;
			try {
				if (typeof pages !== 'undefined' && pages) {
					if (pages[pn] && pages[pn].__onTop === TRUE && pages[pn].__PageNumber > 0) return pn;
					if ((pn - 1) >= 0 && pages[pn - 1] && pages[pn - 1].__onTop === TRUE && pages[pn - 1].__PageNumber > 0) return pn - 1;
					if (pages[pn + 1] && pages[pn + 1].__onTop === TRUE && pages[pn + 1].__PageNumber > 0) return pn + 1;
				}
			} catch (e) {}
			return pn;
		},
		sLastViewedPN,
		__activeOnTopPNs = [],
		__spreadStartAt = {},
		__addActivePN = function(pn){
			for (var i = 0; i < __activeOnTopPNs.length; i++) { if (__activeOnTopPNs[i] === pn) return; }
			__activeOnTopPNs.push(pn);
		},
		__removeActivePN = function(pn){
			for (var i = 0; i < __activeOnTopPNs.length; i++) { if (__activeOnTopPNs[i] === pn) { __activeOnTopPNs.splice(i,1); return; } }
		},
		__maxActiveCapacity = function(){ return _SinglePageMode ? 1 : 2; },
		statResetPageTime = function(pn) {
			spagetimes[pn] = getNow();
			__addActivePN(pn);
			// If active exceeds capacity, flush the oldest
			if (__activeOnTopPNs.length > __maxActiveCapacity()) {
				var old = __activeOnTopPNs.shift();
				if (typeof spagetimes !== 'undefined' && typeof spagetimes[old] !== 'undefined') {
					statSendPageTime(old);
				}
			}
		},
		getAnalyticsPageNumber = function(pn) {
			try {
				if (typeof pages !== 'undefined' && pages && pages[pn] && pages[pn].__PageNumber > 0) return pages[pn].__PageNumber;
			} catch (e) {}
			return pn;
		},
		// Compute the left page index of a spread for a given page index
		getSpreadLeftPn = function(pn) {
			if (_SinglePageMode) return pn;
			try {
				if (typeof pages === 'undefined' || !pages || !pages[pn] || !(pages[pn].__PageNumber > 0)) return pn;
				var pnum = pages[pn].__PageNumber;
				if (pnum % 2 === 0) return pn; // even numbered pages are on the left
				var left = pn - 1;
				if (left >= 0 && pages[left] && pages[left].__PageNumber > 0) return left;
			} catch (e) {}
			return pn;
		},
		// Compute the right page index of a spread given a left page index
		getSpreadRightPn = function(leftPn) {
			if (_SinglePageMode) return __undefined;
			try {
				var r = leftPn + 1;
				if (typeof pages !== 'undefined' && pages && pages[r] && pages[r].__PageNumber > 0) return r;
			} catch (e) {}
			return __undefined;
		},
		// Build the analytics label for current layout: single page number or spread label like "4-5"
		getAnalyticsPageLabel = function(pn) {
			if (_SinglePageMode) return '' + getAnalyticsPageNumber(pn);
			var left = getSpreadLeftPn(pn);
			var right = getSpreadRightPn(left);
			var leftNum = getAnalyticsPageNumber(left);
			try {
				var leftOnTop = (typeof pages !== 'undefined' && pages && pages[left] && pages[left].__onTop === TRUE);
				var rightOnTop = (typeof right !== 'undefined' && typeof pages !== 'undefined' && pages && pages[right] && pages[right].__onTop === TRUE);
				// Use spread label only when both pages are actually visible
				if (leftOnTop && rightOnTop && typeof right !== 'undefined') {
					var rightNum = getAnalyticsPageNumber(right);
					return leftNum + '-' + rightNum;
				}
				// Otherwise, prefer the actual visible page if known
				if (typeof pages !== 'undefined' && pages && pages[pn] && pages[pn].__onTop === TRUE) {
					return '' + getAnalyticsPageNumber(pn);
				}
			} catch (e) {}
			// Fallback to single left page number
			return '' + leftNum;
		},
		statSendPageTime = function(pn) {
			if (!_GoogleAnalyticsMeasurementId) return;
			if (typeof spagetimes === 'undefined') return;
			if (_SinglePageMode) {
				if (typeof spagetimes[pn] === 'undefined') return;
				var t1 = getNow() - spagetimes[pn];
				t1 = Math.floor(t1 / 1000);
				if (t1 < 1) t1 = 1;
				var label1 = getAnalyticsPageLabel(pn);
				gtag('event', 'flipbook_page_time', { event_category: 'Flipbooks', event_label: sLabel, page_number: label1, value: t1 });
				spagetimes[pn] = __undefined;
				__removeActivePN(pn);
				return;
			}
			var leftPn = getSpreadLeftPn(pn);
			if (pn !== leftPn) {
				if (typeof spagetimes[pn] !== 'undefined') spagetimes[pn] = __undefined;
				__removeActivePN(pn);
				return;
			}
			var rightPn = getSpreadRightPn(leftPn);
			var lts = spagetimes[leftPn];
			var rts = (typeof rightPn !== 'undefined') ? spagetimes[rightPn] : __undefined;
			if (typeof lts === 'undefined' && typeof rts === 'undefined') return;
			var startAt = (typeof lts !== 'undefined') ? lts : rts;
			if (typeof rts !== 'undefined' && typeof lts !== 'undefined') startAt = Math.min(lts, rts);
			var t = getNow() - startAt;
			t = Math.floor(t / 1000);
			if (t < 1) t = 1;
			var label = getAnalyticsPageLabel(leftPn);
			gtag('event', 'flipbook_page_time', { event_category: 'Flipbooks', event_label: sLabel, page_number: label, value: t });
			spagetimes[leftPn] = __undefined;
			__removeActivePN(leftPn);
			if (typeof rightPn !== 'undefined') {
				spagetimes[rightPn] = __undefined;
				__removeActivePN(rightPn);
			}
		},
		statSendBookView = function() {
			if (!_GoogleAnalyticsMeasurementId) return;
			gtag('event', 'flipbook_opened', { event_category: 'Flipbooks', event_label: sLabel });
		},
		statSendPageView = function(pn) {
			if (!_GoogleAnalyticsMeasurementId) return;
			var label = getAnalyticsPageLabel(pn);
			gtag('event', 'flipbook_page_view', { event_category: 'Flipbooks', event_label: sLabel, page_number: label });
		},
		statSendDownload = function() {
			if (!_GoogleAnalyticsMeasurementId) return;
			gtag('event', 'flipbook_download', { event_category: 'Flipbooks', event_label: sLabel });
		},
		statSendPrint = function() {
			if (!_GoogleAnalyticsMeasurementId) return;
			gtag('event', 'flipbook_print', { event_category: 'Flipbooks', event_label: sLabel });
		},

		// EventHandling ----------------------------------------------------------------------------------
		PFEvents = [
			'onFlip', 'onFlipEnd', 'onTop', 'onTopEnd', 'onLoad', 'onUnload', 'onRemove', 'onHide', 'onShow',
			'onZoomIn', 'onZoomOut', 'onPageChange', 'onLinkClicked',
			'onFlippingSequenceStarted', 'onAutoFlippingSequenceStarted', 'onAutoFlippingSequenceEnded',
			'onManualFlippingSequenceEnded', 'onManualEnded', 'onPageChangingComplete', 'onStageResize'
		],
		addEventHandler = function(eventName, eventHandlerF) {
			if (!Array.isArray(eventName)) {
				if (typeof eventCallback[eventName] === 'function') {
					var existingHandler = eventCallback[eventName];
					eventCallback[eventName] = [existingHandler];
				}
				if (Array.isArray(eventCallback[eventName])) {
					eventCallback[eventName].push(eventHandlerF);
				} else {
					eventCallback[eventName] = [eventHandlerF];
				}
			} else {
				var eventNameList = eventName;
				eventNameList.forEach(function(eventName, _) {
					addEventHandler(eventName, eventHandlerF);
				});
			}
		},
		PFEventDispatcher = function(PFEvent, PN) { // This function is triggered by the PageFlip engine
			var eventName;
			if (typeof PFEvent === 'number' && typeof PFEvents[PFEvent] !== 'undefined') {
				eventName = PFEvents[PFEvent];
			} else if (typeof PFEvent === 'string' && PFEvents.indexOf(PFEvent) > -1) {
				eventName = PFEvent;
			}
			if (eventName !== 'undefined') {
				if (eventCallback) { // and if set up correctly, calls USERS's event handler functions.
					var eventHandlerOrList = eventCallback[eventName];
					if (typeof eventHandlerOrList === 'function') {
						eventHandlerOrList(PN);
					} else if (Array.isArray(eventHandlerOrList)) {
						eventHandlerOrList.forEach(function(callback, _) {
							if (typeof callback === 'function') {
								callback(PN);
							}
						});
					}
				}
				if (_GoogleAnalyticsMeasurementId) {
					var effectivePN = _SinglePageMode ? resolveSingleEffectivePN(PN) : getSpreadLeftPn(PN);
				if (eventName === 'onTop') {
					if (sLastViewedPN !== effectivePN) {
						statSendPageView(effectivePN);
						sLastViewedPN = effectivePN;
					}
					statResetPageTime(effectivePN);
				} else if (eventName === 'onTopEnd') {
					if (typeof spagetimes !== 'undefined' && typeof spagetimes[effectivePN] !== 'undefined') {
						statSendPageTime(effectivePN);
					}
				} else if (eventName === 'onPageChangingComplete') {
					try {
						if (typeof pages !== 'undefined' && pages && pages.length) {
							var stillTop = {};
							for (var i = 0; i < pages.length; i++) {
								if (pages[i] && pages[i].__onTop === TRUE) stillTop[i] = TRUE;
							}
							for (var k = 0; k < __activeOnTopPNs.length; k++) {
								var apn = __activeOnTopPNs[k];
								if (!stillTop[apn] && typeof spagetimes !== 'undefined' && typeof spagetimes[apn] !== 'undefined') {
									statSendPageTime(apn);
									k--; // adjust index after removal inside statSendPageTime
								}
							}
							// Ensure timers are started for any current onTop pages that might have missed 'onTop'
							for (var j = 0; j < pages.length; j++) {
								if (pages[j] && pages[j].__onTop === TRUE) {
									if (typeof spagetimes === 'undefined' || typeof spagetimes[j] === 'undefined') {
										statResetPageTime(j);
									}
								}
							}
						}
					} catch (e) {}
				}
				}
			}
		},

		// API -----------------------------------------------------------------------------------
		API = {
			gotoPage: function(pn, pSkip) {
				if (userNav()) {
					stopAutoFlip();
					return gotoPage(pn, pSkip);
				}
			},
			gotoPageNumber: function(pNumber, pSkip) {
				if (userNav()) {
					stopAutoFlip();
					return gotoNumber(pNumber, pSkip);
				}
			},
			gotoPageName: function(pName, pSkip) {
				if (userNav()) {
					stopAutoFlip();
					return gotoName(pName, pSkip);
				}
			},
			gotoPageLabel: function(pLabel, pSkip) {
				if (userNav()) {
					stopAutoFlip();
					return gotoLabel(pLabel, pSkip);
				}
			},
			gotoFirstPage: function(btn) {
				if (_IsPhone && Date.now() - lastNavTime < _FlipDuration) return;
				if (userNav()) {
					lastNavTime = Date.now();
					stopAutoFlip();
					gotoFirst(btn);
				}
			},
			gotoPrevPage: function(btn) {
				if (_IsPhone && Date.now() - lastNavTime < _FlipDuration) return;
				if (userNav()) {
					lastNavTime = Date.now();
					stopAutoFlip();
					gotoPrev(btn);
				}
			},
			gotoNextPage: function(btn) {
				if (_IsPhone && Date.now() - lastNavTime < _FlipDuration) return;
				if (userNav()) {
					lastNavTime = Date.now();
					stopAutoFlip();
					gotoNext(btn);
				}
			},
			gotoLastPage: function(btn) {
				if (_IsPhone && Date.now() - lastNavTime < _FlipDuration) return;
				if (userNav()) {
					lastNavTime = Date.now();
					stopAutoFlip();
					gotoLast(btn);
				}
			},
			startAutoFlip: function(inst) {
				if (userNav() && _AutoFlipEnabled) {
					startAutoFlip(inst);
					setPlayBtnStat();
				}
			},
			stopAutoFlip: function() {
				if (autoFlip) {
					stopAutoFlip();
					setPlayBtnStat();
				}
			},
			toggleAutoFlip: function() {
				autoFlip ? API.stopAutoFlip() : API.startAutoFlip();
			},
			closePageflip: function(callBack) {
				closePageflip(callBack);
			},
			getID: function() {
				return _ID;
			},
			getPN: function() {
				return PN;
			},
			getPageNumber: function(pn) {
				return pages[pn ? pn : PN].__PageNumber;
			},
			getPageName: function(pn) {
				return pages[pn ? pn : PN].__PageName;
			},
			getPageLabel: function(pn) {
				return pages[pn ? pn : PN].__PageLabel;
			},
			showThumbnails: function() {
				if (_Thumbnails) {
					thumbnailsHidden ? thumbnailsShow() : thumbnailsHide();
				}
			},
			hideThumbnails: function() {
				if (_Thumbnails) thumbnailsHide();
			},
			zoomIn: function() {
				if (_ZoomEnabled) {
					zoomIn();
					setZoomBtnStat();
				}
			},
			zoomOut: function() {
				zoomOut();
				setZoomBtnStat();
			},
			toggleZoom: function() {
				zooming ? API.zoomOut() : API.zoomIn();
			},
			mouseControl: function(enabled) {
				_MouseControl = enabled;
			},
			pageLimit: function(min, max) {
				pageLimit(min, max);
			},
			data: function(pn, pData) {
				return setData(pn, pData);
			},
			enterFullScreen: function() {
				return enterFullScreen();
			},
			exitFullScreen: function() {
				return exitFullScreen();
			},
			addPage: function(pContent, pn, pRenumber) {
				addNewPages((function(){ var _d = dom.create('div'); _d.innerHTML = pContent; return _d; })(), pn, pRenumber);
			},
			reloadPage: function(pn) {},
			removePage: function(pPN, pNumberOfPages, pRenumber) {
				removePages(pPN, pNumberOfPages, pRenumber);
			},
			download: function() {
				if (_DownloadUrl) {
					statSendDownload();
					if (!window.ActiveXObject) {
						try {
							var save = document.createElement('a');
							save.href = _DownloadUrl;
							save.target = '_blank';
                            save.download = (_Title.split('.').pop() === "pdf") ? _Title : _Title + ".pdf";
							var evt = new MouseEvent('click', {
								'view': window,
								'bubbles': true,
								'cancelable': false
							});
							save.dispatchEvent(evt);
							(window.URL || window.webkitURL).revokeObjectURL(save.href);
						} catch (e) {
							if ('download' in document.createElement('a')) {
								var $a = dom.create('a', {'download': 'flipbook'}); $a.textContent = 's';
								$a.setAttribute('href', _DownloadUrl);
								$a.setAttribute('target', '_blank');
								dom.css($a, 'display', 'none');
								document.body.append($a);
							$a.addEventListener('click', function() {
								this.remove();
							});
							$a.click();
							} else {
								window.open(_DownloadUrl);
							}
						}
					} else if (!!window.ActiveXObject && document.execCommand) {
						var _window = window.open(_DownloadUrl, '_blank');
						_window.document.close();
						_window.document.execCommand('SaveAs', true, _DownloadUrl)
						_window.close();
					}
				}
			},
			printPDF: function() {
				statSendPrint();
				// Create a loading message element
				const loadingMessage = document.createElement('div');
				loadingMessage.id = 'loadingMessage';
				loadingMessage.style.position = 'fixed';
				loadingMessage.style.top = '50%';
				loadingMessage.style.left = '50%';
				loadingMessage.style.transform = 'translate(-50%, -50%)';
				loadingMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
				loadingMessage.style.color = 'white';
				loadingMessage.style.padding = '20px';
				loadingMessage.style.borderRadius = '5px';
				loadingMessage.style.zIndex = '1000';
				loadingMessage.innerText = 'Preparing document for printing...';
				document.body.appendChild(loadingMessage);
			
				const iframe = document.createElement('iframe');
				iframe.style.display = 'none';
				iframe.src = _DownloadUrl;
				document.body.appendChild(iframe);
			
				iframe.onload = function() {
					// Detect if the browser is Safari
					const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
			
					const executePrint = () => {
						document.body.removeChild(loadingMessage); // Remove the loading message
						iframe.contentWindow.focus(); // Focus on the iframe
						iframe.contentWindow.print(); // Trigger the print dialog
					};
			
					if (isSafari) {
						// Add a slight delay for Safari
						setTimeout(executePrint, 500);
					} else {
						executePrint();
					}
				};
			},
			getIsFullScreen: function() {
				return isFullScreen;
			},
			getIsThumbnailMode: function() {
				return (_Thumbnails && !thumbnailsHidden);
			},
			getCurrentPageNumber: function() {
				return PN;
			},
			getFirstPageNumber: function() {
				return _MinPageLimit;
			},
			getLastPageNumber: function() {
				return _MaxPageLimit;
			},
			getPageInfoList: function() {
				return pages;
			},
			updateHash: updateHash,
			addEventHandler: addEventHandler,
			getInstance: function() {
				return __pageflip
			},
			getPagesTemplate: function() {
				return __pagesTemplate;
			},
			getIsTouchDevice: function() {
				return typeof touchType !== 'undefined';
			},
			getIsMobileDevice: function() {
				return _IsPhone || _IsTablet;
			},
			getIsPhone: function() {
				return _IsPhone;
			},
			getIsTablet: function() {
				return _IsTablet;
			},
			getBookWidth: function() {
				return bookWidth;
			},
			getBookHeight: function() {
				return bookHeight;
			},
			getBookScale: function() {
				return bookScale;
			},
			getStageWidth: function() {
				return _StageWidth;
			},
			getStageHeight: function() {
				return _StageHeight;
			},
			getMargin: function() {
				return _MarginLeft;
			},
			getControlbarHeight: function() {
				var height = 0;
				if (_ControlbarEnabled) {
					height = __controlbar.getHeight();
				}
				return height;
			},
			getEndPN: function() {
				return endPN;
			},
			getClickEventName: function() {
				return clickEventName;
			},
			getPfEvent: function() {
				return pfEvent;
			}
		},
		pageflip = function(pCmd, args) {
			if (pCmd == __undefined) return API;
			return __pageflip ? API[pCmd](args) : [];
		};

	window.initFlipbook = function(configObject) {
		var pageflipEl = document.getElementById('pageflip');
		pageflipInit.call(pageflipEl, configObject);
		window.isPrintCss = false;
	};

})();
