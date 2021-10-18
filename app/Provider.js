/*

Class for connecting with the db.

*/
//Dotenv configuration.
require('dotenv').config()

const mysql = require('mysql')

module.exports = class Provider{

	/*TODO: 

	Change to mysql, when in supercs server.*/
	constructor(){
		
		this.connection = mysql.createConnection({
			'host': process.env.DB_HOST,
			'user': process.env.DB_USER,
			'password': process.env.DB_PASS,
			'database': 'supercs'
		})
	}

	connect(){
		this.connection.connect((err)=>{
			if (err) throw err
		})
	}

}