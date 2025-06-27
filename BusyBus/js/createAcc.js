
const form = document.getElementById('form');

form.addEventListener('submit', function(event) {
    event.preventDefault();

    const body = document.getElementById('body');
    body.classList.remove('default');
    body.classList.add('load');
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const birthday = document.getElementById('birthday').value;
    
    const data = {
        name: name, 
        email: email,
        password: password,
        birthday: birthday,
        request: 'create'
    };

    fetch('../controllers/Controller.php', {
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
                    title: 'Conta criada com sucesso!',
                    showConfirmButton: false, 
                    timer: 2500
                })
                .then(() => {
                    window.location.replace('../index.html');
                });
                break;
            case 'error':
                if (data.msg == 'Email cadastrado') {
                    body.classList.remove('load');
                    body.classList.add('default');
                    const emailInput = document.getElementById('emailInput');
                    const innerInput = emailInput.querySelector('input');
                    emailInput.classList.remove('inputDefault');
                    emailInput.classList.add('inputError');
                    innerInput.addEventListener('input', () => {
                        emailInput.classList.remove('inputError');
                        emailInput.classList.add('inputDefault');
                    })
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro ao criar conta. Tente novamente mais tarde!',
                        showConfirmButton: false, 
                        timer: 2500
                    })
                    .then(() => {
                        window.location.replace('../index.html');
                    });
                }
        }
    })
    .catch(error => {
        Swal.fire({
            icon: 'error',
            title: 'Erro ao criar conta. Tente novamente mais tarde!',
            showConfirmButton: false, 
            timer: 2500
        })
        .then(() => {
            window.location.replace('../index.html');
        });
    })
})