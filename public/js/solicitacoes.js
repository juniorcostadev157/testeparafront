import API_BASE_URL from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    carregarSolicitacoes();
    document.getElementById('statusFilter').addEventListener('change', carregarSolicitacoes);
});

function carregarSolicitacoes() {
    const container = document.getElementById('solicitacoesList');
    const statusFilter = document.getElementById('statusFilter').value;

    if (container) {
        fetch(`${API_BASE_URL}/solicitacoes`)
            .then(response => response.json())
            .then(data => {
                let solicitacoesFiltradas = data;
                if (statusFilter !== 'Todas') {
                    solicitacoesFiltradas = data.filter(solicitacao => solicitacao.status === statusFilter);
                }
                displaySolicitacoes(solicitacoesFiltradas);
            })
            .catch(error => console.error('Erro ao carregar solicitações:', error));
    }
}

function displaySolicitacoes(data) {
    const container = document.getElementById('solicitacoesList');
    if (container) {
        container.innerHTML = data.map(solicitacao => `
            <div class="solicitacao-item" data-id="${solicitacao.id}">
                <div class="solicitacao-details">
                    <strong>Equipamentos:</strong> ${solicitacao.equipamentos.map(equip => equip.split(' - ').join(' - ')).join(', ')}<br>
                    <strong>Data:</strong> ${(solicitacao.data)}<br>
                    <strong>Solicitante:</strong> ${solicitacao.nome_almoxarife || 'Desconhecido'}<br>
                    <strong>Destinatário:</strong> ${solicitacao.nome_tecnico || solicitacao.login_tecnico}<br>
                    <strong>Status:</strong> ${solicitacao.status}<br>
                </div>
                <div class="solicitacao-actions">
                    ${solicitacao.status !== 'Aceita' ? `<button class="cancelar" data-id="${solicitacao.id}">Cancelar</button>` : ''}
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.cancelar').forEach(button => {
            button.addEventListener('click', (e) => {
                const solicitacaoId = e.target.dataset.id;
                Swal.fire({
                    title: 'Você tem certeza?',
                    text: 'Você realmente deseja cancelar esta solicitação?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sim, cancelar!',
                    cancelButtonText: 'Não, manter'
                }).then((result) => {
                    if (result.isConfirmed) {
                        cancelarSolicitacao(solicitacaoId);
                    }
                });
            });
        });
    }
}

function cancelarSolicitacao(solicitacaoId) {
    const idToken = localStorage.getItem('idToken');

    fetch(`${API_BASE_URL}/solicitacoes/${solicitacaoId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        }
    })
    .then(response => {
        if (response.ok) {
            Swal.fire('Cancelado!', 'A solicitação foi cancelada com sucesso.', 'success');
            carregarSolicitacoes();
        } else {
            Swal.fire('Erro!', 'Ocorreu um erro ao cancelar a solicitação.', 'error');
        }
    })
    .catch(() => {
        Swal.fire('Erro!', 'Ocorreu um erro de rede.', 'error');
    });
}
