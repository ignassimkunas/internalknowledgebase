/*

Main server file

*/
//Dotenv configuration.
require('dotenv').config()

//Main packages.
const express = require('express')
const fs = require('fs-extra')
const bodyParser = require('body-parser')
const session = require('express-session')
const sha = require('js-sha512')
const {GoogleSpreadsheet} = require('google-spreadsheet')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const ejs_lint = require('ejs-lint')
const readdir = require('readdir-enhanced')

//Mailer config.
const transport = nodemailer.createTransport({

	service: 'gmail',
	auth: {
		user: process.env.MAIL_USER,
		pass: process.env.MAIL_PASS
	}
})

const app = express()

//Helper classes.
const Admin = require('./app/Admin.js')
const Output = require('./app/Output.js')
const App = require('./app/App.js')

const admin = new Admin()
const output = new Output()
const logsApp = new App()

//Actions and styles for items in main page.
const actions = ['open', 'copy']
const styles = ['primary','secondary','success','danger','warning','info','light','dark']

app.use(express.static("public"));

app.use(session({secret:"sssshhhh"}))
app.use(bodyParser.urlencoded({ extended: true })); 
app.set('view engine', 'ejs')
app.use('/logs', express.static(__dirname + '/public'));

app.get('/', async(req, res)=>{

	//Add additional field 'items' to cats and custom cats objects.
	var cats = await admin.getCats()
	console.log(cats)
	for (var cat of cats){
		cat.items = await admin.getItemsByCat(cat['id'])
	}

	//Render with parameters meant for authenticated users.
	if (req.session.user){

		var customCats = await admin.getCustomCats(req.session.user.id)
		for (var cat of customCats){
			cat.items = await admin.getItemsByCustomCat(cat.id)
		}
		res.render("index", {
			user: req.session.user,
			cats: cats,
			customCats: customCats,
			output: output,
		})
		
	}
	//Render with parameters meant for unauthenticated users.
	else{
		
		res.render("index", {
			user: req.session.user,
			cats: cats,
			output: output,
		})
	}
})

//Forgot password form.
app.get('/forgot_pass', (req,res)=>{

	//Renders different messages, according to the error/message.
	if (req.query.user_doesnt_exist){
		return res.render('forgot_pass', {message: "User doesn't exist.", color:'danger'})
	}
	if(req.query.mail_sent){
		return res.render('forgot_pass', {message: "Check your email. You can reset your password from there.", color:'success'})
	}
	if (req.query.token_expired){
		return res.render('forgot_pass', {message: "Your token has expired. Try the password reset again.", color:'danger'})
	}
	
	res.render('forgot_pass', {message: ''})
	
})

app.post('/forgot_pass', async(req,res)=>{
	
	const email = req.body.email
	const users = await admin.getUsers()
	const user = users.find(u => u.agent_email === email)

	//If user doesn't exist, redirect to forgot_pass page with message.
	if (!user){
		return res.redirect('/forgot_pass?user_doesnt_exist=true') 
	}
	
	//Set tokens to used, if any exist.
	await admin.updateResetToken(email)

	//Create token
	const token = crypto.randomBytes(64).toString('base64');

	//Expiration date set to one day after current time
	var expireDate = new Date();
 	expireDate.setDate(expireDate.getDate() + 1);

 	//Upload token to db
 	await admin.createResetToken(email, token, expireDate, new Date(), new Date())

 	const message = {
    	from: process.env.MAIL_USER,
    	to:  email,
    	replyTo: process.env.MAIL_USER,
    	subject: 'Reset your SuperCS password',
    	text: 'To reset your password, please click the link below.\n\n'+process.env.PROTO+'://supercs-reforged.com/reset_pass?token='+encodeURIComponent(token)+'&email='+ email
  	};

  	//Send email with token
  	transport.sendMail(message, (err, info)=>{
  		if(err) { console.log(err)}
     	else {
     		res.redirect('/forgot_pass?mail_sent=true')
     	}
  	})		
})

app.get('/reset_pass', async(req, res)=>{

	//Rendering and redirect for different errors.
	//Entered passwords don't match.
	if (req.query.pass_dont_match){
		return res.render('reset_pass', {message: "Passwords don't match.", color:'danger'})
	}
	//If the route is accessed without either one of params.
	if (!req.query.email || !req.query.token){
		return res.redirect('/forgot_pass')
	}
	//If user is already logged in, redirect him to the main page.
	if (req.query.session){
		return res.redirect('/')
	}
	
	const email = req.query.email
	const token = req.query.token

	req.session.email = email
	req.session.token = token

	//Destroy all currently expired tokens
	await admin.destroyExpiredTokens()

	//Check if user has any tokens
	const record = await admin.findResetToken(email, token)

	//If token isnt found, redirect to forgot_pass with token expired message.
	if (record.length == 0){
		return res.redirect('/forgot_pass?token_expired=true')
	}
	
	res.render('reset_pass', {message: '', color: ''})
})

