// src/pages/profile/profile-page.ts
import { Page } from '../page.js';
import { StorageService } from '../../services/storage.service.js';
import { AuthService } from '../../services/auth.service.js';

export class ProfilePage extends Page {
    private storageService: StorageService;
    private authService: AuthService;
    private feedbackMessage: string = '';
    private feedbackType: 'success' | 'danger' = 'success';

    constructor(storageService: StorageService, authService: AuthService) {
        super();
        this.storageService = storageService;
        this.authService = authService;
    }

    public getTemplate(): string {
        const user = this.authService.getCurrentUser();
        const userName = user ? user.name : '';
        const userEmail = user ? user.email : '';

        return `
            <div class="animate-fade" style="max-width: 550px; margin: 0 auto;">
                <h4 class="text-white mb-3"><i class="bi bi-person-gear"></i> Perfil do Treinador</h4>
                
                ${this.feedbackMessage ? `
                    <div class="alert alert-${this.feedbackType} py-2 px-3 mb-3 text-center" style="font-size: 0.85rem;">
                        ${this.feedbackMessage}
                    </div>
                ` : ''}

                <!-- Form de Alteração de Nome e Senha (CRUD 1 Update) -->
                <div class="glass-card mb-4">
                    <form id="profile-form">
                        <div class="mb-3">
                            <label class="form-label text-secondary mb-1" style="font-size: 0.75rem;">E-mail do Treinador (Identificação)</label>
                            <input type="email" class="form-control form-control-sm text-secondary bg-transparent border-secondary border-opacity-25" value="${userEmail}" readonly style="cursor: not-allowed;">
                        </div>
                        
                        <div class="mb-3">
                            <label for="prof-name" class="form-label text-secondary mb-1" style="font-size: 0.75rem;">Nome de Exibição</label>
                            <input type="text" id="prof-name" class="form-control form-control-sm" value="${userName}" placeholder="Seu nome completo" required>
                        </div>
                        
                        <div class="border-top border-secondary border-opacity-25 my-3 pt-3">
                            <h6 class="text-warning mb-2" style="font-size: 0.8rem;"><i class="bi bi-shield-lock"></i> Alterar Senha (Opcional)</h6>
                            <p class="text-secondary mb-2" style="font-size: 0.75rem;">Deixe estes campos em branco se não quiser alterar a sua senha.</p>
                            
                            <div class="mb-2">
                                <label for="prof-password" class="form-label text-secondary mb-1" style="font-size: 0.75rem;">Nova Senha</label>
                                <input type="password" id="prof-password" class="form-control form-control-sm" placeholder="Mínimo de 6 caracteres">
                            </div>
                            <div class="mb-0">
                                <label for="prof-confirm-password" class="form-label text-secondary mb-1" style="font-size: 0.75rem;">Confirmar Nova Senha</label>
                                <input type="password" id="prof-confirm-password" class="form-control form-control-sm" placeholder="Confirme a nova senha">
                            </div>
                        </div>
                        
                        <button type="submit" class="btn pokedex-btn-dark btn-sm w-100 py-2 mt-3">ATUALIZAR PERFIL</button>
                    </form>
                </div>

                <!-- Excluir Conta (CRUD 1 Delete) -->
                <div class="glass-card border-danger border-opacity-50">
                    <h5 class="text-danger mb-2" style="font-size: 0.9rem;"><i class="bi bi-exclamation-triangle"></i> Área de Perigo</h5>
                    <p class="text-secondary" style="font-size: 0.8rem;">
                        Ao excluir a sua conta, toda a sua binder de coleção, suas pastas organizadoras e logs de movimentação de estoque serão permanentemente apagados de forma irreversível.
                    </p>
                    <button class="btn btn-outline-danger btn-sm w-100 py-2 mt-2" id="btn-delete-account">
                        <i class="bi bi-trash-fill"></i> EXCLUIR MINHA CONTA DO COLECTOR
                    </button>
                </div>
            </div>
        `;
    }

    public render(): void {
        const container = document.getElementById('dashboard-content');
        if (container) {
            container.innerHTML = this.getTemplate();
            this.init();
        }
    }

    public init(): void {
        const user = this.authService.getCurrentUser();
        if (!user) return;

        // 1. Envio de formulário de atualização de perfil
        const form = document.getElementById('profile-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileUpdate(user.id);
            });
        }

        // 2. Exclusão de conta
        const deleteBtn = document.getElementById('btn-delete-account');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.handleAccountDelete(user.id);
            });
        }
    }

    private handleProfileUpdate(userId: string): void {
        const nameInput = document.getElementById('prof-name') as HTMLInputElement;
        const passwordInput = document.getElementById('prof-password') as HTMLInputElement;
        const confirmInput = document.getElementById('prof-confirm-password') as HTMLInputElement;

        if (!nameInput) return;

        const name = nameInput.value.trim();
        const password = passwordInput ? passwordInput.value : '';
        const confirm = confirmInput ? confirmInput.value : '';

        // Validações
        if (name.length < 2) {
            this.showFeedback('Nome deve ter pelo menos 2 caracteres.', 'danger');
            this.flashLEDs('red');
            return;
        }

        const users = this.storageService.getUsers();
        const fullUser = users.find(u => u.id === userId);
        if (!fullUser) return;

        // Se preencheu senha, valida
        if (password.length > 0) {
            if (password.length < 6) {
                this.showFeedback('A nova senha deve ter pelo menos 6 caracteres.', 'danger');
                this.flashLEDs('red');
                return;
            }
            if (password !== confirm) {
                this.showFeedback('As novas senhas não coincidem.', 'danger');
                this.flashLEDs('red');
                return;
            }
            // Atualiza senha também
            fullUser.password = password;
        }

        // Atualiza nome
        fullUser.name = name;

        // Salva
        this.storageService.updateUser(fullUser);
        
        // Atualiza sessão no sessionStorage (mantém dados de sessão sincronizados)
        sessionStorage.setItem('pkdx_current_session', JSON.stringify({
            id: fullUser.id,
            name: fullUser.name,
            email: fullUser.email
        }));

        this.flashLEDs('green');
        this.showFeedback('Perfil atualizado com sucesso!', 'success');
    }

    private handleAccountDelete(userId: string): void {
        const msg = 'ATENÇÃO: Você tem certeza absoluta de que deseja EXCLUIR sua conta?\nEsta ação apagará toda sua coleção e pastas de forma definitiva!';
        if (confirm(msg)) {
            // Exclui
            this.storageService.deleteUser(userId);
            this.authService.logout();

            // Pisca LED vermelho
            const ledRed = document.getElementById('led-red');
            if (ledRed) {
                ledRed.classList.add('blinking');
                setTimeout(() => ledRed.classList.remove('blinking'), 1500);
            }

            alert('Sua conta foi excluída com sucesso. Retornando para a tela inicial.');
            
            // Retorna ao login
            window.location.hash = '#/login';
            window.location.reload(); // Recarrega para fechar a Pokedex e resetar o roteador
        }
    }

    private showFeedback(message: string, type: 'success' | 'danger'): void {
        this.feedbackMessage = message;
        this.feedbackType = type;
        this.render();
    }

    private flashLEDs(color: 'red' | 'green'): void {
        const led = document.getElementById(`led-${color}`);
        if (led) {
            led.classList.add('blinking');
            setTimeout(() => {
                led.classList.remove('blinking');
            }, 1200);
        }
    }
}
