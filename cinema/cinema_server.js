const http = require("http")
const url = require("url");
const qs = require("querystring")
const { CinemaDB } = require("./cinema_database.js")

const PORT = 8000
const IP = "0.0.0.0"


function getCinamaSelection() {
	return new Promise( resoLve => {
		
		
		let selection = `<select name='cinema' onchange='f.submit()'>`

		selection += `<option>Wähle dein Kino</option>`

	
	
		const cinema = new CinemaDB();
		cinema.openDB()
		cinema.getAllCinemas()
		.then( cinemas => {
			cinemas.forEach( cinema_data => {
				selection += `<option value='${cinema_data.ID}'>${cinema_data.name}</option>`
			})
			
			selection += `</select>`
			
			resoLve( selection )
			
		})

	} )
}

const server = http.createServer( (req, res) => {
	
	const request_url  = req.url
	const request_data = url.parse( req.url ) // http://127.0.0.1:8000?cinema=1&movie=7
	const request_query = qs.parse( request_data.query ) // cinema=1&movie=7
	
	console.log("KinoID:",  request_query["cinema"] )
	
	const cinemaID = request_query["cinema"];
	
	
	if(cinemaID) {
		// 
		// TODO, optimize this crappy shitty thingy....
		//
		const cinema = new CinemaDB();
		cinema.openDB()
		
		cinema.getNextMovies( cinemaID ) // Promise
		.then( movies => {				 // movies enthält die komemnden 
										 // 5 Filme
						 
			cinema.getAllCinemas()
			.then( cinemas => {

				getCinamaSelection().then( selection => {
					
					let html_template = `
					<html>
					<head>
					<meta charset='utf-8'/>
					<title>Ugly Cinema</title></head>
					<body>
					<h1 style='color: #3D80CC'>Ugly AF Cinema</h1>
					<form id='f' action='/'>
					${selection}
					</form>`
					
					movies.forEach( movie => { // Movies aus Zeile 28...
						html_template += `
						<div style='clear:both'> 
							<div style='float:left;width:100px;'>BILD</div>
							<div style='float:left;width:400px;'>${movie.titel}</div>
							<div style='float:left;width:100px;'>${movie.KinoID}</div>
							<div style='float:left;width:100px;'>${movie.saalName}</div>
						</div>
						`
						
					});
					
					html_template += `</body></html>`
					
					
					res.writeHead( 200 )
					res.end( html_template )
					
				})

										 
			})

			cinema.closeDB();
		});
	}
	
	else {
		res.writeHead( 200 )
		res.end( `<html><head><title>Ugly Cinema</title></head>
		<body>
		<h1 style='color: #3D80CC'>Ugly AF Cinema</body></html>` );
	}
})

server.listen( PORT, IP , (err) => {
	if(err) throw err;	
	console.log("waiting for connections")
});