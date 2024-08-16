import API_BASE_URL from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const idToken = localStorage.getItem('idToken');
    if (!idToken) {
        window.location.href = 'index.html';
    } else {
        firebase.auth().onAuthStateChanged((user) => {
            if (!user) {
                localStorage.removeItem('idToken');
                window.location.href = 'index.html';
            }
        });
    }
    initializePage();
});

const itemsPerPage = 30;
let totalItems = 0;
let allEquipments = [];
let filteredEquipments = [];

function initializePage() {
    setupEventListeners();
}

function setupEventListeners() {
    document.getElementById('searchButton').addEventListener('click', buscarEquipamentos);
    document.getElementById('apagarSelecionados').addEventListener('click', apagarSelecionados);
    document.getElementById('selectAll').addEventListener('change', (event) => {
        const checkboxes = document.querySelectorAll('.equipamento input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.checked = event.target.checked);
    });

    document.getElementById('statusFilter').addEventListener('change', filterEquipments);

    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    document.getElementById('transferirSelecionados').addEventListener('click', transferirSelecionados);
    document.getElementById('receberEquipamentos').addEventListener('click', receberEquipamentos);
}

function buscarEquipamentos() {
    const searchInput = document.getElementById('searchInput').value;
    const searchTerms = searchInput.split('\n').map(term => term.trim()).filter(term => term !== '');

    if (searchTerms.length === 0) {
        toastr.error('Por favor, insira termos de busca.');
        return;
    }

    const container = document.getElementById('equipamentos');
    if (container) {
        container.innerHTML = '';
    }

    fetch(`${API_BASE_URL}/equipments/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('idToken')}`
        },
        body: JSON.stringify({ searchTerms })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao buscar equipamentos');
        }
        return response.json();
    })
    .then(data => {
        if (data.length === 0) {
            toastr.error('Nenhum serial ou destino encontrado');
        } else {
            allEquipments = data;
            totalItems = data.length;
            filterEquipments();
        }
    })
    .catch(error => {
        console.error('Erro ao buscar equipamentos:', error);
        toastr.error('Erro ao buscar equipamentos.');
    });
}

function filterEquipments() {
    const statusFilter = document.getElementById('statusFilter').value;

    if (statusFilter === 'ALL') {
        filteredEquipments = allEquipments;
    } else {
        filteredEquipments = allEquipments.filter(equip => equip.Estado === statusFilter);
    }

    displayEquipments(filteredEquipments.slice(0, itemsPerPage));
    setupPagination(filteredEquipments);
    document.getElementById('equipCount').textContent = filteredEquipments.length;
}

