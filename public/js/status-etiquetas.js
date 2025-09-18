// public/js/status-etiquetas.js
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
            <p class="text-sm text-gray-600">Cód. Rastreio: <span class="font-mono text-gray-700">${etiqueta.codigoRastreio}</span></p>
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

              <!-- NOVO: botão remover -->
              <button
                class="text-red-600 hover:underline text-sm btn-remover"
                data-id="${etiqueta._id}"
                data-nome="${etiqueta.nomeCliente}">Remover</button>
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

        // remover
        if (t.classList.contains('btn-remover')) {
          const id = t.getAttribute('data-id');
          const nome = t.getAttribute('data-nome');
          excluirEtiqueta(id, nome);
        }
      });

    } catch (err) {
      console.error(err);
      statusList.innerHTML = '<p class="text-red-500">Erro ao carregar as etiquetas.</p>';
    }
  };

  // Confirma e exclui
  async function excluirEtiqueta(id, nome) {
    const ok = confirm(`Tem certeza que deseja remover a etiqueta de "${nome}"? Esta ação não pode ser desfeita.`);
    if (!ok) return;

    try {
      const resp = await fetch(`/api/shipments/${id}`, { method: 'DELETE' });
      if (!resp.ok && resp.status !== 204) throw new Error('Falha ao excluir etiqueta');
      // remove do DOM
      document.getElementById(`ship-${id}`)?.remove();

      // se ficou vazio, mostra mensagem
      if (!statusList.children.length) {
        statusList.innerHTML = '<p class="text-gray-500">Nenhuma etiqueta encontrada.</p>';
      }
      alert('Etiqueta removida com sucesso.');
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir a etiqueta. Tente novamente.');
    }
  }

  function rastrear(codigo) {
    // integra com seu modal/botão já existente
    const input = document.getElementById('tracking-code-input');
    const btn = document.getElementById('track-btn');
    if (input && btn) {
      input.value = codigo;
      btn.click();
    } else {
      alert(`Código de rastreio: ${codigo}`);
    }
  }

  // carrega ao abrir a aba
  await carregar();
});
