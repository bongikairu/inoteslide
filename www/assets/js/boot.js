PDFJS.workerSrc = 'assets/js/pdf.js';
PDFJS.disableWorker = true;

pdf_filename = 'assets/slide/Week01.pdf';
//pdf_filename = '/Users/bongikairu/Library/Application Support/iPhone Simulator/6.0/Applications/316B9182-2F0D-4761-B323-FE6253071E5E/Documents/.inoteslide/1359715523874.pdf';

min_slide = 1;
max_slide = 1;

slide_data = null;

current_slide = 1;
slide_note = [];

note_filename = '';

thumb_drawn = false;

function saveNote() {
	console.log('saving note to slide_note[]');
	console.log(board.sketch('painting'));
	if(board.sketch('painting')) board.sketch('stopPainting');
	console.log($('#textnote textarea').val());
	slide_note[current_slide] = {drawing: board.sketch('actions'), text: $('#textnote textarea').val()};
	var canvas = document.getElementById('canvas_sketch');
	var ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	board.sketch('actions',[]);
	$('#textnote textarea').val('');
}
function loadNote() {
	//console.log(slide_note);
	if(slide_note[current_slide]) {
		$('#textnote textarea').val(slide_note[current_slide].text);
		var canvas = document.getElementById('canvas_sketch');
		var ctx = canvas.getContext('2d');
		//var image = new Image();
		//image.src = slide_note[current_slide];
		acts = slide_note[current_slide].drawing;
		//ctx.drawImage(image, 0, 0);
		board.sketch('actions',acts);
		//board.sketch('preimg',image);
		//board.sketch('redraw');
		//board.sketch('redraw');
		board.sketch('redraw');
	} else {
		//board.sketch('preimg',null);
		board.sketch('redraw');
	}
}

function loadSlidePage() {

	var canvas = document.getElementById('canvas_pdf');
	var context = canvas.getContext('2d');
	context.clearRect(0, 0, canvas.width, canvas.height);

	// Using promise to fetch the page
	slide_data.getPage(current_slide).then(function(page) {
		var scale = 2.0;
		var viewport = page.getViewport(scale);

		//
		// Prepare canvas using PDF page dimensions
		//
		var canvas = document.getElementById('canvas_pdf');
		var $canvas = $('#canvas_pdf');
		var context = canvas.getContext('2d');
		canvas.height = viewport.height;
		canvas.width = viewport.width;

		console.log('resizing slide');

		// canvas resize
		if(canvas.height>690 && canvas.width>920) {
			console.log('both oversize');
			scale_y = canvas.height / 690;
			scale_x = canvas.width / 920;
			console.log(scale_x + ' ' + scale_y);
			if(scale_y>scale_x) {
				console.log('height more oversize');
				$canvas.css({height: 690, width: (canvas.width*690/canvas.height)});
			} else {
				console.log('width more oversize');
				$canvas.css({width: 920, height: (canvas.height*920/canvas.width)});
			}
		} else if(canvas.height>690 && canvas.width<=920) {
			console.log('height oversize');
			$canvas.css({height: 690, width: (canvas.width*690/canvas.height)});
		} else if(canvas.height<=690 && canvas.width>920) {
			console.log('width oversize');
			$canvas.css({width: 920, width: (canvas.height*920/canvas.width)});
		} else {
			// do nothing
			console.log('no oversize');
			$canvas.css({height: 690, width: 920});
		}

		$canvas.css({top: (690-parseInt($canvas.css('height')))/2.0 + 'px',left: (920-parseInt($canvas.css('width')))/2.0 + 'px'});



		//
		// Render PDF page into canvas context
		//
		var renderContext = {
			canvasContext: context,
			viewport: viewport
		};
		page.render(renderContext);
	});
}

function loadSlide() {
	if(slide_data!=null) {
		loadSlidePage();
		return;
	}
	PDFJS.getDocument(pdf_filename).then(function(pdf) {
		slide_data = pdf;
		max_slide = slide_data.numPages;
		loadSlidePage();
	});
}

function prepareDirectory() {
	console.log('preparing fs');
	window.appRootDirName = ".inoteslide";
	window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
}

