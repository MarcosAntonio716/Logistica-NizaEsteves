// src/public/js/configuracoes.js
document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('form-settings');

    // carregar configurações atuais
    async function carregar() {
        try {
            const resp = await fetch('/api/settings');
            if (!resp.ok) return;
            const data = await resp.json();

            document.getElementById('settings-company').value = data.companyName || '';
            document.getElementById('settings-cnpj').value = data.cnpj || '';
            document.getElementById('settings-email').value = data.email || '';
            document.getElementById('settings-cep').value = data.address?.postalCode || '';
            document.getElementById('settings-street').value = data.address?.street || '';
            document.getElementById('settings-number').value = data.address?.number || '';
            document.getElementById('settings-bairro').value = data.address?.bairro || '';
            document.getElementById('settings-city').value = data.address?.city || '';
            document.getElementById('settings-state').value = data.address?.state || '';
            document.getElementById('settings-complement').value = data.address?.complement || '';
        } catch (err) {
            console.error('Erro ao carregar configurações:', err);
        }
    }

    function showToast(message, type = 'error') {
        const toast = document.getElementById('toast-notification');
        const toastMessage = document.getElementById('toast-message');
        toastMessage.textContent = message;
        toast.className = `fixed top-5 right-5 text-white px-6 py-3 rounded-lg shadow-lg ${type}`;
        toast.style.backgroundColor = type === 'success' ? '#004d40' : '#ef4444';
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }

    // salvar configurações
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            companyName: document.getElementById('settings-company').value,
            cnpj: document.getElementById('settings-cnpj').value,
            email: document.getElementById('settings-email').value,
            address: {
                postalCode: document.getElementById('settings-cep').value,
                street: document.getElementById('settings-street').value,
                number: document.getElementById('settings-number').value,
                bairro: document.getElementById('settings-bairro').value,
                city: document.getElementById('settings-city').value,
                state: document.getElementById('settings-state').value,
                complement: document.getElementById('settings-complement').value,
            }
        };

        try {
            const resp = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) throw new Error('Falha ao salvar configurações');
            await resp.json();
            showToast('Configurações salvas com sucesso!', 'success');
        } catch (err) {
            console.error(err);
            showToast('Erro ao salvar configurações.', 'error');
        }
    });

    await carregar();
});
