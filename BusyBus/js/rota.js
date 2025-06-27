// Variáveis globais
let map;
let markers = {
    partida: null,
    destino: null
};
let lastRequestTime = 0;
const REQUEST_DELAY = 1000; // 1 segundo entre requisições
let routeLayer = null; // Para armazenar a rota desenhada

// Inicialização do mapa
function initMap() {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            map = L.map('map').setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            
            // Marcador da localização atual
            const roundIcon = L.divIcon({
                className: '',
                html: `
                    <div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                        <img src="../imgs/pfpFoto.jpg" alt="Perfil" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            });

            L.marker([lat, lng], { icon: roundIcon }).addTo(map)
                .bindPopup("Você está aqui")
                .openPopup();
            
            const carroIcon = L.divIcon({
                className: '',
                html: `<div style="width: 30px; height: 30px; border-radius: 50%; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                        <img src="../imgs/iconCarro.png" alt="Carro" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            });

            const carros = [
                [-3.7613296937803042, -38.567629219585776],
                [-3.7405022786536084, -38.56785275649515],
                [-3.746942512361091, -38.57158736268722],
                [-3.7491139166500447, -38.568260200770176],
                [-6.346548498842942, -39.31400041810475],
                [-6.347923588393702, -39.315556935069594],
                [-6.346927834263066, -39.31274506630783],
                [-6.351312630630214, -39.293532408299114],
                [-6.352455129126499, -39.29501092454376],
                [-6.351734837303015, -39.29734116064877],
                [-6.351860437163514, -39.31338504673731],
                [-3.7484570721810235, -38.56097466049864]
            ];

            carros.forEach(coord => {
                L.marker(coord, { icon: carroIcon }).addTo(map);
            });
            
            // Opcional: já preenche o ponto de partida
            document.getElementById('btnMinhaLocalizacao').click();
        },
        () => {
            // Fallback se geolocalização falhar
            map = L.map('map').setView([-15.7942, -47.8822], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        },
        { timeout: 10000 } // Timeout de 10 segundos
    );
}

// Função para calcular distância entre coordenadas (Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distância em km
}

// Função para encontrar o carro mais próximo
function encontrarCarroMaisProximo(userLat, userLng) {
    const carros = [
        [-3.7613296937803042, -38.567629219585776],
        [-3.7405022786536084, -38.56785275649515],
        [-3.746942512361091, -38.57158736268722],
        [-3.7491139166500447, -38.568260200770176],
        [-6.346548498842942, -39.31400041810475],
        [-6.347923588393702, -39.315556935069594],
        [-6.346927834263066, -39.31274506630783],
        [-6.351312630630214, -39.293532408299114],
        [-6.352455129126499, -39.29501092454376],
        [-6.351734837303015, -39.29734116064877],
        [-6.351860437163514, -39.31338504673731],
        [-3.7484570721810235, -38.56097466049864]
    ];

    let menorDistancia = Infinity;
    let carroMaisProximo = null;

    carros.forEach(coord => {
        const distancia = calcularDistancia(userLat, userLng, coord[0], coord[1]);
        if (distancia < menorDistancia) {
            menorDistancia = distancia;
            carroMaisProximo = { lat: coord[0], lng: coord[1] };
        }
    });
    // Armazena as coordenadas do carro mais próximo
    localStorage.setItem("carroMaisProximo", JSON.stringify(carroMaisProximo));
    // Armazena o ponto de partida
    localStorage.setItem("pontoPartida", JSON.stringify({ lat: userLat, lng: userLng }));
    localStorage.setItem("pontoDestino", JSON.stringify(markers.destino.coords));
    
    return menorDistancia;
}