app.post('/reset_pass', async(req, res)=>{

	const pass1 = req.body.password
	const pass2 = req.body.repeat_pass
	//Email and token stored in session, while user is not logged in
	const email = req.session.email
	const token = req.session.token

	if (pass1 != pass2){
		return res.redirect('/reset_pass?pass_dont_match=true')
	}
	//Check if token exists again.
	const record = await admin.findResetToken(email, token)

	//If not, redirect.
	if (record.length == 0){
		return res.redirect('/forgot_pass?token_expired=true')
	}

	//Sets users tokens as used.
	await admin.updateResetToken(email)

	//Actually resets the password.
	await admin.resetPassword(email, pass1)

	//Destroys email and token stored in session and redirects to login page.
	req.session.destroy((err)=>{
		if (err) console.log(err)
		res.redirect('/admin?pass_reset=true')
	})
})

//Login screen
app.get('/admin', (req, res)=>{

	if (req.session.user){
		return res.redirect('/')
	}
	if(req.query.pass_reset){
		return res.render('admin', {message: 'Your password has been reset. Try logging in.', color: 'success'})
	}
	
	res.render('admin', {message: '', color: ''})
	
})

//Authentication
app.post('/admin', (req, res)=>{

	//Checking if both username and password are provided
	if (!req.body.username || !req.body.password){
		return res.render('admin', {message: "Please enter both your username and password", color: 'danger'})
	}
	
	//Getting list of users and checking if user exists.
	admin.getUsers().then((users)=>{

		let user = users.find(u => u.username === req.body.username)

		if (!user){
			res.render('admin',{message: "User doesn't exist", color: 'danger'})
		}
		else{
			//Hash password, compare and set session, if all is okay.
			if (user.password === sha(req.body.password)){
				req.session.user = user
				res.redirect('/')
			}
			else{
				//Letting the user know that the password is incorrect.
				res.render('admin', {message: "Password incorrect", color: 'danger'})
			}
		}
	})	
})

//Retrieving diagnostics content for log reader
const getLogs = async(ticket) =>{

	const archive = './logs/archive/'
	const files = './logs/files/'
	var fileContents = []
	var type, attachmentCount = 0, attachmentArray = []
	var attachment_url = ''
	const comments = await logsApp.getComments(ticket)

	//Iterate through comments
    for (const comment of comments){

        for (const attachment of comment.attachments){

        	attachmentCount++
            const url = attachment.content_url
            
            const ext = url.slice(-4)

            //Download all files from comment, store into logs/archive, extract into logs/files
            if (ext === '.zip'){

                type = 'windows'
                attachment_url = url

                //Example path: archive/6988399/6988399(0).zip
                const filePath = archive+ticket+'/'+ticket+'('+attachmentCount+')'+'.zip'

                attachmentArray.push(files + ticket+'('+attachmentCount+')')

                //Creating dir only if it doesn't exist.
                if (!fs.existsSync(archive+ticket)){
					fs.mkdirSync(archive + ticket)
                }
                if (!fs.existsSync(filePath)){
                	
                    await logsApp.downloadFile(url, filePath, ticket)
                    await logsApp.unzipFile(filePath, files+ticket +'('+attachmentCount+')')
                }
            }

            else if (ext === '.txt' && attachment.file_name != 'DiagnosticsLog.txt'){

            	type = 'android'
            	attachment_url = url

            	var filePath
            	if (comment.attachments.length > 1){
            		filePath = files + ticket+'/'+attachment.file_name + '('+attachmentCount+')'
            	}
            	else{
            		filePath = files + ticket+'/'+attachment.file_name
            	}

				if (!fs.existsSync(files+ticket)){
					fs.mkdirSync(files + ticket)
                }
                if (!fs.existsSync(filePath)){
					await logsApp.downloadFile(url, filePath, ticket)
				}
            }
            else if (ext === '.log'){

            	type = 'mac'
            	attachment_url = url
            	
            	const filePath = files + ticket+'/'+attachment.file_name

				if (!fs.existsSync(files+ticket)){
					fs.mkdirSync(files + ticket)
                }
                if (!fs.existsSync(filePath)){
					await logsApp.downloadFile(url, filePath, ticket)
				}
            }
    	}
	}

	//Iterate through different diagnostics files, if windows diags, and store them to array
	if (type === 'windows'){
		for (const [index, path] of attachmentArray.entries()){

			const files = await readdir.async(path)

			files.forEach((file)=>{
				
				const contents = fs.readFileSync(path+'/'+file,'utf-8')

				if (attachmentArray.length > 1){
		        	fileContents.push({
			            name: file +'('+index+')',
			            contents: contents,
			            path: path + '/' + file
			        })
		        }
		        else{
		        	fileContents.push({
			            name: file,
			            contents: contents,
			            path: path + '/' + file
			        })
		        }	        
		    })
		}
	}
	//Iterate through files and store to array for displaying
	else {
		fs.readdirSync(files+ticket).forEach((file)=>{
			const contents = fs.readFileSync(files+ticket+'/'+file,'utf-8')
			fileContents.push({
	            name: file,
	            contents: contents,
	            path: files+ticket+'/'+file
	        })
		})
	}

	//if file too big, store html with link to download files from 

	for (file of fileContents){
		//Get file size in MB
		let fileSize = fs.statSync(file.path).size / (1024*1024)
		if (fileSize > 0.25){
			file.contents = 'File too large. You can download it <a href="/download/?path='+ file.path+'">here.<a/>  '
		} 
	}
	
    return [fileContents, attachment_url]
}

