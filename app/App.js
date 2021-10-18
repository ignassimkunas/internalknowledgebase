/*
 	Class for Log Reader, used for downloading from Zendesk API and rendering attachments.s
*/

//Dotenv configuration.
require('dotenv').config()

const zendesk = require('node-zendesk')
const stream = require('stream')
const fs = require('fs')
const readline = require('readline')
const {promisify} = require('util');
const replaceall = require('replaceall')
const wget = require('node-wget')
const unzipper = require('unzipper')
const got = require('got')
const pipeline = promisify(stream.pipeline);

module.exports = class App {

	constructor(){
		this.appsPatterns = this.buildAppsPatterns();
        this.errPatterns = this.buildErrorPatterns();
        this.infoPatterns = this.buildInfoPatterns();
        this.errMessagesPatterns = this.buildErrorMessagesPatterns();
        this.successPatterns = this.buildSuccessPatterns();
        this.miscPatterns = this.buildMiscPatterns();
        this.serverPatterns = this.buildServerPatterns();

	}
	
	//Authenticates with Zendesk and gets comments from ticket.
	getComments(ticket){
		
		const client = zendesk.createClient({
			username: process.env.ZEN_USER,
			token: process.env.ZEN_TOKEN,
			remoteUri: 'https://nordvpn.zendesk.com/api/v2'
		})

		return new Promise((resolve, reject)=>{
			client.tickets.getComments(ticket).then((result)=> {
		    	resolve(result)
		    }).catch((error)=> {
		    	console.log(error)
		  	});
		})
	}

	//Downloads file from given URL
	downloadFile(url, path, ticket){
		return new Promise(async(resolve, reject)=>{
            await pipeline(
                got.stream(url),
                fs.createWriteStream(path)
            );
            resolve()	
        })
		
	}
	
	//Unzips file to given location
	unzipFile(file, path){
		return new Promise((resolve, reject)=>{
			fs.createReadStream(file).pipe(unzipper.Extract({path:path})).on('close', ()=>{
				resolve('success')
			})
		})
	}

	//All patterns for common errors in diagnostics bellow:

	buildErrorPatterns(){

		const errorPatterns = [
            'ERROR',
            'FATAL',
            'FAIL',
            'error',
            'fatal',
            'fail',
            'Error',
            'Fatal',
            'failed',
            'Failed',
            'FAILED',
            'Fail',
            'bad packet ID',
            'USER_VPN_PERMISSION_CANCELLED',
            'AFTB',
        ]
        return errorPatterns
	}

	buildErrorMessagesPatterns(){

		const errorMessagesPatterns = [
            'Initialization Sequence Completed With Errors',
            ':There are no TAP-Windows adapters on this system',
            'All TAP-Windows adapters on this system are currently in use',
            'TLS handshake failed',
            'AUTH: Received control message: AUTH_FAILED',
            'plugin function PLUGIN_UP failed with status 1',
            'route addition failed using CreateIpForwardEntry: The object already exists',
            'Blocking DNS failed',
            'Windows route delete ipv6 command failed: returned error code',
            'Waiting for TUN\/TAP interface to come up',
            'WCF handled error: System\.ComponentModel\.Win32Exception \(0x80004005\): Failed to launch OpenVPN process',
        ]
        return errorMessagesPatterns
	}

	buildSuccessPatterns(){

		const successPatterns = [
            'SUCCESS',
            'OK',
            'Initialization Sequence Completed',
            'Server:',			
        ]
        return successPatterns
	}

	buildMiscPatterns(){

		const miscPatterns = [
            'INFO',
            'DEBUG',
            'WARNING',
        ]
        return miscPatterns
	}
	buildInfoPatterns(){

		const infoPatterns = [
            ' Disconnected ',
            ' DISCONNECTED ',
            ' connected ',
            ' CONNECTED ',
        ]
        return infoPatterns
	}
	buildAppsPatterns(){

		const appsPatterns = [
			'Kaspersky',
			'AVG',
			'Avast',
			'BitDefender',
			'Advanced IP Scanner',
			'Akruto Sync',
			'ASUS Smart Gesture',
			'Axence nVision',
			'Check Point Endpoint Security VPN',
			'Citrix',
			'Comodo',
			'Covenant Eyes',
			'Cybercop',
			'Dell Support Center',
			'FileZilla Server',
			'Fortinet FortiClient',
			'Free download manager',
			'G-Data',
			'GlassWire',
			'IObit Malware Fighter',
			'Kerio',
			'McAfee',
			'NETGEAR Genie',
			'Netnanny',
			'Nmap',
			'Norton',
			'Npcap',
			'Peerguardian',
			'Pulse Secure',
			'Resilio Sync',
			'Safe Eyes',
			'Spy Sweeper',
			'System Explorer',
			'System Mechanic',
			'Tautulli',
			'Trend Micro',
			'Untangle Firewall',
			'WinPcap',
			'Wireshark',
			'ZoneAlarm',
			'SmartByte',
			'360 Total Security',
            'Acronis',
            'Acronis True Image'
        ]
        return appsPatterns
	}

    buildServerPatterns(){

        const fromFile = fs.readFileSync('./public/assets_logview/items/servers.txt').toString().split("\n");
        var servers = []

        for (let server of fromFile){
            servers.push(server.split('\t')[1])
        }

        return servers
    }

	//For actually highlighting the error messages
	registerErrorMessage(file){
		var stage = this.renderErrorMessages(file);
        stage = this.renderError(stage);
        stage = this.renderMiscMessages(stage);
        stage = this.renderInfoMessages(stage);
        stage = this.renderSuccessMessages(stage);
        stage = this.renderApps(stage);
        stage = this.renderServers(stage)
        return stage
	}

    renderServers(file){
        const servers = this.serverPatterns
        const spanStart = '<span class="bg-danger text-white">'
        const spanEnd = '</span>'

        let replacements = []
        for (let server of servers){
            replacements.push(spanStart + server + spanEnd)
        }
        for (let i = 0; i < this.serverPatterns.length; i++){
            file = replaceall(this.serverPatterns[i], replacements[i], file)
        }
        return file
    }

	//Rendering known error messages:
	renderErrorMessages(file){
		const replacements = [
            '<span class="bg-danger text-white">Initialization Sequence Completed With Errors  (solution: <a href="https://ikb.supercs.org/Connection-Issues/Slow-speed/1119632462/General-OpenVPN-Errors.htm#TUN/TAP" target="_blank" style="color:white">https://ikb.supercs.org/Connection-Issues/Slow-speed/1119632462/General-OpenVPN-Errors.htm#TUN/TAP)</a></span>',
            '<span class="bg-danger text-white">:There are no TAP-Windows adapters on this system  (solution: <a href="https://ikb.supercs.org/Connection-Issues/Slow-speed/1119632462/General-OpenVPN-Errors.htm#no_tap" target="_blank" style="color:white">https://ikb.supercs.org/Connection-Issues/Slow-speed/1119632462/General-OpenVPN-Errors.htm#no_tap)</a></span>',
            '<span class="bg-danger text-white">All TAP-Windows adapters on this system are currently in use (solution: <a href="https://ikb.supercs.org/Connection-Issues/Slow-speed/1119632462/General-OpenVPN-Errors.htm#All_tap_in_use" target="_blank" style="color:white">https://ikb.supercs.org/Connection-Issues/Slow-speed/1119632462/General-OpenVPN-Errors.htm#All_tap_in_use)</a></span>',
            '<span class="bg-danger text-white">TLS handshake failed  (solution: <a href="https://ikb.supercs.org/Connection-Issues/Slow-speed/1119632462/General-OpenVPN-Errors.htm#TLS_key" target="_blank" style="color:white">https://ikb.supercs.org/Connection-Issues/Slow-speed/1119632462/General-OpenVPN-Errors.htm#TLS_key)</a></span>',
            '<span class="bg-danger text-white">AUTH: Received control message: AUTH_FAILED  (solution: <a href="https://ikb.supercs.org/Connection-Issues/Slow-speed/1119632462/General-OpenVPN-Errors.htm#Auth_failed" target="_blank" style="color:white">https://ikb.supercs.org/Connection-Issues/Slow-speed/1119632462/General-OpenVPN-Errors.htm#Auth_failed)</a></span>',
            '<span class="bg-danger text-white">PLUGIN_CALL: plugin function PLUGIN_UP failed with status 1</span>',
            '<span class="bg-danger text-white">route addition failed using CreateIpForwardEntry: The object already exists (solution: <a href="https://ikb.supercs.org/1119636762" target="_blank" style="color:white">https://ikb.supercs.org/1119636762)</a></span>',
            '<span class="bg-danger text-white">Blocking DNS failed (solution: <a href="https://ikb.supercs.org/1119637022" target="_blank" style="color:white">https://ikb.supercs.org/1119637022)</a></span>',
            '<span class="bg-danger text-white">Windows route delete ipv6 command failed: returned error code</span>',
            '<span class="bg-danger text-white">Waiting for TUN/TAP interface to come up  (solution: <a href="https://ikb.supercs.org/Connection-Issues/Slow-speed/1119632462/General-OpenVPN-Errors.htm#TUN/TAP" target="_blank" style="color:white">https://ikb.supercs.org/Connection-Issues/Slow-speed/1119632462/General-OpenVPN-Errors.htm#TUN/TAP)</a></span>',
            '<span class="bg-danger text-white">WCF handled error: System.ComponentModel.Win32Exception (0x80004005): Failed to launch OpenVPN process</span>',
        ]

        for (let i = 0; i < this.errMessagesPatterns.length; i++){
        	file = replaceall(this.errMessagesPatterns[i], replacements[i], file)
        }
        return file
	}

	renderError(file){
		const replacements = [
            '<span class="bg-danger text-white">ERROR</span>',
            '<span class="bg-danger text-white">FATAL</span>',
            '<span class="bg-danger text-white">FAIL</span>',
            '<span class="bg-danger text-white">error</span>',
            '<span class="bg-danger text-white">fatal</span>',
            '<span class="bg-danger text-white">fail</span>',
            '<span class="bg-danger text-white">Error</span>',
            '<span class="bg-danger text-white">Fatal</span>',
            '<span class="bg-danger text-white">failed</span>',
            '<span class="bg-danger text-white">Failed</span>',
            '<span class="bg-danger text-white">FAILED</span>',
            '<span class="bg-danger text-white">Fail</span>',
            '<span class="bg-danger text-white">bad packet ID (solution: <a href="https://ikb.supercs.org/1119632462" target="_blank" style="color:white">https://ikb.supercs.org/1119632462)</a></span>',
            '<span class="bg-danger text-white">USER_VPN_PERMISSION_CANCELLED (solution: <a href="https://ikb.supercs.org/1112078392" target="_blank" style="color:white">https://ikb.supercs.org/1112078392)</a></span>',
			'<span class="bg-danger text-white">AFTB (1st generation Firestick, does not support VPN: <a href="https://ikb.supercs.org/1301332302" target="_blank" style="color:white">https://ikb.supercs.org/1301332302</a>)</span>',
        ]

        for (let i = 0; i < this.errPatterns.length; i++){
        	file = replaceall(this.errPatterns[i], replacements[i], file)
        }
        return file
	}

	renderMiscMessages(file){

		const replacements = [
            '<span class="bg-info text-white">INFO</span>',
            '<span class="bg-info text-white">DEBUG</span>',
            '<span class="bg-info text-white">WARNING</span>',
        ]
        for (let i = 0; i < this.miscPatterns.length; i++){
        	file = replaceall(this.miscPatterns[i], replacements[i], file)
        }
        return file
	}

	renderInfoMessages(file){
		const replacements = [
            '<span class="bg-warning text-white">Disconnected</span>',
            '<span class="bg-warning text-white">DISCONNECTED</span>',
            '<span class="bg-warning text-white">connected</span>',
            '<span class="bg-warning text-white">CONNECTED</span>',
        ]

        for (let i = 0; i < this.infoPatterns.length; i++){
        	file = replaceall(this.infoPatterns[i], replacements[i], file)
        }
        return file
	}

	renderSuccessMessages(file){

		const replacements = [
            '<span class="bg-success text-white">SUCCESS</span>',
            '<span class="bg-success text-white">OK</span>',
            '<span class="bg-success text-white">Initialization Sequence Completed</span>',
            '<span class="bg-success text-white">Server:</span>',
        ]

        for (let i = 0; i < this.successPatterns.length; i++){
        	file = replaceall(this.successPatterns[i], replacements[i], file)
        }
        return file

	}

	renderApps(file){

		const replacements = [
            '<span class="bg-danger text-white">Kaspersky</span>',
            '<span class="bg-danger text-white">AVG</span>',
            '<span class="bg-danger text-white">Avast</span>',
            '<span class="bg-danger text-white">BitDefender</span>',
            '<span class="bg-danger text-white">Advanced IP Scanner</span>',
            '<span class="bg-danger text-white">Akruto Sync</span>',
            '<span class="bg-danger text-white">ASUS Smart Gesture</span>',
            '<span class="bg-danger text-white">Axence nVision</span>',
            '<span class="bg-danger text-white">Check Point Endpoint Security VPN</span>',
            '<span class="bg-danger text-white">Citrix</span>',
            '<span class="bg-danger text-white">Comodo</span>',
            '<span class="bg-danger text-white">Covenant Eyes</span>',
            '<span class="bg-danger text-white">Cybercop</span>',
            '<span class="bg-danger text-white">Dell Support Center</span>',
            '<span class="bg-danger text-white">FileZilla Server</span>',
            '<span class="bg-danger text-white">Fortinet FortiClient</span>',
            '<span class="bg-danger text-white">Free download manager</span>',
            '<span class="bg-danger text-white">G-Data</span>',
            '<span class="bg-danger text-white">GlassWire</span>',
            '<span class="bg-danger text-white">IObit Malware Fighter</span>',
            '<span class="bg-danger text-white">Kerio</span>',
            '<span class="bg-danger text-white">McAfee</span>',
            '<span class="bg-danger text-white">NETGEAR Genie</span>',
            '<span class="bg-danger text-white">Netnanny</span>',
            '<span class="bg-danger text-white">Nmap</span>',
            '<span class="bg-danger text-white">Norton</span>',
            '<span class="bg-danger text-white">Npcap</span>',
            '<span class="bg-danger text-white">Peerguardian</span>',
            '<span class="bg-danger text-white">Pulse Secure</span>',
            '<span class="bg-danger text-white">Resilio Sync</span>',
            '<span class="bg-danger text-white">Safe Eyes</span>',
            '<span class="bg-danger text-white">Spy Sweeper</span>',
            '<span class="bg-danger text-white">System Explorer</span>',
            '<span class="bg-danger text-white">System Mechanic</span>',
            '<span class="bg-danger text-white">Tautulli</span>',
            '<span class="bg-danger text-white">Trend Micro</span>',
            '<span class="bg-danger text-white">Untangle Firewall</span>',
            '<span class="bg-danger text-white">WinPcap</span>',
            '<span class="bg-danger text-white">Wireshark</span>',
            '<span class="bg-danger text-white">ZoneAlarm</span>',
            '<span class="bg-danger text-white">SmartByte</span>',
			'<span class="bg-danger text-white">360 Total Security</span>',
            '<span class="bg-danger text-white">Acronis</span>',
            '<span class="bg-danger text-white">Acronis True Image</span>',
        ]

        for (let i = 0; i < this.appsPatterns.length; i++){
        	file = replaceall(this.appsPatterns[i], replacements[i], file)
        }
        return file
	}
}