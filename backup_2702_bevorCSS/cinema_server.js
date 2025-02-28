const http = require("http");
const url = require("url");
const qs = require("querystring");
const fs = require("fs"); 
const { CinemaDB } = require("./cinema_database.js");

const PORT = 8000;
const IP = "0.0.0.0";

function sitzplatzauswahl(movieIDs) {
    return new Promise((resolve) => {
        if (!Array.isArray(movieIDs) || movieIDs.length === 0) {
            resolve('<p>Keine Film Auswähl</p>');
            return;
        }

        let selection = `<h2>Films</h2>`;
        const promises = movieIDs.map(movieID => {
            return new Promise((innerResolve) => {
                console.log(`${movieID}`);
                
                
                fs.readFile('cinema.html', 'utf-8', (err, data) => {
                    if (err) {
                        console.error(err);
                        selection += '<p>Error loading cinema data</p>';
                    } else {
						selection += `<p>Selection Detail: ${movieID} </p>`;
                        sitzplatz(movieID);
                        
                       
						selection += data; 
                    }
                    innerResolve(); // İç promise'i resolve et
                });
            });
        });

        // Tüm dosya okumalarının tamamlanmasını bekle
        Promise.all(promises).then(() => {
          
            resolve(selection); // Tüm iç promise'ler tamamlandığında ana promise'i resolve et
        });
    });
}

function sitzplatz(movieIDk) {
    const obj = JSON.parse(movieIDk);
    const cinemaID = obj.cinemaID;
    const saalID = obj.saalID;
    const movieID = obj.movieID; 

    console.log('cinemaID',cinemaID);
    console.log('movieID',movieID);
    console.log('saalID',saalID);
    
    const cinema = new CinemaDB();
    cinema.openDB();

    // Koltuk verilerini almak için koltuk metodunu çağır
    cinema.koltuk(saalID).then(sitz => {
        console.log('MovieID :', movieID, sitz);
        
        cinema.closeDB(); 
    }).catch(err => {
        console.error("Err:", err);
        cinema.closeDB(); 
    });
}

function getCinamaSelection() {
    return new Promise(resolve => {
        let selection = `<select name='cinema' onchange='f.submit()'>`;
        selection += `<option>Wähle dein Kino</option>`;

        const cinema = new CinemaDB();
        cinema.openDB();
        cinema.getAllCinemas()
        .then(cinemas => {
            cinemas.forEach(cinema_data => {
                selection += `<option value='${cinema_data.ID}'>${cinema_data.name}</option>`;
            });
            
            selection += `</select>`;
            resolve(selection);
        });
    });
}

const server = http.createServer((req, res) => {
    const request_url = req.url;
    const request_data = url.parse(req.url); // http://127.0.0.1:8000?cinema=1&movie=7
    const request_query = qs.parse(request_data.query); // cinema=1&movie=7

    const cinemaID = request_query["cinema"];
    const selectedMovies = request_query["movieID"];
    const movieIDs = selectedMovies ? (Array.isArray(selectedMovies) ? selectedMovies : [selectedMovies]) : [];

    if (cinemaID) {
        const cinema = new CinemaDB();
        cinema.openDB();

        cinema.getNextMovies(cinemaID) // Promise
        .then(movies => {
            cinema.getAllCinemas()
            .then(cinemas => {
                getCinamaSelection().then(selection => {
                    let html_template = `
                    <html>
                    <head>
                    <meta charset='utf-8'/>
                    <title>Ugly Cinema</title>
                    <link rel="stylesheet" type="text/css" href="css.css"/>
                    </head>
                    <body>
                    <h1 style='color: #3D80CC'>Ugly AF Cinema</h1>
                    <form id='f' action='/'>
                    ${selection}
                    </form>
                    <form id='reservationForm' action='/reservation' method='GET'>`;

                    movies.forEach(movie => {
                        const movieData = JSON.stringify({ cinemaID: cinemaID, movieID: movie.ID, saalID: movie.saalID });
                        html_template += `
                        <div style='clear:both'> 
                            <div style='float:left;width:100px;'>BILD</div>
                            <div style='float:left;width:400px;'>${movie.titel}</div>
                            <div style='float:left;width:100px;'>${cinemaID}</div>
                            <div style='float:left;width:100px;'>${movie.saalName}</div>
                            <input type='checkbox' name='movieID' value='${movieData}'> Rezervasyon
                        </div>`;
                    });
                    
                    html_template += `
                    <button type='submit'>Rezervasyon</button>
                    </form>`;
                    html_template += `</body></html>`;
                    
                    res.writeHead(200);
                    res.end(html_template);
                });
            });

            cinema.closeDB();
        });
    } else if (request_data.pathname === '/reservation' && movieIDs.length > 0) {
        // Koltuk rezervasyon sayfasını oluştur
        sitzplatzauswahl(movieIDs).then(seatSelection => {
            let html_template = `
            <html>
            <head>
            <meta charset='utf-8'/>
            <title>Rezervation</title>
			 <link rel="stylesheet" type="text/css" href="css.css"/>
			</head>
            <body>
            <h1>Rezervation Plan</h1>
            ${seatSelection}

            <button type='submit'>Rezervasyonu Tamamla</button>
            </body>
            </html>`;

            res.writeHead(200);
            res.end(html_template);
        });
    } else {
        res.writeHead(200);
        res.end(`<html><head><title>Ugly Cinema</title></head>
        <body>
        <h1 style='color: #3D80CC'>Ugly AF Cinema</body></html>`);
    }
});

server.listen(PORT, IP, (err) => {
    if (err) throw err;	
    console.log("waiting for connections");
});