//Route for downloading files, need to put ?path= as a URL param.
app.get('/download', (req, res)=>{
	const filePath = req.query.path
	const fileName = filePath.split('/').slice(-1)[0]

	res.download(filePath, fileName, (err)=>{
		if (err){
			res.status(500).send({
				message: 'Could not download the file. ' + err
			})
		}
	})
})

//Log reader
app.get('/logs', async(req, res)=>{

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
})

//Server requests form
app.get('/servers', async(req,res)=>{

	if (req.query.submited){
		res.render('tools/requests', {submited:true})
	}
	else{
		res.render('tools/requests', {submited:false})
	}
})

app.post('/servers', async(req,res)=>{

	if (req.body.server_type && req.body.region){

		const doc = new GoogleSpreadsheet(process.env.SHEET_ID)

		//Requires Google API creds
		await doc.useServiceAccountAuth(require('./creds.json'));
		await doc.loadInfo()

		const sheet = doc.sheetsByTitle['Database']

		const rows = await sheet.getRows()
		let rowCount = 0

		while(rows[rowCount].Type){
			rowCount++		
		}

		rows[rowCount].Type = req.body.server_type
		rows[rowCount]['Country,Region'] = req.body.region
		rows[rowCount].City = req.body.city
		rows[rowCount].Email = req.body.email

		//Should be with await, but letting it complete in the background so it doesnt load that long.
		rows[rowCount].save()

		res.redirect('/servers?submited=true')
	}
})

//Interfering apps checker
app.get('/apps_checker', (req, res)=>{
	res.render('tools/interferingapps/index')
})

//Register form
app.get('/register', (req, res)=>{
	res.render('register', {message:''})
})

app.post('/register', (req, res)=>{

	admin.getUsers().then((users)=>{
		
		//Letting the user know if a user with that username or email already exists		
		let user = users.find(u => u.username === req.body.username)
		let email = users.find(u => u.agent_email === req.body.email)

		if (user || email){
			res.render('register',{
				message: 'User already exists',
				color: 'danger'
			}) 
		}
		else{
			admin.createAgent(req.body.username, req.body.password, req.body.fname, req.body.lname, req.body.email).then((result)=>{
				res.render('register', {message:'<strong>Congratz!</strong> Registration completed now you can <a href = "/admin">login</a>', color:'success'})
			})
		}
	})
})

//Redirected here if clicked on the signout button.
app.get('/signout', (req, res)=>{
	req.session.destroy((err)=>{
		if (err) console.log(err)
		res.redirect("/")
	})
})

/*

All create/delete/update

*/

app.post('/create_cat', (req,res)=>{
	admin.createCat(req.body.id, req.body.category_title, req.body.category_desc, req.body.category_item_style).then((result)=>{
		res.redirect('/ucp')
	})
})

app.post('/delete_cat', (req,res)=>{
	admin.deleteCat(req.body.id).then((result)=>{
		res.redirect('/ucp')
	})
})

app.post('/create_item', (req, res)=>{
	admin.createItem(req.body.id, req.body.item_title, req.body.item_url, req.body.item_icon, req.body.item_cat, req.body.item_action).then((result)=>{
	 	res.redirect('/ucp')
	})
})

app.post('/delete_item', (req,res)=>{
	admin.deleteItem(req.body.id).then((result)=>{
		res.redirect('/ucp')
	})
})

