function fun(req, res){

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
}

