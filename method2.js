function fun2(req, res) { //Review: The name for this function is hard to understand 
    //and does not show what exact use-case does this function perform. 
    //Changing the name to something meaningful would help to improve 
    //the readability and maintainability of the code.
    //Additionally, the passed arguments to the function are unclear and should be renamed to something meaningful.

    //If a ticket is provided, get the diagnostics from that ticket.
    const archive = './logs/archive/'
    const files = './logs/files/'
    var fileContents = []
    var type, attachmentCount = 0, attachmentArray = []
    var attachment_url = '' //Review: According to JavaScript naming convention, all names should be writen in camelCase.
    //For example in this case - attachmentUrl.
    const comments = await logsApp.getComments(ticket)

    //Iterate through comments
    for (const comment of comments) {

        for (const attachment of comment.attachments) {

            attachmentCount++
            const url = attachment.content_url
            
            const ext = url.slice(-4)

            //Download all files from comment, store into logs/archive, extract into logs/files
            if (ext === '.zip') {

                type = 'windows'
                attachment_url = url

                //Example path: archive/6988399/6988399(0).zip
                const filePath = archive + ticket + '/' + ticket + '(' + attachmentCount + ')' + '.zip'

                attachmentArray.push(files + ticket + '(' + attachmentCount + ')')

                //Creating dir only if it doesn't exist.
                if (!fs.existsSync(archive + ticket)) {
                    fs.mkdirSync(archive + ticket)
                }
                if (!fs.existsSync(filePath)) {
                	
                    await logsApp.downloadFile(url, filePath, ticket)
                    await logsApp.unzipFile(filePath, files + ticket + '(' + attachmentCount + ')')
                    //Review: Long lines in the code such as above should be divided into a couple of lines for ease of reading.
                    // The line should be broken after an operator or a comma.
                }
            }
            
            // Review: If statements should be commented for 
            // better understanding of why is this statement needed and what function it performs.
            else if (ext === '.txt' && attachment.file_name != 'DiagnosticsLog.txt') {

                type = 'android'
                attachment_url = url
                
                
                if (comment.attachments.length > 1) {
                    filePath = files + ticket + '/' + attachment.file_name + '(' + attachmentCount + ')'
                } //Review: Long lines in the code such as above should be divided into a couple of lines for ease of reading.
                // The line should be broken after an operator or a comma.
                else {
                    filePath = files + ticket + '/' + attachment.file_name
                }

                if (!fs.existsSync(files + ticket)) {
                    fs.mkdirSync(files + ticket)
                }
                if (!fs.existsSync(filePath)) {
                    await logsApp.downloadFile(url, filePath, ticket)
                }
            }
            else if (ext === '.log') {

                type = 'mac'
                attachment_url = url
            	
                const filePath = files + ticket + '/' + attachment.file_name

                if (!fs.existsSync(files + ticket)) {
                    fs.mkdirSync(files + ticket)
                }
                if (!fs.existsSync(filePath)) {
                    await logsApp.downloadFile(url, filePath, ticket)
                }
            }
        }
    }
}