// Função para autocompletar
function setupAddressAutocomplete(inputId, markerType) {
    const input = document.getElementById(inputId);
    const spinner = document.getElementById(`spinner-${inputId}`);
    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    dropdown.style.display = 'none';
    input.parentNode.appendChild(dropdown);

    // Debounce para limitar requisições
    let timeout;
    input.addEventListener('input', function(e) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const query = e.target.value.trim();
            if (query.length < 3) {
                dropdown.style.display = 'none';
                return;
            }

            // Verifica se passou tempo suficiente desde a última requisição
            const now = Date.now();
            if (now - lastRequestTime < REQUEST_DELAY) {
                return;
            }
            lastRequestTime = now;

            fetchAddressSuggestions(query, dropdown, input, spinner, markerType);
        }, 300); // 300ms de delay após digitação
    });

    document.addEventListener('click', function(e) {
        if (e.target !== input) {
            dropdown.style.display = 'none';
        }
    });
}

// Função para buscar sugestões com fallback
async function fetchAddressSuggestions(query, dropdown, input, spinner, markerType) {
    try {
        spinner.style.display = 'block';
        dropdown.innerHTML = '<div class="autocomplete-item loading">Buscando endereços...</div>';
        dropdown.style.display = 'block';

        // Tenta primeiro o Nominatim
        const response = await fetchWithTimeout(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
            { timeout: 5000 }
        );
        
        if (!response.ok) throw new Error('Nominatim failed');
        
        const data = await response.json();
        
        if (data.length === 0) {
            // Fallback para Photon se Nominatim não retornar resultados
            await tryPhotonAPI(query, dropdown, input, spinner, markerType);
            return;
        }
        
        displaySuggestions(data, dropdown, input, spinner, markerType);
        
    } catch (error) {
        console.error('Error fetching addresses:', error);
        // Tenta Photon como fallback
        await tryPhotonAPI(query, dropdown, input, spinner, markerType);
    } finally {
        spinner.style.display = 'none';
    }
}

// Tentativa com API Photon (fallback)
async function tryPhotonAPI(query, dropdown, input, spinner, markerType) {
    try {
        spinner.style.display = 'block';
        dropdown.innerHTML = '<div class="autocomplete-item loading">Buscando em servidor alternativo...</div>';
        dropdown.style.display = 'block';

        const response = await fetchWithTimeout(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
            { timeout: 5000 }
        );
        
        if (!response.ok) throw new Error('Photon failed');
        
        const data = await response.json();
        const formattedData = data.features.map(feature => ({
            display_name: [feature.properties.name, feature.properties.city, feature.properties.country]
                .filter(Boolean).join(', '),
            lat: feature.geometry.coordinates[1],
            lon: feature.geometry.coordinates[0]
        }));
        
        displaySuggestions(formattedData, dropdown, input, spinner, markerType);
    } catch (error) {
        console.error('Error with Photon API:', error);
        dropdown.innerHTML = '<div class="autocomplete-item error">Serviço indisponível no momento</div>';
        dropdown.style.display = 'block';
    } finally {
        spinner.style.display = 'none';
    }
}

// Função auxiliar para fetch com timeout
function fetchWithTimeout(url, options = {}) {
    const { timeout = 8000 } = options;
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    return fetch(url, {
        ...options,
        signal: controller.signal
    }).then(response => {
        clearTimeout(id);
        return response;
    }).catch(error => {
        clearTimeout(id);
        throw error;
    });
}

// Exibir sugestões
function displaySuggestions(data, dropdown, input, spinner, markerType) {
    dropdown.innerHTML = '';
    if (data.length === 0) {
        dropdown.innerHTML = '<div class="autocomplete-item">Nenhum resultado encontrado</div>';
        return;
    }

    data.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'autocomplete-item';
        itemElement.textContent = item.display_name || item.name;
        itemElement.addEventListener('click', function() {
            input.value = item.display_name || item.name;
            dropdown.style.display = 'none';
            updateMapMarker(markerType, parseFloat(item.lat), parseFloat(item.lon), item.display_name || item.name);
        });
        dropdown.appendChild(itemElement);
    });
    dropdown.style.display = 'block';
}

