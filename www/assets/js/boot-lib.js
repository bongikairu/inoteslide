function onDeviceReady() {
	console.log("device is ready");
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
	console.log(JSON.stringify(window.appRootDir));	

	console.log($.jStorage.get('date'));

	//$.jStorage.set('date',new Date().getTime());

	superfname = $.jStorage.get('testfilename');

	var url = "http://gappp.in/files/%3f%3f%3f%3f%3f%3f%20CPLib.pdf";
	url = "http://www.cp.eng.chula.ac.th/~somchai/2110101/Lectures/pdf1/101-12.pdf";

	if(!superfname) {
		alert('downloading test file');
		downloadPDF(url,function(){
			$.jStorage.set('testfilename',superfname);
			alert('download complete');
		},function(){});
	} else {
		alert('old file still there to be used');
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



var start = function(){
	window.appRootDirName = ".inoteslide";
	document.addEventListener("deviceready", onDeviceReady, false);
};

$(start);