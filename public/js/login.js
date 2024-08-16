import API_BASE_URL from './config.js';

window.login = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        toastr.error('Por favor, preencha todos os campos.');
        return;
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login bem-sucedido
            const user = userCredential.user;
            return user.getIdToken().then((idToken) => {
                return { idToken, uid: user.uid };
            });
        })
        .then(({ idToken, uid }) => {
            localStorage.setItem('idToken', idToken);
            return firebase.firestore().collection('Usuarios').doc(uid).get();
        })
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                if (userData.Tipo === 'ALMOX' || userData.Tipo === 'ADMIN') {
                    window.location.href = 'produtos.html';
                } else {
                    toastr.error('Acesso negado. Você não tem permissão para acessar este sistema.');
                    firebase.auth().signOut();
                }
            } else {
                toastr.error('Erro ao verificar o tipo de usuário.');
                firebase.auth().signOut();
            }
        })
        .catch((error) => {
            toastr.error('Email ou senha incorretos. Tente novamente.');
            console.error('Erro ao fazer login:', error);
        });
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('loginButton').addEventListener('click', login);
    document.getElementById('password').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            login();
        }
    });
    document.getElementById('email').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            login();
        }
    });

    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');

    togglePassword.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            togglePassword.classList.remove('fa-eye');
            togglePassword.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            togglePassword.classList.remove('fa-eye-slash');
            togglePassword.classList.add('fa-eye');
        }
    });
});
