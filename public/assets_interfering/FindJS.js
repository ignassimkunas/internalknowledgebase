
document.querySelector("#file-input").addEventListener('change', function() {
	var all_files = this.files;
	if(all_files.length == 0) {
		alert('Error : No file selected');
		return;
	}

	var file = all_files[0];

	var allowed_types = [ 'text/plain' ];
	if(allowed_types.indexOf(file.type) == -1) {
		alert('Error : Incorrect file type');
		return;
	}

	var max_size_allowed = 2*1024*1024
	if(file.size > max_size_allowed) {
		alert('Error : Exceeded size 2MB');
		return;
	}
	var reader = new FileReader();

	reader.addEventListener('loadstart', function() {
	    document.querySelector("#file-input-label").style.display = 'none';
	});

	reader.addEventListener('load', function(e) {
	    var text = e.target.result;

	    document.querySelector("#contents").innerText = text;
	    document.querySelector("#contents").style.display = 'table-row-group';

	    document.querySelector("#file-input-label").style.display = 'inline-block';
	});

	reader.addEventListener('error', function() {
	    alert('Error : Failed to read file');
	});

	reader.addEventListener('progress', function(e) {
	    if(e.lengthComputable == true) {
	    	document.querySelector("#file-progress-percent").innerHTML = Math.floor((e.loaded/e.total)*100);
	    	document.querySelector("#file-progress-percent").style.display = 'block';
	    }
	});

	reader.readAsText(file);
});

function f() {
  var inputText = document.getElementById("input").value;
  document.getElementById("contents").innerText = inputText;
}

var text= [];

function readFile(file)
{
    var f = new XMLHttpRequest();
    f.open("GET", file, false);
    f.onreadystatechange = function ()
    {
        if(f.readyState === 4)
        {
            if(f.status === 200 || f.status == 0)
            {
                var res= f.responseText;
								text = res.split(/\n|\r/g);
            }
        }
    }
    f.send(null);
}

function highlight() {

  var inputText = contents;

 var innerHTML = inputText.innerHTML;
 for (i = 0; i < text.length; i++){
   var index = innerHTML.indexOf(text[i]);
 if (index >= 0) {
  innerHTML = innerHTML.substring(0,index) + "<span class='highlight'>" + innerHTML.substring(index,index+text[i].length) + "</span>" + innerHTML.substring(index + text[i].length);
  inputText.innerHTML = innerHTML;
 }
}
}

readFile('./assets_interfering/Applications.txt');


