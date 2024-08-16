import API_BASE_URL from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    setupMovimentacoesPage();
});

function setupMovimentacoesPage() {
    document.getElementById('searchButton').addEventListener('click', buscarMovimentacoes);
    fetchMovimentacoes();
}

function fetchMovimentacoes() {
    fetch(`${API_BASE_URL}/movimentacoes/latest`)
        .then(response => response.json())
        .then(data => displayMovimentacoes(data))
        .catch(error => console.error('Erro ao buscar movimentações:', error));
}

function buscarMovimentacoes() {
    const searchInput = document.getElementById('searchInput').value;

    fetch(`${API_BASE_URL}/movimentacoes/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ searchTerm: searchInput })
    })
    .then(response => response.json())
    .then(data => displayMovimentacoes(data))
    .catch(error => console.error('Erro ao buscar movimentações:', error));
}

function displayMovimentacoes(data) {
    const container = document.getElementById('movimentacoesList');
    container.innerHTML = data.map(movimentacao => `
        <div class="movimentacao-item" data-id="${movimentacao.id}">
            <div class="movimentacao-details">
                <strong>Nome:</strong> ${movimentacao.Nome}<br>
                <strong>Detalhes:</strong> ${movimentacao.Detalhes}<br>
                <strong>Tipo:</strong> ${movimentacao.Tipo}<br>
                <strong>Data:</strong> ${movimentacao.Data}<br>
            </div>
            <div class="movimentacao-actions">
                <button class="delete" data-id="${movimentacao.id}">Excluir</button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const movimentacaoId = e.target.dataset.id;
            excluirMovimentacao(movimentacaoId);
        });
    });
}

function excluirMovimentacao(movimentacaoId) {
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
            fetch(`${API_BASE_URL}/movimentacoes/${movimentacaoId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (response.status === 204) {
                    fetchMovimentacoes();
                    Swal.fire('Excluído!', 'A movimentação foi excluída com sucesso.', 'success');
                } else {
                    Swal.fire('Erro!', 'Ocorreu um erro ao excluir a movimentação.', 'error');
                }
            })
            .catch(error => {
                Swal.fire('Erro!', 'Ocorreu um erro de rede.', 'error');
            });
        }
    });
}
