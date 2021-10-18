/*

Small class for helping out with output in the ejs files.

*/

module.exports = class Output {

	generateIcon(icon){
		return icon ? '<i class="fa fa-'+ icon +' fa-lg" aria-hidden="true"></i>' : ""
	}

	buildItemDisplay(icon,title,url,id,cat_id,cat_style,action,date){
		var style = ''
		var htmlArray = []

		const datef = Date.parse(date)/1000 + 24 * 3600 * 7
		if (datef > new Date().getTime()) style = '<span class = "text-warning">NEW</span>'

		if (action === 'open'){
			htmlArray = [
				'<div class ="col-md-2">',
				'<a href = ' + url + ' target = "_blank" class = "item_link open text-center"a>',
				'<button class="btn btn-block btn-' + cat_style + '  item">',
				style,
				'<h4>' + icon + '</h4>',
				'<p>' + title + '</p>',
				'</button></a>'
			]
		}
		else{
			htmlArray = [
				'<div class ="col-md-2">',
				'<a href = '+ url + ' target = "_blank" class = "item_link copy text-center"\
				data-clipboard-text='+ url +'>',
				'<button class="btn btn-block btn-'+  cat_style + ' item">',
				style,
				'<h4>' + icon +'</h4>',
				'<p>' + title + '</p>',
				'</button></a>'
			]
		}
		htmlArray.push('</div>')
		return htmlArray.join(' ')
	}
}
