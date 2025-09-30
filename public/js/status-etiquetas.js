// src/public/js/status-etiquetas.js
document.addEventListener('DOMContentLoaded', async () => {
  const statusList = document.getElementById('lista-status-etiquetas');

  const carregar = async () => {
    statusList.innerHTML = '<p class="text-gray-500">Carregando...</p>';

    try {
      const resp = await fetch('/api/shipments');
      if (!resp.ok) throw new Error('Falha ao buscar etiquetas');
      const data = await resp.json(); // { items, total, page, limit, pages }
      const etiquetas = Array.isArray(data.items) ? data.items : [];

      if (etiquetas.length === 0) {
        statusList.innerHTML = '<p class="text-gray-500">Nenhuma etiqueta encontrada.</p>';
        return;
      }

      statusList.innerHTML = '';
      etiquetas.forEach((etiqueta) => {
        const cor =
          etiqueta.status === 'pago' ? 'bg-blue-500' :
            etiqueta.status === 'aguardando_pagamento' ? 'bg-yellow-400' :
              etiqueta.status === 'aguardando_envio' ? 'bg-orange-500' :
                etiqueta.status === 'enviado' ? 'bg-green-500' : 'bg-gray-400';

        const item = document.createElement('div');
        item.id = `ship-${etiqueta._id}`;
        item.className = 'p-4 border rounded-md shadow-sm bg-white flex justify-between items-center';

        item.innerHTML = `
          <div>
            <p class="font-bold text-gray-800">${etiqueta.nomeCliente}</p>
            <p class="text-sm text-gray-600">Transportadora: ${etiqueta.transportadora}</p>
            <p class="text-sm text-gray-500 italic">Origem: ${etiqueta.origem || 'Desconhecida'}</p>
            <p class="text-sm text-gray-600">Cód. Rastreio: 
              <span class="font-mono text-gray-700">${etiqueta.codigoRastreio}</span>
            </p>
            <p class="text-sm mt-1">R$ ${Number(etiqueta.preco).toFixed(2)}</p>
          </div>

          <div class="text-right space-y-2">
            <span class="inline-block px-2 py-1 text-xs text-white rounded-full ${cor}">
              ${String(etiqueta.status).replace('_', ' ')}
            </span>
            <div class="flex items-center gap-3 justify-end">
              <button
                class="text-blue-600 hover:underline text-sm"
                data-track="${etiqueta.codigoRastreio}">Rastrear</button>

              <!-- Botão remover abre modal -->
              <button
                class="text-red-600 hover:underline text-sm btn-remover"
                data-id="${etiqueta._id}"
                data-nome="${etiqueta.nomeCliente}">Remover</button>
            </div>
          </div>

          <!-- Modal de confirmação -->
          <div id="modal-${etiqueta._id}" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 text-center">
              <div class="mb-4">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl"></i>
              </div>
              <h2 class="text-lg font-bold mb-2">Remover Etiqueta</h2>
              <p class="text-gray-600 mb-6">
                Deseja remover a etiqueta de <strong>${etiqueta.nomeCliente}</strong>?<br>
                Essa ação não pode ser desfeita.
              </p>
              <div class="flex justify-center gap-3">
                <button onclick="closeDeleteModal('${etiqueta._id}')" 
                        class="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">
                  Cancelar
                </button>
                <button onclick="confirmDelete('${etiqueta._id}')" 
                        class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                  Remover
                </button>
              </div>
            </div>
          </div>
        `;

        statusList.appendChild(item);
      });

      // listeners dos botões
      statusList.addEventListener('click', (e) => {
        const t = e.target;

        // rastrear
        if (t.matches('[data-track]')) {
          const codigo = t.getAttribute('data-track');
          rastrear(codigo);
        }

        // abrir modal de remover
        if (t.classList.contains('btn-remover')) {
          const id = t.getAttribute('data-id');
          openDeleteModal(id);
        }
      });

    } catch (err) {
      console.error(err);
      statusList.innerHTML = '<p class="text-red-500">Erro ao carregar as etiquetas.</p>';
    }
  };

  // -------- Funções de modal --------
  window.openDeleteModal = (id) => {
    document.getElementById(`modal-${id}`).classList.remove('hidden');
  };

  window.closeDeleteModal = (id) => {
    document.getElementById(`modal-${id}`).classList.add('hidden');
  };

  window.confirmDelete = async (id) => {
    try {
      const resp = await fetch(`/api/shipments/${id}`, { method: 'DELETE' });
      if (!resp.ok && resp.status !== 204) throw new Error('Falha ao excluir etiqueta');
      document.getElementById(`ship-${id}`)?.remove();

      if (!statusList.children.length) {
        statusList.innerHTML = '<p class="text-gray-500">Nenhuma etiqueta encontrada.</p>';
      }

      showToast('Etiqueta removida com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir a etiqueta.', 'error');
    }
    closeDeleteModal(id);
  };

  // -------- Função rastrear --------
  function rastrear(codigo) {
    const input = document.getElementById('tracking-code-input');
    const btn = document.getElementById('track-btn');
    if (input && btn) {
      input.value = codigo;
      btn.click();
    } else {
      alert(`Código de rastreio: ${codigo}`);
    }
  }

  // -------- Toast helper --------
  function showToast(message, type = 'error') {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;
    toast.className = `fixed top-5 right-5 text-white px-6 py-3 rounded-lg shadow-lg ${type}`;
    toast.style.backgroundColor = type === 'success' ? '#004d40' : '#ef4444';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
  }

  // carrega ao abrir a aba
  await carregar();
});
