// src/public/js/embalagens.js
document.addEventListener('DOMContentLoaded', async () => {
    const lista = document.getElementById('lista-embalagens');

    // ------- carregar embalagens -------
    const carregar = async () => {
        lista.innerHTML = '<p class="text-gray-500">Carregando...</p>';
        try {
            const resp = await fetch('/api/packages');
            if (!resp.ok) throw new Error('Falha ao buscar embalagens');
            const embalagens = await resp.json();

            if (!embalagens.length) {
                lista.innerHTML = '<p class="text-gray-500">Nenhuma embalagem cadastrada.</p>';
                return;
            }

            lista.innerHTML = '';
            embalagens.forEach(pkg => {
                const item = document.createElement('div');
                item.id = `package-${pkg._id}`;
                item.className = 'p-4 border rounded-md shadow-sm bg-white flex justify-between items-center';

                item.innerHTML = `
          <div>
            <p class="font-bold text-gray-800">${pkg.name}</p>
            <p class="text-sm text-gray-600">Peso: ${pkg.weight} kg</p>
            <p class="text-sm text-gray-600">Dimensões: ${pkg.dimensions.length} x ${pkg.dimensions.width} x ${pkg.dimensions.height} cm</p>
          </div>

          <div class="flex gap-3">
            <button class="text-blue-600 hover:underline text-sm btn-editar-pkg" data-id="${pkg._id}">Editar</button>
            <button class="text-red-600 hover:underline text-sm btn-remover-pkg" data-id="${pkg._id}">Remover</button>
          </div>

          <!-- Modal de confirmação -->
          <div id="modal-pkg-${pkg._id}" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 text-center">
              <h2 class="text-lg font-bold mb-2">Remover Embalagem</h2>
              <p class="text-gray-600 mb-6">Deseja remover <strong>${pkg.name}</strong>?</p>
              <div class="flex justify-center gap-3">
                <button onclick="closeDeleteModalPkg('${pkg._id}')"
                        class="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">Cancelar</button>
                <button onclick="confirmDeletePkg('${pkg._id}')"
                        class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Remover</button>
              </div>
            </div>
          </div>
        `;
                lista.appendChild(item);
            });
        } catch (err) {
            console.error(err);
            lista.innerHTML = '<p class="text-red-500">Erro ao carregar embalagens.</p>';
        }
    };

    // ------- excluir embalagem -------
    window.openDeleteModalPkg = (id) => {
        document.getElementById(`modal-pkg-${id}`).classList.remove('hidden');
    };
    window.closeDeleteModalPkg = (id) => {
        const modal = document.getElementById(`modal-pkg-${id}`);
        if (modal) modal.classList.add('hidden');
    };
    window.confirmDeletePkg = async (id) => {
        try {
            const resp = await fetch(`/api/packages/${id}`, { method: 'DELETE' });
            if (!resp.ok) throw new Error('Falha ao excluir embalagem');
            closeDeleteModalPkg(id);
            document.getElementById(`package-${id}`)?.remove();
            if (!lista.children.length) {
                lista.innerHTML = '<p class="text-gray-500">Nenhuma embalagem cadastrada.</p>';
            }
            showToast('Embalagem removida com sucesso!', 'success');
        } catch (err) {
            console.error(err);
            showToast('Erro ao excluir embalagem.', 'error');
        }
    };

    // ------- editar embalagem -------
    lista.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-editar-pkg')) {
            const id = e.target.dataset.id;
            try {
                const resp = await fetch(`/api/packages/${id}`);
                if (!resp.ok) throw new Error('Falha ao buscar embalagem');
                const pkg = await resp.json();

                // Preenche modal
                document.getElementById('edit-package-id').value = pkg._id;
                document.getElementById('edit-package-name').value = pkg.name;
                document.getElementById('edit-package-weight').value = pkg.weight;
                document.getElementById('edit-package-height').value = pkg.dimensions.height;
                document.getElementById('edit-package-width').value = pkg.dimensions.width;
                document.getElementById('edit-package-length').value = pkg.dimensions.length;

                document.getElementById('package-edit-modal').classList.remove('hidden');
            } catch (err) {
                console.error(err);
                showToast('Erro ao carregar embalagem para edição.', 'error');
            }
        }
        if (e.target.classList.contains('btn-remover-pkg')) {
            const id = e.target.dataset.id;
            openDeleteModalPkg(id);
        }
    });

    // fechar modal de edição
    document.getElementById('cancel-edit-package-btn').addEventListener('click', () => {
        document.getElementById('package-edit-modal').classList.add('hidden');
    });

    // salvar edição
    document.getElementById('package-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-package-id').value;
        const payload = {
            name: document.getElementById('edit-package-name').value,
            weight: parseFloat(document.getElementById('edit-package-weight').value),
            dimensions: {
                height: parseFloat(document.getElementById('edit-package-height').value),
                width: parseFloat(document.getElementById('edit-package-width').value),
                length: parseFloat(document.getElementById('edit-package-length').value),
            }
        };

        try {
            const resp = await fetch(`/api/packages/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) throw new Error('Erro ao atualizar embalagem');
            document.getElementById('package-edit-modal').classList.add('hidden');
            await carregar();
            showToast('Embalagem atualizada com sucesso!', 'success');
        } catch (err) {
            console.error(err);
            showToast('Erro ao atualizar embalagem.', 'error');
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

    // ------- carrega ao abrir -------
    await carregar();
});
