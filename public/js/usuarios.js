import API_BASE_URL from './config.js';
import './firebaseConfig.js'; // Importa a configuração do Firebase

document.addEventListener('DOMContentLoaded', () => {
    const idToken = localStorage.getItem('idToken');
    if (!idToken) {
        window.location.href = 'index.html';
    } else {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                firebase.firestore().collection('Usuarios').doc(user.uid).get().then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        if (userData.Tipo === 'ALMOX' || userData.Tipo === 'ADMIN') {
                            initializePage(userData.Tipo);
                        } else {
                            toastr.error('Acesso negado. Você não tem permissão para acessar esta página.');
                            firebase.auth().signOut().then(() => {
                                window.location.href = 'index.html';
                            });
                        }
                    } else {
                        toastr.error('Erro ao verificar o tipo de usuário.');
                        firebase.auth().signOut().then(() => {
                            window.location.href = 'index.html';
                        });
                    }
                }).catch((error) => {
                    toastr.error('Erro ao verificar o tipo de usuário.');
                    firebase.auth().signOut().then(() => {
                        window.location.href = 'index.html';
                    });
                });
            } else {
                window.location.href = 'index.html';
            }
        });
    }
});

let cleaveInstance;

function initializeCleave() {
    if (!cleaveInstance) {
        cleaveInstance = new Cleave('#userPhoneInput', {
            phone: true,
            phoneRegionCode: 'BR',
            prefix: '+55',
            delimiters: [' ', ' ', '-'],
            blocks: [3, 2, 5, 4],
            numericOnly: true
        });
        document.getElementById('userPhoneInput').classList.add('cleave-initialized');
    }
}

function initializePage(userType) {
    fetchUsers(userType);

    const modal = document.getElementById('userModal');
    const btn = document.getElementById('criarUsuarioBtn');
    const span = document.getElementsByClassName('close-btn')[0];
    const searchBtn = document.getElementById('searchUserBtn');

    if (userType === 'ADMIN') {
        btn.style.display = 'block';
        btn.onclick = function () {
            modal.style.display = 'flex';
            initializeCleave();
            initializeEmail();
        };
    } else if (btn) {
        btn.style.display = 'none';
    }

    if (span) {
        span.onclick = function () {
            modal.style.display = 'none';
        };
    }

    if (searchBtn) {
        searchBtn.onclick = function () {
            const searchType = document.getElementById('searchType').value;
            const searchValue = document.getElementById('searchUserInput').value.trim();
            fetchUsers(userType, searchValue, searchType);
        };
    }

    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }

    if (userType === 'ADMIN') {
        document.getElementById('createUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            createUser(userType);
        });

        const togglePassword = document.querySelector('.toggle-password');
        const passwordInput = document.getElementById('userPasswordInput');

        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                togglePassword.classList.toggle('fa-eye');
                togglePassword.classList.toggle('fa-eye-slash');
            });
        }
    }
}

function initializeEmail() {
    const emailInput = document.getElementById('userEmailInput');
    if (emailInput && !emailInput.value.includes('@')) {
        emailInput.value = '@seven.com';
    }
}

function fetchUsers(userType, searchValue = '', searchType = 'Nome') {
    const userContainer = document.getElementById('userContainer');
    userContainer.innerHTML = '';

    let query = firebase.firestore().collection('Usuarios');
    if (searchValue) {
        query = query.where(searchType, '>=', searchValue).where(searchType, '<=', searchValue + '\uf8ff');
    }

    query.get().then((querySnapshot) => {
        userContainer.innerHTML = '';
        let userCount = 0;

        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            const userItem = document.createElement('div');
            userItem.classList.add('user-item');
            userItem.innerHTML = `
                <div class="user-info">
                    <strong>Nome:</strong> ${userData.Nome}<br>
                    <strong>Email:</strong> ${userData.Email}<br>
                    <strong>Login:</strong> ${userData.Login}<br>
                    <strong>Tipo:</strong> ${userData.Tipo}
                </div>
                <div class="user-actions">
                    ${userType === 'ADMIN' ? `<button class="edit-btn" data-id="${doc.id}">Editar</button>` : ''}
                    ${userType === 'ADMIN' ? `<button class="delete-btn" data-id="${doc.id}">Excluir</button>` : ''}
                    ${userType === 'ADMIN' ? `<button class="generate-totp-btn" data-id="${doc.id}">Gerar TOTP</button>` : ''}
                </div>
            `;
            userContainer.appendChild(userItem);
            userCount++;
        });

        document.getElementById('userCount').textContent = userCount;

        if (userType === 'ADMIN') {
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const userId = e.target.dataset.id;
                    // Implement edit user functionality here
                });
            });

            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const userId = e.target.dataset.id;
                    deleteUser(userId);
                });
            });

            document.querySelectorAll('.generate-totp-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const userId = e.target.dataset.id;
                    Swal.fire({
                        title: 'Deseja gerar uma chave para este técnico?',
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Sim',
                        cancelButtonText: 'Não'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            generateTotp(userId);
                        }
                    });
                });
            });
        }
    }).catch((error) => {
        toastr.error('Erro ao buscar usuários.');
    });
}

