

export abstract class Page {
    /**
     * Retorna a string HTML que representa a página.
     */
    public abstract getTemplate(): string;

    /**
     * Inicializa a lógica de controle da página, como vincular escutas de eventos.
     * Chamado após o template ser injetado no DOM.
     */
    public abstract init(): void;

    /**
     * Método opcional executado quando o usuário sai da página.
     * Útil para remover event listeners globais, timers, etc.
     */
    public destroy(): void {

    }
}