function displayEquipments(data) {
    const container = document.getElementById('equipamentos');
    if (container) {
        container.innerHTML = data.map(equipamento => `
            <div class="equipamento" data-id="${equipamento.id}" data-tipo="${equipamento.Tipo}" data-tecnologia="${equipamento.Tecnologia}" data-numero-serie="${equipamento.NumeroSerie}" data-estado="${equipamento.Estado}" data-modelo="${equipamento.Modelo}" data-codigo-material-sap="${equipamento.CodigoMaterialSAP}" data-data-ultima-alteracao="${equipamento.DataUltimaAlteracao}" data-destino="${equipamento.Destino}">
                <div class="equipamento-details">
                    <input type="checkbox">
                    <div>
                        <strong>Tipo:</strong> ${equipamento.Tipo}<br>
                        <strong>Tecnologia:</strong> ${equipamento.Tecnologia}<br>
                        <strong>Numero Serie:</strong> ${equipamento.NumeroSerie}<br>
                        <strong>Estado:</strong> ${equipamento.Estado}<br>
                        <strong>Modelo:</strong> ${equipamento.Modelo} ◉ ${equipamento.CodigoMaterialSAP} ◉ ${equipamento.DataUltimaAlteracao}<br>
                        <strong>Destino:</strong> ${equipamento.Destino}<br>
                    </div>
                </div>
                <div class="equipamento-actions">
                    <button class="transfer" data-id="${equipamento.id}">Transferir</button>
                    <button class="edit" data-id="${equipamento.id}">Editar</button>
                    <button class="delete" data-id="${equipamento.id}" data-numero-serie="${equipamento.NumeroSerie}">Excluir</button>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const equipamentoId = e.target.dataset.id;
                const numeroSerie = e.target.dataset.numeroSerie;
                excluirEquipamento(equipamentoId, numeroSerie);
            });
        });

        document.querySelectorAll('.transfer').forEach(button => {
            button.addEventListener('click', (e) => {
                const equipamentoId = e.target.dataset.id;
                transferirEquipamento(equipamentoId);
            });
        });

        document.querySelectorAll('.edit').forEach(button => {
            button.addEventListener('click', (e) => {
                const equipamentoElement = button.closest('.equipamento');
                const equipamento = {
                    id: equipamentoElement.dataset.id,
                    Tipo: equipamentoElement.dataset.tipo,
                    Tecnologia: equipamentoElement.dataset.tecnologia,
                    Estado: equipamentoElement.dataset.estado,
                    Modelo: equipamentoElement.dataset.modelo,
                    CodigoMaterialSAP: equipamentoElement.dataset.codigoMaterialSap,
                    DataUltimaAlteracao: equipamentoElement.dataset.dataUltimaAlteracao,
                    Destino: equipamentoElement.dataset.destino
                };
                editarEquipamento(equipamento);
            });
        });
    }
}

function setupPagination(data) {
    const pagination = document.querySelector('.pagination');
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const maxPagesToShow = 10;
    let currentPage = 1;

    function renderPagination() {
        let startPage = Math.max(currentPage - Math.floor(maxPagesToShow / 2), 1);
        let endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

        if (endPage - startPage < maxPagesToShow) {
            startPage = Math.max(endPage - maxPagesToShow + 1, 1);
        }

        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        pagination.innerHTML = `
            <span id="previousPage">«</span>
            ${pages.map(page => `<span class="page-number ${page === currentPage ? 'active' : ''}">${page}</span>`).join('')}
            <span id="nextPage">»</span>
        `;

        document.querySelectorAll('.page-number').forEach(page => {
            page.addEventListener('click', (e) => {
                currentPage = parseInt(e.target.textContent);
                const start = (currentPage - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                displayEquipments(data.slice(start, end));
                renderPagination();
            });
        });

        document.getElementById('previousPage').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                const start = (currentPage - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                displayEquipments(data.slice(start, end));
                renderPagination();
            }
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                const start = (currentPage - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                displayEquipments(data.slice(start, end));
                renderPagination();
            }
        });
    }

    renderPagination();
}

function excluirEquipamento(equipamentoId, numeroSerie) {
    Swal.fire({
        title: 'Tem certeza?',
        text: `Você está prestes a excluir o equipamento com o número de série ${numeroSerie}. Você não poderá reverter esta ação!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir!'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`${API_BASE_URL}/equipments/${equipamentoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('idToken')}`
                }
            })
            .then(response => {
                if (response.status === 204) {
                    buscarEquipamentos();
                    Swal.fire('Excluído!', `O equipamento com o número de série ${numeroSerie} foi excluído com sucesso.`, 'success');
                } else {
                    Swal.fire('Erro!', 'Ocorreu um erro ao excluir o equipamento.', 'error');
                }
            })
            .catch(error => {
                Swal.fire('Erro!', 'Ocorreu um erro de rede.', 'error');
            });
        }
    });
}