// Atualiza marcadores no mapa
function updateMapMarker(type, lat, lng, title) {
    if (markers[type]) {
        map.removeLayer(markers[type]);
    }
    
    // Adiciona novo marcador
    markers[type] = L.marker([lat, lng]).addTo(map)
        .bindPopup(title)
        .openPopup();
    
    // Armazena as coordenadas no objeto markers
    markers[type].coords = { lat, lng };
    
    // Se ambos os pontos estiverem definidos, traça a rota
    if (markers.partida && markers.partida.coords && 
        markers.destino && markers.destino.coords) {
        tracarRota(markers.partida.coords, markers.destino.coords);
    }
    
    // Verifica se é um destino para atualizar o ícone de favorito
    if (type === 'destino') {
        verificarFavoritoAtual();
    }
    
    // Centraliza o mapa na nova localização
    map.setView([lat, lng], 15);
}

// Função para obter e usar a localização atual
function usarLocalizacaoAtual() {
    const spinner = document.getElementById('spinner-partida');
    const inputPartida = document.getElementById('partida');
    
    spinner.style.display = 'block';
    inputPartida.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Usa o Nominatim para reverse geocoding (obter endereço a partir de coordenadas)
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                .then(response => response.json())
                .then(data => {
                    const endereco = data.display_name || "Minha localização atual";
                    inputPartida.value = endereco;
                    // Cria marcador com imagem personalizada
                    const roundIcon = L.divIcon({
                        className: '',
                        html: `
                            <div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                                <img src="../imgs/pfpFoto.jpg" alt="Perfil" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>`,
                        iconSize: [40, 40],
                        iconAnchor: [20, 40]
                    });

                    // Remove marcador antigo, se existir
                    if (markers.partida) {
                        map.removeLayer(markers.partida);
                    }

                    // Cria novo marcador com ícone personalizado
                    markers.partida = L.marker([lat, lng], { icon: roundIcon }).addTo(map)
                        .bindPopup(endereco)
                        .openPopup();

                    // Armazena as coordenadas
                    markers.partida.coords = { lat, lng };

                    // Traça rota se necessário
                    if (markers.partida && markers.destino && markers.destino.coords) {
                        tracarRota(markers.partida.coords, markers.destino.coords);
                    }

                    // Centraliza
                    map.setView([lat, lng], 15);
                })
                .catch(error => {
                    console.error("Erro ao obter endereço:", error);
                    inputPartida.value = "Minha localização atual";
                    updateMapMarker('partida', lat, lng, "Minha localização atual");
                })
                .finally(() => {
                    spinner.style.display = 'none';
                    inputPartida.disabled = false;
                });
        },
        (error) => {
            console.error("Erro ao obter localização:", error);
            alert("Não foi possível obter sua localização. Por favor, digite manualmente.");
            spinner.style.display = 'none';
            inputPartida.disabled = false;
        },
        { timeout: 10000 } // Timeout de 10 segundos
    );
}

// Adicione o evento de clique no botão
document.getElementById('btnMinhaLocalizacao').addEventListener('click', usarLocalizacaoAtual);

// Sistema de Favoritos
let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];

