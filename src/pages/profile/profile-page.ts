
import { Page } from '../page.js';
import { AuthService } from '../../services/auth.service.js';

export class ProfilePage extends Page {
    private authService: AuthService;
    private feedbackMessage: string = '';
    private feedbackType: 'success' | 'danger' = 'success';

    constructor(authService: AuthService) {
        super();
        this.authService = authService;
    }

    public getTemplate(): string {
        const user = this.authService.getCurrentUser();
        const userNome = user ? user.nome : '';
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
                            <input type="text" id="prof-name" class="form-control form-control-sm" value="${userNome}" placeholder="Seu nome completo" required>
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
                        
                        <button type="submit" id="btn-update-profile" class="btn pokedex-btn-dark btn-sm w-100 py-2 mt-3">ATUALIZAR PERFIL</button>
                    </form>
                </div>

                <!-- Excluir Conta (CRUD 1 Delete) -->
                <div class="glass-card border-danger border-opacity-50">
                    <h5 class="text-danger mb-2" style="font-size: 0.9rem;"><i class="bi bi-exclamation-triangle"></i> Área de Perigo</h5>
                    <p class="text-secondary" style="font-size: 0.8rem;">
                        Ao excluir a sua conta, toda a sua coleção e pastas serão permanentemente apagados de forma irreversível do banco de dados.
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

    public async init(): Promise<void> {
        const user = this.authService.getCurrentUser();
        if (!user) return;

        // 1. Envio de formulário de atualização de perfil
        const form = document.getElementById('profile-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileUpdate(user.id, user.email);
            });
        }

        // 2. Exclusão de conta
        const deleteBtn = document.getElementById('btn-delete-account') as HTMLButtonElement;
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                const conf = window.confirm('TEM CERTEZA ABSOLUTA? Esta ação deletará todo o seu progresso, coleção e pastas para sempre.');
                if (conf) {
                    deleteBtn.disabled = true;
                    deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> DELETANDO...';
                    try {
                        await this.authService.deleteUser(user.id);
                        window.location.hash = '#/login';
                    } catch (error: any) {
                        deleteBtn.disabled = false;
                        deleteBtn.innerHTML = '<i class="bi bi-trash-fill"></i> EXCLUIR MINHA CONTA DO COLECTOR';
                        this.showFeedback(error.message || 'Erro ao excluir conta', 'danger');
                    }
                }
            });
        }
    }

    private async handleProfileUpdate(userId: number, userEmail: string): Promise<void> {
        const nameInput = document.getElementById('prof-name') as HTMLInputElement;
        const passInput = document.getElementById('prof-password') as HTMLInputElement;
        const confInput = document.getElementById('prof-confirm-password') as HTMLInputElement;
        const btnUpdate = document.getElementById('btn-update-profile') as HTMLButtonElement;

        const newName = nameInput.value.trim();
        const newPass = passInput.value;
        const confPass = confInput.value;

        if (!newName) {
            this.showFeedback('O nome não pode estar vazio.', 'danger');
            return;
        }

        if (newPass) {
            if (newPass.length < 6) {
                this.showFeedback('A nova senha deve ter pelo menos 6 caracteres.', 'danger');
                return;
            }
            if (newPass !== confPass) {
                this.showFeedback('As senhas não coincidem.', 'danger');
                return;
            }
        }

        btnUpdate.disabled = true;
        btnUpdate.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ATUALIZANDO...';

        try {
            const payload: any = { id: userId, nome: newName, email: userEmail };
            if (newPass) payload.senha = newPass;
            await this.authService.updateUser(payload);
            this.showFeedback('Perfil atualizado com sucesso!', 'success');
        } catch (error: any) {
            this.showFeedback(error.message || 'Falha ao atualizar perfil', 'danger');
        }
    }

    private showFeedback(message: string, type: 'success' | 'danger'): void {
        this.feedbackMessage = message;
        this.feedbackType = type;
        this.render(); // Re-renderiza para mostrar o feedback

        setTimeout(() => {
            this.feedbackMessage = '';
            this.render();
        }, 4000);
    }
}
