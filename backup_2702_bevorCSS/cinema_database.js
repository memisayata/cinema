// Test

const sqlite = require("sqlite3").verbose()



class CinemaDB {
	constructor() {
		this.db = null;
	
	}
	
	openDB( ) {
		this.db = new sqlite.Database("./cinema_database.db");
	}
	
	closeDB() {
		if(this.db) {
			this.db.close()
			this.db = null;
		}
	}
}



CinemaDB.prototype.deleteMovie = function( movieId ) {
	return new Promise( ( resolve ) => {
		
		this.db.serialize( () => {
			
			this.db.run( `DELETE FROM FilmSpielzeitSaal WHERE filmID = ? LIMIT 1`, [movieId])
			this.db.run( `DELETE FROM FilmGenreZuordnung WHERE filmID = ?`, [movieId])
			this.db.run( `DELETE FROM Film WHERE ID = ? LIMIT 1`, [movieId])
			
			resolve()
		})	
	});
}

CinemaDB.prototype.getAllCinemas = function(  ) {
	return new Promise( ( resolve ) => {
		const query = `SELECT * FROM Kino`
		
		this.db.all( query,  (err, rows )  => {
			resolve( rows )		
		})
	});
}


CinemaDB.prototype.getNextMovies = function( cinemaID ) {
	
	const query = `SELECT Film.*, FSS.*, Saal.ID as SaalID, Saal.name as saalName
				FROM  FilmSpielzeitSaal as FSS, Film, Saal, KinoSaal
				WHERE FSS.spielzeitID IN (SELECT id FROM Spielzeiten ORDER BY Datum, Uhrzeit)
				AND Film.ID = FSS.filmID 
				AND Saal.ID = FSS.saalID
				AND KinoSaal.saalID = FSS.saalID
				AND KinoSaal.kinoID = ?
				LIMIT 5`		
				
	return new Promise( ( resolve ) => {		
		
		this.db.all( query, [cinemaID], (err, rows )  => {
			resolve( rows )		
		})
	});			
	
}

CinemaDB.prototype.getCinema = function( cinemaID ) {
	return new Promise( ( resolve ) => {
		const query = `SELECT * FROM Kino WHERE ID = ? LIMIT 1`
		
		this.db.each( query, [cinemaID], (err, rows )  => {
			resolve( rows )		
		})
	});
}



CinemaDB.prototype.getCinemaHalls = function( cinemaID ) {
	return new Promise( ( resolve ) => {
		const query = `SELECT Kino.ID, Kino.name as Kinoname, Saal.name FROM Kino,Saal,KinoSaal 
			WHERE KinoSaal.kinoID = Kino.ID
			AND KinoSaal.saalID = Saal.ID
			AND Kino.ID = ?`
			
				
		//const query = `SELECT Kino.ID, Kino.name as Kinoname, Saal.name FROM Kino,Saal,KinoSaal 
		//	WHERE KinoSaal.kinoID = Kino.ID
		//	AND KinoSaal.saalID = Saal.ID
		//	AND Kino.ID = ${cinemaID}`
		
		this.db.all( query,  (err, rows )  => {
			resolve( rows )		
		})
	});
}



CinemaDB.prototype.getMovie = function( movieID ) {
	return new Promise( ( resolve ) => {
		const query = `SELECT * FROM Film WHERE ID = ? LIMIT 1`
		
		this.db.each( query, [movieID], (err, rows )  => {
			resolve( rows )		
		})
	});
}




CinemaDB.prototype.getMovieGenre = function( movieID ) {
	
	return new Promise( ( resolve ) => {
			
		const query = `SELECT group_concat(Genre.name) as Genre FROM Film, Genre, FilmGenreZuordnung 
		WHERE Film.ID = FilmGenreZuordnung.filmID
		AND FilmGenreZuordnung.genreID = Genre.ID
		AND Film.ID = ?`
		
		this.db.all( query, [movieID], (err, rows )  => {
			resolve( rows )		
		})
	});

}

CinemaDB.prototype.koltuk = function( saalID ) {
	
	return new Promise( ( resolve ) => {
			
		const query = `SELECT * from kinositze 
		WHERE kinositze.saal_id = ?`
		
		this.db.all( query, [saalID], (err, rows )  => {
			resolve( rows )		
		})
	});

}



/*

let c = new CinemaDB()
c.openDB()
c.getCinemaHalls("-1 OR 1").then( halls  => {
	console.log( halls )
})


c.getNextMovies(1).then( movies  => {
	
	let promises = movies.map( movie => c.getMovieGenre(movie.filmID) )
	
	Promise.all( promises ). then( genres => {
		console.log( genres )
	});
})

*/

module.exports = {
	CinemaDB
}