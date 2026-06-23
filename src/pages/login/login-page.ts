
import { Page } from '../page.js';
import { AuthService } from '../../services/auth.service.js';

export class LoginPage extends Page {
    private authService: AuthService;
    private container: HTMLElement;
    private mode: 'LOGIN' | 'REGISTER' = 'LOGIN';
    private feedbackMessage: string = '';
    private feedbackType: 'success' | 'danger' = 'success';

    constructor(authService: AuthService, container: HTMLElement) {
        super();
        this.authService = authService;
        this.container = container;
    }

    public getTemplate(): string {
        if (this.mode === 'LOGIN') {
            return /*html*/`
                <div class="animate-fade">
                    <h5 class="mb-3 text-center scanner-active-title">ACESSO SIDEX</h5>
                    
                    ${this.feedbackMessage ? `
                        <div class="alert alert-${this.feedbackType} py-1 px-2 mb-3 text-center" style="font-size: 0.8rem;">
                            ${this.feedbackMessage}
                        </div>
                    ` : ''}
                    
                    <form id="login-form">
                        <div class="mb-3">
                            <label for="email" class="form-label text-secondary mb-1" style="font-size: 0.75rem;">E-mail</label>
                            <input type="email" id="email" class="form-control form-control-sm" placeholder="treinador@tcg.com" required>
                        </div>
                        <div class="mb-3">
                            <label for="password" class="form-label text-secondary mb-1" style="font-size: 0.75rem;">Senha</label>
                            <input type="password" id="password" class="form-control form-control-sm" placeholder="******" required>
                        </div>
                        <button type="submit" id="btn-login" class="btn pokedex-btn-dark btn-sm w-100 py-2">ENTRAR</button>
                    </form>
                    
                    <div class="text-center mt-3">
                        <a href="javascript:void(0)" id="link-to-register" class="text-decoration-none text-info" style="font-size: 0.8rem;">
                            Novo Colecionador? Cadastre-se
                        </a>
                    </div>
                </div>
            `;
        } else {
            return /*html*/`
                <div class="animate-fade">
                    <h5 class="mb-3 text-center text-warning">NOVO TREINADOR</h5>
                    
                    ${this.feedbackMessage ? `
                        <div class="alert alert-${this.feedbackType} py-1 px-2 mb-3 text-center" style="font-size: 0.8rem;">
                            ${this.feedbackMessage}
                        </div>
                    ` : ''}
                    
                    <form id="register-form">
                        <div class="mb-2">
                            <label for="reg-name" class="form-label text-secondary mb-1" style="font-size: 0.75rem;">Nome</label>
                            <input type="text" id="reg-name" class="form-control form-control-sm" placeholder="Seu nome" required>
                        </div>
                        <div class="mb-2">
                            <label for="reg-email" class="form-label text-secondary mb-1" style="font-size: 0.75rem;">E-mail</label>
                            <input type="email" id="reg-email" class="form-control form-control-sm" placeholder="email@provedor.com" required>
                        </div>
                        <div class="mb-2">
                            <label for="reg-password" class="form-label text-secondary mb-1" style="font-size: 0.75rem;">Senha</label>
                            <input type="password" id="reg-password" class="form-control form-control-sm" placeholder="Mín. 6 caracteres" required>
                        </div>
                        <div class="mb-3">
                            <label for="reg-confirm-password" class="form-label text-secondary mb-1" style="font-size: 0.75rem;">Confirmar Senha</label>
                            <input type="password" id="reg-confirm-password" class="form-control form-control-sm" placeholder="Confirme a senha" required>
                        </div>
                        <button type="submit" id="btn-register" class="btn pokedex-btn-dark btn-sm w-100 py-2">CADASTRAR</button>
                    </form>
                    
                    <div class="text-center mt-2">
                        <a href="javascript:void(0)" id="link-to-login" class="text-decoration-none text-info" style="font-size: 0.8rem;">
                            Já tem conta? Faça Login
                        </a>
                    </div>
                </div>
            `;
        }
    }

    public render(): void {
        this.container.innerHTML = this.getTemplate();
        this.init();
    }

