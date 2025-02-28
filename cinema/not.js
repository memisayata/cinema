const http = require("http");
const url = require("url");
const qs = require("querystring");
const { CinemaDB } = require("./cinema_database.js");

const PORT = 8000;
const IP = "0.0.0.0";

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
    const request_data = url.parse(req.url);
    const request_query = qs.parse(request_data.query);
    
    console.log("KinoID:", request_query["cinema"]);
    
    const cinemaID = request_query["cinema"];
    
    if (cinemaID) {
        const cinema = new CinemaDB();
        cinema.openDB();
        
        cinema.getNextMovies(cinemaID)
            .then(movies => {
                cinema.getAllCinemas()
                    .then(cinemas => {
                        getCinamaSelection().then(selection => {
                            const fs = require('fs');
                            
                            fs.readFile('main_html.txt', 'utf8', (err, mainData) => {
                                if (err) {
                                    console.error('main_html.txt okuma hatası:', err);
                                    return res.end('main_html.txt okunurken hata oluştu');
                                }

                                fs.readFile('res_html.txt', 'utf8', (err, resData) => {
                                    if (err) {
                                        console.error('res_html.txt okuma hatası:', err);
                                        return res.end('res_html.txt okunurken hata oluştu');
                                    }

                                    let html_template = ``;
									
                                    const res_status = request_query["res"];
                                    
                                    if (res_status == 0) {
                                        html_template += mainData;
                                    } else {
                                        html_template += resData;
                                    }

                                    html_template += selection; 

                                    html_template += `</body></html>`;
                                    
                                    res.writeHead(200);
                                    res.end(html_template);
                                });
                            });
                        });
                    });

                cinema.closeDB();
            });
    } else {
        res.writeHead(200);
        res.end(`<html><head><title>Ugly Cinema</title></head>
        <body>
        <h1 style='color: #3D80CC'>Ugly AF Cinema</h1></body></html>`);
    }
});

server.listen(PORT, IP, (err) => {
    if (err) throw err;
    
});





