var __slice = Array.prototype.slice;
(function($) {
	var Sketch;
	$.fn.sketch = function() {
		var args, key, sketch;
		key = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
		if (this.length > 1) {
			$.error('Sketch.js can only be called on one element at a time.');
		}
		sketch = this.data('sketch');
		if (typeof key === 'string' && sketch) {
			//console.log(sketch[key]);
			if (typeof(sketch[key])!=undefined) {
				if (typeof sketch[key] === 'function') {
					return sketch[key].apply(sketch, args);
				} else if (args.length === 0) {
					return sketch[key];
				} else if (args.length === 1) {
					return sketch[key] = args[0];
				}
			} else {
				return $.error('Sketch.js did not recognize the given command.');
			}
		} else if (sketch) {
			return sketch;
		} else {
			this.data('sketch', new Sketch(this.get(0), key));
			return this;
		}
	};
	Sketch = (function() {
		function Sketch(el, opts) {
			this.el = el;
			this.canvas = $(el);
			this.context = el.getContext('2d');
			this.options = $.extend({
				toolLinks: true,
				defaultTool: 'marker',
				defaultColor: '#000000',
				defaultSize: 5
			}, opts);
			this.painting = false;
			//this.preimg = null;
			this.handtool = false;
			this.color = this.options.defaultColor;
			this.size = this.options.defaultSize;
			this.tool = this.options.defaultTool;
			this.actions = [];
			this.action = [];
			this.zoom = false;
			this.paintedcb = null;
			this.stampname = 'important';

			this.stamps = {
				important: new Image(),
				inexam: new Image(),
			}

			this.stamps["important"].src = 'assets/images/stamp/important.png';

			this.canvas.bind('click mousedown mouseup mousemove mouseleave mouseout touchstart touchmove touchend touchcancel', this.onEvent);
			if (this.options.toolLinks) {
				$('body').delegate("a[href=\"#" + (this.canvas.attr('id')) + "\"]", 'click', function(e) {
					var $canvas, $this, key, sketch, _i, _len, _ref;
					$this = $(this);
					$canvas = $($this.attr('href'));
					sketch = $canvas.data('sketch');
					_ref = ['color', 'size', 'tool'];
					for (_i = 0, _len = _ref.length; _i < _len; _i++) {
						key = _ref[_i];
						if ($this.attr("data-" + key)) {
							sketch.set(key, $(this).attr("data-" + key));
						}
					}
					if ($(this).attr('data-download')) {
						sketch.download($(this).attr('data-download'));
					}
					return false;
				});
			}
		}
		Sketch.prototype.download = function(format) {
			var mime;
			format || (format = "png");
			if (format === "jpg") {
				format = "jpeg";
			}
			mime = "image/" + format;
			return window.open(this.el.toDataURL(mime));
		};
		Sketch.prototype.getData = function(format) {
			var mime;
			format || (format = "png");
			if (format === "jpg") {
				format = "jpeg";
			}
			mime = "image/" + format;
			return this.el.toDataURL(mime);
		};
		Sketch.prototype.set = function(key, value) {
			this[key] = value;
			return this.canvas.trigger("sketch.change" + key, value);
		};
		Sketch.prototype.startPainting = function() {
			this.painting = true;
			return this.action = {
				tool: this.tool,
				color: this.color,
				size: parseFloat(this.size),
				events: []
			};
		};
		Sketch.prototype.stopPainting = function() {
			if (this.action) {
				this.actions.push(this.action);
			}
			console.log('stop painting');
			
			//console.log(this.actions);
			this.painting = false;
			this.action = null;
			this.redraw();

			if(this.paintedcb) this.paintedcb();

			return;
		};
		Sketch.prototype.onEvent = function(e) {
			//console.log(e.type);
			if(typeof(e.originalEvent.targetTouches)=="undefined") {
				e.originalEvent.targetTouches = [
					e.originalEvent
				];
			}
			//console.log(e.originalEvent.targetTouches.length);
            if(e.originalEvent.targetTouches.length>1) return true;
            if($(this).data('sketch').handtool) return true;
			if (e.originalEvent && e.originalEvent.targetTouches) {
				if(e.originalEvent.targetTouches.length==0) {
					e.pageX = 0;
					e.pageY = 0;
				} else {
					e.pageX = e.originalEvent.targetTouches[0].pageX;
					e.pageY = e.originalEvent.targetTouches[0].pageY;
				}			
			}
			$.sketch.tools[$(this).data('sketch').tool].onEvent.call($(this).data('sketch'), e);
			e.preventDefault();
			return false;
		};
		Sketch.prototype.redraw = function() {
			var sketch;
			this.el.width = this.canvas.width();
			this.el.height = this.canvas.height();
			this.context = this.el.getContext('2d');
			//console.log('redrawing canvas');
			//console.log(this.actions);
			//console.log(this.preimg);
			//if(this.preimg!=null) this.context.drawImage(this.preimg, 0, 0);
			sketch = this;
			$.each(this.actions, function() {
				if (this.tool) {
					return $.sketch.tools[this.tool].draw.call(sketch, this);
				}
			});
			if (this.painting && this.action) {
				return $.sketch.tools[this.action.tool].draw.call(sketch, this.action);
			}
		};
		return Sketch;
	})();
	$.sketch = {
		tools: {}
	};
	$.sketch.tools.marker = {
		onEvent: function(e) {
			//console.log(e.type);
			switch (e.type) {
				case 'mousedown':
				case 'touchstart':
					if(this.painting) {
						this.stopPainting();
					}
					this.startPainting();
					break;
				case 'mouseup':
				case 'mouseout':
				case 'mouseleave':
				case 'touchend':
				case 'touchcancel':
					this.stopPainting();
			}
			if (this.painting) {
				var sc = 1.0;
				if(this.zoom) sc=2.0;
				this.action.events.push({
					x: (e.pageX - this.canvas.offset().left)/sc,
					y: (e.pageY - this.canvas.offset().top)/sc,
					event: e.type
				});
				return this.redraw();
			}
		},
		draw: function(action) {
			var sc = 1.0;
			if(this.zoom) sc=2.0;
			var event, previous, _i, _len, _ref;
			this.context.lineJoin = "round";
			this.context.lineCap = "round";
			this.context.beginPath();
			this.context.moveTo(action.events[0].x*sc, action.events[0].y*sc);
			_ref = action.events;
			var ooevent = null;
			for (_i = 0, _len = _ref.length; _i < _len; _i++) {
				event = _ref[_i];
				var oevent = null;
				if(_i>1) {
					oevent = _ref[_i-1];
					if(!ooevent) ooevent = _ref[_i-2];
				}
				/* if(oevent) {
					this.context.quadraticCurveTo((2*oevent.x-ooevent.x)*sc,(2*oevent.y-ooevent.y)*sc,event.x*sc, event.y*sc);
					ooevent = {
						x: 2*oevent.x-ooevent.x,
						y: 2*oevent.y-ooevent.y
					};
				} else 
				*/ 
				this.context.lineTo(event.x*sc, event.y*sc);
				previous = event;
			}
			this.context.strokeStyle = action.color;
			this.context.lineWidth = action.size*sc;
			return this.context.stroke();
		}
	};

	$.sketch.tools.highlight = {
		onEvent: function(e) {
			return $.sketch.tools.marker.onEvent.call(this, e);
		},
		draw: function(action) {
			//var oldcomposite;
			//oldcomposite = this.context.globalCompositeOperation;
			//this.context.globalCompositeOperation = "copy";
			var tp = 0.3;
			//console.log(action.color);
			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(action.color);
    		result = result ? "rgba("+parseInt(result[1], 16)+","+parseInt(result[2], 16)+","+parseInt(result[3], 16)+","+tp+")" : action.color;
			action.color = result;
			//console.log(action.color);
			$.sketch.tools.marker.draw.call(this, action);
			return; //return this.context.globalCompositeOperation = oldcomposite;
		}
	};

	$.sketch.tools.stamp = {
		onEvent: function(e) {
			var oldcolor = $.sketch.color;
			$.sketch.color = $.sketch.stampname;
			$.sketch.tools.marker.onEvent.call(this, e);
			//this.stopPainting();
			$.sketch.color = oldcolor;
			return;
		},
		draw: function(action) {
			//console.log('drawing stamp');

			var simg = this.stamps["important"];

			var sheight = simg.height;
			var swidth = simg.width;

			var sc = 1.0;
			if(this.zoom) sc=2.0;
			
			this.context.drawImage(simg,action.events[0].x*sc-(0.5*swidth*sc), action.events[0].y*sc -(0.5*sheight*sc) ,swidth*sc,sheight*sc);

			return;
		}
	};

	return $.sketch.tools.eraser = {
		onEvent: function(e) {
			return $.sketch.tools.marker.onEvent.call(this, e);
		},
		draw: function(action) {
			var oldcomposite;
			oldcomposite = this.context.globalCompositeOperation;
			this.context.globalCompositeOperation = "copy";
			action.color = "rgba(0,0,0,0)";
			$.sketch.tools.marker.draw.call(this, action);
			return this.context.globalCompositeOperation = oldcomposite;
		}
	};
})(jQuery);