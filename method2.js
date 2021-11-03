function logExtractor() {

    //If a ticket is provided, get the diagnostics from that ticket.
    const archive = './logs/archive/'
    const files = './logs/files/'
    var fileContents = []
    var type, attachmentCount = 0, attachmentArray = []
    var attachmentUrl = ''
    const comments = await logsApp.getComments(ticket)

    //Iterate through comments
    for (const comment of comments) {

        for (const attachment of comment.attachments) {

            attachmentCount++
            const url = attachment.content_url
            
            const ext = url.slice(-4)

            //Download all files from comment, store into logs/archive, extract into logs/files
            //If to check if log file is from Windows device
            if (ext === '.zip') {

                type = 'windows'
                attachmentUrl = url

                //Example path: archive/6988399/6988399(0).zip
                const filePath = archive + ticket + '/' + ticket + 
                      '(' + attachmentCount + ')' + '.zip'

                attachmentArray.push(files + ticket + '(' + attachmentCount + ')')

                //Creating dir only if it doesn't exist.
                if (!fs.existsSync(archive + ticket)) {
                    fs.mkdirSync(archive + ticket)
                }
                if (!fs.existsSync(filePath)) {
                	
                    await logsApp.downloadFile(url, filePath, ticket)
                    await logsApp.unzipFile(filePath, files + ticket +
                                            '(' + attachmentCount + ')')
                }
            }
            
            //If to check if log file is from Android device
            else if (ext === '.txt' && attachment.file_name != 'DiagnosticsLog.txt') {

                type = 'android'
                attachmentUrl = url
                
                
                if (comment.attachments.length > 1) {
                    filePath = files + ticket + '/' + attachment.file_name + 
                        '(' + attachmentCount + ')'
                }
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
            //If to check if log file is from macOS device
            else if (ext === '.log') {

                type = 'mac'
                attachmentUrl = url
            	
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
