// objekt, ki hrani pot
var pot;

// seznam z markerji na mapi
var markerji = [];

var mapa;
var obmocja = [];
var koordinateIzbranePoti = [];

const OMEJITEV_TOCK = 200;

const FRI_LAT = 46.05004;
const FRI_LNG = 14.46931;

function odstraniVseTockeNaZemljevidu() {
  for (var i = 1; i < markerji.length; i++) {
    mapa.removeLayer(markerji[i]);
  }
}

/**
* Ko se stran naloži, se izvedejo ukazi spodnje funkcije
*/
window.addEventListener('load', function () {
  document.querySelector("#akcija").addEventListener('click', akcijaIzbire);
  // Osnovne lastnosti mape
  var mapOptions = {
    center: [FRI_LAT, FRI_LNG],
    zoom: 8.5
  };

  // Ustvarimo objekt mapa
  mapa = new L.map('mapa_id', mapOptions);

  // Ustvarimo prikazni sloj mape
  var layer = new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

  // Prikazni sloj dodamo na mapo
  mapa.addLayer(layer);

  // Ročno dodamo fakulteto za računalništvo in informatiko na mapo
  dodajMarker(FRI_LAT, FRI_LNG, "FAKULTETA ZA RAČUNALNIŠTVO IN INFORMATIKO", "FRI");

  // Objekt oblačka markerja
  var popup = L.popup();

  function obKlikuNaMapo(e) {
    var latlng = e.latlng;
    popup
    .setLatLng(latlng)
    .setContent("Izbrana točka:" + latlng.toString())
    .openOn(mapa);

    prikazPoti(latlng);
  }

  mapa.on('click', obKlikuNaMapo);

  document.getElementById('izbira').addEventListener('change', (elem) => {
  document.getElementById("akcija").disabled = elem.target.value == 'ni_izbrano';
  });

  document.getElementById("izbrisiRezultate")
  .addEventListener("click", function () {

    // Odstrani vse oznake iz zemljevida
    odstraniVseTockeNaZemljevidu();

    // Odstrani vse oznake, razen FRI
    markerji.splice(1);
    // Onemogoči gumb
    document.getElementById("izbrisiRezultate").disabled = true;

    // Resetiraj število najdenih zadetkov
    document.getElementById("fakultete_rezultati").innerHTML = 0;
    document.getElementById("kulturne_dediscine_rezultati").innerHTML = 0;
  });

  // dodaj poslušalca naj bo del naloge!
  document.getElementById("idRadij")
  .addEventListener("click", function () {
    prikaziObmocja();
  });
});


/**
* Na zemljevid dodaj izbrane interesne točke.
*/
function akcijaIzbire() {
  var izbira = document.getElementById('izbira').value;
  
  var gumb = document.getElementById("izbrisiRezultate")

  pridobiPodatke(izbira, function (jsonRezultat) {
    izrisRezultatov(jsonRezultat);
    gumb.disabled = false;
  });
}


/**
* Za podano vrsto interesne točke dostopaj do JSON datoteke
* in vsebino JSON datoteke vrni v povratnem klicu
*
* @param vrstaInteresneTocke "fakultete" ali "kulturne_dediscine"
* @param callback povratni klic z vsebino zahtevane JSON datoteke
*/
function pridobiPodatke(vrstaInteresneTocke, callback) {
  if (typeof (vrstaInteresneTocke) != "string") return;
  
  

  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open("GET", "./podatki/" + vrstaInteresneTocke + ".json", true);
  xobj.onreadystatechange = function () {
    // rezultat ob uspešno prebrani datoteki
    if (xobj.readyState == 4 && xobj.status == "200") {
      var json = JSON.parse(xobj.responseText);

      // vrnemo rezultat
       callback(json);
      if (vrstaInteresneTocke == "fakultete") {
        document.getElementById("fakultete_rezultati").innerHTML = json.length;
      } else {
         document.getElementById("kulturne_dediscine_rezultati").innerHTML = json.length;
      }
       
      
    }
  };
  xobj.send(null);
}