let createUserInProgress = false;

function createUser(userType) {
    if (createUserInProgress) return;
    createUserInProgress = true;

    // Exibir a tela de carregamento
    document.getElementById('loadingOverlay').style.display = 'flex';

    const nameInput = document.getElementById('userNameInput');
    const emailInput = document.getElementById('userEmailInput');
    const passwordInput = document.getElementById('userPasswordInput');
    const typeInput = document.getElementById('userTypeInput');
    const loginInput = document.getElementById('userLoginInput');
    const phoneInput = document.getElementById('userPhoneInput');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';
    const type = typeInput ? typeInput.value : '';
    const login = loginInput ? loginInput.value.trim().toUpperCase() : '';
    let phone = phoneInput ? phoneInput.value.replace(/\D/g, '') : '';

    if (!name || !email || !password || !type || !login || !phone) {
        toastr.error('Por favor, preencha todos os campos.');
        createUserInProgress = false;
        document.getElementById('loadingOverlay').style.display = 'none';
        return;
    }

    if (phone.length !== 13) {
        toastr.error('Telefone inválido. O formato correto é (99) 99999-9999.');
        createUserInProgress = false;
        document.getElementById('loadingOverlay').style.display = 'none';
        return;
    }

    if (!phone.startsWith('55')) {
        phone = `55${phone}`;
    }
    phone = `+${phone}`;

    firebase.firestore().collection('Usuarios').where('Email', '==', email).get().then((querySnapshotEmail) => {
        if (!querySnapshotEmail.empty) {
            toastr.error('Email já existe. Por favor, escolha outro email.');
            createUserInProgress = false;
            document.getElementById('loadingOverlay').style.display = 'none';
        } else {
            const loginCheckPromise = type === 'TECNICO' 
                ? firebase.firestore().collection('Usuarios').where('Login', '==', login).get()
                : Promise.resolve({ empty: true });

            loginCheckPromise.then((querySnapshotLogin) => {
                if (!querySnapshotLogin.empty) {
                    toastr.error('Login já existe. Por favor, escolha outro login.');
                    createUserInProgress = false;
                    document.getElementById('loadingOverlay').style.display = 'none';
                } else {
                    firebase.auth().createUserWithEmailAndPassword(email, password)
                        .then((userCredential) => {
                            const userId = userCredential.user.uid;

                            firebase.firestore().collection('Usuarios').doc(userId).set({
                                Nome: name,
                                Email: email,
                                Tipo: type,
                                Login: login,
                                Senha: password,
                                Telefone: phone
                            }).then(() => {
                                toastr.success('Usuário criado com sucesso!');
                                document.getElementById('userModal').style.display = 'none';
                                document.getElementById('createUserForm').reset();
                                fetchUsers(userType);
                                createUserInProgress = false;
                                document.getElementById('loadingOverlay').style.display = 'none';
                            }).catch((error) => {
                                toastr.error('Erro ao criar usuário no Firestore.');
                                createUserInProgress = false;
                                document.getElementById('loadingOverlay').style.display = 'none';
                            });
                        })
                        .catch((error) => {
                            toastr.error('Erro ao criar usuário no Authentication.');
                            createUserInProgress = false;
                            document.getElementById('loadingOverlay').style.display = 'none';
                        });
                }
            }).catch((error) => {
                toastr.error('Erro ao verificar login.');
                createUserInProgress = false;
                document.getElementById('loadingOverlay').style.display = 'none';
            });
        }
    }).catch((error) => {
        toastr.error('Erro ao verificar email.');
        createUserInProgress = false;
        document.getElementById('loadingOverlay').style.display = 'none';
    });
}

function deleteUser(userId) {
    Swal.fire({
        title: 'Tem certeza?',
        text: 'Você não poderá reverter esta ação!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir!'
    }).then((result) => {
        if (result.isConfirmed) {
            firebase.firestore().collection('Usuarios').doc(userId).delete().then(() => {
                toastr.success('Usuário excluído com sucesso!');
                fetchUsers();
            }).catch((error) => {
                toastr.error('Erro ao excluir usuário.');
            });
        }
    });
}

function generateTotp(userId) {
    firebase.firestore().collection('Usuarios').doc(userId).get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            const requestUrl = `${API_BASE_URL}/generate-totp`;

            fetch(requestUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId })
            }).then(response => {
                return response.json();
            }).then(data => {
                if (data.secret && data.qrCodeUrl) {
                    Swal.fire({
                        title: 'Chave TOTP Gerada',
                        html: `Use o código ou escaneie o QR Code:<br><strong>${data.secret}</strong><br><img src="${data.qrCodeUrl}" alt="QR Code">`,
                        icon: 'success'
                    });
                } else {
                    throw new Error('Erro ao gerar TOTP');
                }
            }).catch((error) => {
                toastr.error('Erro ao gerar TOTP.');
            });
        } else {
            toastr.error('Usuário não encontrado.');
        }
    }).catch((error) => {
        toastr.error('Erro ao buscar usuário.');
    });
}
