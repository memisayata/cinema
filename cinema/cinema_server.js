const http = require("http");
const url = require("url");
const qs = require("querystring");
const fs = require("fs"); 
const { CinemaDB } = require("./cinema_database.js");

const PORT = 8000;
const IP = "0.0.0.0";


let selectedSeats = []; // Global olarak tanımlama


function sitzplatzauswahl(movieIDs) {
    return new Promise((resolve) => {
        if (!Array.isArray(movieIDs) || movieIDs.length === 0) {
            resolve('<p>Kein Film Auswählt</p>');
            return;
        }

        let selection = `<h2>Films</h2>`;
        const promises = movieIDs.map(movieID => {
            return new Promise((innerResolve) => {
                fs.readFile('cinema.html', 'utf-8', (err, data) => {
                    if (err) {
                        console.error(err);
                        selection += '<p>Sinemadan veri yüklenirken hata oluştu.</p>';
                    } else {
                        const obj = JSON.parse(movieID);
                        //console.log(movieID) // {"cinemaID":"1","movieID":5,"saalID":1}
                        const cinemaID = obj.cinemaID;
                        const filmID = obj.movieID;
                        const saalID = obj.saalID;

                        
                        // Belirli film için koltukları almak için metod çağrısı
                        sitzplatz(cinemaID,filmID,saalID).then(seatsHtml => {
                            selection += `<p>Kunden Auswähl: ${movieID}</p>`;
                            selection += seatsHtml; // Koltuk HTML'sini ekle
                            innerResolve(); // İç promise'i çöz
                        });
                    }
                });
            });
        });

        Promise.all(promises).then(() => {
            resolve(selection); // Ana promise'i çöz
        });
    });
}
function sitzplatz(cinemaID, filmID, saalID) {
    const cinema = new CinemaDB();
    cinema.openDB();

    return cinema.koltuk(cinemaID, filmID, saalID).then(sitz => {
        console.log('Console Sitz : ',sitz);
        let seatsHtml = '<div class="cinema">';

        seatsHtml += `
        <style>
            .cinema {
                width: 170px; 
                display: flex; 
                flex-wrap: wrap; 
                gap: 5px; 
            }
            .seat {
                width: 30px; 
                height: 30px; 
                background-color: #32CD32; 
                border-radius: 3px; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                cursor: pointer; 
            }
            .seat.taken {
                background-color: rgb(224, 19, 19); 
                cursor: not-allowed; 
            }
            .seat.selected {
                background-color: #FFD700; 
            }
        </style>
        <script>
            let selectedSeats = []; // Burada tekrar tanımlama
            function selectSeat(seatElement) {
                if (!seatElement.classList.contains('taken')) {
                    seatElement.classList.toggle('selected');

                    const seatId = seatElement.getAttribute('data-seat-id');

                    if (selectedSeats.includes(seatId)) {
                        selectedSeats = selectedSeats.filter(id => id !== seatId);
                    } else {
                        selectedSeats.push(seatId);
                    }

                    console.log("Seçilen Koltuklar:", selectedSeats);
                }
            }
        </script>
        `;

        sitz.forEach(seat => {
            const seatClass = seat.status === 0 ? 'seat' : 'seat taken';
            seatsHtml += `
            <div class="${seatClass}" data-seat-id="${seat.sitze_id || seat.id}" onclick="selectSeat(this)">
                ID: ${seat.sitze_id || seat.id} 
            </div>
            `;
        });

        seatsHtml += '</div>';
        cinema.closeDB(); 
        return seatsHtml;
    }).catch(err => {
        console.error("Hata:", err);
        cinema.closeDB();
        return '<p>Koltuklar yüklenirken hata oluştu.</p>';
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
                    <!DOCTYPE html>
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
                            <div style='float:left;width:100px;'>FilmID:${movie.filmID}</div>
                            <div style='float:left;width:100px;'>SpielzeitID : ${movie.spielzeitID}</div>
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
        console.log(movieIDs); // [ '{"cinemaID":"1","movieID":5,"saalID":1}' ] böyle bir sonuc gelmeli 
        sitzplatzauswahl(movieIDs).then(seatSelection => {
            let html_template = `
            <!DOCTYPE html>
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
