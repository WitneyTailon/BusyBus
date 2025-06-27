// Verifica se o navegador suporta geolocalização
if (!navigator.geolocation) {
    alert("Seu navegador não suporta geolocalização. Usando localização padrão.");
    initMapWithDefaultLocation();
} else {
    // Tenta obter a localização com timeout de 10 segundos
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            initMapWithPosition(lat, lng);
        },
        (error) => {
            console.error("Erro na geolocalização:", error);
            alert("Não foi possível obter sua localização. Usando localização padrão.");
            initMapWithDefaultLocation();
        },
        { timeout: 10000 }
    );
}

function initMapWithPosition(lat, lng) {
    const map = L.map('map').setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    
    const roundIcon = L.divIcon({
        className: 'round-marker',
        html: `<div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                <img src="../imgs/pfpFoto.jpg" alt="Perfil" style="width: 100%; height: 100%; object-fit: cover;">
            </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });

    L.marker([lat, lng], { icon: roundIcon }).addTo(map);

    const carroIcon = L.divIcon({
        className: '',
        html: `<div style="width: 30px; height: 30px; border-radius: 50%; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                <img src="../imgs/iconCarro.png" alt="Carro" style="width: 100%; height: 100%; object-fit: cover;">
            </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });

    // Adiciona carros em posições específicas
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
}

function initMapWithDefaultLocation() {
    // Localização padrão (Fortaleza)
    const lat = -3.71839;
    const lng = -38.5434;
    const map = L.map('map').setView([lat, lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    
    const roundIcon = L.divIcon({
        className: 'round-marker',
        html: `<div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                <img src="../imgs/pfpFoto.jpg" alt="Perfil" style="width: 100%; height: 100%; object-fit: cover;">
            </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });

    L.marker([lat, lng], { icon: roundIcon }).addTo(map);

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
}

document.querySelector('.buttonBuscar').addEventListener('click', function () {
    window.location.href = 'rota.html';
});
document.querySelector('.navbar-toggler').addEventListener('click', function () {
    window.location.href = '../index.html';
});