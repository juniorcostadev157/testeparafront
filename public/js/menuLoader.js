document.addEventListener('DOMContentLoaded', () => {
    fetch('menu.html')
        .then(response => response.text())
        .then(data => {
            document.querySelector('.menu-container').innerHTML = data;

            // Adiciona evento de logout ao botão "Sair"
            const logoutButton = document.getElementById('logout');
            if (logoutButton) {
                logoutButton.addEventListener('click', () => {
                    firebase.auth().signOut().then(() => {
                        localStorage.removeItem('idToken'); // Remova o token do localStorage
                        window.location.href = 'index.html';
                    }).catch((error) => {
                        console.error('Erro ao fazer logout:', error);
                    });
                });
            }

            // Exibir nome do usuário logado
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    firebase.firestore().collection('Usuarios').doc(user.uid).get().then((doc) => {
                        if (doc.exists) {
                            const userData = doc.data();
                            document.getElementById('userName').textContent = `Nome: ${userData.Nome}`;
                        } else {
                            console.error('Erro ao obter dados do usuário.');
                        }
                    }).catch((error) => {
                        console.error('Erro ao obter dados do usuário:', error);
                    });
                }
            });

            // Chama a função initializePage apenas se ela estiver definida
            if (typeof initializePage === 'function') {
                initializePage();
            }
        })
        .catch(error => console.error('Erro ao carregar o menu:', error));
});

// Certifique-se de que o firebaseConfig.js seja carregado antes do menuLoader.js no HTML
