export class UnauthorizedError extends Error {
    constructor(message = 'No autorizado. Tu sesión ha expirado.') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}