function fail() {
	console.log("failed to get filesystem");
}

function gotFS(fileSystem) {
	console.log("filesystem got");
	fileSystem.root.getDirectory(window.appRootDirName, {
		create : true,
		exclusive : false
	}, dirReady, fail);
}

function dirReady(entry) {
	window.appRootDir = entry;
	console.log(JSON.stringify(window.appRootDir));	
}

// TODO: should intercept save on back and save button
function saveNoteFile() {
	// save json(slide_note) to window.appRootDir + '/' + note_filename

	console.log('saving note');

	var jsonobj = {
		notedata: slide_note,
	};

	//console.log(jsonobj);

	var jsontext = $.toJSON(jsonobj);

	if(!window.appRootDir) return;	// directory isn't ready yet

	window.appRootDir.getFile(note_filename, {create: true}, function(fe) {
		// ok
		console.log('note got');
		fe.createWriter(function(writer) {
			console.log('writer got');
		    writer.onwriteend = function(evt) {
		        console.log("write success");
		    };
		    writer.write(jsontext);
		},function(err) {
			console.log(err.code);
		});
	}, function() {
		// fail, do nothing la gun
		console.log("can't find note");
	});

}

var stamping = false;

function onstampstart(evt) {
	stamping = true;
	//console.log(evt);
	// calculating which stamp to use
	board.sketch('stampname','unknown');
	$('#stampchooser img').each(function() {
		var mx = evt.pageX - board.sketch('canvas').offset().left;
		var my = evt.pageY - board.sketch('canvas').offset().top;
		var sx = $(this).offset().left - $('#stampchooser').offset().left;
		var sy = $(this).offset().top - $('#stampchooser').offset().top;
		var sw = $(this).width();
		var sh = $(this).height();

		console.log(mx + ' ' + my);
		console.log(sx + '+' + sw + ' , ' + sy + '+' + sh);

		if(mx>=sx && mx<=sx+sw && my>=sy && my<=sy+sh) {
			console.log('using '+$(this).attr('data-stampname')+' stamp');
			board.sketch('stampname',$(this).attr('data-stampname'));
		}

	});
	$('#stampchooser').fadeOut('fast');
}

function onstampend() {
	$('#control_move').click();
}

function onsketchend() {
	if(stamping && board.sketch('tool')=='stamp') onstampend();
	saveNote();
	loadNote();
	saveNoteFile();
}

function drawThumbnailet(numpage) {
	var tdiv = $('<div></div>').addClass('slidethumbdiv');
	var tcanvas = $('<canvas></canvas>').addClass('slidethumb').attr('data-slideno',numpage);

	tdiv.append(tcanvas);
	$('#thumb_chooser').append(tdiv);

	slide_data.getPage(numpage).then(function(page) {
		var scale = 0.3;
		var viewport = page.getViewport(scale);

		//
		// Prepare canvas using PDF page dimensions
		//
		var canvas = tcanvas.get(0);
		var $canvas = tcanvas;
		var context = canvas.getContext('2d');
		canvas.height = viewport.height;
		canvas.width = viewport.width;

		//
		// Render PDF page into canvas context
		//
		var renderContext = {
			canvasContext: context,
			viewport: viewport
		};
		page.render(renderContext).then(function() {
			if(numpage<max_slide) drawThumbnailet(numpage+1);
			else {
				$('#thumbloadimg').fadeOut('slow');
				$('.slidethumb').click(function() {
					saveNote();
					saveNoteFile();	// intercept to save
					current_slide = $(this).attr('data-slideno');
					loadSlide();
					$('#canvas_sketch').css({
						height: 690,
						width: 920,
					});
					board.sketch('zoom',false);
					loadNote();
					zooming = false;
					$('#thumb_marker').click();
				});
			}
		});
		
	});
}

function drawThumbnail() {
	thumb_drawn = true;
	drawThumbnailet(1);
}

ks_state = 0;
board = null;
zooming = false;
zooming_animing = false;