function transferirEquipamento(equipamentoId) {
    Swal.fire({
        title: 'Transferir Equipamento',
        html: `
            <input type="text" id="loginSearch" class="swal2-input" placeholder="Digite o login" style="text-transform: uppercase;">
            <div id="loginSuggestions" style="text-align: center;"></div>
            <p id="nomeTecnico" style="text-align: center;"></p>
        `,
        showCancelButton: true,
        confirmButtonText: 'Enviar Solicitação',
        preConfirm: () => {
            const login = document.getElementById('loginSearch').value;
            if (!login) {
                Swal.showValidationMessage('Por favor, digite o login');
                return false;
            }
            const nomeTecnico = document.getElementById('nomeTecnico').innerText;
            if (nomeTecnico === 'Login do técnico não encontrado') {
                Swal.showValidationMessage('Login do técnico não encontrado');
                return false;
            }
            return login;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const login = result.value;
            const idToken = localStorage.getItem('idToken');
            const idAlmoxarife = firebase.auth().currentUser.uid;
            const dataFormatada = formatarData(new Date());
            fetch(`${API_BASE_URL}/solicitacoes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ equipamentos: [equipamentoId], id_almoxarife: idAlmoxarife, login_tecnico: login, status: 'Pendente', data: dataFormatada })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao enviar solicitação');
                }
                return response.json();
            })
            .then(data => {
                Swal.fire('Solicitação Enviada!', 'A solicitação de transferência foi enviada com sucesso.', 'success');
                buscarEquipamentos();
            })
            .catch(error => {
                console.error('Erro ao enviar solicitação:', error);
                Swal.fire('Erro!', 'Ocorreu um erro ao enviar a solicitação.', 'error');
            });
        }
    });

    document.getElementById('loginSearch').addEventListener('input', buscarLogins);
}

function transferirSelecionados() {
    const selectedEquipamentos = [];
    document.querySelectorAll('.equipamento input[type="checkbox"]:checked').forEach(checkbox => {
        const equipamentoElement = checkbox.closest('.equipamento');
        const equipamentoId = equipamentoElement.dataset.id;
        selectedEquipamentos.push(equipamentoId);
    });

    if (selectedEquipamentos.length === 0) {
        toastr.error('Nenhum equipamento selecionado');
        return;
    }

    Swal.fire({
        title: 'Transferir Equipamentos',
        html: `
            <input type="text" id="loginSearch" class="swal2-input" placeholder="Digite o login" style="text-transform: uppercase;">
            <div id="loginSuggestions" style="text-align: center;"></div>
            <p id="nomeTecnico" style="text-align: center;"></p>
        `,
        showCancelButton: true,
        confirmButtonText: 'Enviar Solicitação',
        preConfirm: () => {
            const login = document.getElementById('loginSearch').value;
            if (!login) {
                Swal.showValidationMessage('Por favor, digite o login');
                return false;
            }
            const nomeTecnico = document.getElementById('nomeTecnico').innerText;
            if (nomeTecnico === 'Login do técnico não encontrado') {
                Swal.showValidationMessage('Login do técnico não encontrado');
                return false;
            }
            return login;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const login = result.value;
            const idToken = localStorage.getItem('idToken');
            const idAlmoxarife = firebase.auth().currentUser.uid;
            const dataFormatada = formatarData(new Date());
            fetch(`${API_BASE_URL}/solicitacoes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ equipamentos: selectedEquipamentos, id_almoxarife: idAlmoxarife, login_tecnico: login, status: 'Pendente', data: dataFormatada })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao enviar solicitação');
                }
                return response.json();
            })
            .then(data => {
                Swal.fire('Solicitação Enviada!', 'As solicitações de transferência foram enviadas com sucesso.', 'success');
                buscarEquipamentos();
            })
            .catch(error => {
                console.error('Erro ao enviar solicitação:', error);
                Swal.fire('Erro!', 'Ocorreu um erro ao enviar a solicitação.', 'error');
            });
        }
    });

    document.getElementById('loginSearch').addEventListener('input', buscarLogins);
}

function buscarLogins(event) {
    const searchTerm = event.target.value.trim().toUpperCase();
    if (searchTerm.length < 2) {
        document.getElementById('loginSuggestions').innerHTML = '';
        document.getElementById('nomeTecnico').innerText = '';
        return;
    }

    verificarLoginTecnico(searchTerm)
        .then(nome => {
            document.getElementById('nomeTecnico').innerText = `Nome: ${nome}`;
        })
        .catch(() => {
            document.getElementById('nomeTecnico').innerText = 'Login do técnico não encontrado';
        });
}