    public init(): void {
        if (this.mode === 'LOGIN') {
            const form = document.getElementById('login-form') as HTMLFormElement;
            const linkRegister = document.getElementById('link-to-register');

            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin();
                });
            }

            if (linkRegister) {
                linkRegister.addEventListener('click', () => {
                    this.mode = 'REGISTER';
                    this.feedbackMessage = '';
                    this.render();
                });
            }
        } else {
            const form = document.getElementById('register-form') as HTMLFormElement;
            const linkLogin = document.getElementById('link-to-login');

            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleRegister();
                });
            }

            if (linkLogin) {
                linkLogin.addEventListener('click', () => {
                    this.mode = 'LOGIN';
                    this.feedbackMessage = '';
                    this.render();
                });
            }
        }
    }

    private async handleLogin(): Promise<void> {
        const emailInput = document.getElementById('email') as HTMLInputElement;
        const passwordInput = document.getElementById('password') as HTMLInputElement;
        const btnLogin = document.getElementById('btn-login') as HTMLButtonElement;

        if (!emailInput || !passwordInput) return;

        const email = emailInput.value.trim();
        const senha = passwordInput.value;

        if (!this.isValidEmail(email)) {
            this.showFeedback('Formato de e-mail inválido.', 'danger');
            this.flashLEDs('red');
            return;
        }

        if (senha.length === 0) {
            this.showFeedback('A senha é obrigatória.', 'danger');
            this.flashLEDs('red');
            return;
        }

        btnLogin.disabled = true;
        btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        try {
            await this.authService.login(email, senha);
            this.flashLEDs('green');
            this.showFeedback('Acesso autorizado! Carregando...', 'success');
            setTimeout(() => {
                window.location.hash = '#/dashboard';
            }, 800);
        } catch (error: any) {
            btnLogin.disabled = false;
            btnLogin.innerHTML = 'ENTRAR';
            this.flashLEDs('red');
            this.showFeedback(error.message || 'E-mail ou senha incorretos.', 'danger');
        }
    }

    private async handleRegister(): Promise<void> {
        const nameInput = document.getElementById('reg-name') as HTMLInputElement;
        const emailInput = document.getElementById('reg-email') as HTMLInputElement;
        const passwordInput = document.getElementById('reg-password') as HTMLInputElement;
        const confirmInput = document.getElementById('reg-confirm-password') as HTMLInputElement;
        const btnRegister = document.getElementById('btn-register') as HTMLButtonElement;

        if (!nameInput || !emailInput || !passwordInput || !confirmInput) return;

        const nome = nameInput.value.trim();
        const email = emailInput.value.trim();
        const senha = passwordInput.value;
        const confirm = confirmInput.value;

        if (nome.length < 2) {
            this.showFeedback('Nome deve ter pelo menos 2 caracteres.', 'danger');
            this.flashLEDs('red');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showFeedback('Insira um e-mail válido.', 'danger');
            this.flashLEDs('red');
            return;
        }

        if (senha.length < 6) {
            this.showFeedback('A senha deve ter pelo menos 6 caracteres.', 'danger');
            this.flashLEDs('red');
            return;
        }

        if (senha !== confirm) {
            this.showFeedback('As senhas não coincidem.', 'danger');
            this.flashLEDs('red');
            return;
        }

        btnRegister.disabled = true;
        btnRegister.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        try {
            const result = await this.authService.register(nome, email, senha);
            if (result.success) {
                this.flashLEDs('yellow');
                this.mode = 'LOGIN';
                this.showFeedback(result.message, 'success');
                this.render();
            } else {
                btnRegister.disabled = false;
                btnRegister.innerHTML = 'CADASTRAR';
                this.flashLEDs('red');
                this.showFeedback(result.message, 'danger');
            }
        } catch (error: any) {
            btnRegister.disabled = false;
            btnRegister.innerHTML = 'CADASTRAR';
            this.flashLEDs('red');
            this.showFeedback(error.message || 'Falha ao cadastrar.', 'danger');
        }
    }

    private showFeedback(message: string, type: 'success' | 'danger'): void {
        this.feedbackMessage = message;
        this.feedbackType = type;
        this.render();
    }

    private isValidEmail(email: string): boolean {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Pisca um dos leds físicos da Pokédex para feedback visual
     */
    private flashLEDs(color: 'red' | 'yellow' | 'green'): void {
        const led = document.getElementById(`led-${color}`);
        if (led) {
            led.classList.add('blinking');

            setTimeout(() => {

                if (color !== 'red') {
                    led.classList.remove('blinking');
                }
            }, 1500);
        }
    }
}
