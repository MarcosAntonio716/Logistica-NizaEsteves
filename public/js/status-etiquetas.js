// src/public/js/status-etiquetas.js
document.addEventListener('DOMContentLoaded', async () => {
  const statusList = document.getElementById('lista-status-etiquetas');

  const carregar = async () => {
    statusList.innerHTML = '<p class="text-gray-500">Carregando...</p>';

    try {
      const resp = await fetch('/api/shipments');
      if (!resp.ok) throw new Error('Falha ao buscar etiquetas');
      const data = await resp.json();
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

        // 🔴 Botões extras só se for Melhor Envio
        let botoesMelhorEnvio = '';
        if (etiqueta.origem === "Melhor Envio") {
          botoesMelhorEnvio = `
            <div class="flex flex-col space-y-1 mt-2">
              <button class="text-indigo-600 hover:underline text-sm btn-preview" data-id="${etiqueta.codigoRastreio}">Prévia</button>
              <button class="text-green-600 hover:underline text-sm btn-pay" data-id="${etiqueta.codigoRastreio}">Pagar</button>
              <button class="text-purple-600 hover:underline text-sm btn-print" data-id="${etiqueta.codigoRastreio}">Imprimir</button>
            </div>
          `;
        }

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
                class="text-red-600 hover:underline text-sm btn-remover-shipment"
                data-id="${etiqueta._id}"
                data-nome="${etiqueta.nomeCliente}">Remover</button>
            </div>
            ${botoesMelhorEnvio}
          </div>
        `;

        statusList.appendChild(item);
      });

      // listeners dos botões
      statusList.addEventListener('click', async (e) => {
        const t = e.target;

        // rastrear
        if (t.matches('[data-track]')) {
          const codigo = t.getAttribute('data-track');
          rastrear(codigo);
        }

        // remover
        if (t.classList.contains('btn-remover-shipment')) {
          const id = t.getAttribute('data-id');
          openDeleteModalShipment(id);
        }

        // 🔴 Melhor Envio - Preview
        if (t.classList.contains('btn-preview')) {
          const id = t.dataset.id;
          window.open(`/api/melhorenvio/labels/${id}/preview`, '_blank');
        }

        // 🔴 Melhor Envio - Pay
        if (t.classList.contains('btn-pay')) {
          const id = t.dataset.id;
          try {
            const resp = await fetch(`/api/melhorenvio/labels/${id}/pay`, { method: "POST" });
            if (!resp.ok) throw new Error("Falha ao pagar");
            showToast("Etiqueta paga com sucesso!", "success");
            await carregar(); // recarrega lista
          } catch (err) {
            console.error(err);
            showToast("Erro ao pagar etiqueta.", "error");
          }
        }

        // 🔴 Melhor Envio - Print
        if (t.classList.contains('btn-print')) {
          const id = t.dataset.id;
          window.open(`/api/melhorenvio/labels/${id}/print`, '_blank');
        }
      });

    } catch (err) {
      console.error(err);
      statusList.innerHTML = '<p class="text-red-500">Erro ao carregar as etiquetas.</p>';
    }
  };

  // -------- Funções de modal (etiquetas) --------
  window.openDeleteModalShipment = (id) => {
    document.getElementById(`modal-shipment-${id}`).classList.remove('hidden');
  };

  window.closeDeleteModalShipment = (id) => {
    document.getElementById(`modal-shipment-${id}`).classList.add('hidden');
  };

  window.confirmDeleteShipment = async (id) => {
    try {
      const resp = await fetch(`/api/shipments/${id}`, { method: 'DELETE' });
      if (!resp.ok && resp.status !== 204 && resp.status !== 200) {
        throw new Error(`Falha ao excluir etiqueta (${resp.status})`);
      }
      closeDeleteModalShipment(id);
      document.getElementById(`ship-${id}`)?.remove();
      if (!statusList.children.length) {
        statusList.innerHTML = '<p class="text-gray-500">Nenhuma etiqueta encontrada.</p>';
      }
      showToast('Etiqueta removida com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir a etiqueta.', 'error');
    }
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