/**
* Dodaj izbrano oznako na zemljevid na določenih GPS koordinatah,
* z dodatnim opisom, ki se prikaže v oblačku ob kliku in barvo
* ikone, glede na tip oznake (fakultete vključno s FRI = modra in
* kulturne dediščine = zelena)
*
* @param lat zemljepisna širina
* @param lng zemljepisna dolžina
* @param opis sporočilo, ki se prikaže v oblačku
* @param tip "FRI", "restaurant" ali "faculty"
*/
function dodajMarker(lat, lng, opis, tip, prikaziMarker) {
  var ikona = new L.Icon({
    iconUrl: './slike/marker-icon-2x-' +
    (tip == 'visokošolska ustanova' ? 'green' : 'blue') + '.png',
    shadowUrl: 'https://teaching.lavbic.net/cdn/OIS/DN1/' +
    'marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Ustvarimo marker z vhodnima podatkoma koordinat
  // in barvo ikone, glede na tip
  var marker = L.marker([lat, lng], {icon: ikona});

  // Izpišemo želeno sporočilo v oblaček
  marker.bindPopup("<div>" + opis + "</div>").openPopup();

  // Dodamo točko na mapo in v seznam
  if (prikaziMarker == undefined || prikaziMarker) {
    marker.addTo(mapa);
  }

  markerji.push(marker);
}


/**
* Na podlagi podanih interesnih točk v GeoJSON obliki izriši
* posamezne točke na zemljevid neodvisno od izbrane poti maksimalne dolžine 200 interesnih točk
*
* @param jsonRezultat interesne točke v GeoJSON obliki
*/
function izrisRezultatov(seznam) {
  for (var i = 0; i < seznam.length; i++) {
    var lat = seznam[i].lat;
    var lng = seznam[i].lng;

    dodajMarker(lat, lng, seznam[i].Ime, seznam[i].Zvrst, i < OMEJITEV_TOCK);
  }
}

/**
* Glede na vrednost radija območja izbriši oz. dodaj
* oznake na zemljevid.
*
* @return stevecTock število prikazanih interesnih točk oz. oznak
*/
function posodobiOznakeNaZemljevidu() {
  var stevecTock = 1;
  
  for (i = 0; i < markerji.length; i++) {
    if (stevecTock <= OMEJITEV_TOCK-1 && prikaziOznako(markerji[i]._latlng.lng, markerji[i]._latlng.lat)) {
      mapa.addLayer(markerji[i]);
      stevecTock++;
    }
  }
  
  
  return stevecTock;
}


/**
* Prikaz poti od/do izbrane lokacije do/od FRI
*
* @param latLng izbrana točka na zemljevidu
*/
function prikazPoti(latLng) {
  // Izbrišemo obstoječo pot, če ta obstaja
  if (pot != null) mapa.removeControl(pot);
  
  if(idDoFri.checked) {
    pot = L.Routing.control({ 
      waypoints: [latLng, L.latLng(FRI_LAT, FRI_LNG)],
      show: true,
      lineOptions: {styles: [{color: '#4E732E',
                              weight: '6', 
                              dashArray: '4,9'
        
      }]},
      language: "sl",
    }).addTo(mapa);
  } else {
     pot = L.Routing.control({
      waypoints: [L.latLng(FRI_LAT, FRI_LNG), latLng],
      show: true,
      lineOptions: {styles: [{color: '#4E732E',
                              weight: '6', 
                              dashArray: '4,9'
        
      }]},
      language: "sl",
   }).addTo(mapa);
  }

 
  // podrobnosti o poti, ko je ta najdena
  pot.on('routesfound', function (e) {
    koordinateIzbranePoti = e.routes[0].coordinates;
    
   
    
    prikaziObmocja();
    odstraniVseTockeNaZemljevidu();
    
    var dolzinaPoti = document.getElementById("dolzinaPoti");
    var steviloTock = document.getElementById("prikazaneTocke");
    
    dolzinaPoti.innerHTML = e.routes[0].coordinates.length;
    steviloTock.innerHTML = posodobiOznakeNaZemljevidu();
   
  // document.getElementById("dolzinaPoti").innerHTML = kordinateIzbranePoti.length;
    
    
   

  });
}


/**
* Preveri ali izbrano oznako na podanih GPS koordinatah izrišemo
* na zemljevid glede uporabniško določeno vrednost radij, ki
* predstavlja razdaljo od vsake točke poti.
*
* Če radij ni določen, je enak 0 oz. je večji od razdalje izbrane
* oznake od FRI, potem oznako izrišemo, sicer ne.
*
* @param lat zemljepisna širina
* @param lng zemljepisna dolžina
*/
function prikaziOznako(lng, lat) {
  var radij = vrniRadij();
  // Ko je radij 0, prikažemo vse rezultate na mapi
  if (radij == 0)
  return true;
  else {
    for (var i = 0; i < koordinateIzbranePoti.length; i++) {
      if (distance(lat, lng, koordinateIzbranePoti[i].lat, koordinateIzbranePoti[i].lng, "K") <= radij)
      return true;
    }

    return false;
  }
}


function odstraniVsaObmocja() {
  if (obmocja != null || obmocja.length > 0) {
    for (var i = 0; i < obmocja.length; i++) {
      mapa.removeLayer(obmocja[i]);
    }
  }
}

/**
* Na zemljevidu nariši rdeč krog z transparentnim oranžnim polnilom
* s središčem na lokaciji FRI in radijem. Območje se izriše
* le, če je na strani izbrana vrednost "Prikaz radija".
*/
function prikaziObmocja() {
  if (idRadij.checked) {
    const gostotaTock = 20;
    odstraniVsaObmocja();

    for (var i = 0; i < koordinateIzbranePoti.length; i += gostotaTock) {
      obmocja[i / gostotaTock] = L.circle([koordinateIzbranePoti[i].lat, koordinateIzbranePoti[i].lng], {
        color: 'transparent',
        fillColor: 'orange',
        fillOpacity: 0.05,
        radius: vrniRadij() * 1000
      }).addTo(mapa);
    }
  } else {
    odstraniVsaObmocja();
  }
}

/**
* Vrni celoštevilsko vrednost radija, ki ga uporabnik vnese v
* vnosno polje. Če uporabnik vnese neveljavne podatke, je
* privzeta vrednost radija 0.
*/
function vrniRadij() {
  var vrednost = document.getElementById("radij");
  if (vrednost == null) {
    vrednost = 0;
  } else {
    vrednost = parseInt(vrednost.value, 10);
    vrednost = isNaN(vrednost) ? 0 : vrednost;
  }
  return vrednost;
}
