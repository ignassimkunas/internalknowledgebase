/*

Class for creating/updating/deleting items and categories in SuperCS. Most method names are self explanatory.

*/

const Provider = require("./Provider.js")
const sha = require('js-sha512')

module.exports = class Admin extends Provider{

	constructor(){
		super()
		super.connect()
	}

	getItems(){
		return new Promise((resolve, reject)=>{
			this.connection.query("SELECT * FROM `super_cs_item` WHERE id > 0", (err, result)=>{
				if (err) throw err
				resolve(result)
			})
		})
	}

	getCats(){
		return new Promise((resolve, reject)=>{
			this.connection.query("SELECT * FROM `super_cs_cat` WHERE id > 0", (err, result)=>{
				if (err) throw err
				resolve(result)
			})
		})
	}

	getCustomCats(userId){
		return new Promise((resolve, reject)=>{
			this.connection.query("SELECT * FROM `super_cs_custom_cat` WHERE user_id = ? ORDER BY title", [userId], (err, result)=>{
				if (err) throw err
				resolve(result)
			})
		})
	}

	getCustomItems(userId){
		return new Promise((resolve, reject)=>{
			this.connection.query("SELECT * FROM `super_cs_custom_item` WHERE user_id = ? ORDER BY title", [userId], (err, result)=>{
				if (err) throw err
				resolve(result)
			})
		})
	}

	getItemsByCat(catId){
		return new Promise((resolve, reject)=>{
			this.connection.query("SELECT * FROM `super_cs_item` WHERE cat_id = ?\
			 ORDER BY icon DESC",[catId], (err, result)=>{
				if (err) throw err
				resolve(result)
			})
		})
	}
	
	getItemsByCustomCat(catId){
		return new Promise((resolve, reject)=>{
			this.connection.query("SELECT * FROM `super_cs_custom_item` WHERE custom_cat_id = ?\
			 ORDER BY icon DESC",[catId], (err, result)=>{
				if (err) throw err
				resolve(result)
			})
		})
	}

	deleteCat(id){
		return new Promise((resolve, reject)=>{
			this.connection.query("DELETE FROM `super_cs_cat` WHERE id = ?", [id],(err, result)=>{
				if (err) throw err
			})
			this.connection.query("DELETE FROM `super_cs_item` WHERE cat_id = ?", [id],(err, result)=>{
				if (err) throw err
			})
			resolve('success')
		})
	}

	deleteItem(id){
		return new Promise((resolve, reject)=>{
			this.connection.query("DELETE FROM `super_cs_item` WHERE id = ?", [id],(err, result)=>{
				if (err) throw err
			})
			resolve('success')
		})
	}

	deleteCustomCat(id){
		return new Promise((resolve, reject)=>{
			this.connection.query("DELETE FROM `super_cs_custom_cat` WHERE id = ?", [id],(err, result)=>{
				if (err) throw err
			})
			this.connection.query("DELETE FROM `super_cs_item` WHERE cat_id = ?", [id],(err, result)=>{
				if (err) throw err
			})
			resolve('success')
		})
	}

	deleteCustomItem(id){
		return new Promise((resolve, reject)=>{
			this.connection.query("DELETE FROM `super_cs_custom_item` WHERE id = ?", [id],(err, result)=>{
				if (err) throw err
				resolve('success')
			})

		})
	}

	createIcon(id, title, value){
		if (id == ''){
			return new Promise((resolve, reject)=>{
				this.connection.query("REPLACE INTO `icons` (`title`, `value`) VALUES (?,?)", [title,value],(err, result)=>{
					if (err) throw err
				})
				resolve('success')
			})
		}
		else{
			return new Promise((resolve, reject)=>{
				this.connection.query("REPLACE INTO `icons` (`id`,`title`, `value`) VALUES (?,?,?)", [id, title,value],(err, result)=>{
					if (err) throw err
				})
				resolve('success')
			})
		}
		
	}

	getCatData(id){
		return new Promise((resolve, reject)=>{
			this.connection.query("SELECT * FROM `super_cs_cat` WHERE id = ?", [id], (err, result)=>{
				if (err) throw err
				resolve(result)
			})
		})
	}

	getCustomCatData(id){
		return new Promise((resolve, reject)=>{
			this.connection.query("SELECT * FROM `super_cs_custom_cat` WHERE id = ?", [id], (err, result)=>{
				if (err) throw err
				resolve(result)
			})
		})
	}

	getItemData(id){
		return new Promise((resolve, reject)=>{
			this.connection.query("SELECT * FROM `super_cs_item` WHERE id = ?", [id], (err, result)=>{
				if (err) throw err
				resolve(result)
			})
		})
	}

	getCustomItemData(id){
		return new Promise((resolve, reject)=>{
			this.connection.query("SELECT * FROM `super_cs_custom_item` WHERE id = ?", [id], (err, result)=>{
				if (err) throw err
				resolve(result)
			})
		})
	}

	getIconData(id){
		return new Promise((resolve, reject)=>{
			this.connection.query("SELECT * FROM `icons` WHERE id = ?", [id], (err, result)=>{
				if (err) throw err
				resolve(result)
			})
		})
	}

	editCat(title, desc, style, id){
		this.connection.query("UPDATE `super_cs_cat` SET title = ? ,description = ? ,style = ? WHERE id = ? ", [title,desc,style,id],(err, result)=>{
			if (err) throw err
		})
	}

	getIcons(){
		return new Promise((resolve, reject)=>{
			this.connection.query("SELECT * FROM `icons`", (err, result)=>{
				if (err) throw err
				resolve(result)
			})
		})
	}

	createCat(id, title, desc, style){
		if (id == ''){
			return new Promise((resolve, reject)=>{
				this.connection.query("REPLACE INTO `super_cs_cat` (`title`, `description`, `style`) VALUES (?,?,?)", [title,desc,style],(err, result)=>{
					if (err) throw err
					resolve('success')
				})
			})
		}
		else{
			return new Promise((resolve, reject)=>{
				this.connection.query("REPLACE INTO `super_cs_cat` (`id`, `title`, `description`, `style`) VALUES (?,?,?,?)", [id, title,desc,style],(err, result)=>{
					if (err) throw err
					resolve('success')
				})
			})
		}
		
	}

	createItem(id, title, url, icon, cat_id, action){
		if (id == ''){
			return new Promise((resolve, reject)=>{
				this.connection.query("REPLACE INTO `super_cs_item` (`title`, `url`, `icon`, `cat_id`,`action`) VALUES (?,?,?,?,?)", [title,url,icon,cat_id,action],(err, result)=>{
					if (err) throw err
					resolve('success')
				})
			})
		}
		else{
			return new Promise((resolve, reject)=>{
				this.connection.query("REPLACE INTO `super_cs_item` (`id`,`title`, `url`, `icon`, `cat_id`,`action`) VALUES (?,?,?,?,?,?)", [id,title,url,icon,cat_id,action],(err, result)=>{
					if (err) throw err
					resolve('success')
				})
			})
		}
		
	}

	createCustomCat(id, title, desc, style, user_id){
		if (id == ''){
			return new Promise((resolve, reject)=>{
				this.connection.query("REPLACE INTO `super_cs_custom_cat` (`title`, `description`, `style`,`user_id`) VALUES (?,?,?,?)", [title,desc,style,user_id],(err, result)=>{
					if (err) throw err
				})
				resolve('success')
			})
		}
		else{
			return new Promise((resolve, reject)=>{
				this.connection.query("REPLACE INTO `super_cs_custom_cat` (`id`,`title`, `description`, `style`,`user_id`) VALUES (?,?,?,?,?)", [id,title,desc,style,user_id],(err, result)=>{
					if (err) throw err
				})
				resolve('success')
			})
		}
		
	}

	createCustomItem(id,title, url, icon, custom_cat_id, action, user_id){
		if (id == ''){
			return new Promise((resolve, reject)=>{
				this.connection.query('REPLACE INTO `super_cs_custom_item` (`title`, `url`, `icon`, `custom_cat_id`,`action`,`user_id`) VALUES (?,?,?,?,?,?)', [title,url,icon,custom_cat_id, action, user_id],(err, result)=>{
					if (err) throw err
				})
				resolve('success')
			})
		}
		else{
			return new Promise((resolve, reject)=>{
				this.connection.query('REPLACE INTO `super_cs_custom_item` (`id`,`title`, `url`, `icon`, `custom_cat_id`,`action`,`user_id`) VALUES (?,?,?,?,?,?,?)', [id,title,url,icon,custom_cat_id, action, user_id],(err, result)=>{
					if (err) throw err
				})
				resolve('success')
			})
		}
	}

	getUserDataById(id){
		return new Promise((resolve, reject)=>{
			this.connection.query("SELECT * FROM `super_cs_users` WHERE id = ?",[id] ,(err, result)=>{
				if (err) throw err
				resolve(result)
			})
		})
	}

	getUsers(){
		return new Promise((resolve, reject)=>{
			this.connection.query("SELECT * FROM `super_cs_users`",(err, result)=>{
				if (err) throw err
				resolve(result)
			})
		})
	}

	createAgent(username, password, fname, lname, email){
		return new Promise((resolve, reject)=>{
			this.connection.query("INSERT INTO `super_cs_users` (`id`,`username`,`password`,`access`,`agent_name`,`agent_last_name`,`agent_email`) VALUES (NULL,?,?,0,?,?,?)", [username,sha(password),fname,lname, email],(err, result)=>{
				if (err) throw err
				resolve('success')
			})
		})
	}

	resetPassword(email, newPass){
		return new Promise ((resolve, reject)=>{
			this.connection.query("UPDATE `super_cs_users` SET password = ? WHERE agent_email = ?", [sha(newPass), email] , (err, result)=>{
				if (err) throw err
				resolve('success')
			})
		})
	}
	findResetToken(email, token){
		return new Promise ((resolve, reject)=>{
			this.connection.query("SELECT * FROM reset_tokens WHERE email = ? AND used = 0 AND token = ?", [email, token] , (err, result)=>{
				if (err) throw err
				resolve(result)
			})
		})
	}
	updateResetToken(email){
		return new Promise ((resolve, reject)=>{
			this.connection.query("UPDATE `reset_tokens` SET used = 1 WHERE email = ?", [email] , (err, result)=>{
				if (err) throw err
				resolve('success')
			})
		})
	}
	createResetToken(email, token, expiration, createdAt, updatedAt){
		return new Promise ((resolve, reject)=>{
			this.connection.query("INSERT INTO `reset_tokens` (email, token, expiration, createdAt, updatedAt, used) VALUES (?,?,?,?,?,0)", [email, token, expiration, createdAt, updatedAt] , (err, result)=>{
				if (err) throw err
				resolve('success')
			})
		})
	}
	destroyExpiredTokens(){
		const date = new Date()
		return new Promise ((resolve, reject)=>{
			this.connection.query("DELETE FROM `reset_tokens` WHERE expiration < ? OR used = 1", [date] ,(err, result)=>{
				if (err) throw err
				resolve('success')
			})
		})
	}
}