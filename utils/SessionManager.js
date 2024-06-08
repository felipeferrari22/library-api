class SessionManager {
    constructor() {
        if (!SessionManager.instance) {
            this.sessions = new Map();
            SessionManager.instance = this;
        }

        return SessionManager.instance;
    }

    createSession(userId) {
        const sessionId = `sess_${Math.random().toString(36).substr(2, 9)}`;
        this.sessions.set(sessionId, { userId, loginTime: new Date() });
        return sessionId;
    }

    destroySession(sessionId) {
        this.sessions.delete(sessionId);
    }

    calculateSessionDuration(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        const now = new Date();
        const duration = now - new Date(session.loginTime);

        return duration;
    }
}

const instance = new SessionManager();
Object.freeze(instance);

module.exports = instance;