function verificarLoginTecnico(loginTecnico) {
    return fetch(`${API_BASE_URL}/verificar-login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ loginTecnico })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Login não encontrado');
        }
        return response.json();
    })
    .then(data => data.nome);
}

function editarEquipamento(equipamento) {
    Swal.fire({
        title: 'Editar Equipamento',
        html: `
            <input type="text" id="editTipo" class="swal2-input" value="${equipamento.Tipo.toUpperCase()}">
            <input type="text" id="editTecnologia" class="swal2-input" value="${equipamento.Tecnologia.toUpperCase()}">
            <input type="text" id="editEstado" class="swal2-input" value="${equipamento.Estado.toUpperCase()}">
            <input type="text" id="editModelo" class="swal2-input" value="${equipamento.Modelo.toUpperCase()}">
            <input type="text" id="editCodigoMaterialSAP" class="swal2-input" value="${equipamento.CodigoMaterialSAP.toUpperCase()}">
            <input type="text" id="editDestino" class="swal2-input" value="${equipamento.Destino.toUpperCase()}">
        `,
        showCancelButton: true,
        confirmButtonText: 'Salvar',
        preConfirm: () => {
            const tipo = document.getElementById('editTipo').value.toUpperCase();
            const tecnologia = document.getElementById('editTecnologia').value.toUpperCase();
            const estado = document.getElementById('editEstado').value.toUpperCase();
            const modelo = document.getElementById('editModelo').value.toUpperCase();
            const codigoMaterialSAP = document.getElementById('editCodigoMaterialSAP').value.toUpperCase();
            const destino = document.getElementById('editDestino').value.toUpperCase();

            return { Tipo: tipo, Tecnologia: tecnologia, Estado: estado, Modelo: modelo, CodigoMaterialSAP: codigoMaterialSAP, Destino: destino };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { Tipo, Tecnologia, Estado, Modelo, CodigoMaterialSAP, Destino } = result.value;

            // Validação do campo "Destino"
            const destinoOriginal = equipamento.Destino.toUpperCase();
            const destinoFinal = Destino === '' ? '' : destinoOriginal;

            const dataToSend = {
                Tipo: Tipo,
                Tecnologia: Tecnologia,
                Estado: Estado,
                Modelo: Modelo,
                CodigoMaterialSAP: CodigoMaterialSAP,
                Destino: destinoFinal
            };

            

            fetch(`${API_BASE_URL}/equipments/${equipamento.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('idToken')}`
                },
                body: JSON.stringify(dataToSend)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao atualizar equipamento');
                }
                return response.json();
            })
            .then(data => {
                Swal.fire('Atualizado!', 'O equipamento foi atualizado com sucesso.', 'success');
                buscarEquipamentos();
            })
            .catch(error => {
                console.error('Erro ao atualizar equipamento:', error);
                Swal.fire('Erro!', 'Ocorreu um erro ao atualizar o equipamento.', 'error');
            });
        }
    });
}



function apagarSelecionados() {
    const selectedEquipamentos = [];
    document.querySelectorAll('.equipamento input[type="checkbox"]:checked').forEach(checkbox => {
        const equipamentoElement = checkbox.closest('.equipamento');
        const equipamentoId = equipamentoElement.dataset.id;
        selectedEquipamentos.push(equipamentoId);
    });

    if (selectedEquipamentos.length === 0) {
        toastr.error('Nenhum equipamento selecionado');
        return;
    }

    Swal.fire({
        title: 'Tem certeza?',
        text: `Você está prestes a excluir ${selectedEquipamentos.length} equipamentos. Você não poderá reverter esta ação!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir!'
    }).then((result) => {
        if (result.isConfirmed) {
            const idToken = localStorage.getItem('idToken');
            Promise.all(selectedEquipamentos.map(equipamentoId => {
                return fetch(`${API_BASE_URL}/equipments/${equipamentoId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });
            }))
            .then(responses => {
                const allSuccessful = responses.every(response => response.status === 204);
                if (allSuccessful) {
                    buscarEquipamentos();
                    Swal.fire('Excluídos!', 'Os equipamentos selecionados foram excluídos com sucesso.', 'success');
                } else {
                    Swal.fire('Erro!', 'Ocorreu um erro ao excluir alguns equipamentos.', 'error');
                }
            })
            .catch(error => {
                Swal.fire('Erro!', 'Ocorreu um erro de rede.', 'error');
            });
        }
    });
}

function formatarData(data) {
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const ano = data.getFullYear();
    const horas = data.getHours().toString().padStart(2, '0');
    const minutos = data.getMinutes().toString().padStart(2, '0');
    const segundos = data.getSeconds().toString().padStart(2, '0');

    return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
}
