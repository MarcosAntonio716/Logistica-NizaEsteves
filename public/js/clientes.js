// src/public/js/clientes.js
document.addEventListener('DOMContentLoaded', async () => {
    const lista = document.getElementById('lista-clientes');
    const inputBusca = document.getElementById('search-client');
    const btnBusca = document.getElementById('btn-search-client');

    // ------- carregar clientes -------
    const carregar = async (filtro = '') => {
        lista.innerHTML = '<p class="text-gray-500">Carregando...</p>';
        try {
            const resp = await fetch('/api/clients');
            if (!resp.ok) throw new Error('Falha ao buscar clientes');
            const clientes = await resp.json();

            // filtro por nome ou cpf/cnpj
            const filtrados = clientes.filter(c =>
                c.fullName.toLowerCase().includes(filtro.toLowerCase()) ||
                (c.cpf_cnpj || '').toLowerCase().includes(filtro.toLowerCase())
            );

            if (filtrados.length === 0) {
                lista.innerHTML = '<p class="text-gray-500">Nenhum cliente encontrado.</p>';
                return;
            }

            lista.innerHTML = '';
            filtrados.forEach(cliente => {
                const item = document.createElement('div');
                item.id = `client-${cliente._id}`;
                item.className = 'p-4 border rounded-md shadow-sm bg-white flex justify-between items-center';

                // formatar endereço
                const a = cliente.address || {};
                const linha1 = [a.street, a.number, a.complement, a.bairro].filter(Boolean).join(', ');
                const linha2 = [a.city, a.state].filter(Boolean).join(' - ');
                const enderecoFmt = [linha1, linha2, a.postalCode ? `CEP: ${a.postalCode}` : null]
                    .filter(Boolean)
                    .join(' • ');

                item.innerHTML = `
                  <div>
                    <p class="font-bold text-gray-800">${cliente.fullName}</p>
                    <p class="text-sm text-gray-600">CPF/CNPJ: ${cliente.cpf_cnpj || '-'}</p>
                    <p class="text-sm text-gray-600">Telefone: ${cliente.phone || '-'}</p>
                    <p class="text-sm text-gray-600">E-mail: ${cliente.email || '-'}</p>
                    <p class="text-sm text-gray-500 italic">Endereço: ${enderecoFmt || '-'}</p>
                  </div>

                  <div class="flex gap-3">
                    <button class="text-blue-600 hover:underline text-sm btn-editar" data-id="${cliente._id}">
                      Editar
                    </button>
                    <button class="text-red-600 hover:underline text-sm btn-remover" data-id="${cliente._id}">
                      Remover
                    </button>
                  </div>

                  <!-- Modal de confirmação -->
                  <div id="modal-${cliente._id}" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 text-center">
                      <div class="mb-4">
                        <i class="fas fa-exclamation-triangle text-red-500 text-4xl"></i>
                      </div>
                      <h2 class="text-lg font-bold mb-2">Remover Cliente</h2>
                      <p class="text-gray-600 mb-6">
                        Deseja remover o cliente <strong>${cliente.fullName}</strong>?<br>
                        Essa ação não pode ser desfeita.
                      </p>
                      <div class="flex justify-center gap-3">
                        <button onclick="closeDeleteModal('${cliente._id}')" 
                                class="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">
                          Cancelar
                        </button>
                        <button onclick="confirmDelete('${cliente._id}')" 
                                class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                `;

                lista.appendChild(item);
            });

        } catch (err) {
            console.error(err);
            lista.innerHTML = '<p class="text-red-500">Erro ao carregar clientes.</p>';
        }
    };

    // ------- excluir cliente -------
    window.openDeleteModal = (id) => {
        document.getElementById(`modal-${id}`).classList.remove('hidden');
    };

    window.closeDeleteModal = (id) => {
        document.getElementById(`modal-${id}`).classList.add('hidden');
    };

    window.confirmDelete = async (id) => {
        try {
            const resp = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
            if (resp.status !== 200 && resp.status !== 204) {
                throw new Error(`Falha ao excluir cliente (${resp.status})`);
            }

            // fecha modal primeiro
            closeDeleteModal(id);

            // depois remove o cliente da lista
            document.getElementById(`client-${id}`)?.remove();

            if (!lista.children.length) {
                lista.innerHTML = '<p class="text-gray-500">Nenhum cliente encontrado.</p>';
            }

            showToast('Cliente removido com sucesso!', 'success');
        } catch (err) {
            console.error(err);
            showToast('Erro ao excluir cliente.', 'error');
        }
    };

    // ------- editar cliente -------
    lista.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-editar')) {
            const id = e.target.dataset.id;
            try {
                const resp = await fetch(`/api/clients/${id}`);
                if (!resp.ok) throw new Error('Falha ao buscar cliente');
                const c = await resp.json();

                // Preenche modal
                document.getElementById('edit-client-id').value = c._id;
                document.getElementById('edit-client-name').value = c.fullName || '';
                document.getElementById('edit-client-cpf').value = c.cpf_cnpj || '';
                document.getElementById('edit-client-phone').value = c.phone || '';
                document.getElementById('edit-client-email').value = c.email || '';
                document.getElementById('edit-client-cep').value = c.address?.postalCode || '';
                document.getElementById('edit-client-street').value = c.address?.street || '';
                document.getElementById('edit-client-number').value = c.address?.number || '';
                document.getElementById('edit-client-bairro').value = c.address?.bairro || '';
                document.getElementById('edit-client-city').value = c.address?.city || '';
                document.getElementById('edit-client-state').value = c.address?.state || '';
                document.getElementById('edit-client-complemento').value = c.address?.complement || '';

                document.getElementById('client-edit-modal').classList.remove('hidden');
            } catch (err) {
                console.error(err);
                showToast('Erro ao carregar cliente para edição.', 'error');
            }
        }

        if (e.target.classList.contains('btn-remover')) {
            const id = e.target.dataset.id;
            openDeleteModal(id);
        }
    });

    // ------- eventos do modal editar -------
    document.getElementById('close-edit-client-btn').addEventListener('click', () => {
        document.getElementById('client-edit-modal').classList.add('hidden');
    });
    document.getElementById('cancel-edit-client-btn').addEventListener('click', () => {
        document.getElementById('client-edit-modal').classList.add('hidden');
    });

    document.getElementById('client-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-client-id').value;

        const payload = {
            fullName: document.getElementById('edit-client-name').value,
            cpf_cnpj: document.getElementById('edit-client-cpf').value || null,
            phone: document.getElementById('edit-client-phone').value || null,
            email: document.getElementById('edit-client-email').value || null,
            address: {
                postalCode: document.getElementById('edit-client-cep').value,
                street: document.getElementById('edit-client-street').value,
                number: document.getElementById('edit-client-number').value,
                bairro: document.getElementById('edit-client-bairro').value,
                city: document.getElementById('edit-client-city').value,
                state: document.getElementById('edit-client-state').value,
                complement: document.getElementById('edit-client-complemento').value || null,
            }
        };

        try {
            const resp = await fetch(`/api/clients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) throw new Error('Falha ao atualizar cliente');

            document.getElementById('client-edit-modal').classList.add('hidden');
            await carregar(inputBusca.value.trim());
            showToast('Cliente atualizado com sucesso!', 'success');
        } catch (err) {
            console.error(err);
            showToast('Erro ao atualizar cliente.', 'error');
        }
    });

    // ------- Toast helper -------
    function showToast(message, type = 'error') {
        const toast = document.getElementById('toast-notification');
        const toastMessage = document.getElementById('toast-message');
        toastMessage.textContent = message;
        toast.className = `fixed top-5 right-5 text-white px-6 py-3 rounded-lg shadow-lg ${type}`;
        toast.style.backgroundColor = type === 'success' ? '#004d40' : '#ef4444';
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }

    // ------- pesquisa -------
    btnBusca.addEventListener('click', () => carregar(inputBusca.value.trim()));
    inputBusca.addEventListener('keyup', e => {
        if (e.key === 'Enter') carregar(inputBusca.value.trim());
    });

    // ------- carrega ao abrir -------
    await carregar();
});
