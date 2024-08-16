function displayEquipamentos(data) {
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

        // Adicione o evento de clique para cada botão "Excluir"
        document.querySelectorAll('.delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const equipamentoId = e.target.dataset.id;
                const numeroSerie = e.target.dataset.numeroSerie; // Captura o número de série
                excluirEquipamento(equipamentoId, numeroSerie); // Passa o número de série para a função
            });
        });

        // Adicione o evento de clique para cada botão "Transferir"
        document.querySelectorAll('.transfer').forEach(button => {
            button.addEventListener('click', (e) => {
                const equipamentoId = e.target.dataset.id;
                transferirEquipamento(equipamentoId);
            });
        });

        // Adicione o evento de clique para cada botão "Editar"
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
