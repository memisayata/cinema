function sitzplatz(saalID) {
    const cinema = new CinemaDB();
    cinema.openDB();
    
    return cinema.koltuk(saalID).then(sitz => {
        
        let seatsHtml = '<div class="cinema">'; // Grid yapısını kullanarak başlıyoruz
        /* css hier :( --------------------------------------------------------------------*/
        seatsHtml += `
        <style>


   /* Koltuk stilini tanımlar */
   .cinema {
        
   }
   .seat {
       width: 50px; /* Koltuğun genişliği */
       height: 50px; /* Koltuğun yüksekliği */
       background-color: #32CD32; /* Varsayılan koltuk rengi: yeşil */
       border-radius: 5px; /* Koltuğun kenarlarını yuvarlar */
       display: flex; /* İçindeki öğeleri merkezler */
       justify-content: center; /* Yatayda ortalar */
       align-items: center; /* Dikeyde ortalar */
       cursor: pointer; /* Koltuk üzerine gelince imleç değişir */
   }

   .seat.taken {
       background-color: #D3D3D3; /* Alınmış koltuk rengi: gri */
       cursor: not-allowed; /* Alınmış koltuğa tıklanamaz */
   }

   .seat.selected {
       background-color: #FFD700; /* Seçilen koltuğun rengi: sarı */
   }
   </style>
   
      <script>
                function selectSeat(seatElement) {
                    if (!seatElement.classList.contains('taken')) {
                        seatElement.classList.toggle('selected');
                    }
                }
            </script>          
        `;
        
        /* --------------------------------------------------------------------------------*/
        sitz.forEach(seat => {
            const seatClass = seat.status === 0 ? 'seat' : 'seat taken'; // Müsait veya alınmış
            
            seatsHtml += `
                <div class="${seatClass}" data-seat-id="${seat.sitze_id}" onclick="selectSeat(this)">
                    ID: ${seat.sitze_id} 
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