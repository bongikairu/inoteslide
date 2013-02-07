
var user = null;	// with session
var servName = null;	// with session

var allcourses = null;

var courses = {		// with session
	accepted: [],
	pending: [],
};

var slides = {};	// with session

var files = {};		// with session

function onDeviceReady() {
	console.log("device is ready");
	window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
	
	//window.webkitStorageInfo.requestQuota(PERSISTENT, 1024*1024*100, function(grantedBytes) {
		//window.requestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
		window.requestFileSystem(PERSISTENT, 0, gotFS, fail);
	//}, function(e) {
	//	console.log('Error', e);
	//});
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

superfname = '';

function downloadPDF(url, success, err){
	console.log('download pdf ' + url);
	
	var fileName = new Date().getTime() + ".pdf";
	superfname = fileName;
	ft = new FileTransfer();
	ft.download(
	    url,
	    window.appRootDir.fullPath + "/" + fileName,
	    function(entry) {
	        console.log("download complete: " + entry.fullPath);
	        success(entry.fullPath);
	    },
	    function(error) {
	        console.log("download error source " + error.source);
	        console.log("download error target " + error.target);
	        console.log("upload error code" + error.code);
	        err(error);
	    }
	);
}

function dirReady(entry) {
	window.appRootDir = entry;
	//console.log(JSON.stringify(window.appRootDir));	

	console.log($.jStorage.get('date'));

	//$.jStorage.set('date',new Date().getTime());

	superfname = $.jStorage.get('testfilename');

	var url = "http://gappp.in/files/%3f%3f%3f%3f%3f%3f%20CPLib.pdf";
	url = "http://www.cp.eng.chula.ac.th/~somchai/2110101/Lectures/pdf1/101-12.pdf";

	if(!superfname) {
		//alert('downloading test file');
		downloadPDF(url,function(){
			$.jStorage.set('testfilename',superfname);
			alert('download complete');
		},function(){});
	} else {
		//alert('old file still there to be used');
	}

    $('.reloadslide').click(function() {
        alert('downloading test file');
        downloadPDF(url,function(){
            $.jStorage.set('testfilename',superfname);
            alert('download complete');
        },function(){});
    });
    
	$('.gotoslide').click(function() {

		console.log('going to slide');

		var realname = 'slide2013.pdf';
		var keptname = '1359721813933.pdf';
		keptname = '1359726048391.pdf';

		keptname = superfname;
		
		var fpath = keptname;
		var npath = keptname + '.noter.json';

		console.log('retrieving note');

		window.appRootDir.getFile(npath, {create: true}, function(fe) {
			// ok
			console.log('note got');
			fe.file(function(file) {
				// ok
				console.log('reading it');

				var loadSlide = function(ndata) {
					$.jStorage.set('targetSlide',{
							realname: realname,
							filename: fpath,
							filepath: window.appRootDir.fullPath + '/' + fpath,
							notename: npath,
							notepath: window.appRootDir.fullPath + '/' + npath,
							notedata: ndata,
						});

				        console.log($.jStorage.get('targetSlide').filename);

				        console.log('changing page');

						window.location.href = 'slide.html';
				};

				if(file.size==0) {
					// blank file
					loadSlide([]);
				} else {
					// got content
					$.ajax({
						url: file.fullPath,
						success: function(data) {
							//console.log('get data ' + data);

							console.log("read success");

							var ndata = data;

					        console.log('parsing note data');

					        //console.log(JSON);

					        try {
					        	ndataobj = $.evalJSON(ndata);
					        } catch(e) {
					        	console.log(e);
					        }

					        loadSlide(ndataobj.notedata);

					        //console.log(ndataobj);

						},
						error: function(jq,txt,err) {
							console.log('error reading: '+txt+' - '+err);
							console.log(jq);
						}
					});
				}

			}, function() {
				// fail, what?
			});
		}, function() {
			// fail, do nothing la gun
			console.log("can't find note");
		});
	});

}

function bindLogout() {
	$('#logoutbtn').click(function() {
		$.jStorage.deleteKey('user');
		$( "#dialog-working" ).dialog({
			height: 140,
			modal: true
		});
		$.ajax({
			url: servName+'/api/logout',
			success: function() {
				window.location.href = "login.html";
			},
			error: function() {
				window.location.href = "login.html";
			}
		});
	});
}

function openSlide() {
	var $div = $(this);
	var s = $div.data('sdata');
}

function makeSlidelistWList(subject) {
	$sdiv = $('#slidelist').html("");
	var slist = slides[subject._id];
	for(var i=0;i<slist.length;i++) {
		var s = slist[i].slideId;
		$idiv = $('<div></div>').html(s.title);
		$odiv = $('<div></div>').addClass('img-polaroid');
		$odiv.data('sdata',s);
		$odiv.click(openSlide);
		$odiv.append($idiv);
		$sdiv.append($odiv);
	}
	if(slist.length==0) {
		$idiv = $('<div></div>').html('This course has no slide');
		$odiv = $('<div></div>').addClass('img-polaroid');
		$odiv.append($idiv);
		$sdiv.append($odiv);
	}
}

function makeSlidelist(subject) {
	$sdiv = $('#slidelist').html("");
	// <div class="img-polaroid"><div>
	//		Computer Programming by Java language
	// </div></div>
	if(subject) {
		// try requesting latest slide list
		$( "#dialog-working" ).dialog({
			height: 140,
			modal: true
		});
		$.ajax({
			url: servName+'/api/listslide/'+subject._id,
			success: function(data) {
				if(data.data===false) return window.location.href = "login.html";
				slides[subject._id] = data.data;
				$.jStorage.set('slides',slides);
				makeSlidelistWList(subject);
				$("#dialog-working").dialog('destroy');
			},
			error: function() {
				if(slides[subject._id]) makeSlidelistWList(subject);
				else {
					$idiv = $('<div></div>').html("Can't get list of slide of this subject");
					$odiv = $('<div></div>').addClass('img-polaroid');
					$odiv.append($idiv);
					$sdiv.append($odiv);
				}
				$("#dialog-working").dialog('destroy');
			}
		});
	} else {
		$idiv = $('<div></div>').html('Select course to see its slide');
		$odiv = $('<div></div>').addClass('img-polaroid gotoslide');
		$odiv.append($idiv);
		$sdiv.append($odiv);
	}
}

function makeSlidelistCB() {
	makeSlidelist(courses.accepted[$(this).attr('data-cacceptedid')]);
}

function makeCourselist() {
	var $list = $('#courselist');
	$list.html("");

	var ccount = 0;

	for(var i=0;i<courses.accepted.length;i++) {
		var c = courses.accepted[i];
		var $div = $('<div></div>');
		$div.css({
			'border' : '1px solid #CACACA',
			'padding' : '2px',
			'background' : '#FFF',
			'padding' : '10px',
		}).html(c.subjectName).attr('data-subjectid',c._id).attr('data-cacceptedid',i);
		$div.click(makeSlidelistCB);
		$list.append($div);
		ccount++;
	}

	for(var i=0;i<courses.pending.length;i++) {
		var c = courses.pending[i];
		var $div = $('<div></div>');
		$div.css({
			'border' : '1px solid #CACACA',
			'padding' : '2px',
			'background' : '#FFF',
			'padding' : '10px',
		}).html(c.subjectName + " [Pending]");
		$list.append($div);
		ccount++;
	}

	if(ccount==0) {
		var $div = $('<div></div>');
		$div.css({
			'border' : '1px solid #CACACA',
			'padding' : '2px',
			'background' : '#FFF',
			'padding' : '10px',
		}).html("Use [Find courses] to get start!!");
		$list.append($div);
	}

	//<div style="border:1px solid #CACACA; padding:2px; background:#FFF; padding:10px;">
	//							asdf
	//						</div>

}

function reloadCourselist() {
	$( "#dialog-working" ).dialog({
		height: 140,
		modal: true
	});
	$.ajax({
		url: servName+'/api/listsubject',
		success: function(data) {
			if(data.data===false) return window.location.href = "login.html";
			var cdata = data.data;
			courses.accepted = cdata.accepted;
			courses.pending = cdata.pending;
			$.jStorage.set('courses',courses);
			makeCourselist();
			$("#dialog-working").dialog('destroy');
		},
		error: function() {
			$("#dialog-working").dialog('destroy');
		}
	});
}

function makeEnrollWindow() {
	var $div = $('<div></div>').attr('title','Available Courses').css('display','none');

	for(var i=0;i<allcourses.length;i++) {
		var c = allcourses[i];
		var $idiv = $('<div></div>').css({
			'padding' : '10px',
		}).html("["+c.code+"] "+c.subjectName+" - " + c.privacy);
		var id = c._id;
		$idiv.data('sid',id);
		var listed = false;
		for(var j=0;j<courses.accepted.length;j++) {
			if(courses.accepted[j]._id==id) {
				listed = true;
				$idiv.append(' [Enrolled]').css('color','blue');
			}
		}
		for(var j=0;j<courses.pending.length;j++) {
			if(courses.pending[j]._id==id) {
				listed = true;
				$idiv.append(' [Pending]').css('color','darkgreen');
			}
		}
		if(!listed) {
			$idiv.click(function() {
				$div.dialog('destroy');
				console.log('joining course '+$(this).data('sid'));
				$( "#dialog-working" ).dialog({
					height: 140,
					modal: true
				});
				$.ajax({
					url: servName+'/api/enrollsubject/'+$(this).data('sid'),
					success: function(data) {
						if(data.data===false) return window.location.href = "login.html";
						console.log('enrolled');
						console.log(data);
						$("#dialog-working").dialog('destroy');
						$('#reloadcourse').click();
					},
					error: function() {
						console.log('enroll failed');
						$("#dialog-working").dialog('destroy');
					}
				});
			});
		}

		$div.append($idiv);
	}

	$div.dialog({
		height: 500,
		width: 800,
		modal: true
	});
}

function doFindcourse() {
	$( "#dialog-working" ).dialog({
		height: 140,
		modal: true
	});
	console.log('Getting all course list');
	$.ajax({
		url: servName+'/api/listallsubject',
		success: function(data) {
			if(data.data===false) return window.location.href = "login.html";
			allcourses = data.data;
			//console.log(data);
			makeEnrollWindow();
			$("#dialog-working").dialog('destroy');
		},
		error: function() {
			$("#dialog-working").dialog('destroy');
		}
	});
}

function bindFindcourse() {
	$('#findcourse').click(doFindcourse);
}

function bindReload() {
	$('#reloadcourse').click(reloadCourselist);
}

var start = function(){

	user = $.jStorage.get('user',{displayName: "Error, please logout and relogin"});
	servName = $.jStorage.get('servName');
	courses = $.jStorage.get('courses',{accepted:[],pending:[]});
	slides = $.jStorage.get('slides',{});
	files = $.jStorage.get('files',{});

	bindLogout();
	bindReload();
	bindFindcourse();

	makeCourselist();
	makeSlidelist(null);

	$('#userDisplayName').html(user.displayName);

	window.appRootDirName = ".inoteslide";
	document.addEventListener("deviceready", onDeviceReady, false);

	runningInPcBrowser = navigator.userAgent.indexOf('Chrome')  >= 0;

	if(runningInPcBrowser) onDeviceReady();

};

$(start);