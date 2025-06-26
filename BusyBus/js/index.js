
const form = document.getElementById('form');

form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const data = {
        email: email,
        password: password,
        request: 'login'
    };

    fetch('controllers/Controller.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        switch (data.status) {
            case 'success':
                Swal.fire({
                    icon: 'success',
                    title: 'Login realizado com sucesso!',
                    showConfirmButton: false, 
                    timer: 2500
                })
                .then(() => {
                    window.location.replace('/BusyBus/views/mapa.html');
                });
                break;
            case 'error':
                if (data.msg == 'Email ou senha incorretos') {
                    const inputs = document.querySelectorAll('.inputDefault');
                    inputs.forEach(input => {
                        input.classList.remove('inputDefault');
                        input.classList.add('inputError');
                        let innerInput = input.querySelector('input');
                        innerInput.addEventListener('input', () => {
                            const inputsFocus = document.querySelectorAll('.inputError');
                            inputsFocus.forEach(input => {
                                input.classList.remove('inputError');
                                input.classList.add('inputDefault');
                            })
                        })
                    })
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro ao entrar na conta. Tente novamente mais tarde!',
                        showConfirmButton: false, 
                        timer: 2500
                    })
                }
        }
    })
    .catch(error => {
        console.log(error)
        Swal.fire({
            icon: 'error',
            title: error,
            showConfirmButton: true
        })
    })
})