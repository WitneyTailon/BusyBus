document.addEventListener('DOMContentLoaded', function() {
    const pontoPartida = JSON.parse(localStorage.getItem("pontoPartida"));
    const carroMaisProximo = JSON.parse(localStorage.getItem("carroMaisProximo"));
    const pontoDestino = JSON.parse(localStorage.getItem("pontoDestino"));
    const metodoPagamento = localStorage.getItem("metodoPagamento");
    const precoViagem = localStorage.getItem("precoViagem");
    const dist = document.querySelector('.temp');
    const spanTempo = document.querySelector('.temp span');
    const spanMoto = document.querySelector('.txtMoto');
    const spanMotoText = document.querySelector('.txtMoto span');
    const divMotorista = document.querySelector('.motorista');
    const bus = document.querySelector('.busGif');
    const mapa = document.getElementById('map');
    const infMoto = document.querySelector('.infM');
    const inpMoto = document.querySelector('.inpM');
    const DivpagM = document.querySelector('.pagarM');
    const pagM = document.querySelector('.pagarM span');

    // Inicializa o mapa centralizado no ponto médio
    const map = L.map('map').setView([
        (pontoPartida.lat + carroMaisProximo.lat) / 2,
        (pontoPartida.lng + carroMaisProximo.lng) / 2
    ], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Ícones personalizados
    const roundIcon = L.divIcon({
        className: 'round-marker',
        html: `<div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                <img src="../imgs/pfpFoto.jpg" alt="Perfil" style="width: 100%; height: 100%; object-fit: cover;">
            </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });

    const carroIcon = L.divIcon({
        className: '',
        html: `<div style="width: 30px; height: 30px; border-radius: 50%; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                <img src="../imgs/iconCarro.png" alt="Carro" style="width: 100%; height: 100%; object-fit: cover;">
            </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });

    const destinoIcon = L.divIcon({
        className: 'destino-marker',
        html: `<div style="width: 30px; height: 30px; border-radius: 50%; background: #4CAF50; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                <i class="fa-solid fa-flag" style="color: white; font-size: 14px;"></i>
            </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });

    // Cria e armazena os marcadores iniciais
    const partidaMarker = L.marker([pontoPartida.lat, pontoPartida.lng], { 
        icon: roundIcon 
    }).addTo(map).bindPopup("Ponto de Partida").openPopup();

    const carroMarker = L.marker([carroMaisProximo.lat, carroMaisProximo.lng], { 
        icon: carroIcon 
    }).addTo(map).bindPopup("Seu motorista");

    // Mensagem inicial
    spanTempo.textContent = 'Motorista a caminho...';

    // Variável para armazenar o tempo total da rota
    let tempoTotalRota = 0;

    // Traça a rota do carro até o ponto de partida
    tracarRota(map, carroMaisProximo, pontoPartida)
        .then(({coords, tempo}) => {
            tempoTotalRota += tempo; // Adiciona o tempo da primeira parte
            
            if (coords) {
                const initialRoute = L.polyline(coords, { color: 'blue', weight: 5 }).addTo(map);
                map.fitBounds(initialRoute.getBounds());
                
                // Anima o carro até o ponto de partida
                return animarMarcador(carroMarker, coords).then(() => {
                    // Quando o carro chegar ao ponto de partida:
                    map.removeLayer(initialRoute);
                    map.removeLayer(partidaMarker);
                    
                    // Troca o ícone do carro para o roundIcon (foto do perfil)
                    carroMarker.setIcon(roundIcon);
                    
                    // Atualiza a mensagem
                    spanTempo.textContent = `Em direção ao destino final (cerca de ${Math.ceil(tempoTotalRota/60)} minutos restantes)`;
                    divMotorista.classList.add('escondido');
                    spanMoto.classList.add('escondido');

                    // Inicia a rota para o destino final
                    if (pontoDestino) {
                        // Adiciona marcador de destino
                        L.marker([pontoDestino.lat, pontoDestino.lng], {
                            icon: destinoIcon
                        }).addTo(map).bindPopup("Destino final");
                        
                        return tracarRota(map, pontoPartida, pontoDestino, true)
                            .then(({coords: routeCoords, tempo: tempoFinal}) => {
                                tempoTotalRota += tempoFinal; // Adiciona o tempo da segunda parte
                                
                                if (routeCoords) {
                                    const finalRoute = L.polyline(routeCoords, { 
                                        color: '#4CAF50', 
                                        weight: 5 
                                    }).addTo(map);
                                    
                                    map.fitBounds(finalRoute.getBounds());
                                    
                                    // Atualiza o tempo restante
                                    let tempoRestante = Math.ceil(tempoTotalRota/60);
                                    spanTempo.textContent = `Em direção ao destino final (cerca de ${tempoRestante} minutos restantes)`;
                                    
                                    return animarMarcador(carroMarker, routeCoords).then(() => {
                                        dist.classList.remove('distancia');
                                        spanTempo.classList.add('temp2');
                                        spanTempo.textContent = 'VOCÊ CHEGOU AO SEU DESTINO!';
                                        divMotorista.classList.remove('escondido');
                                        bus.classList.remove('escondido');
                                        spanMoto.classList.remove('escondido');
                                        spanMotoText.textContent = 'AVALIE O MOTORISTA';
                                        infMoto.classList.add('escondido');
                                        inpMoto.classList.remove('escondido');
                                        mapa.classList.add('escondido');
                                        DivpagM.classList.remove('escondido');
                                        pagM.textContent = `Realize o pagamento ao motorista com ${metodoPagamento} pelo valor de ${precoViagem}`;
                                    });
                                }
                            });
                    }
                });
            }
        })
        .then(() => {
            // Atualiza o contador de tempo durante o trajeto final
            let tempoRestante = Math.ceil(tempoTotalRota/60);
            const intervalo = setInterval(() => {
                tempoRestante -= 1;
                if (tempoRestante <= 0) {
                    clearInterval(intervalo);
                } else {
                    spanTempo.textContent = `Em direção ao destino final (${tempoRestante} minutos restantes)`;
                }
            }, 60000);
        });
});

// Função para traçar a rota no mapa (agora retorna tempo também)
function tracarRota(map, origem, destino, isFinalRoute = false) {
    const coordsOrigem = `${origem.lng},${origem.lat}`;
    const coordsDestino = `${destino.lng},${destino.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsOrigem};${coordsDestino}?overview=full&geometries=geojson`;

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const routeCoords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]); // [lat, lng]
                return {
                    coords: routeCoords,
                    tempo: route.duration // tempo em segundos
                };
            }
            return {
                coords: [
                    [origem.lat, origem.lng],
                    [destino.lat, destino.lng]
                ],
                tempo: calcularDistancia(origem.lat, origem.lng, destino.lat, destino.lng) / (40 * 1000 / 3600) // tempo estimado
            };
        })
        .catch(error => {
            console.error('Erro ao traçar rota:', error);
            // Fallback em linha reta
            return {
                coords: [
                    [origem.lat, origem.lng],
                    [destino.lat, destino.lng]
                ],
                tempo: calcularDistancia(origem.lat, origem.lng, destino.lat, destino.lng) / (40 * 1000 / 3600) // tempo estimado
            };
        });
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distância em metros
}

function animarMarcador(marker, routeCoords) {
    return new Promise(resolve => {
        const VELOCIDADE_KMH = 60;
        const VELOCIDADE_MS = VELOCIDADE_KMH * 1000 / 3600; // m/s
        // 1. Pré-cálculo das distâncias e do total
        const segmentos = [];
        let distanciaTotal = 0;
        for (let i = 1; i < routeCoords.length; i++) {
        const [lat1, lng1] = routeCoords[i-1];
        const [lat2, lng2] = routeCoords[i];
        const d = calcularDistancia(lat1, lng1, lat2, lng2);
        segmentos.push({ start: routeCoords[i-1], end: routeCoords[i], distancia: d });
        distanciaTotal += d;
        }

        const inicio = performance.now();

        function frame() {
        // 2. Quanto tempo passou desde o início (ms)
        const elapsedMs = performance.now() - inicio;
        // 3. Quantos metros deveríamos ter percorrido
        const travelled = VELOCIDADE_MS * (elapsedMs / 1000);

        if (travelled >= distanciaTotal) {
            // Já chegamos
            marker.setLatLng(routeCoords[routeCoords.length - 1]);
            resolve();
            return;
        }

        // 4. Descobrir em qual segmento estamos
        let acum = 0;
        let segIndex = 0;
        while (acum + segmentos[segIndex].distancia < travelled) {
            acum += segmentos[segIndex].distancia;
            segIndex++;
        }
        const seg = segmentos[segIndex];
        const segTraveled = travelled - acum;
        const frac = segTraveled / seg.distancia;

        // 5. Interpolar lat/lng
        const lat = seg.start[0] + (seg.end[0] - seg.start[0]) * frac;
        const lng = seg.start[1] + (seg.end[1] - seg.start[1]) * frac;
        marker.setLatLng([lat, lng]);

        // 6. Próximo frame
        requestAnimationFrame(frame);
        }

        frame();
    });
}
document.querySelector('.navbar-toggler').addEventListener('click', function () {
    window.location.href = '../index.html';
});