function fun2(req, res){

	//If a ticket is provided, get the diagnostics from that ticket.
	if (req.query.ticket){

		var logsData = await getLogs(req.query.ticket)
		var fileContents = logsData[0]

		for (let file of fileContents){
			
			file.contents = logsApp.registerErrorMessage(file.contents)
		}
		res.render('tools/logs', {
        	files: fileContents,
        	attachment: logsData[1]
        })
	}
	else{
		res.render('tools/logs', {files: ""})
	}
}