$(function() {

	console.log('starting slide');

	file_data = $.jStorage.get('targetSlide',{
		filepath: 'assets/slide/Week01.pdf',
		notedata: [],
		notename: '',
	});

	pdf_filename = file_data.filepath;
	slide_note = file_data.notedata;
	note_filename = file_data.notename;

	document.addEventListener("deviceready", prepareDirectory, false);

	if(!slide_note) slide_note = [];

	console.log(slide_note);

	board = $('#canvas_sketch').sketch({defaultColor: "#030D80",defaultSize: 5});

	board.sketch('paintedcb',onsketchend);

	board.sketch('cbGetStampType',onstampstart);

	$('#kitchencontrol').click(function() {
		if(ks_state==0) {
			$('#kitchensink').animate({right: 0},300);
			$('#kitchencontrol').animate({rotate: 180},300)
			ks_state=1;
		} else {
			$('#kitchensink').animate({right: "-"+$('#kitchensink').css('width')},300);
			$('#kitchencontrol').animate({rotate: 0},300)
			ks_state=0;
		}
	});
	$('#canvas_sketch').bind('click mousedown touchstart touchmove', function() {
		if(ks_state==1) $('#kitchencontrol').click();
	});
	$('#nextslide').click(function() {
		saveNote();
		saveNoteFile();	// intercept to save
		current_slide++;
		if(current_slide>max_slide) current_slide=max_slide;
		loadSlide();
		$('#canvas_sketch').css({
			height: 690,
			width: 920,
		});
		board.sketch('zoom',false);
		loadNote();
		zooming = false;
	});
	$('#prevslide').click(function() {
		saveNote();
		saveNoteFile();	// intercept to save
		current_slide--;
		if(current_slide<min_slide) current_slide=min_slide;
		loadSlide();
		$('#canvas_sketch').css({
			height: 690,
			width: 920,
		});
		board.sketch('zoom',false);
		loadNote();
		zooming = false;
	});

	var dozoom = function() {
		$('#canvas_pdf').animate({
				height: parseInt($('#canvas_pdf').css('height'))*2,
				width: parseInt($('#canvas_pdf').css('width'))*2,
				top: parseInt($('#canvas_pdf').css('top'))*2,
				left: parseInt($('#canvas_pdf').css('left'))*2,
			},500,function() {
				zooming_animing=false; 
				//board.sketch('redraw'); 
			});
			$('#canvas_sketch').animate({
				height: 690*2,
				width: 920*2,
			},500,function() {
				//$(this).attr('width','1840').attr('height','1380');
				board.sketch('redraw');
			});
			board.sketch('zoom',true);
			zooming = true;
	};

	var dozoomout = function() {
		$('#canvas_pdf').animate({
				height: parseInt($('#canvas_pdf').css('height'))/2,
				width: parseInt($('#canvas_pdf').css('width'))/2,
				top: parseInt($('#canvas_pdf').css('top'))/2,
				left: parseInt($('#canvas_pdf').css('left'))/2,
			},500,function() {
				zooming_animing=false; 
				//board.sketch('redraw'); 
			});
			$('#canvas_sketch').animate({
				height: 690,
				width: 920,
			},500,function() {
				//$(this).attr('width','920').attr('height','690');
				board.sketch('redraw');
			});
			board.sketch('zoom',false);
			zooming = false;
	}

	$('#zoomtoggle').click(function() {
		$('#stampchooser').fadeOut('fast');
		if(zooming_animing) return;
		zooming_animing = true;
		if(zooming==false) {
			dozoom();
		} else {
			dozoomout();
		}
	});

	//$.jGestures.defaults.thresholdPinchopen = 0.2;
	//$.jGestures.defaults.thresholdPinchclose = 0.2;

	$('#canvaser').on('pinchopen',function() {
		//var fings=obj.description.split(":")[1];
		//alert(obj.description);
		//alert(fings);
		if(zooming_animing) return;
		zooming_animing = true;
		if(zooming==false) {
			dozoom();
		} else {
			//dozoomout();
			zooming_animing = false;
		}
	});
	$('#canvaser').on('pinchclose',function() {
		//var fings=obj.description.split(":")[1];
		//alert(obj.description);
		//alert(fings);
		if(zooming_animing) return;
		zooming_animing = true;
		if(zooming==false) {
			//dozoom();
			zooming_animing = false;
		} else {
			dozoomout();
		}
	});

	$('#canvaser').on('swipethreeleft',function() {
		$('#nextslide').click();
	});
	$('#canvaser').on('swipethreeright',function() {
		$('#prevslide').click();
	});

	$('#control_move').click(function() {
		console.log('using handtool');
		board.sketch('handtool',true);
		$('.control').removeClass('control_using');
		$(this).addClass('control_using');
		$('#stampchooser').fadeOut('fast');
	});
	$('#control_pen').click(function() {
		console.log('using pen');
		board.sketch('handtool',false);
		$('.control').removeClass('control_using');
		$(this).addClass('control_using');
		board.sketch('tool','marker');
		$('.spicker[data-size=5]').click();
	});
	$('#control_eraser').click(function() {
		console.log('using eraser');
		board.sketch('handtool',false);
		$('.control').removeClass('control_using');
		$(this).addClass('control_using');
		board.sketch('tool','eraser');
		$('.spicker[data-size=20]').click();
	});
	$('#control_highlight').click(function() {
		console.log('using highlight');
		board.sketch('handtool',false);
		$('.control').removeClass('control_using');
		$(this).addClass('control_using');
		board.sketch('tool','highlight');
		$('.spicker[data-size=16]').click();
	});
	$('#control_stamp').click(function() {
		console.log('using stamp');
		board.sketch('handtool',false);
		$('.control').removeClass('control_using');
		$(this).addClass('control_using');
		$('#stampchooser').fadeIn('fast');
		$('#canvaser').trigger('pinchclose');
		board.sketch('tool','stamp');
	});
	$('#control_color').click(function() {
		console.log('using color');
		$('#sink_color').animate({right: 0},100);
		$('#stampchooser').fadeOut('fast');
	});
	$('#sink_color .cpicker').click(function() {
		board.sketch('color',$(this).attr('data-color'));
		$('#control_color_current').css('background-color',$(this).attr('data-color'));
		$('#sink_color').animate({right: -90},100);
		$('#stampchooser').fadeOut('fast');
	});
  	$('#control_size').click(function() {
		console.log('using size');
		$('#sink_size').animate({right: 0},100);
		$('#stampchooser').fadeOut('fast');
	});
	$('#sink_size .spicker').click(function() {
		board.sketch('size',$(this).attr('data-size'));
		$('#control_size_current').css('width',$(this).attr('data-size')).css('height',$(this).attr('data-size')).css('border-radius',$(this).attr('data-size')*0.5).css('margin-left',35.5-($(this).attr('data-size')*0.5));
		$('#sink_size').animate({right: -90},100);
		$('#stampchooser').fadeOut('fast');
	});

	$('#control_note').click(function() {
		console.log('using note');
		$('#stampchooser').fadeOut('fast');
		$('#textnote').slideDown('slow');
		$('#textnote_marker').fadeIn('slow',function(){
			$(this).click(function() {
				saveNote();
				saveNoteFile();
				loadNote();
				$(this).fadeOut('slow');
				$('#textnote').blur().slideUp('slow');
			});
			$('#textnote').focus();
		});
	});

	$('#textnote textarea').bind('input propertychange',function() {
		var ttext = $(this).val()
		var tlen = ttext.length;

		if(tlen%10==5) {
			// save note
			saveNote();
			saveNoteFile();
			loadNote();
		}
	});

	$('#control_menu').click(function() {
		// back to library
		window.location.href = 'library.html';
	});

	$('#thumbnailtoggle').click(function() {
		console.log('showing thumbnail');
		$('#stampchooser').fadeOut('fast');
		$('#thumb_chooser').fadeIn('slow');
		$('#thumb_marker').fadeIn('slow',function(){
			if(thumb_drawn==false) {
				drawThumbnail();
			}
			$(this).click(function() {
				$(this).fadeOut('slow');
				$('#thumb_chooser').fadeOut('slow');
			});
		});
	});

    loadSlide();
    loadNote();
  
});