app.post('/create_icon', (req, res)=>{
	admin.createIcon(req.body.id, req.body.icon_title, req.body.icon_value).then((result)=>{
		res.redirect('/ucp')
	})
})

app.post('/create_custom_cat', (req, res)=>{
	admin.createCustomCat(req.body.id,req.body.category_title, req.body.category_desc, req.body.category_item_style, req.session.user.id).then((result)=>{
		res.redirect('/ucp')
	})
})

app.post('/delete_custom_cat', (req,res)=>{
	admin.deleteCustomCat(req.body.id).then((result)=>{
		res.redirect('/ucp')
	})
})

app.post('/create_custom_item', (req, res)=>{
	admin.createCustomItem(req.body.id, req.body.item_title, req.body.item_url, req.body.item_icon, req.body.item_cat, req.body.item_action, req.session.user.id).then((result)=>{
	 	res.redirect('/ucp')
	 })
})

app.post('/delete_custom_item', (req,res)=>{
	admin.deleteCustomItem(req.body.item_id).then((result)=>{
		res.redirect('/ucp')
	})
})

//Personal/admin panel
app.get('/ucp', async(req,res)=>{

	const cats = await admin.getCats()
	const items = await admin.getItems()
	const icons = await admin.getIcons()

	//If nothing is requested for loading in the admin panel.
	if (req.session.user && req.session.user.access === 1 && !req.query.cat_id && !req.query.item_id && !req.query.icon_id){
		res.render('ucp', {
			user:req.session.user,
			cats:cats,
			items: items,
			catData:{},
			itemData: {},
			iconData: {},
			icons: icons,
			actions: actions,
			styles: styles,
			selected_style: '',
		})
	}
	//If a category/item/icon is requested.
	else if (req.session.user && req.session.user.access === 1 && (req.query.cat_id || req.query.item_id || req.query.icon_id)){

		var catData, itemData, iconData
		
		if (req.query.cat_id){
			catData = await admin.getCatData(req.query.cat_id)

			res.render('ucp', {
				user: req.session.user,
				cats: cats,
				items: items,
				catData: catData[0],
				itemData: {},
				iconData: {},
				icons: icons,
				actions: actions,
				styles: styles,
				selected_style: req.query.selected_style,
			})

		} 
		if (req.query.item_id){

			itemData = await admin.getItemData(req.query.item_id)
			res.render('ucp', {
				user: req.session.user,
				cats: cats,
				items: items,
				catData: {},
				itemData: itemData[0],
				iconData: {},
				icons: icons,
				actions: actions,
				styles: styles,
				selected_style: req.query.selected_style,
			})
		}
		if (req.query.icon_id){

			iconData = await admin.getIconData(req.query.icon_id)

			res.render('ucp', {
				user: req.session.user,
				cats: cats,
				items: items,
				catData: {},
				itemData: {},
				iconData: iconData[0],
				icons: icons,
				actions: actions,
				styles: styles,
				selected_style: req.query.selected_style,
			})
		}
	}
	//If nothing is requested by a regular user.
	else if (req.session.user && req.session.user.access === 0 && !req.query.custom_cat_id && !req.query.custom_item_id){

		const customCats = await admin.getCustomCats(req.session.user.id)
		const customItems = await admin.getCustomItems(req.session.user.id)

		res.render('ucp', {
			user: req.session.user,
			customCats: customCats,
			customItems: customItems,
			customCatData: {},
			customItemData: {},
			icons: icons,
			actions: actions,
			styles: styles,
			selected_style: '',
		})
	}
	//If a custom category/item is requested by a regular user.
	else if (req.session.user && req.session.user.access === 0 && (req.query.custom_cat_id || req.query.custom_item_id)){

		const customCats = await admin.getCustomCats(req.session.user.id)
		const customItems = await admin.getCustomItems(req.session.user.id)

		if (req.query.custom_cat_id){

			customCatData = await admin.getCustomCatData(req.query.custom_cat_id)
			res.render('ucp', {
				user: req.session.user,
				customCats: customCats,
				customItems: customItems,
				customCatData: customCatData[0],
				customItemData: {},
				icons: icons,
				actions: actions,
				styles: styles,
				selected_style: '',
			})
		}
		else if (req.query.custom_item_id){
			customItemData = await admin.getCustomItemData(req.query.custom_item_id)

			res.render('ucp', {
				user: req.session.user,
				customCats: customCats,
				customItems: customItems,
				customCatData: {},
				icons: icons,
				customItemData: customItemData[0],
				actions: actions,
				styles: styles,
				selected_style: '',
			})
		}
	}
	else{
		res.redirect('/admin')
	}
	
})

app.listen(process.env.PORT, ()=>{
  console.log("Listening on port", process.env.PORT)
})