// Função para atualizar a lista de favoritos
function atualizarListaFavoritos() {
    const listaFavoritos = document.getElementById('listaFavoritos');
    listaFavoritos.innerHTML = '';
    
    favoritos.forEach((favorito, index) => {
        const item = document.createElement('div');
        item.className = 'favorito-item';

        const nomeResumido = favorito.nome.split(' ').slice(0, 8).join(' ') + '...';

        item.innerHTML = `
            <span class="favorito-nome">${nomeResumido}</span>
            <button class="btn-remover" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        item.addEventListener('click', () => {
            document.getElementById('destino').value = favorito.nome;
            updateMapMarker('destino', favorito.lat, favorito.lng, favorito.nome);
        });
        
        listaFavoritos.appendChild(item);
    });
    
    // Eventos para remover favoritos
    document.querySelectorAll('.btn-remover').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const index = parseInt(this.dataset.index);
            favoritos.splice(index, 1);
            localStorage.setItem('favoritos', JSON.stringify(favoritos));
            atualizarListaFavoritos();
            verificarFavoritoAtual();
        });
    });
}

// Função para favoritar um endereço
function favoritarEndereco(nome, lat, lng) {
    // Verifica se já existe
    const existe = favoritos.some(f => 
        f.lat === lat && f.lng === lng
    );
    
    if (!existe) {
        favoritos.unshift({ nome, lat, lng }); // Adiciona no início
        localStorage.setItem('favoritos', JSON.stringify(favoritos));
        atualizarListaFavoritos();
        
        // Feedback visual
        const btn = document.getElementById('btnFavoritar');
        btn.innerHTML = '<i class="fas fa-star"></i>';
        setTimeout(() => {
            verificarFavoritoAtual();
        }, 1000);
    }
}

// Verifica se o destino atual está favoritado
function verificarFavoritoAtual() {
    const btnFavorito = document.getElementById('btnFavoritar');
    if (markers.destino && markers.destino.coords) {
        const jaFavoritado = favoritos.some(f => 
            f.lat === markers.destino.coords.lat && 
            f.lng === markers.destino.coords.lng
        );
        btnFavorito.innerHTML = jaFavoritado ? 
            '<i class="fas fa-star"></i>' : 
            '<i class="far fa-star"></i>';
    } else {
        btnFavorito.innerHTML = '<i class="far fa-star"></i>';
    }
}

// Configura o botão de favorito
document.getElementById('btnFavoritar').addEventListener('click', function() {
    const destinoInput = document.getElementById('destino');
    const destino = destinoInput.value.trim();
    
    if (destino && markers.destino && markers.destino.coords) {
        favoritarEndereco(
            destino,
            markers.destino.coords.lat,
            markers.destino.coords.lng
        );
    } else {
        alert('Selecione um destino válido antes de favoritar');
    }
});

// Função para traçar a rota no mapa
function tracarRota(origem, destino, callback) {
    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }

    const btnContinuar = document.getElementById('btnContinuar');
    if (btnContinuar) btnContinuar.disabled = true; // desativa enquanto carrega

    const coordsOrigem = `${origem.lng},${origem.lat}`;
    const coordsDestino = `${destino.lng},${destino.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsOrigem};${coordsDestino}?overview=full&geometries=geojson`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const routeCoords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                routeLayer = L.polyline(routeCoords, { color: 'blue', weight: 5 }).addTo(map);
                map.fitBounds(routeLayer.getBounds());

                const duracao = route.duration / 60;
                localStorage.setItem('tempoRota', duracao.toFixed(2));

                if (btnContinuar) btnContinuar.disabled = false; // ativa botão agora

                if (callback) callback(); // se houver callback
            } else {
                alert('Não foi possível calcular a rota.');
            }
        })
        .catch(error => {
            console.error('Erro ao traçar rota:', error);
            alert('Erro ao calcular rota.');
        });
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    setupAddressAutocomplete('partida', 'partida');
    setupAddressAutocomplete('destino', 'destino');
    atualizarListaFavoritos();
    
    // Modifique o evento de clique do botão Continuar
    document.getElementById('btnContinuar').addEventListener('click', function () {
        if (markers.partida && markers.destino) {
            tracarRota(markers.partida.coords, markers.destino.coords, () => {
                localStorage.setItem('pontoPartida', JSON.stringify(markers.partida.coords));
                localStorage.setItem('pontoDestino', JSON.stringify(markers.destino.coords));
                window.location.href = 'pagamento.html';
            });
        } else {
            alert('Por favor, selecione os pontos de partida e destino');
        }
    });
});

document.querySelector('.navbar-toggler').addEventListener('click', function () {
    window.location.href = '../index.html';
});